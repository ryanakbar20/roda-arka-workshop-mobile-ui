import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/dashboard/ProfileScreen';
import EditProfileScreen from '../screens/dashboard/EditProfileScreen';
import ManageOperatingHoursScreen from '../screens/features/settings/ManageOperatingHoursScreen';
import ManageWorkshopServicesScreen from '../screens/features/services/ManageWorkshopServicesScreen';
import EditWorkshopServiceScreen from '../screens/features/services/EditWorkshopServiceScreen_v2';
import InputCapacityScreen from '../screens/dashboard/InputCapacityScreen';
import { ProfileStackParamList } from './types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ProfileDashboard" 
        component={ProfileScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="ManageOperatingHours" 
        component={ManageOperatingHoursScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="ManageWorkshopServices" 
        component={ManageWorkshopServicesScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="EditWorkshopService" 
        component={EditWorkshopServiceScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="InputCapacity" 
        component={InputCapacityScreen} 
        options={{ headerShown: false }} 
      />
    </Stack.Navigator>
  );
}
