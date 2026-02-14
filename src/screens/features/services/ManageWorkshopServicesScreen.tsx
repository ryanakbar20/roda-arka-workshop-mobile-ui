import React, { useState, useCallback } from "react";
import { View, Text, FlatList, RefreshControl, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../../../navigation/types";
import { supabase } from "../../../lib/supabase";
import { getWorkshopId } from "../../../lib/utils";
import { Card, CardContent } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Plus, Trash2, Edit, ChevronLeft } from "lucide-react-native";
import { cn } from "../../../lib/utils";

export default function ManageWorkshopServicesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const [activeTab, setActiveTab] = useState<"my_services" | "add_new">("my_services");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [workshopServices, setWorkshopServices] = useState<any[]>([]);
  const [masterServices, setMasterServices] = useState<any[]>([]);

  const fetchWorkshopServices = async () => {
    try {
      const workshopId = await getWorkshopId();
      if (!workshopId) return;

      const { data, error } = await supabase
        .from("workshop_services")
        .select(`
            id,
            price,
            duration_minutes,
            is_available,
            services (
              name,
              category
            )
        `)
        .eq("workshop_id", workshopId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWorkshopServices(data || []);
    } catch (err) {
      console.error("Fetch workshop services error:", err);
    }
  };

  const fetchMasterServices = async () => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMasterServices(data || []);
    } catch (err) {
      console.error("Fetch master services error:", err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchWorkshopServices(), fetchMasterServices()]);
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Service", "Are you sure you want to remove this service from your workshop?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase.from("workshop_services").delete().eq("id", id);
            if (error) throw error;
            Alert.alert("Success", "Service removed.");
            fetchWorkshopServices();
          } catch (err: any) {
            Alert.alert("Error", err.message);
          }
        }
      }
    ]);
  };

  const handleAddService = (masterService: any) => {
    // Check if duplicate
    const exists = workshopServices.find(ws => ws.services.name === masterService.name);
    if (exists) {
        Alert.alert("Notice", "You already have this service in your workshop.");
        return;
    }

    navigation.navigate("EditWorkshopService", { 
        masterServiceId: masterService.id,
        masterService: masterService
    });
  };

  const renderWorkshopService = ({ item }: { item: any }) => (
    <Card className="mb-4 overflow-hidden rounded-2xl border-border/40 shadow-sm shadow-black/5">
      <CardContent className="p-4 flex-row justify-between items-center">
        <View className="flex-1">
          <View className="flex-row items-center mb-1.5">
             <Text className="font-bold text-base text-foreground mr-2">{item.services?.name}</Text>
             <View className="bg-blue-100 px-2.5 py-1 rounded-lg">
                <Text className="text-blue-700 text-[10px] font-bold uppercase tracking-wider">{item.services?.category}</Text>
             </View>
          </View>
          <View className="flex-row items-center">
             <Text className="text-foreground font-bold text-sm">
                Rp {item.price?.toLocaleString()}
             </Text>
             <View className="w-1 h-1 bg-muted-foreground/30 rounded-full mx-2" />
             <Text className="text-muted-foreground text-xs font-medium">
                {item.duration_minutes} mins
             </Text>
          </View>
          <View className={cn("mt-2 self-start px-2 py-0.5 rounded-md border", item.is_available ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100")}>
             <Text className={cn("text-[10px] font-bold", item.is_available ? "text-green-600" : "text-red-500")}>
                {item.is_available ? "AVAILABLE" : "UNAVAILABLE"}
             </Text>
          </View>
        </View>
        <View className="flex-row gap-2">
            <TouchableOpacity 
                onPress={() => navigation.navigate("EditWorkshopService", { serviceId: item.id })}
                className="h-10 w-10 bg-muted/30 rounded-full items-center justify-center active:bg-muted/50"
            >
                <Edit size={18} className="text-foreground" />
            </TouchableOpacity>
            <TouchableOpacity 
                onPress={() => handleDelete(item.id)}
                className="h-10 w-10 bg-red-50 rounded-full items-center justify-center active:bg-red-100"
            >
                <Trash2 size={18} className="text-destructive" />
            </TouchableOpacity>
        </View>
      </CardContent>
    </Card>
  );

  const renderMasterService = ({ item }: { item: any }) => {
     const isAdded = workshopServices.some(ws => ws.services?.name === item.name);

     return (
        <Card className="mb-4 overflow-hidden rounded-2xl border-border/40 shadow-sm shadow-black/5">
        <CardContent className="p-4 flex-row justify-between items-center">
            <View className="flex-1">
                <Text className="font-bold text-base text-foreground mb-1.5">{item.name}</Text>
                <View className="flex-row items-center gap-2">
                    <View className="bg-primary/5 border border-primary/10 px-2.5 py-1 rounded-lg">
                        <Text className="text-primary text-[10px] uppercase font-bold tracking-wider">{item.category}</Text>
                    </View>
                    {isAdded && (
                        <View className="bg-green-100 px-2.5 py-1 rounded-lg">
                             <Text className="text-green-700 text-[10px] uppercase font-bold tracking-wider">Added</Text>
                        </View>
                    )}
                </View>
            </View>
            <Button 
                size="sm" 
                variant={isAdded ? "outline" : "default"}
                onPress={() => handleAddService(item)}
                disabled={isAdded}
                className={cn("h-9 px-5 rounded-xl", isAdded ? "opacity-30" : "shadow-sm shadow-primary/20")}
                label={isAdded ? "Added" : "Add Service"}
            />
        </CardContent>
        </Card>
     );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-6 py-4 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2 rounded-full active:bg-muted/10">
          <ChevronLeft size={24} className="text-foreground" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground ml-2">Workshop Services</Text>
      </View>

      <View className="px-6 mb-4">
        <View className="flex-row bg-muted/30 p-1 rounded-2xl">
            <TouchableOpacity
                onPress={() => setActiveTab("my_services")}
                className={cn(
                    "flex-1 py-2.5 items-center rounded-xl",
                    activeTab === "my_services" ? "bg-card shadow-sm" : ""
                )}
            >
                <Text className={cn("text-sm font-bold", activeTab === "my_services" ? "text-primary" : "text-muted-foreground")}>
                    My Services
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => setActiveTab("add_new")}
                className={cn(
                    "flex-1 py-2.5 items-center rounded-xl",
                    activeTab === "add_new" ? "bg-card shadow-sm" : ""
                )}
            >
                <Text className={cn("text-sm font-bold", activeTab === "add_new" ? "text-primary" : "text-muted-foreground")}>
                    Master Catalog
                </Text>
            </TouchableOpacity>
        </View>
      </View>

      {loading && !refreshing ? (
          <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" />
          </View>
      ) : (
          <FlatList
            data={activeTab === "my_services" ? workshopServices : masterServices}
            keyExtractor={(item) => item.id}
            contentContainerClassName="px-6 pb-24"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            renderItem={activeTab === "my_services" ? renderWorkshopService : renderMasterService}
            ListEmptyComponent={
                <View className="items-center justify-center py-20 opacity-50">
                    <Text className="text-muted-foreground text-center">
                        {activeTab === "my_services" 
                            ? "No services in your workshop yet.\nAdd some from the Master Catalog!" 
                            : "No master services found."}
                    </Text>
                </View>
            }
          />
      )}
    </SafeAreaView>
  );
}
