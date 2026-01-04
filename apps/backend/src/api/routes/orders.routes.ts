import { Router } from 'express';
import { supabase } from '../../lib/supabase.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { ERROR_CODES } from '@owninstead/shared';

export const ordersRoutes = Router();

// All routes require authentication
ordersRoutes.use(authMiddleware);

// List orders
ordersRoutes.get('/', async (req, res, next) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const { status, page = '1', pageSize = '20' } = req.query;

    let query = supabase
      .from('orders')
      .select(
        `
        *,
        evaluations(
          id,
          rule_id,
          period_start,
          period_end,
          rules(category)
        )
      `,
        { count: 'exact' }
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status as string);
    }

    const offset = (parseInt(page as string) - 1) * parseInt(pageSize as string);
    query = query.range(offset, offset + parseInt(pageSize as string) - 1);

    const { data: orders, error, count } = await query;

    if (error) {
      throw new AppError(ERROR_CODES.INTERNAL_ERROR, 500, error.message);
    }

    res.json({
      success: true,
      data: orders,
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

// Get single order
ordersRoutes.get('/:id', async (req, res, next) => {
  try {
    const { userId } = req as unknown as AuthenticatedRequest;
    const { id } = req.params;

    const { data: order, error } = await supabase
      .from('orders')
      .select(
        `
        *,
        evaluations(
          id,
          rule_id,
          period_start,
          period_end,
          actual_spend,
          target_spend,
          rules(category)
        )
      `
      )
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !order) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 404, 'Order not found');
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
});
