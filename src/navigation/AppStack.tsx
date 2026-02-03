import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AppTabParamList } from './types';
import { HomeStack } from './HomeStack';
import { ChatStack } from './ChatStack';
import ProfileStack from './ProfileStack';
import OrdersStack from './OrdersStack';
import { Home, ClipboardList, MessageSquare, User } from 'lucide-react-native';

const Tab = createBottomTabNavigator<AppTabParamList>();

export default function AppStack() {
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
        options={{
            tabBarIcon: ({ color, size }) => <MessageSquare size={size} color={color} />
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
