import { Router } from 'express';
import { supabase } from '../../lib/supabase.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { updateProfileSchema } from '@owninstead/shared';
import { AppError } from '../middleware/errorHandler.js';
import { ERROR_CODES } from '@owninstead/shared';

export const profileRoutes = Router();

// All routes require authentication
profileRoutes.use(authMiddleware);

// Get profile
profileRoutes.get('/', async (req, res, next) => {
  try {
    const { userId } = req as AuthenticatedRequest;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 404, 'Profile not found');
    }

    // Get connection status
    const { data: plaidConnections } = await supabase
      .from('plaid_connections')
      .select('id, institution_name')
      .eq('user_id', userId);

    const { data: snaptradeConnection } = await supabase
      .from('snaptrade_connections')
      .select('id, brokerage_name')
      .eq('user_id', userId)
      .single();

    // Check if user has any completed orders
    const { count: orderCount } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('status', ['submitted', 'filled']);

    res.json({
      success: true,
      data: {
        ...profile,
        plaidConnected: (plaidConnections?.length ?? 0) > 0,
        snaptradeConnected: !!snaptradeConnection,
        plaidInstitutions: plaidConnections?.map((c) => c.institution_name) ?? [],
        brokerageName: snaptradeConnection?.brokerage_name ?? null,
        hasCompletedOrders: (orderCount ?? 0) > 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update profile
profileRoutes.patch('/', async (req, res, next) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const input = updateProfileSchema.parse(req.body);

    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        selected_asset: input.selectedAsset,
        max_per_trade: input.maxPerTrade,
        max_per_month: input.maxPerMonth,
        investing_paused: input.investingPaused,
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new AppError(ERROR_CODES.INTERNAL_ERROR, 500, error.message);
    }

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
});

// Complete onboarding
profileRoutes.post('/complete-onboarding', async (req, res, next) => {
  try {
    const { userId } = req as AuthenticatedRequest;

    const { data: profile, error } = await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new AppError(ERROR_CODES.INTERNAL_ERROR, 500, error.message);
    }

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
});

// Confirm first trade
profileRoutes.post('/confirm-first-trade', async (req, res, next) => {
  try {
    const { userId } = req as AuthenticatedRequest;

    const { data: profile, error } = await supabase
      .from('profiles')
      .update({ first_trade_confirmed: true })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new AppError(ERROR_CODES.INTERNAL_ERROR, 500, error.message);
    }

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
});
