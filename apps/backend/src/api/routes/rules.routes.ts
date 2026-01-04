import { Router } from 'express';
import { supabase } from '../../lib/supabase.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { createRuleSchema, updateRuleSchema } from '@owninstead/shared';
import { AppError } from '../middleware/errorHandler.js';
import { ERROR_CODES } from '@owninstead/shared';

export const rulesRoutes = Router();

// All routes require authentication
rulesRoutes.use(authMiddleware);

// List rules
rulesRoutes.get('/', async (req, res, next) => {
  try {
    const { userId } = req as AuthenticatedRequest;

    const { data: rules, error } = await supabase
      .from('rules')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError(ERROR_CODES.INTERNAL_ERROR, 500, error.message);
    }

    res.json({
      success: true,
      data: rules,
    });
  } catch (error) {
    next(error);
  }
});

// Get single rule
rulesRoutes.get('/:id', async (req, res, next) => {
  try {
    const { userId } = req as unknown as AuthenticatedRequest;
    const { id } = req.params;

    const { data: rule, error } = await supabase
      .from('rules')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !rule) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 404, 'Rule not found');
    }

    res.json({
      success: true,
      data: rule,
    });
  } catch (error) {
    next(error);
  }
});

// Create rule
rulesRoutes.post('/', async (req, res, next) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const input = createRuleSchema.parse(req.body);

    const { data: rule, error } = await supabase
      .from('rules')
      .insert({
        user_id: userId,
        category: input.category,
        merchant_pattern: input.merchantPattern,
        period: input.period,
        target_spend: input.targetSpend,
        invest_type: input.investType,
        invest_amount: input.investAmount,
        streak_enabled: input.streakEnabled,
      })
      .select()
      .single();

    if (error) {
      throw new AppError(ERROR_CODES.INTERNAL_ERROR, 500, error.message);
    }

    res.status(201).json({
      success: true,
      data: rule,
    });
  } catch (error) {
    next(error);
  }
});

// Update rule
rulesRoutes.patch('/:id', async (req, res, next) => {
  try {
    const { userId } = req as unknown as AuthenticatedRequest;
    const { id } = req.params;
    const input = updateRuleSchema.parse(req.body);

    const { data: rule, error } = await supabase
      .from('rules')
      .update({
        category: input.category,
        merchant_pattern: input.merchantPattern,
        target_spend: input.targetSpend,
        invest_type: input.investType,
        invest_amount: input.investAmount,
        streak_enabled: input.streakEnabled,
        active: input.active,
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new AppError(ERROR_CODES.INTERNAL_ERROR, 500, error.message);
    }

    res.json({
      success: true,
      data: rule,
    });
  } catch (error) {
    next(error);
  }
});

// Delete rule
rulesRoutes.delete('/:id', async (req, res, next) => {
  try {
    const { userId } = req as unknown as AuthenticatedRequest;
    const { id } = req.params;

    const { error } = await supabase
      .from('rules')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new AppError(ERROR_CODES.INTERNAL_ERROR, 500, error.message);
    }

    res.json({
      success: true,
      data: { message: 'Rule deleted successfully' },
    });
  } catch (error) {
    next(error);
  }
});
