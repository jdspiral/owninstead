import { Worker, Queue } from 'bullmq';
import { redis } from '../lib/redis.js';
import { supabase } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';
import { ruleEngine } from '../services/rule-engine.js';
import { sendPushNotification, notificationTemplates } from '../services/notifications.js';

const QUEUE_NAME = 'weekly-evaluation';

// Queue for scheduling weekly evaluations
export const weeklyEvaluationQueue = redis
  ? new Queue(QUEUE_NAME, { connection: redis })
  : null;

// Worker to process weekly evaluations
export const weeklyEvaluationWorker = redis
  ? new Worker(
      QUEUE_NAME,
      async (job) => {
        logger.info({ jobId: job.id, data: job.data }, 'Processing weekly evaluation job');

        try {
          if (job.data.userId) {
            // Single user evaluation (for testing or on-demand)
            await processUserEvaluation(job.data.userId);
          } else {
            // Batch evaluation for all active users
            await processAllUsers();
          }

          logger.info({ jobId: job.id }, 'Weekly evaluation job completed');
        } catch (error) {
          logger.error({ error, jobId: job.id }, 'Weekly evaluation job failed');
          throw error;
        }
      },
      { connection: redis }
    )
  : null;

// Streak milestones that trigger special notifications
const STREAK_MILESTONES = [3, 5, 10, 25, 52];

/**
 * Process weekly evaluation for a single user
 */
async function processUserEvaluation(userId: string): Promise<void> {
  logger.info({ userId }, 'Processing weekly evaluation for user');

  // Create evaluations for this user
  await ruleEngine.createEvaluations(userId);

  // Get pending evaluations with streak info
  const { data: evaluations } = await supabase
    .from('evaluations')
    .select('final_invest, streak_count, rules(streak_enabled)')
    .eq('user_id', userId)
    .eq('status', 'pending');

  const totalSavings = evaluations?.reduce((sum, e) => sum + (e.final_invest || 0), 0) || 0;

  // Check for streak milestones
  for (const evaluation of evaluations || []) {
    const rule = evaluation.rules as { streak_enabled: boolean } | null;
    if (rule?.streak_enabled && STREAK_MILESTONES.includes(evaluation.streak_count)) {
      const bonusPercent = evaluation.streak_count * 10;
      await sendPushNotification(
        userId,
        'streak_bonus',
        notificationTemplates.streakBonus(evaluation.streak_count, bonusPercent)
      );
      break; // Only send one streak notification per evaluation cycle
    }
  }

  // Only send weekly review notification if there are savings to invest
  if (totalSavings > 0) {
    await sendPushNotification(
      userId,
      'weekly_review',
      notificationTemplates.weeklyReview(totalSavings)
    );
  }
}

/**
 * Process weekly evaluations for all active users
 */
async function processAllUsers(): Promise<void> {
  logger.info('Starting batch weekly evaluation for all users');

  // Get all users with active rules and completed onboarding
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, investing_paused')
    .eq('onboarding_completed', true);

  if (error) {
    logger.error({ error }, 'Failed to fetch profiles for weekly evaluation');
    throw error;
  }

  if (!profiles || profiles.length === 0) {
    logger.info('No users to process for weekly evaluation');
    return;
  }

  logger.info({ count: profiles.length }, 'Processing weekly evaluations');

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const profile of profiles) {
    if (profile.investing_paused) {
      skipCount++;
      continue;
    }

    try {
      await processUserEvaluation(profile.id);
      successCount++;
    } catch (err) {
      errorCount++;
      logger.error({ error: err, userId: profile.id }, 'Failed to process user evaluation');
    }
  }

  logger.info(
    { successCount, skipCount, errorCount },
    'Completed batch weekly evaluation'
  );
}

/**
 * Schedule the weekly evaluation cron job
 * Runs every Sunday at 6:00 AM UTC
 */
export async function scheduleWeeklyEvaluation(): Promise<void> {
  if (!weeklyEvaluationQueue) {
    logger.warn('Weekly evaluation queue not available - Redis not configured');
    return;
  }

  // Remove any existing repeatable jobs
  const repeatableJobs = await weeklyEvaluationQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    await weeklyEvaluationQueue.removeRepeatableByKey(job.key);
  }

  // Schedule new weekly job
  await weeklyEvaluationQueue.add(
    'weekly-batch',
    {},
    {
      repeat: {
        pattern: '0 6 * * 0', // Sunday at 6:00 AM UTC
      },
      removeOnComplete: 100,
      removeOnFail: 50,
    }
  );

  logger.info('Scheduled weekly evaluation cron job');
}

/**
 * Trigger evaluation for a specific user (for testing)
 */
export async function triggerUserEvaluation(userId: string): Promise<void> {
  if (!weeklyEvaluationQueue) {
    // Run directly if no queue
    await processUserEvaluation(userId);
    return;
  }

  await weeklyEvaluationQueue.add(
    'user-evaluation',
    { userId },
    {
      removeOnComplete: true,
      removeOnFail: true,
    }
  );
}
