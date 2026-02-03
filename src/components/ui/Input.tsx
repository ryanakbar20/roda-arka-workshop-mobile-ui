import React from "react";
import { TextInput, View, Text, TextInputProps } from "react-native";
import { cn } from "../../lib/utils";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const Input = React.forwardRef<TextInput, InputProps>(
  ({ className, containerClassName, label, error, ...props }, ref) => {
    return (
      <View className={cn("w-full space-y-2", containerClassName)}>
        {label && <Text className="text-sm font-medium text-foreground">{label}</Text>}
        <TextInput
          ref={ref}
          className={cn(
            "flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground",
            "focus:border-primary focus:ring-1 focus:ring-primary",
            error && "border-destructive",
            className
          )}
          placeholderTextColor="hsl(var(--muted-foreground))"
          {...props}
        />
        {error && <Text className="text-xs text-destructive">{error}</Text>}
      </View>
    );
  }
);

Input.displayName = "Input";
