import { Redis } from 'ioredis';
import { env } from '../config/env.js';
import { logger } from './logger.js';

// Create Redis connection if REDIS_URL is configured
let redis: Redis | null = null;

if (env.REDIS_URL) {
  redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: false,
  });

  redis.on('connect', () => {
    logger.info('Connected to Redis');
  });

  redis.on('error', (err: Error) => {
    logger.error({ err }, 'Redis connection error');
  });
} else {
  logger.warn('REDIS_URL not configured - background jobs disabled');
}

export { redis };
