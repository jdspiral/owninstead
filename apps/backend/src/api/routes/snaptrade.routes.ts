import { Router } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { ERROR_CODES } from '@owninstead/shared';

export const snaptradeRoutes = Router();

// All routes require authentication
snaptradeRoutes.use(authMiddleware);

// Get redirect URI for OAuth
snaptradeRoutes.get('/redirect-uri', async (req, res, next) => {
  try {
    const { userId: _userId } = req as AuthenticatedRequest;

    // TODO: Implement SnapTrade OAuth URL generation
    // 1. Register user with SnapTrade if not exists
    // 2. Generate login URL

    res.json({
      success: true,
      data: {
        redirectUri: 'TODO_IMPLEMENT_SNAPTRADE',
      },
    });
  } catch (error) {
    next(error);
  }
});

// Handle OAuth callback
snaptradeRoutes.post('/callback', async (req, res, next) => {
  try {
    const { userId: _userId } = req as AuthenticatedRequest;
    const { code } = req.body;

    if (!code) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 400, 'Authorization code is required');
    }

    // TODO: Implement SnapTrade callback handling
    // Store connection details in snaptrade_connections

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
    const { userId: _userId } = req as AuthenticatedRequest;

    // TODO: Implement SnapTrade account listing

    res.json({
      success: true,
      data: {
        accounts: [],
      },
    });
  } catch (error) {
    next(error);
  }
});
