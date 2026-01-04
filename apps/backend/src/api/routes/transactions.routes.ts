import { Router } from 'express';
import { supabase } from '../../lib/supabase.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { updateTransactionSchema } from '@owninstead/shared';
import { AppError } from '../middleware/errorHandler.js';
import { ERROR_CODES } from '@owninstead/shared';

export const transactionsRoutes = Router();

// All routes require authentication
transactionsRoutes.use(authMiddleware);

// List transactions
transactionsRoutes.get('/', async (req, res, next) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const { startDate, endDate, category: _category, excluded, page = '1', pageSize = '50' } = req.query;

    let query = supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (startDate) {
      query = query.gte('date', startDate as string);
    }
    if (endDate) {
      query = query.lte('date', endDate as string);
    }
    if (excluded !== undefined) {
      query = query.eq('excluded', excluded === 'true');
    }

    const offset = (parseInt(page as string) - 1) * parseInt(pageSize as string);
    query = query.range(offset, offset + parseInt(pageSize as string) - 1);

    const { data: transactions, error, count } = await query;

    if (error) {
      throw new AppError(ERROR_CODES.INTERNAL_ERROR, 500, error.message);
    }

    res.json({
      success: true,
      data: transactions,
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

// Update transaction (exclude/include)
transactionsRoutes.patch('/:id', async (req, res, next) => {
  try {
    const { userId } = req as unknown as AuthenticatedRequest;
    const { id } = req.params;
    const input = updateTransactionSchema.parse(req.body);

    const { data: transaction, error } = await supabase
      .from('transactions')
      .update({ excluded: input.excluded })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new AppError(ERROR_CODES.INTERNAL_ERROR, 500, error.message);
    }

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
});
