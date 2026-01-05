import { Worker, Queue } from 'bullmq';
import { redis } from '../lib/redis.js';
import { supabase } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';
import { plaidService } from '../services/plaid.js';

const QUEUE_NAME = 'transaction-sync';

// Queue for scheduling transaction syncs
export const transactionSyncQueue = redis
  ? new Queue(QUEUE_NAME, { connection: redis })
  : null;

// Worker to process transaction syncs
export const transactionSyncWorker = redis
  ? new Worker(
      QUEUE_NAME,
      async (job) => {
        logger.info({ jobId: job.id, data: job.data }, 'Processing transaction sync job');

        try {
          if (job.data.userId) {
            // Single user sync
            await syncUserTransactions(job.data.userId);
          } else {
            // Batch sync for all users
            await syncAllUsers();
          }

          logger.info({ jobId: job.id }, 'Transaction sync job completed');
        } catch (error) {
          logger.error({ error, jobId: job.id }, 'Transaction sync job failed');
          throw error;
        }
      },
      { connection: redis }
    )
  : null;

/**
 * Sync transactions for a single user
 */
async function syncUserTransactions(userId: string): Promise<void> {
  logger.info({ userId }, 'Syncing transactions for user');

  const result = await plaidService.syncTransactions(userId);

  logger.info(
    { userId, synced: result.synced, accounts: result.accounts },
    'Completed transaction sync for user'
  );
}

/**
 * Sync transactions for all users with Plaid connections
 */
async function syncAllUsers(): Promise<void> {
  logger.info('Starting batch transaction sync for all users');

  // Get all users with Plaid connections
  const { data: connections, error } = await supabase
    .from('plaid_connections')
    .select('user_id')
    .order('last_synced_at', { ascending: true, nullsFirst: true });

  if (error) {
    logger.error({ error }, 'Failed to fetch Plaid connections');
    throw error;
  }

  // Get unique user IDs
  const userIds = [...new Set(connections?.map((c) => c.user_id) ?? [])];

  if (userIds.length === 0) {
    logger.info('No users with Plaid connections to sync');
    return;
  }

  logger.info({ count: userIds.length }, 'Syncing transactions for users');

  let successCount = 0;
  let errorCount = 0;

  for (const userId of userIds) {
    try {
      await syncUserTransactions(userId);
      successCount++;

      // Add a small delay between users to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (err) {
      errorCount++;
      logger.error({ error: err, userId }, 'Failed to sync transactions for user');
    }
  }

  logger.info({ successCount, errorCount }, 'Completed batch transaction sync');
}

/**
 * Schedule the transaction sync cron job
 * Runs twice daily: 6 AM and 6 PM UTC
 */
export async function scheduleTransactionSync(): Promise<void> {
  if (!transactionSyncQueue) {
    logger.warn('Transaction sync queue not available - Redis not configured');
    return;
  }

  // Remove any existing repeatable jobs
  const repeatableJobs = await transactionSyncQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    await transactionSyncQueue.removeRepeatableByKey(job.key);
  }

  // Schedule morning sync (6 AM UTC)
  await transactionSyncQueue.add(
    'daily-sync-morning',
    {},
    {
      repeat: {
        pattern: '0 6 * * *', // 6 AM UTC daily
      },
      removeOnComplete: 100,
      removeOnFail: 50,
    }
  );

  // Schedule evening sync (6 PM UTC)
  await transactionSyncQueue.add(
    'daily-sync-evening',
    {},
    {
      repeat: {
        pattern: '0 18 * * *', // 6 PM UTC daily
      },
      removeOnComplete: 100,
      removeOnFail: 50,
    }
  );

  logger.info('Scheduled transaction sync cron jobs (6 AM and 6 PM UTC)');
}

/**
 * Trigger transaction sync for a specific user (for manual/on-demand sync)
 */
export async function triggerUserTransactionSync(userId: string): Promise<void> {
  if (!transactionSyncQueue) {
    // Run directly if no queue
    await syncUserTransactions(userId);
    return;
  }

  await transactionSyncQueue.add(
    'user-sync',
    { userId },
    {
      removeOnComplete: true,
      removeOnFail: true,
    }
  );
}
