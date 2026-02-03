import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import { Play, Pause } from 'lucide-react-native';
import { cn } from '../../lib/utils';

interface AudioPlayerProps {
    uri: string;
    isPending?: boolean;
}

export const AudioPlayer = ({ uri, isPending }: AudioPlayerProps) => {
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [position, setPosition] = useState(0);
    const [loading, setLoading] = useState(false);

    async function loadSound() {
        setLoading(true);
        try {
            const { sound: newSound, status } = await Audio.Sound.createAsync(
                { uri },
                { shouldPlay: false },
                onPlaybackStatusUpdate
            );
            setSound(newSound);
            if (status.isLoaded && status.durationMillis) {
                setDuration(status.durationMillis);
            }
        } catch (error) {
            console.error("Error loading sound", error);
        } finally {
            setLoading(false);
        }
    }

    const onPlaybackStatusUpdate = (status: any) => {
        if (status.isLoaded) {
            setPosition(status.positionMillis);
            setDuration(status.durationMillis || 0);
            setIsPlaying(status.isPlaying);
            if (status.didJustFinish) {
                setIsPlaying(false);
                setPosition(0);
                // Reset (optional, depending on UX preference)
            }
        }
    };

    useEffect(() => {
        if (!isPending) {
             loadSound(); // Only load if not pending (or load immediately if optimistic has local uri?)
             // Optimistic local URI works with expo-av usually.
        }
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [uri, isPending]);

    const togglePlay = async () => {
        if (!sound) return;
        if (isPlaying) {
            await sound.pauseAsync();
        } else {
            if (position >= duration) {
                 await sound.replayAsync();
            } else {
                await sound.playAsync();
            }
        }
    };

    const formatTime = (millis: number) => {
        if (typeof millis !== 'number' || !Number.isFinite(millis) || millis < 0) return "0:00";
        const totalSeconds = Math.floor(millis / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    return (
        <View className={cn("flex-row items-center bg-muted/20 p-2 rounded-lg min-w-[150px]", isPending && "opacity-50")}>
            <TouchableOpacity 
                onPress={togglePlay} 
                className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3"
                disabled={loading || isPending}
            >
                {loading ? (
                    <ActivityIndicator size="small" color="#2563eb" />
                ) : isPlaying ? (
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
