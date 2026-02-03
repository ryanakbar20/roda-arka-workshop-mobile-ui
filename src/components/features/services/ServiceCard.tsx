import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { cn } from "../../../lib/utils";
import { User, Calendar, Car, AlertCircle, Wrench } from "lucide-react-native";
import dayjs from "../../../lib/dayjs";
import { Button } from "../../ui/Button";

interface ServiceCardProps {
  service: any;
  onPress: () => void;
  onAction?: () => void;
  actionLabel?: string;
  actionVariant?: "default" | "outline" | "destructive" | "ghost" | "link";
  showStatusBadge?: boolean;
}

export const ServiceCard = ({ 
    service,
    onPress, 
    onAction, 
    actionLabel, 
    actionVariant = "default",
    showStatusBadge = true
}: ServiceCardProps) => {
    // Parse offline data if profile is missing
    let customerName = service.profiles?.full_name ?? "Guest";
    let phone = service.profiles?.phone ?? "-";
    let vehicleInfo = `${service.vehicles?.brands?.name || ""} ${service.vehicles?.models?.name || ""} - ${service.vehicles?.plate_number || ""}`;

    if (!service.profiles && service.service_details?.offline_data) {
        const offline = service.service_details.offline_data;
        customerName = offline.customer_name || customerName;
        phone = offline.phone || phone;
        vehicleInfo = `${offline.brand || ""} ${offline.model || ""} - ${offline.plate || ""}`;
    }

    // Status color mapping
    const getStatusColor = (status: string) => {
        switch(status) {
            case 'pending': return 'bg-orange-100 text-orange-600';
            case 'accepted': return 'bg-blue-100 text-blue-600';
            case 'in_progress': return 'bg-yellow-100 text-yellow-600';
            case 'completed': return 'bg-green-100 text-green-600';
            case 'cancelled': 
            case 'rejected': return 'bg-red-100 text-red-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

  return (
    <TouchableOpacity 
        onPress={onPress}
        className="bg-card border border-border rounded-xl p-4 mb-3 shadow-sm"
    >
        <View className="flex-1">
            <Text className="font-bold text-lg text-foreground mb-1">{customerName}</Text>
            <View className="flex-row items-center mb-1">
                <User size={14} className="text-muted-foreground mr-1" />
                <Text className="text-sm text-foreground">{phone}</Text>
                    {showStatusBadge && (
                        <View className={cn("ml-2 px-2 py-1 rounded-full", getStatusColor(service.status).split(" ")[0])}>
                            <Text className={cn("text-xs font-medium capitalize", getStatusColor(service.status).split(" ")[1])}>
                                {service.status === 'accepted' ? 'In Progress' : service.status.replace('_', ' ')}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Date */}
                <View className="flex-row items-center mb-3">
                    <Calendar size={14} className="text-muted-foreground mr-1.5" />
                    <Text className="text-xs text-muted-foreground">
                        {dayjs(service.booking_date || service.created_at).format("D MMM YYYY")}, {service.booking_time ? service.booking_time.slice(0, 5) : dayjs(service.created_at).format("HH:mm")}
                    </Text>
                </View>

                {/* Vehicle */}
                <View className="flex-row items-start mb-2">
                    <Car size={16} className="text-muted-foreground mr-2 mt-0.5" />
                    <Text className="text-sm font-medium text-foreground flex-1">{vehicleInfo}</Text>
                </View>

                {/* Complaint */}
                {service.notes && (
                    <View className="flex-row items-start bg-muted/30 p-2 rounded-md">
                        <Wrench size={16} className="text-muted-foreground mr-2 mt-0.5" />
                        <Text numberOfLines={2} className="text-sm text-foreground flex-1">
                            {service.notes}
                        </Text>
                    </View>
                )}
        </View>
      
      <View className="flex-row items-center mt-3 justify-between">
           {onAction && actionLabel && (
               <Button 
                size="sm" 
                variant="outline" 
                label={actionLabel} 
                onPress={onAction}
                className="h-8 py-0 px-3"
                />
           )}
      </View>
    </TouchableOpacity>
  );
}
