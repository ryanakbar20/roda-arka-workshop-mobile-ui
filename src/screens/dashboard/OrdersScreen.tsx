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

export default function OrdersScreen({ navigation }: { navigation: NativeStackNavigationProp<OrdersStackParamList> }) {
    // const navigation = useNavigation<NativeStackNavigationProp<OrdersStackParamList>>();
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



    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }} edges={['top']}>
             <View style={{ paddingHorizontal: 24, paddingVertical: 16, backgroundColor: 'white' }}>
                <Text className="text-2xl font-bold text-foreground mb-4">Orders</Text>
                <View style={{ flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.05)', padding: 4, borderRadius: 16 }}>
                    <TouchableOpacity 
                        key="pending"
                        onPress={() => setActiveTab("pending")}
                        style={[
                            { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
                            activeTab === "pending" ? { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 } : {}
                        ]}
                    >
                        <Text style={{ fontWeight: '600', color: activeTab === "pending" ? "#2563eb" : "#64748b" }}>Requests</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        key="active"
                        onPress={() => setActiveTab("active")}
                        style={[
                            { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
                            activeTab === "active" ? { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 } : {}
                        ]}
                    >
                        <Text style={{ fontWeight: '600', color: activeTab === "active" ? "#2563eb" : "#64748b" }}>Active</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        key="history"
                        onPress={() => setActiveTab("history")}
                        style={[
                            { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
                            activeTab === "history" ? { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 } : {}
                        ]}
                    >
                        <Text style={{ fontWeight: '600', color: activeTab === "history" ? "#2563eb" : "#64748b" }}>History</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
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
                        <ServiceCard 
                            service={item}
                            onPress={() => handlePress(item)}
                        />
                    )}
                />
            )}
        </SafeAreaView>
    );
}
