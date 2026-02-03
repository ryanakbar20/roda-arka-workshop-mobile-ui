import React, { useState, useCallback, useEffect } from "react";
import { View, Text, FlatList, RefreshControl, Image, TouchableOpacity, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../../../navigation/types"; // Using HomeStack for simplicity if we put it there, or generic
import { supabase } from "../../../lib/supabase";
import { getWorkshopId } from "../../../lib/utils";
import { Search, MessageSquare } from "lucide-react-native";
import { cn } from "../../../lib/utils";
import dayjs from "../../../lib/dayjs";

export default function ChatListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>(); // Any to allow flexible navigation
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chats, setChats] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
    });
  }, []);

  const fetchChats = async () => {
    try {
      const workshopId = await getWorkshopId();
      if (!workshopId) return;

      const { data: chatsData, error: chatsError } = await supabase
        .from("chats")
        .select("*")
        .eq("workshop_id", workshopId)
        .order("last_message_at", { ascending: false });

      if (chatsError) throw chatsError;

      if (!chatsData || chatsData.length === 0) {
        setChats([]);
        return;
      }
      
      // Fetch unread counts
      const chatIds = chatsData.map((c: any) => c.id);
      
      // Get unread messages count for each chat where sender is NOT current user
      const { data: unreadData } = await supabase
        .from("messages")
        .select("chat_id")
        .in("chat_id", chatIds)
        .eq("is_read", false)
        .neq("sender_id", currentUserId); // Don't count own messages as unread

      const unreadCounts: Record<string, number> = {};
      unreadData?.forEach((msg: any) => {
        unreadCounts[msg.chat_id] = (unreadCounts[msg.chat_id] || 0) + 1;
      });

      const userIds = [...new Set(chatsData.map((c: any) => c.user_id))];
      
      // Fetch profiles with user_id
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, avatar_url")
        .in("id", userIds);

      // Fallback: if no profiles found, try matching by user_id column
      let finalProfiles = profilesData;
      if (!profilesData || profilesData.length === 0) {
          const { data: profilesByUserId } = await supabase
            .from("profiles")
            .select("id, user_id, full_name, avatar_url")
            .in("user_id", userIds);
          finalProfiles = profilesByUserId;
      }

      const mergedChats = chatsData.map((chat: any) => {
        // Match by id OR user_id
        const profile = finalProfiles?.find((p: any) => p.id === chat.user_id || p.user_id === chat.user_id);
        return {
          ...chat,
          unread_count: unreadCounts[chat.id] || 0,
          profiles: {
            full_name: profile?.full_name || "Unknown User",
            avatar_url: profile?.avatar_url || null,
          },
        };
      });

      setChats(mergedChats);
    } catch (err) {
      console.error("Fetch chats error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchChats();
      
      if (!currentUserId) return;

      const channel = supabase
       .channel('public:chats_list')
       .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, () => {
         fetchChats();
       })
       // Also listen for new messages to update unread counts and last message
       .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
          fetchChats();
       })
       .subscribe();
       
       return () => { supabase.removeChannel(channel); };
    }, [currentUserId])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchChats();
  };

  const filteredChats = chats.filter((item) => {
      const name = item.profiles?.full_name?.toLowerCase() || "";
      return name.includes(searchQuery.toLowerCase());
  });

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-5 py-3 border-b border-border/50 bg-background">
        <Text className="text-xl font-bold text-foreground mb-3">Messages</Text>
         <View className="flex-row items-center bg-muted/30 border border-input rounded-lg px-3 h-10">
              <Search size={18} className="text-muted-foreground mr-2" />
              <TextInput 
                placeholder="Search conversations..."
                className="flex-1 text-foreground"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
          </View>
      </View>

      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
            !loading ? (
                <View className="items-center justify-center py-20 opacity-50">
                    <MessageSquare size={48} className="text-muted-foreground mb-4" />
                    <Text className="text-muted-foreground">No conversations yet</Text>
                </View>
            ) : null
        }
        renderItem={({ item }) => (
            <TouchableOpacity 
                onPress={() => navigation.navigate("ChatDetail", { 
                    chatId: item.id, 
                    customerName: item.profiles.full_name,
                    avatarUrl: item.profiles.avatar_url
                 })}
                className="flex-row items-center p-3 mb-2 bg-card rounded-xl border border-border shadow-sm"
            >
                <Image 
                    source={{ uri: item.profiles.avatar_url || "https://ui-avatars.com/api/?name=" + item.profiles.full_name }}
                    className="w-12 h-12 rounded-full bg-muted" 
                />
                <View className="flex-1 ml-3">
                    <View className="flex-row justify-between mb-1">
                        <Text className="font-semibold text-foreground text-base flex-1 mr-2">{item.profiles.full_name}</Text>
                        <Text className="text-xs text-muted-foreground">
                            {item.last_message_at ? dayjs(item.last_message_at).fromNow(true) : ""}
                        </Text>
                    </View>
                    <View className="flex-row justify-between items-center">
                        <Text numberOfLines={1} className={cn("text-sm flex-1 mr-2", item.unread_count > 0 ? "text-foreground font-semibold" : "text-muted-foreground")}>
                            {item.last_message || "No messages"}
                        </Text>
                        {item.unread_count > 0 && (
                            <View className="bg-green-600 rounded-full min-w-[20px] h-5 px-1.5 items-center justify-center">
                                <Text className="text-white text-[10px] font-bold">
                                    {item.unread_count > 99 ? '99+' : item.unread_count}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
