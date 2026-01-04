import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from '../config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { routes } from './routes/index.js';
import { logger } from '../lib/logger.js';

export function createServer() {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGINS.split(','),
      credentials: true,
    })
  );

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use((req, _res, next) => {
    logger.debug(`${req.method} ${req.path}`);
    next();
  });

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes
  app.use('/api/v1', routes);

  // Error handling
  app.use(errorHandler);

  return app;
}
