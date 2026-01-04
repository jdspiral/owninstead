import { Router } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { ERROR_CODES } from '@owninstead/shared';

export const plaidRoutes = Router();

// All routes require authentication
plaidRoutes.use(authMiddleware);

// Generate link token
plaidRoutes.post('/link-token', async (req, res, next) => {
  try {
    const { userId: _userId } = req as AuthenticatedRequest;

    // TODO: Implement Plaid link token generation
    // const plaidClient = getPlaidClient();
    // const response = await plaidClient.linkTokenCreate({...});

    res.json({
      success: true,
      data: {
        linkToken: 'TODO_IMPLEMENT_PLAID',
      },
    });
  } catch (error) {
    next(error);
  }
});

// Exchange public token
plaidRoutes.post('/exchange-token', async (req, res, next) => {
  try {
    const { userId: _userId } = req as AuthenticatedRequest;
    const { publicToken } = req.body;

    if (!publicToken) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 400, 'publicToken is required');
    }

    // TODO: Implement Plaid token exchange
    // const response = await plaidClient.itemPublicTokenExchange({ public_token: publicToken });
    // Store access_token in plaid_connections

    res.json({
      success: true,
      data: {
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
    const { userId: _userId } = req as AuthenticatedRequest;

    // TODO: Implement Plaid transaction sync
    // Fetch transactions from Plaid and store in transactions table

    res.json({
      success: true,
      data: {
        synced: 0,
        message: 'Transactions synced successfully',
      },
    });
  } catch (error) {
    next(error);
  }
});
