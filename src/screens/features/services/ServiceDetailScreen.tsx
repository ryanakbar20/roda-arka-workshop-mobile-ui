import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, RefreshControl, Alert, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../../../navigation/types";
import { supabase } from "../../../lib/supabase";
import { Button } from "../../../components/ui/Button";
import { ChevronLeft, User, Calendar, Car, Wrench, AlertCircle } from "lucide-react-native";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import dayjs from "../../../lib/dayjs";

type ServiceDetailRouteProp = RouteProp<HomeStackParamList, "ServiceDetail">;

export default function ServiceDetailScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
    const route = useRoute<ServiceDetailRouteProp>();
    const { serviceId } = route.params;

    const [service, setService] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchServiceDetail = async () => {
        try {
            const { data, error } = await supabase
                .from("bookings")
                .select(`
                    *,
                    *,
                    profiles (full_name, phone, email, avatar_url),
                    vehicles (plate_number, brands(name), models(name), transmission, year)
                `)
                .eq("id", serviceId)
                .single();

            if (error) throw error;
            setService(data);
        } catch (error) {
            console.error("Fetch service error:", error);
            Alert.alert("Error", "Failed to fetch service details");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchServiceDetail();
        }, [serviceId])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchServiceDetail();
    };

    const updateStatus = async (newStatus: string) => {
        setActionLoading(true);
        try {
            const { error } = await supabase
                .from("bookings")
                .update({ status: newStatus })
                .eq("id", serviceId);

            if (error) throw error;
            fetchServiceDetail();
            Alert.alert("Success", `Service status updated to ${newStatus}`);
        } catch (error: any) {
             Alert.alert("Error", error.message);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-background justify-center items-center">
                <Text>Loading...</Text>
            </SafeAreaView>
        );
    }

    if (!service) {
         return (
            <SafeAreaView className="flex-1 bg-background justify-center items-center">
                <Text>Service not found.</Text>
                <Button label="Go Back" onPress={() => navigation.goBack()} className="mt-4" />
            </SafeAreaView>
        );
    }

    // Safer accessors
    const profile = service.profiles || {};
    const vehicle = service.vehicles || {};
    const brand = vehicle.brands?.name || service.service_details?.offline_data?.brand || "-";
    const model = vehicle.models?.name || service.service_details?.offline_data?.model || "-";
    const plate = vehicle.plate_number || service.service_details?.offline_data?.plate || "-";
    const customerName = profile.full_name || service.service_details?.offline_data?.customer_name || "Guest";
    const status = service.status;

    const renderStatusBadge = () => {
        let colorClass = "bg-gray-100 text-gray-800";
        if (status === "pending") colorClass = "bg-orange-100 text-orange-800";
        else if (status === "accepted") colorClass = "bg-blue-100 text-blue-800";
        else if (status === "in_progress") colorClass = "bg-yellow-100 text-yellow-800";
        else if (status === "completed") colorClass = "bg-green-100 text-green-800";
        else if (status === "cancelled" || status === "rejected") colorClass = "bg-red-100 text-red-800";

        return (
            <View className={`px-3 py-1 rounded-full ${colorClass.split(" ")[0]}`}>
                <Text className={`text-sm font-semibold capitalize ${colorClass.split(" ")[1]}`}>
                    {status.replace("_", " ")}
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
            <View className="px-4 py-3 border-b border-border/50 flex-row items-center justify-between bg-background">
                 <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
                        <ChevronLeft size={24} className="text-foreground" />
                    </TouchableOpacity>
                    <Text className="text-lg font-bold text-foreground">Service Detail</Text>
                 </View>
                 {renderStatusBadge()}
            </View>

            <ScrollView 
                contentContainerClassName="p-6 pb-32"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Customer Info */}
                <Card className="mb-4 overflow-hidden">
                    <CardContent className="p-0">
                        <View className="flex-row items-center p-4">
                            <View className="h-12 w-12 bg-primary/10 rounded-2xl items-center justify-center mr-4">
                                <User size={24} className="text-primary" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Customer</Text>
                                <Text className="text-lg font-bold text-foreground leading-tight">{customerName}</Text>
                                <Text className="text-sm text-muted-foreground">{profile.phone || service.service_details?.offline_data?.phone || "-"}</Text>
                            </View>
                        </View>
                    </CardContent>
                </Card>

                {/* Vehicle Info */}
                <Card className="mb-4 overflow-hidden">
                    <CardContent className="p-0">
                        <View className="flex-row items-center p-4">
                            <View className="h-12 w-12 bg-blue-50 rounded-2xl items-center justify-center mr-4">
                                <Car size={24} className="text-blue-600" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Vehicle</Text>
                                <Text className="text-lg font-bold text-foreground leading-tight">{brand} {model}</Text>
                                <Text className="text-sm text-muted-foreground">{plate}</Text>
                            </View>
                        </View>
                    </CardContent>
                </Card>

                {/* Service Info */}
                <Card className="mb-8 overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base text-muted-foreground uppercase tracking-widest text-[11px]">Service Details</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                        <View className="flex-row items-center mb-4 bg-muted/20 p-3 rounded-xl">
                            <Calendar size={18} className="text-muted-foreground mr-3" />
                            <Text className="text-base font-medium text-foreground">{dayjs(service.booking_date).format("D MMMM YYYY, HH:mm")}</Text>
                        </View>
                        <View className="flex-row items-start bg-muted/20 p-4 rounded-xl">
                            <Wrench size={18} className="text-muted-foreground mr-3 mt-1" />
                            <View className="flex-1">
                                <Text className="text-xs text-muted-foreground uppercase font-bold mb-1">Complaint / Notes</Text>
                                <Text className="text-base text-foreground leading-5">{service.notes || "No complaints or notes provided."}</Text>
                            </View>
                        </View>
                    </CardContent>
                </Card>

                 {/* Action Buttons */}
                <View className="gap-4">
                    {status === "accepted" && (
                         <Button 
                            label="Start Service" 
                            onPress={() => updateStatus("in_progress")}
                            loading={actionLoading}
                            size="lg"
                        />
                    )}
                    {status === "in_progress" && (
                        <Button 
                            label="Complete Service" 
                            onPress={() => updateStatus("completed")}
                            loading={actionLoading}
                            size="lg"
                            className="bg-green-600 border-green-600"
                        />
                    )}
                    {(status === "completed") && (
                        <Button 
                             label="Revert to In Progress"
                             variant="outline"
                             onPress={() => updateStatus("in_progress")}
                             loading={actionLoading}
                             size="lg"
                        />
                    )}
                    {status === "pending" && (
                         <Button 
                            label="Review Booking Request" 
                            onPress={() => navigation.navigate("BookingDetail", { bookingId: serviceId })}
                            variant="default"
                            size="lg"
                        />
                    )}
                    
                    {/* Cancel Action for Active Services */}
                    {(status === "accepted" || status === "in_progress") && (
                        <Button 
                            label="Cancel Service" 
                            variant="ghost"
                            onPress={() => updateStatus("cancelled")}
                            loading={actionLoading}
                            className="bg-red-50"
                        >
                            <Text className="text-red-600 font-bold">Cancel Service</Text>
                        </Button>
                    )}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}
