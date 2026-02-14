import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, RefreshControl, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { getWorkshopId } from "../../lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { ActivityItem } from "../../components/dashboard/ActivityItem";
import { Car, Wrench, CheckCircle, Clock, TrendingUp, Bell } from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import dayjs from "dayjs";

export default function HomeScreen({ navigation }: any) {
  // const navigation = useNavigation();
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
      if (!workshopId) return;

      const today = dayjs().format("YYYY-MM-DD");

      // 1. Fetch Workshop Details
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

      // 3. Fetch Recent Activities
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
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }} edges={['top']}>
      {/* Custom Header */}
      <View style={{ paddingHorizontal: 24, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white' }}>
        <View>
          <Text className="text-sm font-medium text-muted-foreground">Welcome back,</Text>
          <Text className="text-2xl font-bold text-foreground">{workshopName || "Workshop Boss"}</Text>
        </View>
        {/* <Button variant="ghost" size="icon" className="rounded-full bg-muted/50">
          <Bell size={22} className="text-foreground" />
        </Button> */}
      </View>

      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner */}
        <View className="px-6 mb-8">
           <View className="rounded-[32px] overflow-hidden shadow-xl bg-muted">
            <Image 
              source={require("../../../assets/workshop_banner.png")} 
              className="w-full h-44"
              resizeMode="cover"
            />
            <View className="absolute bottom-0 left-0 right-0 p-5 bg-black/30 backdrop-blur-sm">
                <Text className="text-white text-lg font-bold">Manage your workshop</Text>
                <Text className="text-white/80 text-sm">Everything is running smoothly today</Text>
            </View>
          </View>
        </View>

        <View className="px-6 pb-12">
            <Text className="text-lg font-bold mb-4 text-foreground ml-1">Today's Overview</Text>
            
            {/* Stats Grid */}
            <View className="flex-row flex-wrap -mx-2 mb-8">
                <View className="w-1/2 px-2 mb-4">
                    <Card className="bg-blue-50/40 dark:bg-blue-900/10 border-blue-100/50 shadow-none">
                        <CardContent className="p-4">
                            <View className="h-10 w-10 bg-blue-100/80 dark:bg-blue-800/20 rounded-2xl items-center justify-center mb-3">
                                <Car size={20} className="text-blue-600 dark:text-blue-400" />
                            </View>
                            <Text className="text-2xl font-bold text-foreground">{stats.totalVehiclesToday}</Text>
                            <Text className="text-[13px] text-muted-foreground font-medium mt-0.5">Today's Vehicles</Text>
                        </CardContent>
                    </Card>
                </View>
                <View className="w-1/2 px-2 mb-4">
                    <Card className="bg-orange-50/40 dark:bg-orange-900/10 border-orange-100/50 shadow-none">
                        <CardContent className="p-4">
                            <View className="h-10 w-10 bg-orange-100/80 dark:bg-orange-800/20 rounded-2xl items-center justify-center mb-3">
                                <Wrench size={20} className="text-orange-600 dark:text-orange-400" />
                            </View>
                            <Text className="text-2xl font-bold text-foreground">{stats.inProgress}</Text>
                            <Text className="text-[13px] text-muted-foreground font-medium mt-0.5">In Progress</Text>
                        </CardContent>
                    </Card>
                </View>
                <View className="w-1/2 px-2">
                    <Card className="bg-green-50/40 dark:bg-green-900/10 border-green-100/50 shadow-none">
                        <CardContent className="p-4">
                            <View className="h-10 w-10 bg-green-100/80 dark:bg-green-800/20 rounded-2xl items-center justify-center mb-3">
                                <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
                            </View>
                            <Text className="text-2xl font-bold text-foreground">{stats.completed}</Text>
                            <Text className="text-[13px] text-muted-foreground font-medium mt-0.5">Completed</Text>
                        </CardContent>
                    </Card>
                </View>
                <View className="w-1/2 px-2">
                    <Card className="bg-slate-50/40 dark:bg-slate-900/10 border-slate-100/50 shadow-none">
                        <CardContent className="p-4">
                            <View className="h-10 w-10 bg-slate-100/80 dark:bg-slate-800/20 rounded-2xl items-center justify-center mb-3">
                                <Clock size={20} className="text-slate-600 dark:text-slate-400" />
                            </View>
                            <Text className="text-2xl font-bold text-foreground">{stats.remainingSlots}</Text>
                            <Text className="text-[13px] text-muted-foreground font-medium mt-0.5">Available Slots</Text>
                        </CardContent>
                    </Card>
                </View>
            </View>

            {/* Recent Activity */}
            <View className="flex-row items-center justify-between mb-4 px-1">
                <Text className="text-lg font-bold text-foreground">Recent Activity</Text>
            </View>
            
            <Card className="overflow-hidden border-border/40 shadow-sm">
                <CardContent className="p-0">
                    {recentActivities.length === 0 ? (
                        <View className="items-center py-12">
                             <TrendingUp size={40} className="text-muted/30 mb-2" />
                             <Text className="text-muted-foreground text-center">No recent activity found</Text>
                        </View>
                    ) : (
                        recentActivities.map((item, index) => {
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
                                    isLast={index === recentActivities.length - 1}
                                />
                            );
                        })
                    )}
                </CardContent>
            </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
