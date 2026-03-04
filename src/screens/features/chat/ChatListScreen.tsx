import React, { useState, useCallback, useEffect } from "react";
import { View, Text, FlatList, RefreshControl, Image, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../../../navigation/types";
import { supabase } from "../../../lib/supabase";
import { getWorkshopId } from "../../../lib/utils";
import { Search, MessageSquare } from "lucide-react-native";
import { cn } from "../../../lib/utils";
import dayjs from "../../../lib/dayjs";

export default function ChatListScreen({ navigation }: any) {
  // const navigation = useNavigation<NativeStackNavigationProp<any>>();
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
      
      const chatIds = chatsData.map((c: any) => c.id);
      
      const { data: unreadData } = await supabase
        .from("messages")
        .select("chat_id")
        .in("chat_id", chatIds)
        .eq("is_read", false)
        .neq("sender_id", currentUserId || "");

      const unreadCounts: Record<string, number> = {};
      unreadData?.forEach((msg: any) => {
        unreadCounts[msg.chat_id] = (unreadCounts[msg.chat_id] || 0) + 1;
      });

      const userIds = [...new Set(chatsData.map((c: any) => c.user_id))];
      
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, avatar_url")
        .in("id", userIds);

      let finalProfiles = profilesData;
      if (!profilesData || profilesData.length === 0) {
          const { data: profilesByUserId } = await supabase
            .from("profiles")
            .select("id, user_id, full_name, avatar_url")
            .in("user_id", userIds);
          finalProfiles = profilesByUserId;
      }

      const mergedChats = chatsData.map((chat: any) => {
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

  const filteredConversations = chats.filter((item) => {
      const name = item.profiles?.full_name?.toLowerCase() || "";
      return name.includes(searchQuery.toLowerCase());
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }} edges={['top', 'left', 'right']}>
      <View className="px-6 py-4">
        <Text className="text-2xl font-bold text-foreground mb-4">Messages</Text>
        <View className="flex-row items-center bg-muted/30 px-4 py-2 rounded-2xl border border-border/50">
          <Search size={18} className="text-muted-foreground mr-3" />
          <TextInput 
            placeholder="Search conversations..."
            className="flex-1 text-foreground text-sm"
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-6 pb-20"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            !loading && filteredConversations.length === 0 ? (
              <View className="items-center justify-center py-20 opacity-50">
                <MessageSquare size={48} className="text-muted-foreground mb-4" />
                <Text className="text-muted-foreground">No conversations yet</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const customerName = item.profiles?.full_name || "Customer";
            const lastMessage = item.last_message || "No messages yet";
            const timestamp = item.last_message_at;
            const unreadCount = item.unread_count || 0;

            return (
              <TouchableOpacity 
                onPress={() => navigation.navigate("ChatDetail", { chatId: item.id, customerName, avatarUrl: item.profiles.avatar_url })}
                className="flex-row items-center py-4 border-b border-border/30 active:bg-muted/5"
              >
                <View className="h-14 w-14 bg-primary/10 rounded-2xl items-center justify-center mr-4">
                  <View className="h-12 w-12 bg-primary/20 rounded-xl items-center justify-center">
                    <Text className="text-xl font-bold text-primary">
                      {customerName.charAt(0)}
                    </Text>
                  </View>
                </View>
                <View className="flex-1">
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-base font-bold text-foreground" numberOfLines={1}>{customerName}</Text>
                    <Text className="text-xs text-muted-foreground">
                      {timestamp ? dayjs(timestamp).fromNow(true) : ""}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-sm text-muted-foreground flex-1 pr-4" numberOfLines={1}>
                      {lastMessage}
                    </Text>
                    {unreadCount > 0 && (
                      <View className="bg-primary h-5 w-5 rounded-full items-center justify-center">
                        <Text className="text-[10px] font-bold text-white">{unreadCount}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
