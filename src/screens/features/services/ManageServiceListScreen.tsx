import React, { useState, useCallback } from "react";
import { View, Text, FlatList, RefreshControl, TouchableOpacity, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../../../navigation/types";
import { supabase } from "../../../lib/supabase";
import { getWorkshopId } from "../../../lib/utils";
import { ServiceCard } from "../../../components/features/services/ServiceCard";
import { Plus, Search, Filter } from "lucide-react-native";
import { cn } from "../../../lib/utils";

export default function ManageServiceListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchServices = async () => {
    try {
      const workshopId = await getWorkshopId();
      if (!workshopId) return;

      const { data, error } = await supabase
        .from("bookings")
        .select(`
            id,
            status,
            created_at,
            service_details,
            profiles (full_name),
            vehicles (plate_number, brands (name), models (name))
        `)
        .eq("workshop_id", workshopId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (err) {
      console.error("Fetch services error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

    const handleServicePress = (serviceId: string) => {
        navigation.navigate("ServiceDetail", { serviceId });
    };

  useFocusEffect(
    useCallback(() => {
      fetchServices();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchServices();
  };

  const filteredServices = services.filter((item) => {
    const status = item.status;
    const isHistory = status === "completed" || status === "cancelled" || status === "rejected";
    const isActive = !isHistory; // accepted, in_progress, arrived

    if (activeTab === "active" && !isActive) return false;
    if (activeTab === "history" && !isHistory) return false;

    if (searchQuery) {
        // Search Logic
        const query = searchQuery.toLowerCase();
        const customerName = item.profiles?.full_name?.toLowerCase() || item.service_details?.offline_data?.customer_name?.toLowerCase() || "";
        const plate = item.vehicles?.plate_number?.toLowerCase() || item.service_details?.offline_data?.plate?.toLowerCase() || "";
        
        return customerName.includes(query) || plate.includes(query);
    }

    return true;
  });

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="px-5 py-3 border-b border-border/50 bg-background flex-row justify-between items-center">
        <Text className="text-xl font-bold text-foreground">Manage Services</Text>
        <TouchableOpacity 
            onPress={() => navigation.navigate("AddService")}
            className="bg-primary p-2 rounded-full"
        >
            <Plus size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Search & Filter */}
      <View className="p-4 bg-background z-10">
          <View className="flex-row items-center bg-muted/30 border border-input rounded-lg px-3 h-10 mb-4">
              <Search size={18} className="text-muted-foreground mr-2" />
              <TextInput 
                placeholder="Search customer, plate number..."
                className="flex-1 text-foreground"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
          </View>

          <View className="flex-row">
              <TouchableOpacity
                onPress={() => setActiveTab("active")}
                className={cn(
                    "flex-1 py-2 border-b-2 items-center",
                    activeTab === "active" ? "border-primary" : "border-transparent"
                )}
              >
                  <Text className={cn(
                      "font-semibold", 
                      activeTab === "active" ? "text-primary" : "text-muted-foreground"
                    )}>
                      In Progress ({services.filter(s => !["completed", "cancelled", "rejected"].includes(s.status)).length})
                  </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab("history")}
                className={cn(
                    "flex-1 py-2 border-b-2 items-center",
                    activeTab === "history" ? "border-primary" : "border-transparent"
                )}
              >
                  <Text className={cn(
                      "font-semibold", 
                      activeTab === "history" ? "text-primary" : "text-muted-foreground"
                    )}>
                      History
                  </Text>
              </TouchableOpacity>
          </View>
      </View>

      {/* List */}
      <FlatList
        data={filteredServices}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4 pb-20"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
            !loading ? (
                <View className="items-center justify-center py-10">
                    <Text className="text-muted-foreground">No services found.</Text>
                </View>
            ) : null
        }
        renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleServicePress(item.id)}>
                <ServiceCard 
                    service={item}
                    onPress={() => handleServicePress(item.id)}
                />
            </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
