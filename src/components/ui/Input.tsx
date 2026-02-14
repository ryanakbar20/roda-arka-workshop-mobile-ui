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
      <View className={cn("w-full mb-4", containerClassName)}>
        {label && (
          <Text className="text-[13px] font-semibold text-muted-foreground mb-1.5 ml-0.5">
            {label}
          </Text>
        )}
        <TextInput
          ref={ref}
          className={cn(
            "flex h-14 w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-base text-foreground",
            "focus:border-primary focus:ring-2 focus:ring-primary/10",
            error && "border-destructive focus:ring-destructive/10",
            className
          )}
          placeholderTextColor="hsl(var(--muted-foreground))"
          {...props}
        />
        {error && <Text className="text-xs text-destructive mt-1 ml-1">{error}</Text>}
      </View>
    );
  }
);

Input.displayName = "Input";
