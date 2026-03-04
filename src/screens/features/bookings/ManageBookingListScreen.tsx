import React, { useState, useCallback } from "react";
import { View, Text, FlatList, RefreshControl, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../../../navigation/types";
import { supabase } from "../../../lib/supabase";
import { getWorkshopId } from "../../../lib/utils";
import { ServiceCard } from "../../../components/features/services/ServiceCard";
import { ChevronLeft } from "lucide-react-native";

export default function ManageBookingListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);

  const fetchBookings = async () => {
    try {
      const workshopId = await getWorkshopId();
      if (!workshopId) return;

      const { data, error } = await supabase
        .from("bookings")
        .select(`
            id,
            status,
            created_at,
            booking_date,
            booking_time,
            notes,
            service_details,
            profiles (full_name),
            vehicles (plate_number, brands (name), models (name))
        `)
        .eq("workshop_id", workshopId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.error("Fetch pending bookings error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const handleAccept = async (bookingId: string) => {
      try {
          const { error } = await supabase
              .from("bookings")
              .update({ status: 'accepted' })
              .eq('id', bookingId);
          if (error) throw error;
          Alert.alert("Success", "Booking Accepted!");
          fetchBookings();
      } catch (err: any) {
          Alert.alert("Error", err.message);
      }
  };

  const handleReject = async (bookingId: string) => {
    Alert.alert("Reject Booking", "Are you sure you want to reject this booking?", [
        { text: "Cancel", style: "cancel" },
        { 
            text: "Reject", 
            style: "destructive", 
            onPress: async () => {
                try {
                    const { error } = await supabase
                        .from("bookings")
                        .update({ status: 'rejected' })
                        .eq('id', bookingId);
                    if (error) throw error;
                    Alert.alert("Success", "Booking Rejected.");
                    fetchBookings();
                } catch (err: any) {
                    Alert.alert("Error", err.message);
                }
            } 
        }
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <View className="px-4 py-3 border-b border-border/50 bg-background flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
            <ChevronLeft size={24} className="text-foreground" />
        </TouchableOpacity>
        <Text className="text-xl font-bold ml-2 text-foreground">Pending Bookings</Text>
      </View>

      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4 pb-20"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
            !loading ? (
                <View className="items-center justify-center py-10">
                    <Text className="text-muted-foreground">No pending bookings.</Text>
                </View>
            ) : null
        }
        renderItem={({ item }) => (
            <TouchableOpacity onPress={() => navigation.navigate("BookingDetail", { bookingId: item.id })}>
                 <ServiceCard 
                    service={item}
                    onPress={() => navigation.navigate("BookingDetail", { bookingId: item.id })}
                    onAction={() => handleAccept(item.id)}
                    actionLabel="Accept"
                    actionVariant="default"
                />
            </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
