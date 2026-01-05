import { Redis } from 'ioredis';
import { env } from '../config/env.js';
import { logger } from './logger.js';

// Create Redis connection if REDIS_URL is configured
let redis: Redis | null = null;

if (env.REDIS_URL) {
  try {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null, // Required for BullMQ
      enableReadyCheck: false,
      lazyConnect: true, // Don't connect immediately
      retryStrategy: (times) => {
        if (times > 3) {
          logger.warn('Redis connection failed after 3 attempts - disabling background jobs');
          return null; // Stop retrying
        }
        return Math.min(times * 200, 1000);
      },
    });

    redis.on('connect', () => {
      logger.info('Connected to Redis');
    });

    redis.on('error', (err: Error) => {
      logger.error({ err }, 'Redis connection error');
    });

    // Try to connect, but don't crash if it fails
    redis.connect().catch((err) => {
      logger.warn({ err }, 'Failed to connect to Redis - background jobs disabled');
      redis = null;
    });
  } catch (err) {
    logger.warn({ err }, 'Failed to initialize Redis - background jobs disabled');
    redis = null;
  }
} else {
  logger.warn('REDIS_URL not configured - background jobs disabled');
}

export { redis };
