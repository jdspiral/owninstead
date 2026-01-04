import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ERROR_CODES, ERROR_MESSAGES } from '@owninstead/shared';
import { logger } from '../../lib/logger.js';

export class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message?: string
  ) {
    super(message || ERROR_MESSAGES[code] || 'An error occurred');
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error(err);

  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Validation failed',
        details: err.errors,
      },
    });
  }

  // Custom app errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  // Unknown errors
  return res.status(500).json({
    success: false,
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message:
        process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : err.message,
    },
  });
}
