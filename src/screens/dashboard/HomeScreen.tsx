import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { getWorkshopId } from "../../lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { ActivityItem } from "../../components/dashboard/ActivityItem";
import { Car, Wrench, CheckCircle, Clock, TrendingUp } from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import dayjs from "dayjs";

export default function HomeScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [workshopName, setWorkshopName] = useState("");
  const [stats, setStats] = useState({
    totalVehiclesToday: 0,
    inProgress: 0,
    completed: 0,
    remainingSlots: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const workshopId = await getWorkshopId();
      if (!workshopId) {
          // If no workshop ID, maybe session expired or user has no workshop
          return;
      }

      const today = dayjs().format("YYYY-MM-DD");

      // 1. Fetch Workshop Details (Name & Capacity)
      const { data: workshop } = await supabase
        .from("workshops")
        .select("name, capacity_mobil, capacity_motor")
        .eq("id", workshopId)
        .single();
      
      if (workshop) setWorkshopName(workshop.name);
      
      const totalCapacity = (workshop?.capacity_mobil || 0) + (workshop?.capacity_motor || 0);

      // 2. Fetch Bookings
      const { data: allBookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("id, status, created_at")
        .eq("workshop_id", workshopId);

      if (bookingsError) throw bookingsError;

      const todayBookings = allBookings?.filter((b) => 
        dayjs(b.created_at).format("YYYY-MM-DD") === today
      ) || [];

      const activeBookings = allBookings?.filter((b) => 
        ["accepted", "in_progress", "arrived"].includes(b.status || "")
      ) || [];

      const completedToday = allBookings?.filter((b) => 
        b.status === "completed" && dayjs(b.created_at).format("YYYY-MM-DD") === today
      ) || [];

      setStats({
        totalVehiclesToday: todayBookings.length,
        inProgress: activeBookings.length,
        completed: completedToday.length,
        remainingSlots: Math.max(0, totalCapacity - todayBookings.length),
      });

      // 3. Fetch Recent Activities with Joins
      const { data: recent, error: recentError } = await supabase
        .from("bookings")
        .select(`
          id,
          status,
          created_at,
          service_details,
          profiles (full_name, avatar_url),
          vehicles (plate_number, brands (name), models (name))
        `)
        .eq("workshop_id", workshopId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (recentError) throw recentError;

      setRecentActivities(recent || []);

    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 py-4 border-b border-border/50 flex-row justify-between items-center">
        <View>
          <Text className="text-2xl font-bold text-foreground">Dashboard</Text>
          <Text className="text-muted-foreground">{workshopName || "Loading..."}</Text>
        </View>

      </View>

      <ScrollView 
        contentContainerClassName="p-6"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Stats Grid */}
        {/* Stats Grid */}
        <View className="flex-row flex-wrap -mx-2 mb-6">
            <View className="w-1/2 px-2 mb-4">
                <Card className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-200/50">
                    <CardContent className="p-4 items-center">
                        <View className="h-10 w-10 bg-blue-100 rounded-full items-center justify-center mb-2">
                             <Car size={20} className="text-blue-600" />
                        </View>
                        <Text className="text-2xl font-bold text-foreground">{stats.totalVehiclesToday}</Text>
                        <Text className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">Today</Text>
                    </CardContent>
                </Card>
            </View>
            <View className="w-1/2 px-2 mb-4">
                <Card className="bg-orange-50/50 dark:bg-orange-900/10 border-orange-200/50">
                    <CardContent className="p-4 items-center">
                        <View className="h-10 w-10 bg-orange-100 rounded-full items-center justify-center mb-2">
                             <Wrench size={20} className="text-orange-600" />
                        </View>
                        <Text className="text-2xl font-bold text-foreground">{stats.inProgress}</Text>
                        <Text className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">Working</Text>
                    </CardContent>
                </Card>
            </View>
            <View className="w-1/2 px-2">
                <Card className="bg-green-50/50 dark:bg-green-900/10 border-green-200/50">
                    <CardContent className="p-4 items-center">
                        <View className="h-10 w-10 bg-green-100 rounded-full items-center justify-center mb-2">
                             <CheckCircle size={20} className="text-green-600" />
                        </View>
                        <Text className="text-2xl font-bold text-foreground">{stats.completed}</Text>
                        <Text className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">Done</Text>
                    </CardContent>
                </Card>
            </View>
            <View className="w-1/2 px-2">
                <Card className="bg-red-50/50 dark:bg-red-900/10 border-red-200/50">
                    <CardContent className="p-4 items-center">
                        <View className="h-10 w-10 bg-red-100 rounded-full items-center justify-center mb-2">
                             <Clock size={20} className="text-red-600" />
                        </View>
                        <Text className="text-2xl font-bold text-foreground">{stats.remainingSlots}</Text>
                        <Text className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">Slots</Text>
                    </CardContent>
                </Card>
            </View>
        </View>

        {/* Recent Activity */}
        {/* Recent Activity */}
        <Card className="overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-muted/20 py-3">
                <View className="flex-row items-center space-x-2">
                    <TrendingUp size={16} className="text-muted-foreground" />
                    <Text className="font-semibold text-base text-foreground">Recent Activity</Text>
                </View>
            </CardHeader>
            <CardContent className="p-0">
                {recentActivities.length === 0 ? (
                    <Text className="text-muted-foreground text-center py-4">No recent activity</Text>
                ) : (
                    recentActivities.map((item) => {
                        // Handle Offline Data fallback
                        let customerName = item.profiles?.full_name ?? "Guest";
                        let vehicleInfo = `${item.vehicles?.brands?.name || ""} ${item.vehicles?.models?.name || ""} - ${item.vehicles?.plate_number || ""}`;

                        if (!item.profiles && item.service_details?.offline_data) {
                            customerName = item.service_details.offline_data.customer_name || customerName;
                            const od = item.service_details.offline_data;
                            vehicleInfo = `${od.brand || ""} ${od.model || ""} - ${od.plate || ""}`;
                        }

                        return (
                            <ActivityItem
                                key={item.id}
                                title={customerName}
                                description={vehicleInfo}
                                status={item.status}
                                avatarUrl={item.profiles?.avatar_url}
                                timestamp={dayjs(item.created_at).fromNow()}
                            />
                        );
                    })
                )}

            </CardContent>
        </Card>

      </ScrollView>
    </SafeAreaView>
  );
}
