import { Request, Response, NextFunction } from 'express';
import { supabase } from '../../lib/supabase.js';
import { AppError } from './errorHandler.js';
import { ERROR_CODES } from '@owninstead/shared';

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
