import React, { useState, useEffect, useRef } from "react";
import { View, Text, FlatList, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, Image, ActivityIndicator, Modal, ActionSheetIOS, NativeModules } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { supabase } from "../../../lib/supabase";
import { ChevronLeft, Send, Image as ImageIcon, FileText, Mic, Square, Trash2, Paperclip, X, Download as DownloadIcon, Play } from "lucide-react-native";
import dayjs from "../../../lib/dayjs";
import * as ImagePicker from 'expo-image-picker';
import { HomeStackParamList } from "../../../navigation/types";
import { cn } from "../../../lib/utils";
import { VideoView, useVideoPlayer } from 'expo-video';
import { useAudioRecorder, RecordingPresets, requestRecordingPermissionsAsync } from 'expo-audio';
import { AudioPlayer } from "../../../components/chat/AudioPlayer";
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

type ChatDetailRouteProp = RouteProp<HomeStackParamList, "ChatDetail">;

const isVideoAvailable = !!NativeModules.ExpoVideo;
const isAudioAvailable = !!NativeModules.ExpoAudio;

export default function ChatDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute<ChatDetailRouteProp>();
    const insets = useSafeAreaInsets();
    
    if (!route.params) return null;
    const { chatId, customerName, avatarUrl } = route.params;

    const [messages, setMessages] = useState<any[]>([]);
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const flatListRef = useRef<FlatList>(null);

    // Voice Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const recordingTimer = useRef<NodeJS.Timeout | null>(null);

    // Lightbox & Attach State
    const [viewerUrl, setViewerUrl] = useState<string | null>(null);
    const [downloading, setDownloading] = useState(false);
    const [showAttachModal, setShowAttachModal] = useState(false);
    
    // Preview State
    const [previewFile, setPreviewFile] = useState<{uri: string, type: 'image' | 'video' | 'voice' | 'file', name?: string} | null>(null);

    useEffect(() => {
        fetchCurrentUser();
    }, []);

    useEffect(() => {
        if (!userId) return;
        
        fetchMessages();
        markAsRead();

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
                        if (prev.find(m => m.id === payload.new.id)) return prev;
                        return [...prev, payload.new];
                    });
                    
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
             const { data, error: msgError } = await supabase.from("messages").insert({
                chat_id: chatId,
                sender_id: userId,
                content: content,
                message_type: "text",
            }).select().single();

            if (msgError) throw msgError;

            setMessages((prev) => {
                const alreadyExists = prev.some(m => m.id === data.id);
                if (alreadyExists) return prev.filter(m => m.id !== optimisticMessage.id);
                return prev.map(m => m.id === optimisticMessage.id ? data : m);
            });

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
            setPreviewFile({ uri: result.assets[0].uri, type });
        }
    };

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true
            });

            if (result.assets && result.assets[0]) {
                const asset = result.assets[0];
             if (asset.mimeType?.startsWith('image/')) {
                     setPreviewFile({ uri: asset.uri, type: 'image' });
                 } else if (asset.mimeType?.startsWith('video/')) {
                     setPreviewFile({ uri: asset.uri, type: 'video' });
                 } else {
                     setPreviewFile({ uri: asset.uri, type: 'file', name: asset.name });
                 }
            }
        } catch (err) {
            console.error("Document picker error", err);
        }
    };
    const handleStartRecording = () => {
        if (!isAudioAvailable) {
            alert("Voice recording is not supported on this device/version.");
            return;
        }
        setIsRecording(true);
        setRecordingDuration(0);
        recordingTimer.current = setInterval(() => {
            setRecordingDuration(d => d + 1);
        }, 1000);
    };

    const handleStopRecording = async (cancel: boolean) => {
        setIsRecording(false);
        if (recordingTimer.current) {
            clearInterval(recordingTimer.current);
            recordingTimer.current = null;
        }
    };


    const handleDownload = async (url: string, fileName?: string) => {
        setDownloading(true);
        try {
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
            if (type === 'voice' && !uri.includes('.')) extension = 'm4a';

            const folder = type === 'image' ? '' : (type === 'voice' ? 'audio/' : (type === 'file' ? 'documents/' : ''));
            const timestamp = Date.now();
            const fileName = fileNameOverride 
                ? `${folder}${chatId}/${timestamp}_${fileNameOverride}`
                : `${folder}${chatId}/${timestamp}.${extension}`;
            
            let optimisticContent = null;
            if (type === 'file') optimisticContent = fileNameOverride || 'Document';

            const optimisticMessage = {
                id: 'temp-' + timestamp,
                chat_id: chatId,
                sender_id: userId,
                content: optimisticContent,
                message_type: type,
                media_url: uri,
                created_at: new Date().toISOString(),
                is_read: false,
            };
            
            setMessages((prev) => [...prev, optimisticMessage]);

            const formData = new FormData();
            formData.append('file', {
                uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
                name: fileName.split('/').pop() || 'upload.bin',
                type: type === 'image' ? 'image/jpeg' : (type === 'video' ? 'video/mp4' : (type === 'voice' ? 'audio/m4a' : '*/*'))
            } as any);

            const { error: uploadError } = await supabase.storage
                .from("chat-media")
                .upload(fileName, formData, {
                  cacheControl: '3600',
                  upsert: false
                });

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
        } finally {
            setSending(false);
        }
    };

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

    const renderMessage = ({ item }: { item: any }) => {
        const isMe = item.sender_id === userId;
        const isVoice = item.message_type === "voice";
        const isImage = item.message_type === "image";
        const isVideo = item.message_type === "video";
        const isFile = item.message_type === "file";

        return (
            <View className={cn("mb-4 max-w-[80%]", isMe ? "self-end items-end" : "self-start items-start")}>
                <View className={cn(
                    "p-3 rounded-2xl shadow-sm",
                    isMe ? "bg-primary rounded-tr-none" : "bg-card border border-border/50 rounded-tl-none"
                )}>
                    {isImage ? (
                        <TouchableOpacity onPress={() => item.media_url && setViewerUrl(item.media_url)}>
                            <Image source={{ uri: item.media_url }} className="w-48 h-48 rounded-xl bg-muted" />
                        </TouchableOpacity>
                    ) : isVideo ? (
                        <VideoMessage uri={item.media_url} />
                    ) : isFile ? (
                        <TouchableOpacity onPress={() => handleDownload(item.media_url, item.content)} className="flex-row items-center p-1">
                            <View className={cn("p-2 rounded-lg mr-2", isMe ? "bg-white/20" : "bg-primary/10")}>
                                <FileText size={20} className={isMe ? "text-white" : "text-primary"} />
                            </View>
                            <View>
                                <Text className={cn("text-sm font-medium", isMe ? "text-white" : "text-foreground")} numberOfLines={1}>
                                    {item.content || "Document"}
                                </Text>
                                <Text className={cn("text-[10px]", isMe ? "text-white/60" : "text-muted-foreground")}>Tap to open</Text>
                            </View>
                        </TouchableOpacity>
                    ) : isVoice ? (
                        <AudioPlayer uri={item.media_url} />
                    ) : (
                        <Text className={cn("text-base leading-5", isMe ? "text-primary-foreground font-medium" : "text-foreground")}>
                            {item.content}
                        </Text>
                    )}
                </View>
                <Text className="text-[10px] text-muted-foreground mt-1 px-1">
                    {dayjs(item.created_at).format("HH:mm")}
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
            <View className="px-4 py-3 border-b border-border/50 flex-row items-center bg-background z-10">
                <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3 p-1 rounded-full active:bg-muted/10">
                    <ChevronLeft size={24} className="text-foreground" />
                </TouchableOpacity>
                <View className="h-10 w-10 bg-primary/10 rounded-xl items-center justify-center mr-3">
                     <Text className="font-bold text-primary">{customerName?.charAt(0) || "C"}</Text>
                </View>
                <View className="flex-1">
                    <Text className="text-base font-bold text-foreground leading-tight" numberOfLines={1}>
                        {customerName || "Customer"}
                    </Text>
                    <View className="flex-row items-center mt-0.5">
                        <View className="h-2 w-2 bg-green-500 rounded-full mr-1.5" />
                        <Text className="text-[11px] text-muted-foreground">Online</Text>
                    </View>
                </View>
            </View>

            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "padding"}
                keyboardVerticalOffset={0}
                className="flex-1"
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    contentContainerClassName="p-6"
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />

                <View 
                    style={{ paddingBottom: Math.max(insets.bottom, 16) }}
                    className="p-4 bg-background border-t border-border/30"
                >
                    <View className="flex-row items-end gap-2">
                        <View className="flex-1 flex-row items-center bg-muted/40 rounded-[24px] px-3 py-1 border border-border/40 min-h-[48px]">
                             {!isRecording && (
                                 <TouchableOpacity onPress={handleAttachmentPress} className="p-2 mr-1">
                                    <Paperclip size={22} className="text-muted-foreground" />
                                </TouchableOpacity>
                             )}
                            
                            {isRecording ? (
                                <View className="flex-1 flex-row items-center py-2 px-2">
                                    <View className="h-2 w-2 rounded-full bg-red-500 mr-2 animate-pulse" />
                                    <Text className="text-foreground text-sm font-medium">{formatDuration(recordingDuration)}</Text>
                                    <Text className="text-muted-foreground text-xs ml-auto mr-2">Tap mic to stop and send</Text>
                                </View>
                            ) : (
                                <TextInput
                                    className="flex-1 text-foreground text-sm max-h-24 min-h-[40px] py-1"
                                    placeholder="Message..."
                                    placeholderTextColor="#94a3b8"
                                    multiline
                                    value={text}
                                    onChangeText={setText}
                                />
                            )}
                             {!text.trim() && (
                                <AudioRecorderWrapper 
                                    isAudioAvailable={isAudioAvailable}
                                    isRecording={isRecording}
                                    onStartRecording={handleStartRecording}
                                    onStopRecording={handleStopRecording}
                                    onUploadMedia={(uri) => uploadMedia(uri, 'voice')}
                                />
                             )}
                        </View>
                        {(text.trim().length > 0) && (
                            <TouchableOpacity 
                                onPress={sendMessage}
                                className="h-11 w-11 bg-primary rounded-full items-center justify-center shadow-sm shadow-primary/20"
                            >
                                <Send size={20} className="text-white ml-0.5" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>

            {/* Preview Modal */}
            <Modal visible={!!previewFile} transparent={true} animationType="slide">
                 <View className="flex-1 bg-black justify-center items-center pb-20 pt-10 px-4">
                     <View className="absolute top-12 left-6 z-10">
                        <TouchableOpacity onPress={() => setPreviewFile(null)} className="p-2 bg-white/20 rounded-full">
                            <X size={24} color="white" />
                        </TouchableOpacity>
                     </View>

                     {previewFile?.type === 'image' && (
                         <Image source={{ uri: previewFile.uri }} className="w-full h-[70%]" resizeMode="contain" />
                     )}
                     {previewFile?.type === 'video' && (
                         <VideoMessage uri={previewFile.uri} />
                     )}
                     {previewFile?.type === 'file' && (
                         <View className="bg-white/10 p-6 rounded-2xl items-center w-full max-w-xs">
                             <FileText size={64} color="white" />
                             <Text className="text-white mt-4 text-center font-bold" numberOfLines={2}>
                                 {previewFile.name || "Document"}
                             </Text>
                         </View>
                     )}

                     <View className="absolute bottom-10 flex-row gap-4 px-6 w-full justify-center">
                         <TouchableOpacity 
                             onPress={() => setPreviewFile(null)}
                             className="flex-1 bg-white/20 py-4 rounded-xl items-center"
                         >
                             <Text className="text-white font-bold">Cancel</Text>
                         </TouchableOpacity>
                         <TouchableOpacity 
                             onPress={() => {
                                 if (previewFile) {
                                    uploadMedia(previewFile.uri, previewFile.type, previewFile.name);
                                    setPreviewFile(null);
                                 }
                             }}
                             className="flex-1 bg-primary py-4 rounded-xl items-center flex-row justify-center"
                         >
                             <Text className="text-white font-bold mr-2">Send</Text>
                             <Send size={18} color="white" />
                         </TouchableOpacity>
                     </View>
                 </View>
            </Modal>

            <Modal visible={!!viewerUrl} transparent={true} onRequestClose={() => setViewerUrl(null)}>
                <View className="flex-1 bg-black justify-center items-center">
                    <TouchableOpacity 
                        className="absolute top-12 right-6 z-10 p-2 bg-white/20 rounded-full"
                        onPress={() => setViewerUrl(null)}
                    >
                        <X size={24} color="white" />
                    </TouchableOpacity>
                    <Image 
                        source={{ uri: viewerUrl || "" }} 
                        className="w-full h-full" 
                        resizeMode="contain"
                    />
                </View>
            </Modal>

            {/* Android Attachment Modal */}
            <Modal visible={showAttachModal} transparent={true} onRequestClose={() => setShowAttachModal(false)} animationType="fade">
                <TouchableOpacity 
                    className="flex-1 bg-black/40 justify-end" 
                    activeOpacity={1} 
                    onPress={() => setShowAttachModal(false)}
                >
                    <View className="bg-card m-4 rounded-2xl overflow-hidden mb-20 shadow-lg">
                        <TouchableOpacity 
                            className="p-4 flex-row items-center border-b border-border/50" 
                            onPress={() => { setShowAttachModal(false); pickImage(); }}
                        >
                            <View className="h-10 w-10 bg-blue-100 rounded-xl items-center justify-center mr-4">
                                <ImageIcon size={20} className="text-blue-600" />
                            </View>
                            <Text className="text-foreground text-base font-semibold">Photo & Video</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            className="p-4 flex-row items-center"
                            onPress={() => { setShowAttachModal(false); pickDocument(); }}
                        >
                            <View className="h-10 w-10 bg-orange-100 rounded-xl items-center justify-center mr-4">
                                <FileText size={20} className="text-orange-600" />
                            </View>
                            <Text className="text-foreground text-base font-semibold">Document</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const VideoMessage = ({ uri }: { uri: string }) => {
    if (!isVideoAvailable) {
        return (
            <View className="w-48 h-48 bg-muted rounded-xl items-center justify-center p-4">
                <Text className="text-xs text-muted-foreground text-center">Video playback not supported in this environment</Text>
            </View>
        );
    }
    return <VideoMessageInternal uri={uri} />;
};

const VideoMessageInternal = ({ uri }: { uri: string }) => {
    const player = useVideoPlayer(uri, (player) => {
        player.loop = false;
    });

    return (
        <VideoView
            player={player}
            style={{ width: 192, height: 192, borderRadius: 12 }}
            nativeControls
        />
    );
};
const AudioRecorderWrapper = ({ 
    isAudioAvailable, 
    isRecording, 
    onStartRecording, 
    onStopRecording, 
    onUploadMedia 
}: { 
    isAudioAvailable: boolean, 
    isRecording: boolean, 
    onStartRecording: () => void, 
    onStopRecording: (cancel: boolean) => void,
    onUploadMedia: (uri: string) => void
}) => {
    if (!isAudioAvailable) {
        return (
            <View className="p-2">
                <Mic size={22} className="text-muted-foreground opacity-30" />
            </View>
        );
    }
    return (
        <AudioRecorderInternal 
            isRecording={isRecording} 
            onStartRecording={onStartRecording} 
            onStopRecording={onStopRecording}
            onUploadMedia={onUploadMedia}
        />
    );
};

const AudioRecorderInternal = ({ 
    isRecording, 
    onStartRecording, 
    onStopRecording,
    onUploadMedia
}: { 
    isRecording: boolean, 
    onStartRecording: () => void, 
    onStopRecording: (cancel: boolean) => void,
    onUploadMedia: (uri: string) => void
}) => {
    const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

    const toggleRecording = async () => {
        if (isRecording) {
            onStopRecording(false);
            try {
                await recorder.stop();
                const uri = recorder.uri;
                if (uri) {
                    onUploadMedia(uri);
                }
            } catch (error) {
                console.error('Failed to stop recording', error);
            }
        } else {
            try {
                const permission = await requestRecordingPermissionsAsync();
                if (permission.status === 'granted') {
                    await recorder.prepareToRecordAsync();
                    recorder.record();
                    onStartRecording();
                }
            } catch (err) {
                console.error('Failed to start recording', err);
            }
        }
    };

    return (
        <TouchableOpacity 
            onPress={toggleRecording}
            className={cn("p-2 rounded-full", isRecording ? "bg-red-100" : "")}
        >
            <Mic size={22} className={isRecording ? "text-red-600" : "text-muted-foreground"} />
        </TouchableOpacity>
    );
};
