import React, { useCallback, useState } from "react";
import { View, Text, FlatList, RefreshControl, TouchableOpacity, Alert, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../../../navigation/types";
import { supabase } from "../../../lib/supabase";
import { getWorkshopId } from "../../../lib/utils";
import { Plus, User, Phone, Briefcase, ChevronLeft, Trash2 } from "lucide-react-native";
import { Button } from "../../../components/ui/Button";
import { Card, CardContent } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";

type Mechanic = {
  id: string;
  name: string;
  phone?: string | null;
  experience_years?: number | null;
  specializations?: string[] | null;
  is_active: boolean | null;
  avatar_url?: string | null;
};

export default function ManageMechanicsListScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
    const [mechanics, setMechanics] = useState<Mechanic[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchMechanics = async () => {
        try {
            const workshopId = await getWorkshopId();
            if (!workshopId) return;

            const { data, error } = await supabase
                .from("mechanics")
                .select("*")
                .eq("workshop_id", workshopId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setMechanics(data || []);
        } catch (error) {
            console.error("Fetch mechanics error:", error);
            Alert.alert("Error", "Failed to fetch mechanics");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchMechanics();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchMechanics();
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            "Delete Mechanic",
            "Are you sure? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                         try {
                             const { error } = await supabase.from("mechanics").delete().eq("id", id);
                             if (error) {
                                 // Handle FK constraint
                                 if (error.code === "23503") {
                                     Alert.alert(
                                         "Cannot Delete", 
                                         "This mechanic has related data. Deactivate instead?",
                                         [
                                             { text: "Cancel", style: "cancel" },
                                             { 
                                                 text: "Deactivate",
                                                 onPress: async () => {
                                                     await supabase.from("mechanics").update({ is_active: false }).eq("id", id);
                                                     fetchMechanics();
                                                 }
                                             }
                                         ]
                                     );
                                 } else {
                                     throw error;
                                 }
                             } else {
                                 fetchMechanics();
                             }
                         } catch (err: any) {
                             Alert.alert("Error", err.message);
                         }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: Mechanic }) => (
        <Card className="mb-3 border-border/50">
            <CardContent className="p-4 flex-row items-center">
                 <Image 
                    source={{ uri: item.avatar_url || "https://ui-avatars.com/api/?name=" + item.name }}
                    className="w-14 h-14 rounded-full bg-muted mr-4"
                />
                <View className="flex-1">
                    <Text className="text-lg font-bold text-foreground">{item.name}</Text>
                    <View className="flex-row items-center mt-1">
                         <Briefcase size={14} className="text-muted-foreground mr-1" />
                         <Text className="text-sm text-muted-foreground">
                             {item.specializations && item.specializations.length > 0 
                                ? item.specializations.slice(0, 2).join(", ") + (item.specializations.length > 2 ? ` +${item.specializations.length - 2}` : "")
                                : "General Mechanic"}
                         </Text>
                    </View>
                    {item.is_active === false && (
                        <View className="mt-2">
                             <Badge variant="destructive">Inactive</Badge>
                        </View>
                    )}
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.id)} className="p-2">
                    <Trash2 size={20} className="text-muted-foreground hover:text-destructive" />
                </TouchableOpacity>
            </CardContent>
        </Card>
    );

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
             <View className="px-5 py-3 border-b border-border/50 bg-background flex-row justify-between items-center">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="mr-2">
                        <ChevronLeft size={24} className="text-foreground" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-foreground">Mechanics</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate("AddMechanic")}>
                    <Plus size={24} className="text-primary" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={mechanics}
                keyExtractor={(item) => item.id}
                contentContainerClassName="p-4 safe-pb-20"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                renderItem={renderItem}
                ListEmptyComponent={
                    !loading ? (
                        <View className="justify-center items-center py-20">
                            <User size={48} className="text-muted-foreground mb-4" />
                            <Text className="text-muted-foreground">No mechanics found.</Text>
                            <Button 
                                label="Add Mechanic" 
                                onPress={() => navigation.navigate("AddMechanic")}
                                className="mt-4"
                            />
                        </View>
                    ) : null
                }
            />
        </SafeAreaView>
    );
}
