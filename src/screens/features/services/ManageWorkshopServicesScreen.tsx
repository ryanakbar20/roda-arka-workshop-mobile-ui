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
    <Card className="mb-3 hover:bg-muted/10">
      <CardContent className="p-4 flex-row justify-between items-center">
        <View className="flex-1">
          <View className="flex-row items-center mb-1">
             <Text className="font-bold text-base text-foreground mr-2">{item.services?.name}</Text>
             <View className="bg-blue-100 px-2 py-0.5 rounded">
                <Text className="text-blue-700 text-[10px] font-bold uppercase">{item.services?.category}</Text>
             </View>
          </View>
          <Text className="text-muted-foreground text-sm">
             Price: Rp {item.price?.toLocaleString()} • {item.duration_minutes} mins
          </Text>
          <Text className={cn("text-xs font-semibold mt-1", item.is_available ? "text-green-600" : "text-red-500")}>
             {item.is_available ? "Available" : "Unavailable"}
          </Text>
        </View>
        <View className="flex-row gap-2">
            <TouchableOpacity 
                onPress={() => navigation.navigate("EditWorkshopService", { serviceId: item.id })}
                className="p-2 bg-muted/20 rounded-full"
            >
                <Edit size={18} className="text-foreground" />
            </TouchableOpacity>
            <TouchableOpacity 
                onPress={() => handleDelete(item.id)}
                className="p-2 bg-red-50 rounded-full"
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
        <Card className="mb-3">
        <CardContent className="p-4 flex-row justify-between items-center">
            <View className="flex-1">
                <Text className="font-bold text-base text-foreground mb-1">{item.name}</Text>
                <View className="flex-row items-center gap-2">
                    <View className="bg-primary/10 px-2 py-0.5 rounded">
                        <Text className="text-primary text-[10px] uppercase font-bold">{item.category}</Text>
                    </View>
                    {isAdded && (
                        <View className="bg-green-100 px-2 py-0.5 rounded">
                             <Text className="text-green-700 text-[10px] uppercase font-bold">Added</Text>
                        </View>
                    )}
                </View>
            </View>
            <Button 
                size="sm" 
                variant={isAdded ? "outline" : "default"}
                onPress={() => handleAddService(item)}
                disabled={isAdded}
                className={isAdded ? "opacity-50" : ""}
            >
                <Text className={isAdded ? "text-foreground" : "text-primary-foreground"}>
                    {isAdded ? "Added" : "Add"}
                </Text>
            </Button>
        </CardContent>
        </Card>
     );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-6 py-4 border-b border-border/50 flex-row items-center space-x-4">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 rounded-full active:bg-muted/10">
          <ChevronLeft size={24} className="text-foreground" />
        </TouchableOpacity>
        <Text className="text-xl font-semibold text-foreground">Workshop Services</Text>
      </View>

      <View className="flex-row border-b border-border/50">
        <TouchableOpacity
          onPress={() => setActiveTab("my_services")}
          className={cn(
            "flex-1 py-3 items-center border-b-2",
            activeTab === "my_services" ? "border-primary" : "border-transparent"
          )}
        >
          <Text className={cn("font-semibold", activeTab === "my_services" ? "text-primary" : "text-muted-foreground")}>
            My Services
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("add_new")}
          className={cn(
            "flex-1 py-3 items-center border-b-2",
            activeTab === "add_new" ? "border-primary" : "border-transparent"
          )}
        >
          <Text className={cn("font-semibold", activeTab === "add_new" ? "text-primary" : "text-muted-foreground")}>
            Master Catalog
          </Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
          <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" />
          </View>
      ) : (
          <FlatList
            data={activeTab === "my_services" ? workshopServices : masterServices}
            keyExtractor={(item) => item.id}
            contentContainerClassName="p-4 pb-20"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            renderItem={activeTab === "my_services" ? renderWorkshopService : renderMasterService}
            ListEmptyComponent={
                <View className="items-center justify-center py-10">
                    <Text className="text-muted-foreground">
                        {activeTab === "my_services" 
                            ? "No services in your workshop yet. Add some from the Master Catalog!" 
                            : "No master services found."}
                    </Text>
                </View>
            }
          />
      )}
    </SafeAreaView>
  );
}
