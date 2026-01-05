-- Fix RLS policies for service role to allow INSERT operations
-- The USING clause only applies to SELECT/UPDATE/DELETE
-- INSERT requires WITH CHECK clause

-- Drop and recreate plaid_connections policy
DROP POLICY IF EXISTS "Service role can manage plaid connections" ON public.plaid_connections;
CREATE POLICY "Service role can manage plaid connections" ON public.plaid_connections
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Drop and recreate snaptrade_connections policy
DROP POLICY IF EXISTS "Service role can manage snaptrade connections" ON public.snaptrade_connections;
CREATE POLICY "Service role can manage snaptrade connections" ON public.snaptrade_connections
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Also fix profiles, rules, transactions, evaluations, orders tables if they have similar issues
DROP POLICY IF EXISTS "Service role can manage profiles" ON public.profiles;
CREATE POLICY "Service role can manage profiles" ON public.profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage rules" ON public.rules;
CREATE POLICY "Service role can manage rules" ON public.rules
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage transactions" ON public.transactions;
CREATE POLICY "Service role can manage transactions" ON public.transactions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage evaluations" ON public.evaluations;
CREATE POLICY "Service role can manage evaluations" ON public.evaluations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage orders" ON public.orders;
CREATE POLICY "Service role can manage orders" ON public.orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
