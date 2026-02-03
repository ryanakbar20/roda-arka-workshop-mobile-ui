import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChatListScreen from '../screens/features/chat/ChatListScreen';
import ChatDetailScreen from '../screens/features/chat/ChatDetailScreen';
import { HomeStackParamList } from './types'; // We can share Types or create separate

const Stack = createNativeStackNavigator<HomeStackParamList>(); // Reusing types for simplicity, assuming merged

export function ChatStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ChatList" 
        component={ChatListScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="ChatDetail" 
        component={ChatDetailScreen} 
        options={{ headerShown: false }} 
      />
    </Stack.Navigator>
  );
}
