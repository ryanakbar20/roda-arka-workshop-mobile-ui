import React, { useCallback, useState } from "react";
import { View, Text, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { OrdersStackParamList } from "../../navigation/types";
import { supabase } from "../../lib/supabase";
import { getWorkshopId } from "../../lib/utils";
import { ServiceCard } from "../../components/features/services/ServiceCard";
import { cn } from "../../lib/utils";

type TabStatus = "pending" | "active" | "history";

export default function OrdersScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<OrdersStackParamList>>();
    const [activeTab, setActiveTab] = useState<TabStatus>("pending");
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchBookings = async () => {
        try {
            const workshopId = await getWorkshopId();
            if (!workshopId) return;

            setLoading(true);
            
            let query = supabase
                .from("bookings")
                .select(`
                    id,
                    status,
                    created_at,
                    updated_at,
                    booking_date,
                    booking_time,
                    notes,
                    service_details,
                    user_id,
                    profiles (full_name, phone),
                    vehicles (plate_number, brands (name), models (name))
                `)
                .eq("workshop_id", workshopId);

            if (activeTab === "history") {
                query = query.order("updated_at", { ascending: false });
            } else {
                query = query.order("created_at", { ascending: false });
            }

            if (activeTab === "pending") {
                query = query.eq("status", "pending");
            } else if (activeTab === "active") {
                query = query.in("status", ["accepted", "in_progress"]);
            } else {
                query = query.in("status", ["completed", "cancelled", "rejected"]);
            }

            const { data: bookingsData, error } = await query;
            if (error) throw error;
            
            // Manual Profile Fetching Strategy
            const userIds = [...new Set(bookingsData?.map((b: any) => b.user_id).filter(Boolean))];
            
            let profilesMap: Record<string, any> = {};
            if (userIds.length > 0) {
                 const { data: profiles } = await supabase
                    .from("profiles")
                    .select("id, user_id, full_name, phone")
                    .in("id", userIds); // Try matching by ID first
                 
                 // Fallback for user_id mismatch
                 const { data: profilesByUserId } = await supabase
                    .from("profiles")
                    .select("id, user_id, full_name, phone")
                    .in("user_id", userIds);

                 profiles?.forEach((p: any) => { profilesMap[p.id] = p; });
                 profilesByUserId?.forEach((p: any) => { profilesMap[p.user_id] = p; });
            }

            const mergedBookings = bookingsData?.map((booking: any) => {
                // Use joined profile if exists, otherwise fallback to manual fetch
                const manualProfile = profilesMap[booking.user_id];
                const finalProfile = booking.profiles || manualProfile;

                // Ensure structure
                return {
                    ...booking,
                    profiles: {
                        full_name: finalProfile?.full_name || "Guest",
                        phone: finalProfile?.phone || "-"
                    }
                };
            });

            setBookings(mergedBookings || []);
        } catch (error) {
            console.error("Fetch orders error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchBookings();
        }, [activeTab])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchBookings();
    };

    const handlePress = (booking: any) => {
        navigation.navigate("BookingDetail", { bookingId: booking.id });
    };

    const TabButton = ({ label, value }: { label: string; value: TabStatus }) => (
        <TouchableOpacity 
            onPress={() => setActiveTab(value)}
            className={cn(
                "px-4 py-2 rounded-full mr-2 border",
                activeTab === value ? "bg-primary border-primary" : "bg-card border-border"
            )}
        >
            <Text className={cn(
                "font-medium",
                activeTab === value ? "text-primary-foreground" : "text-muted-foreground"
            )}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
             <View className="px-5 py-4 bg-background">
                <Text className="text-2xl font-bold text-foreground mb-4">Orders</Text>
                <View className="flex-row">
                    <TabButton label="Requests" value="pending" />
                    <TabButton label="In Progress" value="active" />
                    <TabButton label="History" value="history" />
                </View>
            </View>

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#2563eb" />
                </View>
            ) : (
                <FlatList
                    data={bookings}
                    keyExtractor={(item) => item.id}
                    contentContainerClassName="p-4 safe-pb-20"
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                         <View className="items-center justify-center py-20 opacity-50">
                            <Text className="text-muted-foreground">No orders found.</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => handlePress(item)}>
                            <ServiceCard 
                                service={item}
                                onPress={() => handlePress(item)}
                            />
                        </TouchableOpacity>
                    )}
                />
            )}
        </SafeAreaView>
    );
}
