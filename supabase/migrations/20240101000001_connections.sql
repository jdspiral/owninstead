-- Plaid connections
CREATE TABLE public.plaid_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  item_id TEXT NOT NULL,
  institution_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ,
  UNIQUE(user_id, item_id)
);

-- Index for user queries
CREATE INDEX plaid_connections_user_id_idx ON public.plaid_connections(user_id);

-- Enable RLS
ALTER TABLE public.plaid_connections ENABLE ROW LEVEL SECURITY;

-- Plaid policies (only backend service role can access)
CREATE POLICY "Service role can manage plaid connections" ON public.plaid_connections
  FOR ALL USING (auth.role() = 'service_role');

-- Users can view their own connections (limited fields)
CREATE POLICY "Users can view own plaid connections" ON public.plaid_connections
  FOR SELECT USING (auth.uid() = user_id);


-- SnapTrade connections
CREATE TABLE public.snaptrade_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  snaptrade_user_id TEXT NOT NULL,
  snaptrade_user_secret TEXT NOT NULL,
  account_id TEXT,
  brokerage_name TEXT,
  supports_notional BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index for user queries
CREATE INDEX snaptrade_connections_user_id_idx ON public.snaptrade_connections(user_id);

-- Enable RLS
ALTER TABLE public.snaptrade_connections ENABLE ROW LEVEL SECURITY;

-- SnapTrade policies (only backend service role can access)
CREATE POLICY "Service role can manage snaptrade connections" ON public.snaptrade_connections
  FOR ALL USING (auth.role() = 'service_role');

-- Users can view their own connections (limited fields)
CREATE POLICY "Users can view own snaptrade connections" ON public.snaptrade_connections
  FOR SELECT USING (auth.uid() = user_id);
