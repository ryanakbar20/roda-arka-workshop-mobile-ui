import React from "react";
import { View, Text, ViewProps } from "react-native";
import { cn } from "../../lib/utils";

interface BadgeProps extends ViewProps {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
  className?: string;
  children: React.ReactNode;
}

export const Badge = ({ variant = "default", className, children, ...props }: BadgeProps) => {
  const variants = {
    default: "border-transparent bg-primary",
    secondary: "border-transparent bg-secondary",
    destructive: "border-transparent bg-destructive",
    outline: "text-foreground",
    success: "border-transparent bg-green-500",
    warning: "border-transparent bg-yellow-500",
  };

  const textVariants = {
    default: "text-primary-foreground",
    secondary: "text-secondary-foreground",
    destructive: "text-destructive-foreground",
    outline: "text-foreground",
    success: "text-white",
    warning: "text-white",
  };

  return (
    <View
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 transition-colors focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    >
      <Text className={cn("text-xs font-semibold", textVariants[variant])}>
        {children}
      </Text>
    </View>
  );
};
