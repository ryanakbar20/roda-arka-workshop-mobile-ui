import React, { useState, useEffect, useRef } from "react";
import { View, Text, FlatList, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { supabase } from "../../../lib/supabase";
import { ChevronLeft, Send, Image as ImageIcon } from "lucide-react-native";
import dayjs from "../../../lib/dayjs";
import * as ImagePicker from 'expo-image-picker';
import { HomeStackParamList } from "../../../navigation/types";
import { cn } from "../../../lib/utils";
import { Video, ResizeMode, Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import { AudioPlayer } from "../../../components/chat/AudioPlayer";
import { FileText, Mic, Square, Trash2, Paperclip, Image as ImageIconOriginal } from "lucide-react-native";
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Modal, ActionSheetIOS } from 'react-native';
import { X, Download as DownloadIcon } from "lucide-react-native";

// Route prop might come from ChatStackParamList actually, but treating as generic for now
// We need to ensure we export ChatStackParamList or merge into HomeStackParamList in types.ts
type ChatDetailRouteProp = RouteProp<HomeStackParamList, "ChatDetail">;

export default function ChatDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute<ChatDetailRouteProp>();
    
    // Safety check for params
    if (!route.params) return null;
    const { chatId, customerName, avatarUrl } = route.params;

    const [messages, setMessages] = useState<any[]>([]);
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const flatListRef = useRef<FlatList>(null);

    // Voice Recording State
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const recordingTimer = useRef<NodeJS.Timeout | null>(null);

    // Lightbox State
    const [viewerUrl, setViewerUrl] = useState<string | null>(null);
    const [downloading, setDownloading] = useState(false);
    const [showAttachModal, setShowAttachModal] = useState(false);

    const handleAttachmentPress = () => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['Cancel', 'Photo & Video', 'Document'],
                    cancelButtonIndex: 0,
                },
                (buttonIndex) => {
                    if (buttonIndex === 1) pickImage();
                    if (buttonIndex === 2) pickDocument();
                }
            );
        } else {
            setShowAttachModal(true);
        }
    };

    useEffect(() => {
        fetchCurrentUser();
    }, []);

    useEffect(() => {
        if (!userId) return;
        
        fetchMessages();
        markAsRead(); // Mark as read when entering

        const channel = supabase
            .channel(`public:messages:chat_id=eq.${chatId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `chat_id=eq.${chatId}`,
                },
                (payload) => {
                    setMessages((prev) => {
                        // Check if message already exists (deduplication for optimistic UI)
                        if (prev.find(m => m.id === payload.new.id)) return prev;
                        return [...prev, payload.new];
                    });
                    
                    // If message is from other user, mark it as read immediately if we are viewing this screen
                    if (payload.new.sender_id !== userId) {
                        markAsRead(); 
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [chatId, userId]);

    const fetchCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id || null);
    };

    const fetchMessages = async () => {
        const { data } = await supabase
            .from("messages")
            .select("*")
            .eq("chat_id", chatId)
            .order("created_at", { ascending: true });
        
        if (data) setMessages(data);
    };

    const markAsRead = async () => {
        if (!userId) return;

        // Mark all messages in this chat sent by others as read
        await supabase
            .from("messages")
            .update({ is_read: true })
            .eq("chat_id", chatId)
            .neq("sender_id", userId)
            .eq("is_read", false);
    };

    const sendMessage = async () => {
        if (!text.trim() || !userId) return;
        
        const content = text.trim();
        setText("");
        setSending(true); 

        // Optimistic Update
        const optimisticMessage = {
            id: 'temp-' + Date.now(),
            chat_id: chatId,
            sender_id: userId,
            content: content,
            message_type: 'text',
            created_at: new Date().toISOString(),
            is_read: false,
        };
        setMessages((prev) => [...prev, optimisticMessage]);

        try {
             // 1. Insert message
             const { data, error: msgError } = await supabase.from("messages").insert({
                chat_id: chatId,
                sender_id: userId,
                content: content,
                message_type: "text",
            }).select().single();

            if (msgError) throw msgError;

            // Replace optimistic message with real one, OR remove optimistic if realtime already added real one
            setMessages((prev) => {
                const alreadyExists = prev.some(m => m.id === data.id);
                if (alreadyExists) {
                    return prev.filter(m => m.id !== optimisticMessage.id);
                }
                return prev.map(m => m.id === optimisticMessage.id ? data : m);
            });

             // 2. Update chat last_message
             await supabase
                .from("chats")
                .update({
                    last_message: content,
                    last_message_at: new Date().toISOString(),
                })
                .eq("id", chatId);
        } catch (error) {
            console.error("Send error:", error);
        } finally {
            setSending(false);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.All,
          quality: 0.5,
          allowsEditing: true, 
        });
    
        if (!result.canceled && result.assets[0].uri) {
            const type = result.assets[0].type === 'video' ? 'video' : 'image';
            uploadMedia(result.assets[0].uri, type);
        }
    };

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*', // Allow all, or specific types like 'application/pdf'
                copyToCacheDirectory: true
            });

            if (result.assets && result.assets[0]) {
                const asset = result.assets[0];
                 // Determine type roughly
                 if (asset.mimeType?.startsWith('image/')) {
                     uploadMedia(asset.uri, 'image');
                 } else if (asset.mimeType?.startsWith('video/')) {
                     uploadMedia(asset.uri, 'video');
                 } else {
                     // Treat as generic file
                     uploadMedia(asset.uri, 'file', asset.name);
                 }
            }
        } catch (err) {
            console.error("Document picker error", err);
        }
    };

    // Voice Recording Functions
    const startRecording = async () => {
        try {
            const permission = await Audio.requestPermissionsAsync();
            if (permission.status === 'granted') {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true,
                });

                const { recording } = await Audio.Recording.createAsync(
                    Audio.RecordingOptionsPresets.HIGH_QUALITY
                );

                setRecording(recording);
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

    const stopRecording = async (cancel = false) => {
        if (!recording) return;

        setIsRecording(false);
        if (recordingTimer.current) clearInterval(recordingTimer.current);

        try {
            await recording.stopAndUnloadAsync();
        } catch (error) {
            // minor error if already stopped
        }

        const uri = recording.getURI(); 
        setRecording(null);

        if (!cancel && uri) {
            uploadMedia(uri, 'voice');
        }
    };

    const handleDownload = async (url: string, fileName?: string) => {
        setDownloading(true);
        try {
            if (Platform.OS === 'web') {
                const anchor = document.createElement('a');
                anchor.href = url;
                anchor.download = fileName || 'download';
                document.body.appendChild(anchor);
                anchor.click();
                document.body.removeChild(anchor);
                return;
            }

            const downloadResumable = FileSystem.createDownloadResumable(
                url,
                FileSystem.documentDirectory + (fileName || 'downloaded_file'),
                {}
            );

            const result = await downloadResumable.downloadAsync();
            if (result && result.uri) {
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(result.uri);
                }
            }
        } catch (e) {
            console.error(e);
            alert("Download failed");
        } finally {
            setDownloading(false);
        }
    };

    const formatDuration = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const uploadMedia = async (uri: string, type: 'image' | 'video' | 'voice' | 'file', fileNameOverride?: string) => {
        if (!userId) return;
        setSending(true);

        try {
            let extension = uri.split('.').pop() || 'bin';
             // Adjust extension for voice if needed
            if (type === 'voice' && !uri.includes('.')) extension = 'm4a';

            const folder = type === 'image' ? '' : (type === 'voice' ? 'audio/' : (type === 'file' ? 'documents/' : ''));
            const timestamp = Date.now();
            const fileName = fileNameOverride 
                ? `${folder}${chatId}/${timestamp}_${fileNameOverride}`
                : `${folder}${chatId}/${timestamp}.${extension}`;
            
            // For optimistic UI - construct a realistic looking message
            let optimisticContent = null;
            if (type === 'file') optimisticContent = fileNameOverride || 'Document';

            const optimisticMessage = {
                id: 'temp-' + timestamp,
                chat_id: chatId,
                sender_id: userId,
                content: optimisticContent,
                message_type: type,
                media_url: uri, // Local URI for preview
                created_at: new Date().toISOString(),
                is_read: false,
            };
            
            setMessages((prev) => [...prev, optimisticMessage]);

            // Fetch blob from URI
            const response = await fetch(uri);
            const blob = await response.blob();

            const { error: uploadError } = await supabase.storage
                .from("chat-media")
                .upload(fileName, blob);

            if (uploadError) throw uploadError;

             const { data: { publicUrl } } = supabase.storage
                .from("chat-media")
                .getPublicUrl(fileName);

            const { data, error: msgError } = await supabase.from("messages").insert({
                chat_id: chatId,
                sender_id: userId,
                content: optimisticContent,
                media_url: publicUrl,
                message_type: type,
            }).select().single();

            if (msgError) throw msgError;

             // Replace optimistic message
            setMessages((prev) => {
                const alreadyExists = prev.some(m => m.id === data.id);
                if (alreadyExists) return prev.filter(m => m.id !== optimisticMessage.id);
                return prev.map(m => m.id === optimisticMessage.id ? data : m);
            });

             let lastMsgText = `Sent a ${type}`;
             if(type === 'image') lastMsgText = "📷 Image";
             if(type === 'video') lastMsgText = "🎥 Video";
             if(type === 'voice') lastMsgText = "🎤 Voice Message";
             if(type === 'file') lastMsgText = "📄 File";

             await supabase
                .from("chats")
                .update({
                    last_message: lastMsgText,
                    last_message_at: new Date().toISOString(),
                })
                .eq("id", chatId);

        } catch (error) {
            console.error("Upload error:", error);
            // Remove optimistic on error
            // setMessages...
        } finally {
            setSending(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
             {/* Header */}
            <View className="px-4 py-2 border-b border-border/50 flex-row items-center bg-background z-10 shadow-sm">
                <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
                    <ChevronLeft size={24} className="text-foreground" />
                </TouchableOpacity>
                <Image 
                    source={{ uri: avatarUrl || "https://ui-avatars.com/api/?name=" + customerName }}
                    className="w-9 h-9 rounded-full bg-muted ml-2" 
                />
                <View className="ml-3">
                    <Text className="text-base font-bold text-foreground">{customerName}</Text>
                    <Text className="text-xs text-green-600">Active</Text>
                </View>
            </View>

            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    contentContainerClassName="p-4 space-y-3"
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    renderItem={({ item }) => {
                        const isMe = item.sender_id === userId;
                        return (
                             <View className={cn("flex-row mb-2", isMe ? "justify-end" : "justify-start")}>
                                <View className={cn(
                                    "max-w-[75%] p-3 rounded-2xl", 
                                    isMe ? "bg-primary rounded-tr-none" : "bg-card border border-border rounded-tl-none"
                                )}>
                                    {item.message_type === "image" && item.media_url ? (
                                        <TouchableOpacity onPress={() => setViewerUrl(item.media_url)}>
                                            <Image 
                                                source={{ uri: item.media_url }} 
                                                className="w-48 h-48 rounded-lg bg-black/10" 
                                                resizeMode="cover"
                                            />
                                        </TouchableOpacity>
                                    ) : item.message_type === "video" && item.media_url ? (
                                        <Video
                                            source={{ uri: item.media_url }}
                                            style={{ width: 200, height: 200, borderRadius: 8, backgroundColor: 'black' }}
                                            useNativeControls
                                            resizeMode={ResizeMode.CONTAIN}
                                            isLooping={false}
                                        />
                                    ) : item.message_type === "voice" && item.media_url ? (
                                        <AudioPlayer uri={item.media_url} isPending={item.id.toString().startsWith('temp-')} />
                                    ) : item.message_type === "file" && item.media_url ? (
                                        <TouchableOpacity 
                                            onPress={() => handleDownload(item.media_url!, item.content || 'document')}
                                            className="flex-row items-center space-x-2 bg-black/5 p-2 rounded-lg"
                                        >
                                            <View className="p-2 bg-primary/10 rounded-lg">
                                                <FileText size={24} className="text-primary" />
                                            </View>
                                            <View className="flex-1 max-w-[150px]">
                                                <Text numberOfLines={1} className={cn("font-medium text-sm", isMe ? "text-primary-foreground" : "text-foreground")}>
                                                    {item.content || "Document"}
                                                </Text>
                                                <Text className="text-[10px] text-muted-foreground uppercase">PDF / DOC</Text>
                                            </View>
                                            <View className="p-1">
                                                {downloading ? (
                                                  <ActivityIndicator size="small" color={isMe ? "white" : "black"} />
                                                ) : (
                                                  <DownloadIcon size={16} className="text-muted-foreground" />
                                                )}
                                            </View>
                                        </TouchableOpacity>
                                    ) : (
                                        <Text className={cn("text-base", isMe ? "text-primary-foreground" : "text-foreground")}>
                                            {item.content}
                                        </Text>
                                    )}
                                    <Text className={cn("text-[10px] mt-1 text-right", isMe ? "text-primary-foreground/70" : "text-muted-foreground")}>
                                        {dayjs(item.created_at).format("HH:mm")}
                                    </Text>
                                </View>
                            </View>
                        )
                    }}
                />

                <Modal visible={!!viewerUrl} transparent={true} onRequestClose={() => setViewerUrl(null)}>
                    <View className="flex-1 bg-black/95 justify-center items-center">
                        <TouchableOpacity 
                            onPress={() => setViewerUrl(null)} 
                            className="absolute top-12 right-6 z-10 p-2 bg-white/20 rounded-full"
                        >
                            <X size={24} color="white" />
                        </TouchableOpacity>
                        
                        {viewerUrl && (
                             <Image 
                                source={{ uri: viewerUrl }} 
                                className="w-full h-full" 
                                resizeMode="contain"
                            />
                        )}
                        
                        <TouchableOpacity 
                             onPress={() => viewerUrl && handleDownload(viewerUrl, 'image.jpg')}
                             className="absolute bottom-12 right-6 z-10 p-3 bg-white/20 rounded-full"
                        >
                             <DownloadIcon size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                </Modal>

                {/* Attachment Modal */}
                <Modal visible={showAttachModal} transparent={true} onRequestClose={() => setShowAttachModal(false)} animationType="fade">
                    <TouchableOpacity 
                        className="flex-1 bg-black/40 justify-end" 
                        activeOpacity={1} 
                        onPress={() => setShowAttachModal(false)}
                    >
                        <View className="bg-card m-4 rounded-xl overflow-hidden mb-20">
                            <TouchableOpacity 
                                className="p-4 flex-row items-center border-b border-border" 
                                onPress={() => { setShowAttachModal(false); pickImage(); }}
                            >
                                <ImageIcon size={24} className="text-foreground mr-3" />
                                <Text className="text-foreground text-base font-medium">Photo & Video</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                className="p-4 flex-row items-center"
                                onPress={() => { setShowAttachModal(false); pickDocument(); }}
                            >
                                <FileText size={24} className="text-foreground mr-3" />
                                <Text className="text-foreground text-base font-medium">Document</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>

                {/* Input */}
                <View className="p-2 bg-background border-t border-border flex-row items-end space-x-2">
                     <View className="flex-row items-end pb-2">
                        <TouchableOpacity onPress={handleAttachmentPress} className="p-2">
                            <Paperclip size={24} className="text-muted-foreground" />
                        </TouchableOpacity>
                     </View>

                    {isRecording ? (
                         <View className="flex-1 bg-red-100 rounded-2xl px-4 py-2 min-h-[44px] flex-row items-center justify-between">
                            <View className="flex-row items-center">
                                <View className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2" />
                                <Text className="text-red-600 font-medium">{formatDuration(recordingDuration)}</Text>
                            </View>
                            <View className="flex-row items-center space-x-3">
                                 <TouchableOpacity onPress={() => stopRecording(true)}>
                                    <Trash2 size={20} className="text-red-400" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => stopRecording(false)}>
                                    <Square size={20} className="text-red-600" fill="currentColor" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                         <View className="flex-1 bg-muted/30 border border-input rounded-2xl px-4 py-2 min-h-[44px] flex-row items-end">
                            <TextInput
                                placeholder="Type a message..."
                                value={text}
                                onChangeText={setText}
                                multiline
                                className="text-foreground max-h-24 pt-2 flex-1"
                            />
                            {!text.trim() && (
                                <TouchableOpacity onPress={startRecording} className="p-1 ml-1">
                                    <Mic size={20} className="text-muted-foreground" />
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    {!isRecording && (
                        <TouchableOpacity 
                            onPress={sendMessage} 
                            disabled={!text.trim() && !sending}
                            className={cn("p-2 mb-1 rounded-full", text.trim() ? "bg-primary" : "bg-muted")}
                        >
                             {sending ? (
                                 <ActivityIndicator size="small" color="white" />
                             ) : (
                                 <Send size={20} color="white" />
                             )}
                        </TouchableOpacity>
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
