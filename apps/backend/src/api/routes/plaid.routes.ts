import { Router } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { ERROR_CODES } from '@owninstead/shared';
import { plaidService } from '../../services/plaid.js';
import { logger } from '../../lib/logger.js';

export const plaidRoutes = Router();

// All routes require authentication
plaidRoutes.use(authMiddleware);

// Generate link token
plaidRoutes.post('/link-token', async (req, res, next) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    logger.info({ userId }, 'Creating Plaid link token');

    const linkToken = await plaidService.createLinkToken(userId);

    res.json({
      success: true,
      data: { linkToken },
    });
  } catch (error: unknown) {
    const err = error as Error & { response?: { data?: unknown } };
    logger.error({
      error: err.message,
      stack: err.stack,
      plaidError: err.response?.data
    }, 'Failed to create Plaid link token');
    next(error);
  }
});

// Exchange public token
plaidRoutes.post('/exchange-token', async (req, res, next) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const { publicToken } = req.body;

    if (!publicToken) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 400, 'publicToken is required');
    }

    const result = await plaidService.exchangePublicToken(userId, publicToken);

    res.json({
      success: true,
      data: {
        itemId: result.itemId,
        institutionName: result.institutionName,
        message: 'Bank account connected successfully',
      },
    });
  } catch (error) {
    next(error);
  }
});

// Sync transactions
plaidRoutes.post('/sync', async (req, res, next) => {
  try {
    const { userId } = req as AuthenticatedRequest;

    const result = await plaidService.syncTransactions(userId);

    res.json({
      success: true,
      data: {
        synced: result.synced,
        accounts: result.accounts,
        message: 'Transactions synced successfully',
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get connection status
plaidRoutes.get('/status', async (req, res, next) => {
  try {
    const { userId } = req as AuthenticatedRequest;

    const status = await plaidService.getConnectionStatus(userId);

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
});

// Remove a connection
plaidRoutes.delete('/connections/:connectionId', async (req, res, next) => {
  try {
    const { userId } = req as unknown as AuthenticatedRequest;
    const { connectionId } = req.params;

    await plaidService.removeConnection(userId, connectionId);

    res.json({
      success: true,
      data: { message: 'Connection removed successfully' },
    });
  } catch (error) {
    next(error);
  }
});
