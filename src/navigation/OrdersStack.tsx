import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OrdersStackParamList } from './types';
import OrdersScreen from '../screens/dashboard/OrdersScreen';
import BookingDetailScreen from '../screens/features/bookings/BookingDetailScreen';
import ServiceDetailScreen from '../screens/features/services/ServiceDetailScreen';

const Stack = createNativeStackNavigator<OrdersStackParamList>();

export default function OrdersStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="OrdersList" 
        component={OrdersScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="BookingDetail" 
        component={BookingDetailScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="ServiceDetail" 
        component={ServiceDetailScreen} 
        options={{ headerShown: false }} 
      />
    </Stack.Navigator>
  );
}
