import { Router } from 'express';
import { supabase } from '../../lib/supabase.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { confirmEvaluationSchema } from '@owninstead/shared';
import { AppError } from '../middleware/errorHandler.js';
import { ERROR_CODES } from '@owninstead/shared';

export const evaluationsRoutes = Router();

// All routes require authentication
evaluationsRoutes.use(authMiddleware);

// List evaluations
evaluationsRoutes.get('/', async (req, res, next) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const { status, ruleId, page = '1', pageSize = '20' } = req.query;

    let query = supabase
      .from('evaluations')
      .select('*, rules(category, invest_type, invest_amount)', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status as string);
    }
    if (ruleId) {
      query = query.eq('rule_id', ruleId as string);
    }

    const offset = (parseInt(page as string) - 1) * parseInt(pageSize as string);
    query = query.range(offset, offset + parseInt(pageSize as string) - 1);

    const { data: evaluations, error, count } = await query;

    if (error) {
      throw new AppError(ERROR_CODES.INTERNAL_ERROR, 500, error.message);
    }

    res.json({
      success: true,
      data: evaluations,
      meta: {
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / parseInt(pageSize as string)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get current week's evaluation
evaluationsRoutes.get('/current', async (req, res, next) => {
  try {
    const { userId } = req as AuthenticatedRequest;

    const { data: evaluation, error } = await supabase
      .from('evaluations')
      .select('*, rules(category, invest_type, invest_amount)')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new AppError(ERROR_CODES.INTERNAL_ERROR, 500, error.message);
    }

    res.json({
      success: true,
      data: evaluation || null,
    });
  } catch (error) {
    next(error);
  }
});

// Confirm evaluation
evaluationsRoutes.post('/:id/confirm', async (req, res, next) => {
  try {
    const { userId } = req as unknown as AuthenticatedRequest;
    const { id } = req.params;
    const input = confirmEvaluationSchema.parse(req.body);

    // If there are excluded transactions, recalculate
    if (input.excludedTransactionIds?.length) {
      // TODO: Recalculate investment amount based on excluded transactions
    }

    const { data: evaluation, error } = await supabase
      .from('evaluations')
      .update({ status: 'confirmed' })
      .eq('id', id)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .select()
      .single();

    if (error) {
      throw new AppError(ERROR_CODES.INTERNAL_ERROR, 500, error.message);
    }

    res.json({
      success: true,
      data: evaluation,
    });
  } catch (error) {
    next(error);
  }
});

// Skip evaluation
evaluationsRoutes.post('/:id/skip', async (req, res, next) => {
  try {
    const { userId } = req as unknown as AuthenticatedRequest;
    const { id } = req.params;

    const { data: evaluation, error } = await supabase
      .from('evaluations')
      .update({ status: 'skipped' })
      .eq('id', id)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .select()
      .single();

    if (error) {
      throw new AppError(ERROR_CODES.INTERNAL_ERROR, 500, error.message);
    }

    res.json({
      success: true,
      data: evaluation,
    });
  } catch (error) {
    next(error);
  }
});
