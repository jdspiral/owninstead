import { Request, Response, NextFunction } from 'express';
import { supabase } from '../../lib/supabase.js';
import { AppError } from './errorHandler.js';
import { ERROR_CODES } from '@owninstead/shared';
import { env } from '../../config/env.js';

export interface AuthenticatedRequest extends Request {
  userId: string;
  userEmail: string;
}

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    // DEV ONLY: Allow direct user ID for testing
    if (env.NODE_ENV === 'development' && authHeader?.startsWith('DevUser ')) {
      const userId = authHeader.substring(8);
      (req as AuthenticatedRequest).userId = userId;
      (req as AuthenticatedRequest).userEmail = 'dev@test.local';
      return next();
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(ERROR_CODES.AUTH_UNAUTHORIZED, 401, 'Missing authorization header');
    }

    const token = authHeader.substring(7);

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new AppError(ERROR_CODES.AUTH_UNAUTHORIZED, 401, 'Invalid or expired token');
    }

    (req as AuthenticatedRequest).userId = user.id;
    (req as AuthenticatedRequest).userEmail = user.email || '';

    next();
  } catch (error) {
    next(error);
  }
}
