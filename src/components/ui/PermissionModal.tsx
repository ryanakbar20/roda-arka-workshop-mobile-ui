import React, { useEffect, useState } from 'react';
import { View, Text, Modal, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import { Button } from './Button';
import { Bell, Mic } from 'lucide-react-native';

const PERMISSION_KEY = 'HAS_REQUESTED_PERMISSIONS';

interface PermissionModalProps {
  onPermissionsGranted: () => void;
}

export function PermissionModal({ onPermissionsGranted }: PermissionModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    try {
      const hasRequested = await AsyncStorage.getItem(PERMISSION_KEY);
      if (hasRequested !== 'true') {
        setIsVisible(true);
      } else {
        // If already requested in the past, immediately tell the parent to proceed
        onPermissionsGranted();
      }
    } catch (error) {
      console.error('Error checking permission status in AsyncStorage:', error);
      // Failsafe: just hide it if AsyncStorage crashes
      setIsVisible(true); 
    }
  };

  const handleAllowPermissions = async () => {
    setLoading(true);
    try {
      // 1. Request Notification Permissions
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
      await Notifications.requestPermissionsAsync();

      // 2. Request Audio Recording Permissions
      await Audio.requestPermissionsAsync();

      // Mark as requested in AsyncStorage
      await AsyncStorage.setItem(PERMISSION_KEY, 'true');

      // Dismiss modal
      setIsVisible(false);

      // Trigger parent callback to fetch the Expo token
      onPermissionsGranted();
    } catch (error) {
      console.error('Error requesting permissions:', error);
      setIsVisible(false);
      onPermissionsGranted(); // Proceed anyway so they aren't stuck
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {}} // Disabled back button on Android to force a choice
    >
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-background rounded-t-3xl p-6 pb-12 shadow-lg">
          <Text className="text-2xl font-bold text-foreground mb-2">
            Perizinan App
          </Text>
          <Text className="text-muted-foreground text-base mb-6">
            Untuk pengalaman terbaik, aplikasi roda bengkel membutuhkan beberapa izin akses:
          </Text>

          <View className="space-y-4 mb-8">
            <View className="flex-row items-center bg-card p-4 rounded-xl border border-border/50">
              <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mr-4">
                <Bell size={24} color="#2563eb" />
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-semibold text-base">Notifikasi</Text>
                <Text className="text-muted-foreground text-sm">
                  Agar Anda tidak ketinggalan pesan chat dari pelanggan.
                </Text>
              </View>
            </View>

            <View className="flex-row items-center bg-card p-4 rounded-xl border border-border/50">
              <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mr-4">
                <Mic size={24} color="#2563eb" />
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-semibold text-base">Mikrofon</Text>
                <Text className="text-muted-foreground text-sm">
                  Digunakan untuk mengirim pesan suara (voice note) di chat.
                </Text>
              </View>
            </View>
          </View>

          <Button
            label="Izinkan Sekarang"
            onPress={handleAllowPermissions}
            loading={loading}
            className="w-full"
          />
        </View>
      </View>
    </Modal>
  );
}
