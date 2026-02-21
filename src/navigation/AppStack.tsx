import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { AppTabParamList } from './types';
import { HomeStack } from './HomeStack';
import { ChatStack } from './ChatStack';
import ProfileStack from './ProfileStack';
import OrdersStack from './OrdersStack';
import { Home, ClipboardList, MessageSquare, User } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { getWorkshopId } from '../lib/utils';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const Tab = createBottomTabNavigator<AppTabParamList>();

export default function AppStack() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
    });
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    const fetchUnreadCount = async () => {
      try {
        const workshopId = await getWorkshopId();
        if (!workshopId) return;

        const { data: chats } = await supabase
          .from("chats")
          .select("id")
          .eq("workshop_id", workshopId);
        
        if (!chats || chats.length === 0) return;
        const chatIds = chats.map(c => c.id);

        const { data: unreadData } = await supabase
          .from("messages")
          .select("id")
          .in("chat_id", chatIds)
          .eq("is_read", false)
          .neq("sender_id", currentUserId);

        setUnreadCount(unreadData?.length || 0);
      } catch (e) {
        console.error("Error fetching global unread count:", e);
      }
    };

    fetchUnreadCount();

    const channel = supabase
       .channel('global_chat_notifications')
       .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
         const newMessage = payload.new;
         if (newMessage.sender_id !== currentUserId) {
             setUnreadCount(prev => prev + 1);
             const messageText = newMessage.message_type === "text" 
                                  ? newMessage.content 
                                  : `Sent a ${newMessage.message_type || 'file'}`;
             
             Notifications.scheduleNotificationAsync({
               content: {
                 title: "New Chat Message",
                 body: messageText || "You have received a new message.",
                 data: { chatId: newMessage.chat_id },
               },
               trigger: null, // Send immediately
             });
         }
       })
       .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
           fetchUnreadCount();
       })
       .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUserId]);

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        console.log("Expo Push Token:", token);
        // Note: In a future iteration, save this to the backend `users` or `push_tokens` table.
      }
    });
  }, []);

  return (
    <Tab.Navigator
        screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#2563eb',
            tabBarInactiveTintColor: '#64748b',
        }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStack} 
        options={{
            tabBarIcon: ({ color, size }) => <Home size={size} color={color} />
        }}
      />
      <Tab.Screen 
        name="Orders" 
        component={OrdersStack} 
        options={{
            tabBarIcon: ({ color, size }) => <ClipboardList size={size} color={color} />
        }}
      />
       <Tab.Screen 
        name="Chat" 
        component={ChatStack} 
        options={({ route }) => {
            const routeName = getFocusedRouteNameFromRoute(route) ?? 'ChatList';
            return {
              tabBarIcon: ({ color, size }) => <MessageSquare size={size} color={color} />,
              tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
              tabBarStyle: routeName === 'ChatDetail' ? { display: 'none' } : undefined,
            };
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack} 
        options={{
            tabBarIcon: ({ color, size }) => <User size={size} color={color} />
        }}
      />
    </Tab.Navigator>
  );
}

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return;
    }
    
    // To use Expo's default service without a project ID, pass an empty object or your own GC id here.
    // Replace with EAS project ID if configured in app.json.
    try {
        // We catch errors here if a projectId hasn't been configured in app.json yet.
        const tokenResponse = await Notifications.getExpoPushTokenAsync();
        token = tokenResponse.data;
    } catch (e) {
        console.warn("Could not get Expo Push Token:", e);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}
