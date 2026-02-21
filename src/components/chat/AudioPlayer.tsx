import React from 'react';
import { View, TouchableOpacity, Text, NativeModules } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Play, Pause, CircleOff } from 'lucide-react-native';
import { cn } from '../../lib/utils';

interface AudioPlayerProps {
    uri: string;
    isPending?: boolean;
}

// Check if the native module is available
const isAudioAvailable = !!NativeModules.ExpoAudio;

export const AudioPlayer = (props: AudioPlayerProps) => {
    if (!isAudioAvailable) {
        return (
            <View className="flex-row items-center bg-muted/20 p-2 rounded-lg min-w-[150px] opacity-60">
                <CircleOff size={16} className="text-muted-foreground mr-2" />
                <Text className="text-[10px] text-muted-foreground font-medium">Audio not supported</Text>
            </View>
        );
    }
    return <AudioPlayerInternal {...props} />;
};

const AudioPlayerInternal = ({ uri, isPending }: AudioPlayerProps) => {
    const player = useAudioPlayer(
        uri,
        uri.startsWith('http') ? { downloadFirst: true } : undefined
    );
    const status = useAudioPlayerStatus(player);
    
    const isPlaying = status.playing;
    const duration = status.duration;
    const position = status.currentTime;

    const togglePlay = () => {
        if (isPending) return;
        if (isPlaying) {
            player.pause();
        } else {
            // Give a 0.5s tolerance to handle floating point duration vs position
            const threshold = (duration || 1) - 0.5;
            if (position > 0 && position >= threshold) {
                 player.seekTo(0);
                 player.play();
            } else {
                player.play();
            }
        }
    };

    const formatTime = (seconds: number) => {
        if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds < 0) return "0:00";
        const totalSeconds = Math.floor(seconds);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <View className={cn("flex-row items-center bg-muted/20 p-2 rounded-lg min-w-[150px]", isPending && "opacity-50")}>
            <TouchableOpacity 
                onPress={togglePlay} 
                className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3"
                disabled={isPending}
            >
                {isPlaying ? (
                    <Pause size={16} className="text-primary" fill="currentColor" />
                ) : (
                    <Play size={16} className="text-primary" fill="currentColor" />
                )}
            </TouchableOpacity>
            
            <View className="flex-1">
                 <View className="h-1 bg-muted rounded overflow-hidden mb-1">
                     <View 
                        className="h-full bg-primary" 
                        style={{ width: `${(position / (duration || 1)) * 100}%` }} 
                     />
                 </View>
                 <View className="flex-row justify-between">
                     <Text className="text-[10px] text-muted-foreground font-medium">
                         {formatTime(position)}
                     </Text>
                     <Text className="text-[10px] text-muted-foreground font-medium">
                         -{formatTime(Math.max(0, duration - position))}
                     </Text>
                 </View>
            </View>
        </View>
    );
};
