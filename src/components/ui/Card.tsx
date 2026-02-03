import React from "react";
import { View, Text, ViewProps } from "react-native";
import { cn } from "../../lib/utils";

interface CardProps extends ViewProps {
  className?: string;
}

export const Card = ({ className, ...props }: CardProps) => (
  <View
    className={cn(
      "rounded-xl border border-border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
);

export const CardHeader = ({ className, ...props }: CardProps) => (
  <View className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
);

export const CardTitle = ({ className, ...props }: CardProps) => (
  <Text
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight text-foreground",
      className
    )}
    {...props}
  />
);

export const CardDescription = ({ className, ...props }: CardProps) => (
  <Text
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
);

export const CardContent = ({ className, ...props }: CardProps) => (
  <View className={cn("p-6 pt-0", className)} {...props} />
);

export const CardFooter = ({ className, ...props }: CardProps) => (
  <View className={cn("flex-row items-center p-6 pt-0", className)} {...props} />
);
