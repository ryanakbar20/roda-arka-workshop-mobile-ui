import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Play, Pause } from 'lucide-react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { cn } from '../../lib/utils';

interface AudioPlayerProps {
  uri: string;
  isMe?: boolean;
}

export function AudioPlayer({ uri, isMe = false }: AudioPlayerProps) {
  const player = useAudioPlayer(uri, {
    downloadFirst: true,
  });
  const status = useAudioPlayerStatus(player);
  const [error, setError] = useState<string | null>(null);

  const togglePlayback = () => {
    if (status.playing) {
      player.pause();
    } else {
      if (status.currentTime >= status.duration - 0.1) {
        player.seekTo(0);
      }
      player.play();
    }
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  if (error) {
    return (
      <View className={cn("flex-row items-center p-2 rounded-xl", isMe ? "bg-red-900/20" : "bg-red-50")}>
        <Text className={cn("text-xs", isMe ? "text-white" : "text-red-500")}>Gagal memutar audio</Text>
      </View>
    );
  }

  const accentColor = isMe ? "#fff" : "#6090ffff";
  const trackColor = isMe ? "rgba(255,255,255,0.2)" : "#6090ffff";
  const progressColor = isMe ? "#fff" : "#6090ffff";

  return (
    <View className="flex-row items-center gap-3 min-w-[200px] py-1">
      <TouchableOpacity 
        onPress={togglePlayback}
        className={cn(
            "w-10 h-10 rounded-full items-center justify-center", 
            isMe ? "bg-white/20" : "bg-primary/10"
        )}
      >
        {status.isBuffering ? (
          <ActivityIndicator size="small" color={accentColor} />
        ) : status.playing ? (
          <Pause size={18} color={accentColor} fill={accentColor} />
        ) : (
          <Play size={18} color={accentColor} fill={accentColor} className="ml-0.5" />
        )}
      </TouchableOpacity>
      
      <View className="flex-1">
        <View style={{ backgroundColor: trackColor }} className="h-1.5 rounded-full overflow-hidden">
          <View 
            style={{ 
              width: `${status.duration > 0 ? (status.currentTime / status.duration) * 100 : 0}%`,
              backgroundColor: progressColor
            }} 
            className="h-full" 
          />
        </View>
        <View className="flex-row justify-between mt-1.5">
          <Text className={cn("text-[9px] font-bold uppercase tracking-widest", isMe ? "text-primary-foreground/60" : "text-muted-foreground/60")}>
            {formatTime(status.currentTime)}
          </Text>
          <Text className={cn("text-[9px] font-bold uppercase tracking-widest", isMe ? "text-primary-foreground/60" : "text-muted-foreground/60")}>
            {formatTime(status.duration)}
          </Text>
        </View>
      </View>
    </View>
  );
}
