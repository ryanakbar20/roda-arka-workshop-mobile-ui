import React, { useState, useCallback, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ProfileStackParamList } from "../../navigation/types";
import { supabase } from "../../lib/supabase";
import { getWorkshopId } from "../../lib/utils";
import { Wrench, Package, Calendar, Clock, ChevronRight, Settings, LogOut, ShieldCheck, HelpCircle, Bell } from "lucide-react-native";
import * as Notifications from 'expo-notifications';
import { Card, CardContent } from "../../components/ui/Card";
import { cn } from "../../lib/utils";

export default function ProfileScreen({ navigation }: { navigation: NativeStackNavigationProp<ProfileStackParamList> }) {
  // const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [workshop, setWorkshop] = useState<any>(null);
  const [pushEnabled, setPushEnabled] = useState(false);

  const fetchWorkshop = async () => {
    setLoading(true);
    try {
      const workshopId = await getWorkshopId();
      if (!workshopId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("workshops")
        .select("*")
        .eq("id", workshopId)
        .single();

      if (error) throw error;
      setWorkshop(data);
    } catch (err) {
      console.error("Fetch workshop error:", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchWorkshop();
      
      const checkPermissions = async () => {
        const { status } = await Notifications.getPermissionsAsync();
        setPushEnabled(status === 'granted');
      };
      checkPermissions();
    }, [])
  );

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: async () => {
            await supabase.auth.signOut();
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }} edges={['top', 'left', 'right']}>
        <ScrollView className="flex-1" contentContainerClassName="pb-10">
            {/* Header */}
            <View className="px-6 py-4 flex-row justify-between items-center">
                <Text className="text-2xl font-bold text-foreground">Workshop Profile</Text>
                <TouchableOpacity 
                    onPress={() => {}}
                    className="p-2 bg-muted/30 rounded-full"
                >
                    <Settings size={22} className="text-foreground" />
                </TouchableOpacity>
            </View>

            {/* Profile Card */}
            <View className="px-6 mb-8">
                <Card className="rounded-[32px] overflow-hidden border-none shadow-lg shadow-primary/10">
                     <View className="bg-primary p-6">
                        <View className="flex-row items-center">
                            <View className="h-16 w-16 bg-white/20 rounded-2xl items-center justify-center border border-white/30 mr-4">
                                <View className="h-12 w-12 bg-white rounded-xl items-center justify-center shadow-sm">
                                    <Wrench size={24} className="text-primary" />
                                </View>
                            </View>
                            <View className="flex-1">
                                <Text className="text-xl font-bold text-white leading-tight">
                                    {workshop?.name || "Workshop Name"}
                                </Text>
                                <View className="flex-row items-center mt-1">
                                    <View className="h-2 w-2 bg-white/60 rounded-full mr-2" />
                                    <Text className="text-sm text-white/80 font-medium">Workshop Account</Text>
                                </View>
                            </View>
                        </View>

                        <View className="mt-6 flex-row gap-2">
                            <TouchableOpacity 
                                onPress={() => navigation.navigate("EditProfile", { workshop })}
                                className="flex-1 bg-white/10 border border-white/20 py-2.5 rounded-xl items-center"
                            >
                                <Text className="text-white text-xs font-bold">Edit Profile</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={handleLogout}
                                className="px-4 bg-white/10 border border-white/20 py-2.5 rounded-xl items-center"
                            >
                                <LogOut size={16} className="text-white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <CardContent className="bg-card p-4 flex-row justify-around border-t border-border/5">
                         <View className="items-center">
                            <Text className="text-xs text-muted-foreground mb-1">Status</Text>
                            <View className="bg-green-100 px-2 py-0.5 rounded-md">
                                <Text className="text-[10px] font-bold text-green-700 uppercase">Open</Text>
                            </View>
                         </View>
                         <View className="w-[1px] h-8 bg-border/40" />
                         <View className="items-center">
                            <Text className="text-xs text-muted-foreground mb-1">Rating</Text>
                            <Text className="text-sm font-bold text-foreground">4.8</Text>
                         </View>
                         <View className="w-[1px] h-8 bg-border/40" />
                         <View className="items-center">
                            <Text className="text-xs text-muted-foreground mb-1">Bookings</Text>
                            <Text className="text-sm font-bold text-foreground">124</Text>
                         </View>
                    </CardContent>
                </Card>
            </View>

            {/* Menu Sections */}
            <View className="px-6">
                <View>
                    <Text className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 px-1">Management</Text>
                    <View className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm shadow-black/5">
                        <ProfileMenuItem 
                            icon={<Package size={20} className="text-blue-500" />}
                            title="Manage Services"
                            description="Update prices and availability"
                            onPress={() => navigation.navigate("ManageWorkshopServices")}
                        />
                        <View className="h-[1px] bg-border/30 mx-4" />
                        <ProfileMenuItem 
                            icon={<Calendar size={20} className="text-primary" />}
                            title="Capacity Planning"
                            description="Set daily vehicle limits"
                            onPress={() => navigation.navigate("InputCapacity")}
                        />
                        <View className="h-[1px] bg-border/30 mx-4" />
                        <ProfileMenuItem 
                            icon={<Clock size={20} className="text-orange-500" />}
                            title="Operating Hours"
                            description="Set weekly schedule"
                            onPress={() => navigation.navigate("ManageOperatingHours")}
                        />
                    </View>
                </View>

                <View className="mt-6" >
                    <Text className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 px-1">Support & Others</Text>
                    <View className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm shadow-black/5">
                        <ProfileMenuItem 
                            icon={<Bell size={20} className="text-rose-500" />}
                            title="Push Notifications"
                            description={pushEnabled ? "Enabled" : "Disabled (Tap to fix)"}
                            onPress={() => Linking.openSettings()}
                        />
                        <View className="h-[1px] bg-border/30 mx-4" />
                        <ProfileMenuItem 
                            icon={<HelpCircle size={20} className="text-purple-500" />}
                            title="Help Center"
                            onPress={() => {}}
                        />
                        <View className="h-[1px] bg-border/30 mx-4" />
                        <ProfileMenuItem 
                            icon={<ShieldCheck size={20} className="text-green-500" />}
                            title="Privacy Policy"
                            onPress={() => {}}
                        />
                    </View>
                </View>
                
                <Text className="text-center text-[10px] text-muted-foreground uppercase tracking-tighter opacity-50 mt-6">
                    App Version 1.0.0 • Roda Arka Workshop
                </Text>
            </View>
        </ScrollView>
    </SafeAreaView>
  );
}

const ProfileMenuItem = ({ icon, title, description, onPress }: { icon: any, title: string, description?: string, onPress: () => void }) => (
    <TouchableOpacity 
        onPress={onPress}
        className="flex-row items-center p-4 active:bg-muted/30"
    >
        <View className="h-10 w-10 bg-muted/5 rounded-xl items-center justify-center mr-4 border border-border/10">
            {icon}
        </View>
        <View className="flex-1">
            <Text className="text-sm font-bold text-foreground">{title}</Text>
            {description && <Text className="text-xs text-muted-foreground mt-0.5">{description}</Text>}
        </View>
        <ChevronRight size={18} className="text-muted-foreground/60" />
    </TouchableOpacity>
);
