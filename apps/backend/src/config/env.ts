import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  HOST: z.string().default('0.0.0.0'),

  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_KEY: z.string().min(1),

  // Redis (optional for local dev)
  REDIS_URL: z.string().url().optional(),

  // Plaid
  PLAID_CLIENT_ID: z.string().min(1),
  PLAID_SECRET: z.string().min(1),
  PLAID_ENV: z.enum(['sandbox', 'development', 'production']).default('sandbox'),

  // SnapTrade
  SNAPTRADE_CLIENT_ID: z.string().min(1),
  SNAPTRADE_CONSUMER_KEY: z.string().min(1),

  // Security
  CORS_ORIGINS: z.string().default('http://localhost:8081'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
