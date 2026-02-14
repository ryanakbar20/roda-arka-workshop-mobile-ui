import React from "react";
import { TouchableOpacity, Text, TouchableOpacityProps, ActivityIndicator } from "react-native";
import { cn } from "../../lib/utils";

interface ButtonProps extends TouchableOpacityProps {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  loading?: boolean;
  label?: string;
}

export const Button = ({
  className,
  variant = "default",
  size = "default",
  loading,
  label,
  children,
  disabled,
  ...props
}: ButtonProps) => {
  const baseStyles = "flex-row items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  
  const variants = {
    default: "bg-primary text-primary-foreground shadow-sm",
    destructive: "bg-destructive text-destructive-foreground shadow-sm",
    outline: "border border-input bg-background",
    ghost: "bg-transparent",
  };

  const sizes = {
    default: "h-14 px-6",
    sm: "h-10 rounded-lg px-4",
    lg: "h-16 rounded-2xl px-10",
    icon: "h-11 w-11 p-0",
  };

  const textStyles = {
    default: "text-primary-foreground",
    destructive: "text-destructive-foreground",
    outline: "text-foreground",
    ghost: "text-foreground",
  };

  return (
    <TouchableOpacity
      className={cn(baseStyles, "rounded-xl", variants[variant], sizes[size], className)}
      disabled={loading || disabled}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === "outline" || variant === "ghost" ? "hsl(var(--primary))" : "white"} />
      ) : (
        <Text className={cn("text-base font-bold tracking-tight", textStyles[variant])}>
            {label || children}
        </Text>
      )}
    </TouchableOpacity>
  );
};
