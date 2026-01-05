import { logger } from '../lib/logger.js';
import { redis } from '../lib/redis.js';
import {
  weeklyEvaluationWorker,
  scheduleWeeklyEvaluation,
  triggerUserEvaluation,
} from './weekly-evaluation.js';
import {
  tradeExecutionWorker,
  scheduleTradeExecution,
  triggerEvaluationTrade,
} from './trade-execution.js';
import {
  transactionSyncWorker,
  scheduleTransactionSync,
  triggerUserTransactionSync,
} from './transaction-sync.js';

/**
 * Initialize all workers and schedule cron jobs
 */
export async function initializeWorkers(): Promise<void> {
  if (!redis) {
    logger.warn('Redis not configured - workers will not be started');
    return;
  }

  // Start workers
  if (weeklyEvaluationWorker) {
    weeklyEvaluationWorker.on('completed', (job) => {
      logger.debug({ jobId: job.id }, 'Weekly evaluation job completed');
    });
    weeklyEvaluationWorker.on('failed', (job, err) => {
      logger.error({ jobId: job?.id, err }, 'Weekly evaluation job failed');
    });
  }

  if (tradeExecutionWorker) {
    tradeExecutionWorker.on('completed', (job) => {
      logger.debug({ jobId: job.id }, 'Trade execution job completed');
    });
    tradeExecutionWorker.on('failed', (job, err) => {
      logger.error({ jobId: job?.id, err }, 'Trade execution job failed');
    });
  }

  if (transactionSyncWorker) {
    transactionSyncWorker.on('completed', (job) => {
      logger.debug({ jobId: job.id }, 'Transaction sync job completed');
    });
    transactionSyncWorker.on('failed', (job, err) => {
      logger.error({ jobId: job?.id, err }, 'Transaction sync job failed');
    });
  }

  // Schedule cron jobs
  await scheduleWeeklyEvaluation();
  await scheduleTradeExecution();
  await scheduleTransactionSync();

  logger.info('Workers initialized and cron jobs scheduled');
}

/**
 * Gracefully shutdown workers
 */
export async function shutdownWorkers(): Promise<void> {
  const closePromises: Promise<void>[] = [];

  if (weeklyEvaluationWorker) {
    closePromises.push(weeklyEvaluationWorker.close());
  }

  if (tradeExecutionWorker) {
    closePromises.push(tradeExecutionWorker.close());
  }

  if (transactionSyncWorker) {
    closePromises.push(transactionSyncWorker.close());
  }

  await Promise.all(closePromises);
  logger.info('Workers shut down');
}

// Re-export for external use
export { triggerUserEvaluation, triggerEvaluationTrade, triggerUserTransactionSync };
