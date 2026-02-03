import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/dashboard/HomeScreen';
import ManageServiceListScreen from '../screens/features/services/ManageServiceListScreen';
import AddServiceScreen from '../screens/features/services/AddServiceScreen';
import ServiceDetailScreen from '../screens/features/services/ServiceDetailScreen';
import EditServiceScreen from '../screens/features/services/EditServiceScreen';
import ManageBookingListScreen from '../screens/features/bookings/ManageBookingListScreen';
import BookingDetailScreen from '../screens/features/bookings/BookingDetailScreen';
import ManageMechanicsListScreen from '../screens/features/mechanics/ManageMechanicsListScreen';
import AddMechanicScreen from '../screens/features/mechanics/AddMechanicScreen';
import InvoiceListScreen from '../screens/features/invoices/InvoiceListScreen';
import InputCapacityScreen from '../screens/dashboard/InputCapacityScreen';
import ManageWorkshopServicesScreen from '../screens/features/services/ManageWorkshopServicesScreen';
import EditWorkshopServiceScreen from '../screens/features/services/EditWorkshopServiceScreen_v2';
import ManageOperatingHoursScreen from '../screens/features/settings/ManageOperatingHoursScreen';
import { HomeStackParamList } from './types';

// Placeholder screens for now
import { View, Text } from 'react-native';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Dashboard" 
        component={HomeScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen name="InputCapacity" component={InputCapacityScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ManageWorkshopServices" component={ManageWorkshopServicesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EditWorkshopService" component={EditWorkshopServiceScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ManageOperatingHours" component={ManageOperatingHoursScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ManageServiceList" component={ManageServiceListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AddService" component={AddServiceScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EditService" component={EditServiceScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ManageBookingList" component={ManageBookingListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="BookingDetail" component={BookingDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AddMechanic" component={AddMechanicScreen} options={{ headerShown: false }} />
      <Stack.Screen name="InvoiceList" component={InvoiceListScreen} options={{ headerShown: false }} />
      {/* Add other feature screens here */}
    </Stack.Navigator>
  );
}
