import { Router } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { ERROR_CODES } from '@owninstead/shared';
import { snaptradeService } from '../../services/snaptrade.js';

export const snaptradeRoutes = Router();

// All routes require authentication
snaptradeRoutes.use(authMiddleware);

// Get redirect URI for OAuth
snaptradeRoutes.get('/redirect-uri', async (req, res, next) => {
  try {
    const { userId } = req as AuthenticatedRequest;

    const redirectUri = await snaptradeService.getLoginUrl(userId);

    res.json({
      success: true,
      data: {
        redirectUri,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Handle OAuth callback
snaptradeRoutes.post('/callback', async (req, res, next) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const { authorizationId } = req.body;

    if (!authorizationId) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 400, 'authorizationId is required');
    }

    await snaptradeService.handleCallback(userId, authorizationId);

    res.json({
      success: true,
      data: {
        message: 'Brokerage connected successfully',
      },
    });
  } catch (error) {
    next(error);
  }
});

// List connected accounts
snaptradeRoutes.get('/accounts', async (req, res, next) => {
  try {
    const { userId } = req as AuthenticatedRequest;

    const accounts = await snaptradeService.listAccounts(userId);

    res.json({
      success: true,
      data: {
        accounts,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get connection status
snaptradeRoutes.get('/status', async (req, res, next) => {
  try {
    const { userId } = req as AuthenticatedRequest;

    const status = await snaptradeService.getConnectionStatus(userId);

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
});

// Remove connection
snaptradeRoutes.delete('/connection', async (req, res, next) => {
  try {
    const { userId } = req as AuthenticatedRequest;

    await snaptradeService.removeConnection(userId);

    res.json({
      success: true,
      data: {
        message: 'Brokerage connection removed',
      },
    });
  } catch (error) {
    next(error);
  }
});
