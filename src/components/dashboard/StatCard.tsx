import React from "react";
import { View, Text } from "react-native";
import { cn } from "../../lib/utils";

interface StatCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  color?: string; // hex color for icon or bg
}

export function StatCard({ title, value, icon, color = "bg-primary" }: StatCardProps) {
  return (
    <View className="bg-background rounded-xl p-4 shadow-sm border border-border flex-1 min-w-[45%] m-1">
        <View className="flex-row items-center justify-between mb-2">
            <Text className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{title}</Text>
            {icon && <View className={cn("p-2 rounded-full bg-opacity-10", color)}>{icon}</View>}
        </View>
      <Text className="text-2xl font-bold text-foreground">{value}</Text>
    </View>
  );
}
