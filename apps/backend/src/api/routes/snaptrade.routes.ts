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

// Sync accounts (refresh account_id from SnapTrade)
snaptradeRoutes.post('/sync', async (req, res, next) => {
  try {
    const { userId } = req as AuthenticatedRequest;

    await snaptradeService.handleCallback(userId, '');

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

// Search for tradeable symbols (ETFs only)
snaptradeRoutes.get('/symbols/search', async (req, res, next) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const { q } = req.query;

    if (!q || typeof q !== 'string' || q.length < 1) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 400, 'Search query is required');
    }

    const symbols = await snaptradeService.searchSymbols(userId, q);

    res.json({
      success: true,
      data: {
        symbols,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Check if a symbol is available on user's brokerage
snaptradeRoutes.get('/symbols/:symbol/available', async (req, res, next) => {
  try {
    const { userId } = req as unknown as AuthenticatedRequest;
    const { symbol } = req.params;

    const available = await snaptradeService.isSymbolAvailable(userId, symbol);

    res.json({
      success: true,
      data: {
        symbol,
        available,
      },
    });
  } catch (error) {
    next(error);
  }
});
