import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiClient } from './api/client';

// Check if we're in Expo Go (native modules not available)
const isExpoGo = Constants.appOwnership === 'expo';

// Lazy load modules to avoid crash in Expo Go
let Notifications: typeof import('expo-notifications') | null = null;
let Device: typeof import('expo-device') | null = null;

async function getNotifications() {
  if (isExpoGo) {
    return null;
  }
  if (!Notifications) {
    Notifications = await import('expo-notifications');
    Device = await import('expo-device');
    // Configure how notifications are handled when app is in foreground
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
  return Notifications;
}

/**
 * Register for push notifications and save token to backend
 */
export async function registerForPushNotifications(): Promise<string | null> {
  const NotificationsModule = await getNotifications();
  if (!NotificationsModule || !Device) {
    console.log('Push notifications require a development build');
    return null;
  }

  // Must be a physical device
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Check/request permissions
  const { status: existingStatus } = await NotificationsModule.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await NotificationsModule.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

  // Get the Expo push token
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const token = await NotificationsModule.getExpoPushTokenAsync({
      projectId,
    });

    // Save token to backend
    await savePushToken(token.data);

    // Configure Android channel
    if (Platform.OS === 'android') {
      await NotificationsModule.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: NotificationsModule.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4F46E5',
      });
    }

    return token.data;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

/**
 * Save push token to backend
 */
async function savePushToken(token: string): Promise<void> {
  try {
    await apiClient.post('/profile/push-token', { pushToken: token });
  } catch (error) {
    console.error('Failed to save push token:', error);
  }
}

/**
 * Add listener for notification received while app is foregrounded
 */
export function addNotificationReceivedListener(
  callback: (notification: import('expo-notifications').Notification) => void
): { remove: () => void } {
  if (isExpoGo) {
    return { remove: () => {} };
  }
  // This will be called after getNotifications() has loaded the module
  const NotificationsModule = require('expo-notifications');
  return NotificationsModule.addNotificationReceivedListener(callback);
}

/**
 * Add listener for when user taps on a notification
 */
export function addNotificationResponseListener(
  callback: (response: import('expo-notifications').NotificationResponse) => void
): { remove: () => void } {
  if (isExpoGo) {
    return { remove: () => {} };
  }
  const NotificationsModule = require('expo-notifications');
  return NotificationsModule.addNotificationResponseReceivedListener(callback);
}

/**
 * Get the last notification response (for handling notification that opened the app)
 */
export async function getLastNotificationResponse(): Promise<import('expo-notifications').NotificationResponse | null> {
  const NotificationsModule = await getNotifications();
  if (!NotificationsModule) return null;
  return await NotificationsModule.getLastNotificationResponseAsync();
}

/**
 * Schedule a local notification (for testing)
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<string | null> {
  const NotificationsModule = await getNotifications();
  if (!NotificationsModule) return null;
  return await NotificationsModule.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: null, // Immediately
  });
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications(): Promise<void> {
  const NotificationsModule = await getNotifications();
  if (!NotificationsModule) return;
  await NotificationsModule.dismissAllNotificationsAsync();
}

/**
 * Set badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  const NotificationsModule = await getNotifications();
  if (!NotificationsModule) return;
  await NotificationsModule.setBadgeCountAsync(count);
}
