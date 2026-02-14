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
        className="bg-card border border-border/50 rounded-2xl p-4 mb-4 shadow-sm"
    >
        <View className="flex-row justify-between items-start mb-3">
            <View className="flex-1 mr-2">
                <Text className="font-bold text-lg text-foreground leading-tight mb-0.5">{customerName}</Text>
                <View className="flex-row items-center">
                    <User size={13} className="text-muted-foreground mr-1" />
                    <Text className="text-xs text-muted-foreground font-medium">{phone}</Text>
                </View>
            </View>
            {showStatusBadge && (
                <View className={cn("px-2.5 py-1 rounded-lg", getStatusColor(service.status).split(" ")[0])}>
                    <Text className={cn("text-[10px] font-bold uppercase tracking-wider", getStatusColor(service.status).split(" ")[1])}>
                        {service.status === 'accepted' ? 'In Progress' : service.status.replace('_', ' ')}
                    </Text>
                </View>
            )}
        </View>

        {/* Info Grid */}
        <View className="space-y-2 mb-4">
            <View className="flex-row items-center">
                <Calendar size={14} className="text-primary mr-2" />
                <Text className="text-xs text-foreground font-semibold">
                    {dayjs(service.booking_date || service.created_at).format("D MMM YYYY")}, {service.booking_time ? service.booking_time.slice(0, 5) : dayjs(service.created_at).format("HH:mm")}
                </Text>
            </View>

            <View className="flex-row items-start">
                <Car size={14} className="text-blue-500 mr-2 mt-0.5" />
                <Text className="text-xs text-foreground font-medium flex-1" numberOfLines={1}>{vehicleInfo}</Text>
            </View>
        </View>

        {/* Complaint Snippet */}
        {service.notes && (
            <View className="bg-muted/30 p-2.5 rounded-xl border border-border/20">
                <View className="flex-row items-start">
                    <Wrench size={12} className="text-muted-foreground mr-2 mt-1" />
                    <Text numberOfLines={2} className="text-xs text-muted-foreground leading-4 flex-1">
                        {service.notes}
                    </Text>
                </View>
            </View>
        )}
      
       {onAction && actionLabel && (
           <View className="mt-4 pt-3 border-t border-border/20">
               <Button 
                size="sm" 
                variant="outline" 
                label={actionLabel} 
                onPress={onAction}
                className="h-9 px-4 rounded-xl"
                />
           </View>
       )}
    </TouchableOpacity>
  );
}
