import { Worker, Queue } from 'bullmq';
import { redis } from '../lib/redis.js';
import { supabase } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';
import { snaptradeService } from '../services/snaptrade.js';
import { sendPushNotification, notificationTemplates } from '../services/notifications.js';

const QUEUE_NAME = 'trade-execution';

interface Evaluation {
  id: string;
  user_id: string;
  final_invest: number;
  profiles: {
    selected_asset: string;
  };
}

// Queue for scheduling trade executions
export const tradeExecutionQueue = redis
  ? new Queue(QUEUE_NAME, { connection: redis })
  : null;

// Worker to process trade executions
export const tradeExecutionWorker = redis
  ? new Worker(
      QUEUE_NAME,
      async (job) => {
        logger.info({ jobId: job.id, data: job.data }, 'Processing trade execution job');

        try {
          if (job.data.evaluationId) {
            // Single evaluation trade
            await executeEvaluationTrade(job.data.evaluationId);
          } else {
            // Batch execute all confirmed trades
            await executeAllConfirmedTrades();
          }

          logger.info({ jobId: job.id }, 'Trade execution job completed');
        } catch (error) {
          logger.error({ error, jobId: job.id }, 'Trade execution job failed');
          throw error;
        }
      },
      { connection: redis }
    )
  : null;

/**
 * Execute trade for a single evaluation
 */
async function executeEvaluationTrade(evaluationId: string): Promise<void> {
  // Get evaluation with user profile
  const { data: evaluation, error } = await supabase
    .from('evaluations')
    .select('id, user_id, final_invest, profiles(selected_asset)')
    .eq('id', evaluationId)
    .eq('status', 'confirmed')
    .single();

  if (error || !evaluation) {
    logger.warn({ evaluationId }, 'Evaluation not found or not confirmed');
    return;
  }

  const evalWithProfile = evaluation as unknown as Evaluation;

  await executeTrade(evalWithProfile);
}

/**
 * Execute all confirmed trades
 */
async function executeAllConfirmedTrades(): Promise<void> {
  logger.info('Starting batch trade execution');

  // Get all confirmed evaluations that haven't been executed
  const { data: evaluations, error } = await supabase
    .from('evaluations')
    .select('id, user_id, final_invest, profiles(selected_asset)')
    .eq('status', 'confirmed')
    .gt('final_invest', 0);

  if (error) {
    logger.error({ error }, 'Failed to fetch confirmed evaluations');
    throw error;
  }

  if (!evaluations || evaluations.length === 0) {
    logger.info('No confirmed evaluations to execute');
    return;
  }

  logger.info({ count: evaluations.length }, 'Executing confirmed trades');

  let successCount = 0;
  let errorCount = 0;

  for (const evaluation of evaluations) {
    try {
      await executeTrade(evaluation as unknown as Evaluation);
      successCount++;
    } catch (err) {
      errorCount++;
      logger.error(
        { error: err, evaluationId: evaluation.id },
        'Failed to execute trade'
      );
    }
  }

  logger.info({ successCount, errorCount }, 'Completed batch trade execution');
}

/**
 * Execute a single trade
 */
async function executeTrade(evaluation: Evaluation): Promise<void> {
  const { id: evaluationId, user_id: userId, final_invest, profiles } = evaluation;
  const symbol = profiles?.selected_asset || 'VTI';

  logger.info(
    { evaluationId, userId, amount: final_invest, symbol },
    'Executing trade'
  );

  // Create pending order record
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      evaluation_id: evaluationId,
      symbol,
      amount_dollars: final_invest,
      status: 'pending',
    })
    .select()
    .single();

  if (orderError || !order) {
    logger.error({ error: orderError, evaluationId }, 'Failed to create order record');
    throw new Error('Failed to create order record');
  }

  try {
    // Place the trade
    const result = await snaptradeService.placeOrder({
      userId,
      symbol,
      amountDollars: final_invest,
    });

    // Update order with SnapTrade details
    await supabase
      .from('orders')
      .update({
        snaptrade_order_id: result.orderId,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    // Update evaluation status
    await supabase
      .from('evaluations')
      .update({ status: 'executed' })
      .eq('id', evaluationId);

    logger.info(
      { evaluationId, orderId: order.id, snaptradeOrderId: result.orderId },
      'Trade submitted successfully'
    );

    // Send push notification
    await sendPushNotification(
      userId,
      'order_submitted',
      notificationTemplates.orderSubmitted(final_invest, symbol)
    );
  } catch (err) {
    // Update order with error
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    await supabase
      .from('orders')
      .update({
        status: 'failed',
        error_message: errorMessage,
      })
      .eq('id', order.id);

    logger.error({ error: err, evaluationId, orderId: order.id }, 'Trade execution failed');

    // Send push notification about failure
    await sendPushNotification(
      userId,
      'order_failed',
      notificationTemplates.orderFailed()
    );

    throw err;
  }
}

/**
 * Schedule the trade execution cron job
 * Runs every Monday at 9:35 AM ET (14:35 UTC)
 */
export async function scheduleTradeExecution(): Promise<void> {
  if (!tradeExecutionQueue) {
    logger.warn('Trade execution queue not available - Redis not configured');
    return;
  }

  // Remove any existing repeatable jobs
  const repeatableJobs = await tradeExecutionQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    await tradeExecutionQueue.removeRepeatableByKey(job.key);
  }

  // Schedule new weekly job (Monday after market open)
  await tradeExecutionQueue.add(
    'weekly-trades',
    {},
    {
      repeat: {
        pattern: '35 14 * * 1', // Monday at 9:35 AM ET (14:35 UTC)
      },
      removeOnComplete: 100,
      removeOnFail: 50,
    }
  );

  logger.info('Scheduled trade execution cron job');
}

/**
 * Trigger trade execution for a specific evaluation (for testing)
 */
export async function triggerEvaluationTrade(evaluationId: string): Promise<void> {
  if (!tradeExecutionQueue) {
    // Run directly if no queue
    await executeEvaluationTrade(evaluationId);
    return;
  }

  await tradeExecutionQueue.add(
    'single-trade',
    { evaluationId },
    {
      removeOnComplete: true,
      removeOnFail: true,
    }
  );
}
