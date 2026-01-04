import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

// Service role client for backend operations
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Create a client with user's JWT for authenticated requests
export function createUserClient(jwt: string) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
