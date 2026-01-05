import { useEffect, useRef } from 'react';
import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import {
  registerForPushNotifications,
  addNotificationResponseListener,
} from '@/services/notifications';

export default function TabLayout() {
  const notificationResponseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    // Register for push notifications
    registerForPushNotifications();

    // Handle notification taps
    notificationResponseListener.current = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;

      // Navigate based on notification type
      if (data?.type === 'weekly_review') {
        router.push('/review');
      } else if (data?.type === 'order_submitted' || data?.type === 'order_failed') {
        router.push('/(tabs)/history');
      }
    });

    return () => {
      if (notificationResponseListener.current) {
        notificationResponseListener.current.remove();
      }
    };
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#9CA3AF',
        headerShown: true,
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="rules"
        options={{
          title: 'Rules',
          tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => <Ionicons name="time" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
