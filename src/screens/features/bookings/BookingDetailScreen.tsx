import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Alert, ActivityIndicator, TouchableOpacity, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { supabase } from "../../../lib/supabase";
import { Button } from "../../../components/ui/Button";
import { ChevronLeft, User, Car, Calendar, Check, X, Tag } from "lucide-react-native";
import dayjs from "../../../lib/dayjs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../../../navigation/types";
import { cn } from "../../../lib/utils";

type BookingDetailRouteProp = RouteProp<HomeStackParamList, "BookingDetail">;

export default function BookingDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<BookingDetailRouteProp>();
  const { bookingId } = route.params;

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchDetail();
  }, [bookingId]);

  const fetchDetail = async () => {
    try {
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
            user_id,
            profiles (full_name, phone, email),
            vehicles (plate_number, brands (name), models (name))
        `)
        .eq("id", bookingId)
        .single();

      if (error) throw error;

      // Manual profile fetch fallback if join returned null but we have user_id
      let finalData: any = data;
      if (data.user_id && !data.profiles) {
          const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, phone, email")
              .eq("user_id", data.user_id) // or .eq("id", data.user_id) depending on schema, usually one 
              .single();
          
          if (!profile) {
               // Try fetching by id if user_id was actually the profile id (rare but possible in some schemas)
               const { data: profileById } = await supabase
                 .from("profiles")
                 .select("full_name, phone, email")
                 .eq("id", data.user_id)
                 .single();
               
               if (profileById) finalData.profiles = profileById;
          } else {
              finalData.profiles = profile;
          }
      }

      setBooking(finalData);
    } catch (err: any) {
      console.error("Fetch booking detail error:", err);
      Alert.alert("Error", "Failed to load booking details");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

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

  const handleAction = async (action: 'accepted' | 'rejected' | 'cancelled' | 'completed') => {
      let actionText = '';
      let actionStyle: 'default' | 'destructive' = 'default';

      switch(action) {
          case 'accepted': actionText = 'Accept'; break;
          case 'rejected': actionText = 'Reject'; actionStyle = 'destructive'; break;
          case 'cancelled': actionText = 'Cancel Service'; actionStyle = 'destructive'; break;
          case 'completed': actionText = 'Mark as Complete'; break;
      }

      const executeUpdate = async () => {
          setProcessing(true);
          try {
              console.log(`Updating booking ${bookingId} to ${action}`);
              const { data, error } = await supabase
                .from("bookings")
                .update({ status: action })
                .eq("id", bookingId)
                .select(); // Select to confirm update
              
              if (error) {
                  console.error("Update error:", error);
                  throw error;
              }

              if (!data || data.length === 0) {
                  throw new Error("Update failed - could not verify change.");
              }
              
              if (Platform.OS === 'web') {
                  window.alert(`Success: Booking updated to ${action} successfully!`);
              } else {
                  Alert.alert("Success", `Booking updated to ${action} successfully!`);
              }
              navigation.goBack();
          } catch (err: any) {
              if (Platform.OS === 'web') {
                 window.alert(`Error: ${err.message}`);
              } else {
                 Alert.alert("Error", err.message);
              }
          } finally {
              setProcessing(false);
          }
      };

      if (Platform.OS === 'web') {
          if (window.confirm(`${actionText}\n\nAre you sure you want to perform this action?`)) {
              executeUpdate();
          }
      } else {
          Alert.alert(actionText, `Are you sure you want to ${actionText.toLowerCase()}?`, [
              { text: "No", style: "cancel" },
              {
                  text: "Yes",
                  style: actionStyle,
                  onPress: executeUpdate
              }
          ]);
      }
  };



  if (loading) {
    return (
        <View className="flex-1 justify-center items-center bg-background">
            <ActivityIndicator size="large" color="#2563eb" />
        </View>
    );
  }

  if (!booking) return null;

  let customerName = booking.profiles?.full_name ?? "Guest";
  let phone = booking.profiles?.phone ?? "-";
  let vehicleInfo = `${booking.vehicles?.brands?.name || ""} ${booking.vehicles?.models?.name || ""} - ${booking.vehicles?.plate_number || ""}`;
  let items: any[] = [];
  
  // Offline data handling (though pending bookings usually come from users/online)
  if (!booking.profiles && booking.service_details?.offline_data) {
    const offlineData = booking.service_details.offline_data;
    customerName = offlineData.customer_name || customerName;
    phone = offlineData.phone || phone;
    vehicleInfo = `${offlineData.brand || ""} ${offlineData.model || ""} - ${offlineData.plate || ""}`;
  }

   if (booking.service_details?.items && Array.isArray(booking.service_details.items)) {
      items = booking.service_details.items;
  } else if (Array.isArray(booking.service_details)) {
      items = booking.service_details;
  }

  // Calculate estimated price
  const estimatedPrice = items.reduce((acc, item) => acc + (Number(item.price) || 0), 0);
  
  // In pending bookings, items might be just categories or initial requests
  // but we display whatever is there.

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
       <View className="px-4 py-2 border-b border-border/50 flex-row items-center bg-background z-10">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
            <ChevronLeft size={24} className="text-foreground" />
        </TouchableOpacity>
        <Text className="text-lg font-bold ml-2 text-foreground">Booking Request</Text>
      </View>

      <ScrollView contentContainerClassName="p-6 pb-20">
        
        {/* Status Badge */}
        <View className="flex-row justify-center mb-6">
             <View className={cn("px-4 py-1.5 rounded-full", getStatusColor(booking.status).split(" ")[0])}>
                 <Text className={cn("font-bold capitalize", getStatusColor(booking.status).split(" ")[1])}>
                     {booking.status === 'accepted' ? 'In Progress' : booking.status.replace('_', ' ')}
                 </Text>
            </View>
        </View>

        {/* Customer & Vehicle */}
        <View className="bg-card border border-border rounded-xl p-4 shadow-sm mb-6 space-y-4">
            <View className="flex-row items-start">
                <User size={20} className="text-muted-foreground mr-3 mt-0.5" />
                <View>
                    <Text className="text-sm text-muted-foreground uppercase">Customer</Text>
                    <Text className="text-base font-semibold text-foreground">{customerName}</Text>
                    <Text className="text-sm text-muted-foreground">{phone}</Text>
                </View>
            </View>
            <View className="h-[1px] bg-border/50" />
            <View className="flex-row items-start">
                <Car size={20} className="text-muted-foreground mr-3 mt-0.5" />
                <View>
                    <Text className="text-sm text-muted-foreground uppercase">Vehicle</Text>
                    <Text className="text-base font-semibold text-foreground">{vehicleInfo}</Text>
                </View>
            </View>
             <View className="h-[1px] bg-border/50" />
            <View className="flex-row items-start">
                <Calendar size={20} className="text-muted-foreground mr-3 mt-0.5" />
                <View>
                    <Text className="text-sm text-muted-foreground uppercase">Requested Time</Text>
                    <Text className="text-base text-foreground">
                        {dayjs(booking.booking_date).format("D MMM YYYY")}, {booking.booking_time}
                    </Text>
                </View>
            </View>
        </View>

        {/* Complaint */}
        <View className="mb-6">
            <Text className="text-base font-semibold mb-2 text-foreground">Complaint / Notes</Text>
            <View className="bg-muted/30 p-4 rounded-lg border border-border/50">
                <Text className="text-foreground">{booking.notes || "No notes provided."}</Text>
            </View>
        </View>

        {/* Selected Services (if any) */}
         <View className="mb-8">
            <Text className="text-base font-semibold mb-2 text-foreground">Requested Services</Text>
             <View className="bg-card border border-border rounded-xl overflow-hidden p-4">
                 {items.length === 0 ? (
                     <Text className="text-muted-foreground italic">No specific services selected.</Text>
                 ) : (
                     items.map((item: any, idx) => {
                          const serviceName = typeof item === 'string' ? item : (item.name || item.service_name || "Unknown Service");
                          const servicePrice = item.price ? Number(item.price) : 0;
                          return (
                              <View key={idx} className="flex-row justify-between mb-1">
                                <Text className="text-foreground">• {serviceName}</Text>
                                {servicePrice > 0 && (
                                    <Text className="text-muted-foreground text-sm">
                                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(servicePrice)}
                                    </Text>
                                )}
                              </View>
                          );
                      })
                  )}
             </View>
             
             {estimatedPrice > 0 && (
                <View className="flex-row justify-between items-center mt-3 bg-muted/30 p-3 rounded-lg border border-border/50">
                    <View className="flex-row items-center">
                        <Tag size={18} className="text-muted-foreground mr-2" />
                        <Text className="text-sm font-medium text-foreground">Estimated Price</Text>
                    </View>
                    <Text className="text-lg font-bold text-primary">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(estimatedPrice)}
                    </Text>
                </View>
             )}
         </View>

        {/* Actions */}
        {booking.status === 'pending' && (
            <View className="flex-row space-x-4">
                <View className="flex-1">
                    <Button 
                        label="Reject" 
                        variant="destructive"
                        onPress={() => handleAction('rejected')} 
                        loading={processing}
                    />
                </View>
                <View className="flex-1">
                     <Button 
                        label="Accept" 
                        onPress={() => handleAction('accepted')} 
                        loading={processing}
                        className="bg-green-600"
                    />
                </View>
            </View>
        )}

        {['accepted', 'in_progress'].includes(booking.status) && (
            <View className="flex-row space-x-4">
                <View className="flex-1">
                    <Button 
                        label="Cancel Service" 
                        variant="destructive"
                        onPress={() => handleAction('cancelled')} 
                        loading={processing}
                    />
                </View>
                <View className="flex-1">
                     <Button 
                        label="Mark as Complete" 
                        onPress={() => handleAction('completed')} 
                        loading={processing}
                        className="bg-green-600"
                    />
                </View>
            </View>
        )}

      </ScrollView>

    </SafeAreaView>
  );
}
