import React from "react";
import { View, Text, Image } from "react-native";
import { cn } from "../../lib/utils";

interface ActivityItemProps {
  title: string;
  description: string;
  status: string;
  avatarUrl?: string | null;
  timestamp: string;
  isLast?: boolean;
}

export function ActivityItem({ title, description, status, avatarUrl, timestamp, isLast }: ActivityItemProps) {
    let statusColor = "text-gray-500";
    if (status === "completed") statusColor = "text-green-600";
    if (status === "in_progress" || status === "accepted") statusColor = "text-blue-600";
    if (status === "rejected") statusColor = "text-red-600";
    
  return (
    <View className={cn("flex-row items-start py-4 mx-4", !isLast && "border-b border-border/40")}>
      <View className="h-10 w-10 rounded-full bg-muted items-center justify-center mr-3 overflow-hidden">
        {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} className="w-full h-full" />
        ) : (
            <Text className="text-lg font-bold text-muted-foreground">{title.charAt(0)}</Text>
        )}
      </View>
      <View className="flex-1">
        <Text className="font-semibold text-foreground text-base">{title}</Text>
        <Text className="text-sm text-muted-foreground">{description}</Text>
        <View className="flex-row items-center mt-1">
             <Text className={cn("text-xs font-medium capitalize", statusColor)}>{status.replace('_', ' ')}</Text>
             <Text className="text-xs text-muted-foreground ml-2">• {timestamp}</Text>
        </View>
      </View>
    </View>
  );
}
