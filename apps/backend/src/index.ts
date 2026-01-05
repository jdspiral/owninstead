import { createServer } from './api/server.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { initializeWorkers, shutdownWorkers } from './workers/index.js';

async function main() {
  try {
    const app = createServer();

    // Initialize background workers and cron jobs
    await initializeWorkers();

    const server = app.listen(env.PORT, env.HOST, () => {
      logger.info(`Server running at http://${env.HOST}:${env.PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down...');
      await shutdownWorkers();
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();
