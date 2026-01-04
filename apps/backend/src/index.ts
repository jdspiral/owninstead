import { createServer } from './api/server.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';

async function main() {
  try {
    const app = createServer();

    app.listen(env.PORT, env.HOST, () => {
      logger.info(`Server running at http://${env.HOST}:${env.PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();
