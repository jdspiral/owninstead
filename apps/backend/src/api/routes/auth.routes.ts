import { Router } from 'express';
import { supabase } from '../../lib/supabase.js';
import { loginSchema, registerSchema } from '@owninstead/shared';
import { AppError } from '../middleware/errorHandler.js';
import { ERROR_CODES } from '@owninstead/shared';
import { env } from '../../config/env.js';

export const authRoutes = Router();

// DEV ONLY: Generate test token for a user (bypasses email confirmation)
if (env.NODE_ENV === 'development') {
  authRoutes.post('/dev-token', async (req, res, next) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        throw new AppError(ERROR_CODES.VALIDATION_ERROR, 400, 'userId required');
      }

      // Use admin API to generate session
      const { data, error } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: `${userId}@test.local`,
      });

      if (error) {
        // Fallback: Return a mock token that the auth middleware will accept
        // This only works in dev mode
        throw new AppError(ERROR_CODES.INTERNAL_ERROR, 500, error.message);
      }

      res.json({
        success: true,
        data: { token: data.properties?.hashed_token },
      });
    } catch (error) {
      next(error);
    }
  });
}

// Register
authRoutes.post('/register', async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);

    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
    });

    if (error) {
      throw new AppError(ERROR_CODES.AUTH_INVALID_CREDENTIALS, 400, error.message);
    }

    res.json({
      success: true,
      data: {
        user: data.user,
        session: data.session,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Login
authRoutes.post('/login', async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) {
      throw new AppError(ERROR_CODES.AUTH_INVALID_CREDENTIALS, 401, error.message);
    }

    res.json({
      success: true,
      data: {
        user: data.user,
        session: data.session,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Logout
authRoutes.post('/logout', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      // Supabase handles token invalidation
    }

    res.json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  } catch (error) {
    next(error);
  }
});

// Refresh token
authRoutes.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError(ERROR_CODES.AUTH_UNAUTHORIZED, 401, 'Refresh token required');
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      throw new AppError(ERROR_CODES.AUTH_TOKEN_EXPIRED, 401, error.message);
    }

    res.json({
      success: true,
      data: {
        session: data.session,
      },
    });
  } catch (error) {
    next(error);
  }
});
