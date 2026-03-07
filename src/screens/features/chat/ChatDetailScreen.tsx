import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform, TextInput, Image, ActivityIndicator, Alert, Modal, ActionSheetIOS, NativeModules } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../../lib/supabase';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ArrowLeft, Send, Image as ImageIcon, Mic, Paperclip, FileText, X, Clock, Check, StopCircle, Play, Pause, Square, Trash2, ChevronLeft, Download as DownloadIcon } from 'lucide-react-native';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/Button';
import * as ImagePicker from 'expo-image-picker';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useAudioRecorder, RecordingPresets, requestRecordingPermissionsAsync } from 'expo-audio';
import { AudioPlayer } from '../../../components/chat/AudioPlayer';
import * as DocumentPicker from 'expo-document-picker';
import { useHeaderHeight } from '@react-navigation/elements';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import dayjs from '../../../lib/dayjs';
import { HomeStackParamList } from "../../../navigation/types";

const isVideoAvailable = true;
const isAudioAvailable = true;

const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
};

type ChatDetailRouteProp = RouteProp<HomeStackParamList, "ChatDetail">;

export default function ChatDetailScreen() {
  const route = useRoute<ChatDetailRouteProp>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  
  if (!route.params) return null;
  const { chatId, customerName, avatarUrl } = route.params;

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const headerHeight = useHeaderHeight();

  // Preview & View State
  const [previewFile, setPreviewFile] = useState<{uri: string, type: 'image' | 'video' | 'voice' | 'document', name?: string} | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

  // Audio Recorder Hook
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  useEffect(() => {
    let channel: any;

    const init = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigation.goBack();
                return;
            }
            setUserId(user.id);
            fetchMessages();
            markAsRead(user.id);

            channel = supabase
              .channel(`public:messages:${chatId}`)
              .on(
                'postgres_changes',
                {
                  event: 'INSERT',
                  schema: 'public',
                  table: 'messages',
                  filter: `chat_id=eq.${chatId}`
                },
                (payload) => {
                  if (payload.new.sender_id !== user.id) {
                    markAsRead(user.id);
                  }
                  setMessages(prev => {
                    if (prev.some(m => m.id === payload.new.id)) return prev;
                    return [...prev, payload.new];
                  });
                }
              )
              .subscribe();
        } catch (error) {
            console.error('Init error:', error);
            Alert.alert("Error", "Gagal memuat detail chat");
        }
    };

    init();

    return () => {
        if (channel) supabase.removeChannel(channel);
        if (recordingTimer.current) {
            clearInterval(recordingTimer.current);
            recordingTimer.current = null;
        }
    };
  }, [chatId]);

  const markAsRead = async (uid?: string) => {
    const activeUserId = uid || userId;
    if (!activeUserId) return;

    try {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('chat_id', chatId)
          .eq('is_read', false)
          .neq('sender_id', activeUserId);
    } catch (error) {
        console.error('Mark as read error:', error);
    }
  };

  const fetchMessages = async () => {
    try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chatId)
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        if (data) setMessages(data);
    } catch (error) {
        console.error('Fetch messages error:', error);
        Alert.alert("Error", "Gagal memuat pesan");
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0].uri) {
      const asset = result.assets[0];
      const fileName = asset.uri.split('/').pop() || (asset.type === 'video' ? 'video.mp4' : 'image.jpg');
      setPreviewFile({
        uri: asset.uri,
        type: asset.type === 'video' ? 'video' : 'image',
        name: fileName
      });
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileName = asset.name || asset.uri.split('/').pop() || 'file';
        
        if (asset.mimeType?.startsWith('image/')) {
            setPreviewFile({ uri: asset.uri, type: 'image', name: fileName });
        } else if (asset.mimeType?.startsWith('video/')) {
            setPreviewFile({ uri: asset.uri, type: 'video', name: fileName });
        } else {
            setPreviewFile({ uri: asset.uri, type: 'document', name: fileName });
        }
      }
    } catch (err) {
      console.error('Document picker error:', err);
    }
  };

  const handleStartRecording = async () => {
    try {
        const permission = await requestRecordingPermissionsAsync();
        if (permission.status === 'granted') {
            await recorder.prepareToRecordAsync();
            recorder.record();
            setIsRecording(true);
            setRecordingDuration(0);
            recordingTimer.current = setInterval(() => {
                setRecordingDuration(d => d + 1);
            }, 1000);
        }
    } catch (err) {
        console.error('Failed to start recording', err);
    }
  };

  const handleStopRecording = async (cancel: boolean) => {
    setIsRecording(false);
    if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
    }
    
    try {
        await recorder.stop();
        if (!cancel && recorder.uri) {
            setPreviewFile({
                uri: recorder.uri,
                type: 'voice',
            });
        }
    } catch (error) {
        console.error('Failed to stop recording', error);
    }
  };

  const handleAttachment = () => {
    if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
            {
                options: ['Batal', 'Foto & Video', 'Dokumen'],
                cancelButtonIndex: 0,
            },
            (buttonIndex) => {
                if (buttonIndex === 1) pickImage();
                if (buttonIndex === 2) pickDocument();
            }
        );
    } else {
        setAttachmentModalVisible(true);
    }
  };

  const uploadFile = async (uri: string, type: string, name?: string) => {
    try {
        let fileExt = uri.split('.').pop() || 'bin';
        if (type === 'voice' && !uri.includes('.')) fileExt = 'm4a';
        
        const folder = type === 'image' ? '' : (type === 'voice' ? 'audio/' : (type === 'document' ? 'documents/' : ''));
        const timestamp = Date.now();
        const fileName = name 
            ? `${folder}${chatId}/${timestamp}_${name}`
            : `${folder}${chatId}/${timestamp}.${fileExt}`;

        const formData = new FormData();
        formData.append('file', {
            uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
            name: fileName.split('/').pop(),
            type: type === 'voice' ? 'audio/m4a' : (type === 'image' ? 'image/jpeg' : (type === 'video' ? 'video/mp4' : '*/*'))
        } as any);

        const { error: uploadError } = await supabase.storage
            .from('chat-media')
            .upload(fileName, formData, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('chat-media')
            .getPublicUrl(fileName);

        return data.publicUrl;
    } catch (error) {
        console.error('Upload failed:', error);
        Alert.alert("Error", "Gagal mengupload file");
        return null;
    }
  };

  const handleDownload = async (url: string, fileName?: string) => {
    try {
        setUploading(true);
        const fileExt = fileName?.split('.').pop() || 'bin';
        const localUri = `${FileSystem.cacheDirectory}${Date.now()}.${fileExt}`;
        
        const { uri } = await FileSystem.downloadAsync(url, localUri);
        
        setUploading(false);
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
            await Sharing.shareAsync(uri);
        } else {
            Alert.alert("Error", "Sharing is not available on this device");
        }
    } catch (error) {
        setUploading(false);
        console.error('Preview failed:', error);
        Alert.alert("Error", "Gagal membuka dokumen");
    }
  };

  const handleSendMedia = async () => {
      if (!previewFile || !userId) return;

      const { uri, type, name } = previewFile;
      setPreviewFile(null);
      setUploading(true);

      const timestamp = Date.now();
      const mediaLabel = type === 'image' ? 'Foto' : (type === 'document' ? 'Dokumen' : (type === 'voice' ? 'Pesan Suara' : 'Video'));
      const messageContent = name || mediaLabel;
      
      const optimisticMessage = {
          id: 'temp-' + timestamp,
          chat_id: chatId,
          sender_id: userId,
          content: messageContent,
          message_type: type,
          media_url: uri, // Use local URI for preview
          created_at: new Date().toISOString(),
          is_sending: true
      };

      setMessages(prev => [...prev, optimisticMessage]);

      const mediaUrl = await uploadFile(uri, type, name);
      
      if (!mediaUrl) {
          setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
          setUploading(false);
          return;
      }

      const { data: realMessage, error } = await supabase
        .from('messages')
        .insert({
            chat_id: chatId,
            sender_id: userId,
            content: messageContent,
            message_type: type,
            media_url: mediaUrl
        })
        .select()
        .single();

      if (error) {
          console.error(error);
          Alert.alert("Error", "Gagal mengirim pesan");
          setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
          setUploading(false);
          return;
      }

      setMessages(prev => {
          if (prev.some(m => m.id === realMessage.id)) {
              return prev.filter(m => m.id !== optimisticMessage.id);
          }
          return prev.map(m => m.id === optimisticMessage.id ? realMessage : m);
      });

      const { error: chatUpdateError } = await supabase
        .from('chats')
        .update({
            last_message: mediaLabel,
            last_message_at: new Date().toISOString()
        })
        .eq('id', chatId);

      if (chatUpdateError) {
          console.error('Chat update error:', chatUpdateError);
      }

      setUploading(false);
  };

  const sendMessage = async () => {
      if (!newMessage.trim() || !userId) return;

      const content = newMessage.trim();
      setNewMessage("");
      const tempId = `temp-${Date.now()}`;
      const now = new Date().toISOString();

      const tempMessage = {
          id: tempId,
          chat_id: chatId,
          sender_id: userId,
          content: content,
          message_type: 'text',
          created_at: now,
          is_sending: true
      };

      setMessages(prev => [...prev, tempMessage]);

      const { data: realMessage, error } = await supabase
        .from('messages')
        .insert({
            chat_id: chatId,
            sender_id: userId,
            content: content,
            message_type: 'text',
        })
        .select()
        .single();

      if (error) {
          console.error(error);
          Alert.alert("Error", "Gagal mengirim pesan");
          setMessages(prev => prev.filter(m => m.id !== tempId));
          return;
      }

      setMessages(prev => {
          if (prev.some(m => m.id === realMessage.id)) {
              return prev.filter(m => m.id !== tempId);
          }
          return prev.map(m => m.id === tempId ? realMessage : m);
      });

      const { error: chatUpdateError } = await supabase
        .from('chats')
        .update({
            last_message: content,
            last_message_at: now
        })
        .eq('id', chatId);

      if (chatUpdateError) {
          console.error('Chat list update error:', chatUpdateError);
      }
  };

  const renderMessageContent = (item: any, isMe: boolean) => {
    if (item.message_type === 'image') {
        return (
            <TouchableOpacity onPress={() => item.media_url && setViewerUrl(item.media_url)} activeOpacity={0.9}>
                <Image 
                    source={{ uri: item.media_url || item.content }} 
                    className="w-48 h-48 rounded-lg mb-1 bg-muted"
                    resizeMode="cover"
                />
            </TouchableOpacity>
        );
    } else if (item.message_type === 'video') {
       return (
            <View>
                {isVideoAvailable ? (
                    <VideoMessage uri={item.media_url} />
                ) : (
                    <View className="w-48 h-48 bg-muted rounded-lg items-center justify-center p-4">
                        <Text className="text-[10px] text-muted-foreground text-center">Video tidak didukung</Text>
                    </View>
                )}
                 {item.content && !['Video', 'Sent a video', '🎥 Video'].includes(item.content) && (
                     <Text className={isMe ? "text-primary-foreground mt-2" : "text-foreground mt-2"}>{item.content}</Text>
                )}
            </View>
       )
    } else if (item.message_type === 'voice' || item.message_type === 'audio') {
        return <AudioPlayer uri={item.media_url} isMe={isMe} />;
    } else if (item.message_type === 'document' || item.message_type === 'file') {
        const fileName = item.content || 'Dokumen';
        return (
            <TouchableOpacity onPress={() => handleDownload(item.media_url, item.content)} className="flex-row items-center p-1">
                <View className={cn("p-2 rounded-lg mr-2", isMe ? "bg-white/20" : "bg-primary/10")}>
                    <FileText size={20} className={isMe ? "text-white" : "text-primary"} />
                </View>
                <View>
                    <Text className={cn("text-sm font-medium", isMe ? "text-white" : "text-foreground")} numberOfLines={1}>
                        {item.content || "Dokumen"}
                    </Text>
                    <Text className={cn("text-[10px]", isMe ? "text-white/60" : "text-muted-foreground")}>Ketuk untuk membuka</Text>
                </View>
            </TouchableOpacity>
        )
    }

    return <Text className={cn("text-[15px] leading-relaxed", isMe ? "text-primary-foreground font-medium" : "text-foreground")}>{item.content}</Text>;
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      {/* Header */}
      <View className="px-5 py-4 border-b border-border/50 flex-row items-center gap-4 bg-background z-10">
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            className="w-10 h-10 rounded-xl bg-secondary items-center justify-center border border-border/30"
          >
              <ArrowLeft size={20} className="text-foreground" />
          </TouchableOpacity>
          <View className="flex-1 flex-row items-center gap-3">
              <View className="w-11 h-11 bg-primary/10 rounded-2xl items-center justify-center border border-primary/20 overflow-hidden">
                  {avatarUrl ? (
                      <Image source={{ uri: avatarUrl }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                      <Text className="font-bold text-primary text-lg">{customerName?.charAt(0) || "C"}</Text>
                  )}
              </View>
              <View>
                <Text className="font-bold text-base text-foreground tracking-tight leading-tight" numberOfLines={1}>{customerName || "Customer"}</Text>
              </View>
          </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : "padding"} 
        keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
        className="flex-1"
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
              const isMe = item.sender_id === userId;
              return (
                  <View className={isMe ? "items-end mb-4" : "items-start mb-4"}>
                      <View className={cn(
                          "p-4 rounded-[24px] max-w-[85%] shadow-sm",
                          isMe ? "bg-primary rounded-tr-none" : "bg-card border border-border/40 rounded-tl-none"
                      )}>
                          {renderMessageContent(item, isMe)}
                      </View>
                      <View className="flex-row items-center gap-1.5 mt-1.5 px-1">
                          <Text className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                              {dayjs(item.created_at).format('HH:mm')}
                          </Text>
                          {isMe && (
                              item.is_sending ? 
                              <Clock size={10} className="text-muted-foreground/40" /> : 
                              <Check size={10} className="text-primary/60" />
                          )}
                      </View>
                  </View>
              );
          }}
        />

        <View className="bg-background">
            <View 
                style={{ paddingBottom: Math.max(insets.bottom, 20) }} 
                className="px-5 py-4 border-t border-border/30 bg-background flex-row items-end gap-3"
            >
                {!isRecording && (
                    <TouchableOpacity 
                        className="w-11 h-11 rounded-2xl bg-secondary items-center justify-center border border-border/30 mb-0.5" 
                        onPress={handleAttachment} 
                        disabled={uploading}
                    >
                        <Paperclip size={20} className="text-muted-foreground" />
                    </TouchableOpacity>
                )}
                
                {isRecording ? (
                    <View className="flex-1 flex-row items-center bg-red-50 rounded-[28px] h-12 px-4 border border-red-100 mb-0.5">
                        <View className="w-2.5 h-2.5 rounded-full bg-red-500 mr-2 shadow-sm animate-pulse" />
                        <Text className="text-sm font-bold text-red-600 tracking-tight">{formatDuration(recordingDuration)}</Text>
                        <Text className="text-[10px] font-bold text-red-400 uppercase tracking-widest ml-auto">Merekam...</Text>
                    </View>
                ) : (
                    <View className="flex-1 bg-secondary/50 rounded-[28px] px-4 border border-border/30 min-h-[48px] justify-center py-1">
                        <TextInput 
                            className="text-foreground font-medium text-[15px] max-h-32" 
                            placeholder="Ketik pesan..." 
                            placeholderTextColor="hsl(var(--muted-foreground))"
                            multiline
                            value={newMessage}
                            onChangeText={setNewMessage}
                            editable={!uploading}
                        />
                    </View>
                )}

                <View className="flex-row items-center mb-0.5">
                    {isRecording ? (
                        <>
                            <TouchableOpacity 
                                className="w-11 h-11 rounded-2xl bg-red-100 items-center justify-center mr-2 border border-red-200" 
                                onPress={() => handleStopRecording(true)}
                            >
                                <Trash2 size={20} className="text-red-600" />
                            </TouchableOpacity>
                            <TouchableOpacity 
                                className="w-12 h-12 bg-red-600 rounded-[20px] items-center justify-center shadow-lg shadow-red-200"
                                onPress={() => handleStopRecording(false)}
                            >
                                <Square size={18} color="#fff" fill="#fff" />
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            {!newMessage.trim() ? (
                                <TouchableOpacity 
                                    className="w-12 h-12 bg-primary rounded-[20px] items-center justify-center shadow-lg shadow-primary/20" 
                                    onPress={handleStartRecording}
                                    disabled={uploading}
                                >
                                    <Mic size={22} color="#fff" />
                                </TouchableOpacity>
                            ) : (
                                <Button 
                                    size="sm" 
                                    className="w-12 h-12 rounded-[20px] items-center justify-center p-0 shadow-lg shadow-primary/20"
                                    onPress={sendMessage}
                                    disabled={uploading}
                                >
                                    {uploading ? <ActivityIndicator size="small" color="#fff" /> : <Send size={20} color="#fff" className="ml-0.5" />}
                                </Button>
                            )}
                        </>
                    )}
                </View>
            </View>
        </View>
      </KeyboardAvoidingView>

      {/* Attachment Modal for Android */}
      <Modal
        visible={attachmentModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAttachmentModalVisible(false)}
      >
        <TouchableOpacity 
          className="flex-1 bg-black/40 justify-end"
          activeOpacity={1}
          onPress={() => setAttachmentModalVisible(false)}
        >
          <View className="bg-card m-4 rounded-[32px] overflow-hidden mb-12 shadow-2xl p-2 border border-border/50">
            <TouchableOpacity 
              className="p-5 flex-row items-center gap-4 bg-background/50 m-1 rounded-[24px]"
              onPress={() => {
                setAttachmentModalVisible(false);
                pickImage();
              }}
            >
              <View className="w-12 h-12 rounded-2xl bg-blue-100 items-center justify-center">
                <ImageIcon size={22} className="text-blue-600" />
              </View>
              <View>
                <Text className="text-foreground text-base font-bold">Foto & Video</Text>
                <Text className="text-muted-foreground text-xs font-medium">Kirim gambar atau rekaman video</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="p-5 flex-row items-center gap-4 bg-background/50 m-1 rounded-[24px]"
              onPress={() => {
                setAttachmentModalVisible(false);
                pickDocument();
              }}
            >
              <View className="w-12 h-12 rounded-2xl bg-orange-100 items-center justify-center">
                <FileText size={22} className="text-orange-600" />
              </View>
              <View>
                <Text className="text-foreground text-base font-bold">Dokumen</Text>
                <Text className="text-muted-foreground text-xs font-medium">Berbagi dokumen, PDF, dan lainnya</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="p-4 mt-2 items-center"
              onPress={() => setAttachmentModalVisible(false)}
            >
              <Text className="text-red-500 font-bold text-sm uppercase tracking-widest">Batal</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Preview Modal */}
      <Modal visible={!!previewFile} transparent={true} animationType="slide">
        <View className="flex-1 bg-black justify-center items-center pb-20 pt-10 px-4">
            <View className="absolute top-12 left-6 z-10">
                <TouchableOpacity onPress={() => setPreviewFile(null)} className="p-2 bg-white/20 rounded-full">
                    <X size={24} color="white" />
                </TouchableOpacity>
            </View>

            {previewFile?.type === 'image' && (
                <View className="w-full h-[70%] justify-center items-center">
                    <Image source={{ uri: previewFile.uri }} className="w-full h-full" resizeMode="contain" />
                    {previewFile.name && (
                        <Text className="text-white mt-4 font-bold text-sm" numberOfLines={1}>{previewFile.name}</Text>
                    )}
                </View>
            )}
            {previewFile?.type === 'video' && (
                <View className="w-full h-[70%] justify-center items-center">
                    <VideoMessage uri={previewFile.uri} />
                    {previewFile.name && (
                        <Text className="text-white mt-4 font-bold text-sm" numberOfLines={1}>{previewFile.name}</Text>
                    )}
                </View>
            )}
            {(previewFile?.type === 'document') && (
                <View className="bg-white/10 p-8 rounded-3xl items-center w-full max-w-xs border border-white/10">
                    <View className="w-20 h-20 bg-primary/20 rounded-2xl items-center justify-center mb-4">
                        <FileText size={40} color="white" />
                    </View>
                    <Text className="text-white text-center font-bold text-lg" numberOfLines={2}>
                        {previewFile.name || "Dokumen"}
                    </Text>
                    <Text className="text-white/40 mt-2 text-xs uppercase tracking-widest font-bold">Siap kirim</Text>
                </View>
            )}
            {previewFile?.type === 'voice' && (
                <View className="bg-white/10 p-8 rounded-3xl items-center w-full max-w-xs border border-white/10">
                    <View className="w-20 h-20 bg-red-500/20 rounded-2xl items-center justify-center mb-4">
                        <Mic size={40} color="white" />
                    </View>
                    <Text className="text-white text-center font-bold text-lg">Rekaman Suara</Text>
                    <Text className="text-white/40 mt-2 text-xs uppercase tracking-widest font-bold">Siap kirim</Text>
                </View>
            )}

            <View className="absolute bottom-10 flex-row gap-4 px-6 w-full justify-center">
                <TouchableOpacity 
                    onPress={() => setPreviewFile(null)}
                    className="flex-1 bg-white/10 py-4 rounded-2xl items-center border border-white/10"
                >
                    <Text className="text-white font-bold uppercase tracking-widest text-xs">Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={handleSendMedia}
                    className="flex-1 bg-primary py-4 rounded-2xl items-center flex-row justify-center shadow-lg shadow-primary/20"
                >
                    <Text className="text-white font-bold mr-2 uppercase tracking-widest text-xs">Kirim</Text>
                    <Send size={16} color="white" />
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

      {/* Image Viewer Modal */}
      <Modal visible={!!viewerUrl} transparent={true} animationType="fade">
        <View className="flex-1 bg-black">
            <SafeAreaView className="flex-1">
                <View className="p-4 flex-row justify-between items-center">
                    <TouchableOpacity 
                        onPress={() => setViewerUrl(null)}
                        className="w-10 h-10 bg-white/10 rounded-full items-center justify-center border border-white/10"
                    >
                        <X size={20} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => viewerUrl && handleDownload(viewerUrl, 'image.jpg')}
                        className="w-10 h-10 bg-white/10 rounded-full items-center justify-center border border-white/10"
                    >
                        <DownloadIcon size={20} color="white" />
                    </TouchableOpacity>
                </View>
                <View className="flex-1 justify-center items-center">
                    <Image source={{ uri: viewerUrl || "" }} className="w-full h-full" resizeMode="contain" />
                </View>
            </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const VideoMessage = ({ uri }: { uri: string }) => {
    const player = useVideoPlayer(uri, (player) => {
        player.loop = false;
    });

    return (
        <VideoView
            player={player}
            style={{ width: 200, height: 200, borderRadius: 8 }}
            nativeControls
        />
    );
};
