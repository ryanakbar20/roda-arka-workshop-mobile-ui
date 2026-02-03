import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Image, ActivityIndicator, Alert, TouchableOpacity, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ProfileStackParamList } from "../../navigation/types";
import { supabase } from "../../lib/supabase";
import { getWorkshopId } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { LogOut, User, MapPin, Phone, Mail, ChevronRight, Wrench, TrendingUp, Edit, Clock } from "lucide-react-native";

interface ProfileMenuItemProps {
  icon: React.ElementType;
  label: string;
  onPress: () => void;
  color?: string;
  showBorder?: boolean;
}

const ProfileMenuItem = ({ icon: Icon, label, onPress, color, showBorder = true }: ProfileMenuItemProps) => (
  <TouchableOpacity 
    onPress={onPress}
    className={`flex-row items-center p-4 bg-card active:bg-muted/10 ${showBorder ? 'border-b border-border/50' : ''}`}
  >
    <View className={`p-2 rounded-full ${color ? `bg-${color}-100 dark:bg-${color}-900/20` : 'bg-muted/20'}`}>
        <Icon size={20} className={color ? `text-${color}-600 dark:text-${color}-400` : "text-foreground"} />
    </View>
    <Text className="flex-1 ml-4 font-medium text-foreground text-base">{label}</Text>
    <ChevronRight size={20} className="text-muted-foreground" />
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [workshop, setWorkshop] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const workshopId = await getWorkshopId();
      if (!workshopId) return;

      const { data, error } = await supabase
        .from("workshops")
        .select("*")
        .eq("id", workshopId)
        .single();

      if (error) throw error;
      setWorkshop(data);
    } catch (error) {
      console.error("Profile fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const performLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
        } catch (error: any) {
            if (Platform.OS === 'web') {
                window.alert(error.message);
            } else {
                Alert.alert("Logout Failed", error.message);
            }
        }
    };

    if (Platform.OS === 'web') {
        if (window.confirm("Are you sure you want to logout?")) {
            await performLogout();
        }
    } else {
        Alert.alert("Logout", "Are you sure you want to logout?", [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Logout", 
                style: "destructive", 
                onPress: performLogout
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

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="p-6">
        <View className="items-center mb-8">
            <View className="h-24 w-24 bg-primary/10 rounded-full items-center justify-center mb-4">
                <Text className="text-3xl font-bold text-primary">
                    {workshop?.name?.charAt(0) || "W"}
                </Text>
            </View>
            <Text className="text-2xl font-bold text-foreground text-center">
                {workshop?.name || "Workshop Name"}
            </Text>
            <View className="mt-2 px-3 py-1 bg-blue-100 rounded-full">
                <Text className="text-blue-700 text-xs font-semibold uppercase">
                    {workshop?.specialist_type?.replace('_', ' ') || "General"}
                </Text>
            </View>
        </View>

        <View className="space-y-6 bg-card border border-border rounded-xl p-4 shadow-sm mb-8">
            <View className="flex-row items-center space-x-3">
                <Mail size={20} className="text-muted-foreground mr-3" />
                <View>
                    <Text className="text-xs text-muted-foreground uppercase">Email</Text>
                    <Text className="text-base text-foreground">{workshop?.email}</Text>
                </View>
            </View>
            
            <View className="flex-row items-center space-x-3">
                <Phone size={20} className="text-muted-foreground mr-3" />
                <View>
                    <Text className="text-xs text-muted-foreground uppercase">Phone</Text>
                    <Text className="text-base text-foreground">{workshop?.phone}</Text>
                </View>
            </View>

            <View className="flex-row items-center space-x-3">
                <MapPin size={20} className="text-muted-foreground mr-3" />
                <View className="flex-1">
                    <Text className="text-xs text-muted-foreground uppercase">Address</Text>
                    <Text className="text-base text-foreground">{workshop?.address}</Text>
                    <Text className="text-sm text-muted-foreground">
                        {workshop?.city}, {workshop?.province}
                    </Text>
                </View>
            </View>
        </View>

         {/* Menu Section */}
        <View className="bg-card border border-border rounded-xl overflow-hidden mb-6">
            <ProfileMenuItem 
                icon={Edit} 
                label="Edit Profile" 
                onPress={() => navigation.navigate("EditProfile", { workshop })} 
            />
            <ProfileMenuItem 
                icon={Wrench} 
                label="Workshop Services" 
                onPress={() => navigation.navigate("ManageWorkshopServices")} 
            />
            <ProfileMenuItem 
                icon={TrendingUp} 
                label="Capacity Planning" 
                onPress={() => navigation.navigate("InputCapacity")}
            />
            <ProfileMenuItem 
                icon={Clock} 
                label="Operating Hours" 
                onPress={() => navigation.navigate("ManageOperatingHours")}
                showBorder={false}
            />
        </View>

        <Button 
            variant="destructive" 
            label="Logout" 
            onPress={handleLogout}
            className="w-full"
        />
        
        <Text className="text-center text-xs text-muted-foreground mt-4">
            App Version 1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
