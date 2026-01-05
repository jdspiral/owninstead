import { supabase } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
}

/**
 * Send a push notification to a specific user
 */
export async function sendPushNotification(
  userId: string,
  type: string,
  payload: NotificationPayload
): Promise<boolean> {
  try {
    // Get user's push token
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('push_token')
      .eq('id', userId)
      .single();

    if (error || !profile?.push_token) {
      logger.warn({ userId, type }, 'No push token found for user');
      return false;
    }

    const pushToken = profile.push_token;

    // Validate Expo push token format
    if (!isExpoPushToken(pushToken)) {
      logger.warn({ userId, pushToken }, 'Invalid Expo push token format');
      return false;
    }

    // Send the notification
    const message: ExpoPushMessage = {
      to: pushToken,
      title: payload.title,
      body: payload.body,
      data: { ...payload.data, type },
      sound: 'default',
      channelId: 'default',
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();

    if (result.data?.status === 'error') {
      logger.error(
        { userId, type, error: result.data.message },
        'Failed to send push notification'
      );

      // If the token is invalid, clear it from the database
      if (result.data.details?.error === 'DeviceNotRegistered') {
        await supabase
          .from('profiles')
          .update({ push_token: null, push_token_updated_at: null })
          .eq('id', userId);
        logger.info({ userId }, 'Cleared invalid push token');
      }

      return false;
    }

    logger.info({ userId, type }, 'Push notification sent successfully');
    return true;
  } catch (error) {
    logger.error({ error, userId, type }, 'Error sending push notification');
    return false;
  }
}

/**
 * Send push notifications to multiple users
 */
export async function sendBulkPushNotifications(
  userIds: string[],
  type: string,
  payload: NotificationPayload
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const userId of userIds) {
    const sent = await sendPushNotification(userId, type, payload);
    if (sent) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed };
}

/**
 * Check if a string is a valid Expo push token
 */
function isExpoPushToken(token: string): boolean {
  return (
    typeof token === 'string' &&
    (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken['))
  );
}

/**
 * Notification templates
 */
export const notificationTemplates = {
  weeklyReview: (totalSavings: number): NotificationPayload => ({
    title: 'Weekly Review Ready',
    body: `You saved $${totalSavings.toFixed(2)} this week! Tap to review and invest.`,
    data: { type: 'weekly_review' },
  }),

  orderSubmitted: (amount: number, symbol: string): NotificationPayload => ({
    title: 'Investment Order Placed',
    body: `Your $${amount.toFixed(2)} ${symbol} order has been submitted.`,
    data: { type: 'order_submitted' },
  }),

  orderFilled: (amount: number, symbol: string): NotificationPayload => ({
    title: 'Investment Complete',
    body: `Your $${amount.toFixed(2)} ${symbol} order has been filled.`,
    data: { type: 'order_filled' },
  }),

  orderFailed: (): NotificationPayload => ({
    title: 'Investment Failed',
    body: 'There was an issue with your investment order. Tap to learn more.',
    data: { type: 'order_failed' },
  }),

  streakBonus: (weeks: number, bonusPercent: number): NotificationPayload => ({
    title: `${weeks} Week Streak!`,
    body: `You're on fire! Enjoy a ${bonusPercent}% bonus on this week's investment.`,
    data: { type: 'streak_bonus' },
  }),
};
