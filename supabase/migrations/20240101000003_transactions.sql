-- Transactions (cached from Plaid)
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plaid_transaction_id TEXT UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  merchant_name TEXT,
  category TEXT[],
  date DATE NOT NULL,
  excluded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX transactions_user_id_idx ON public.transactions(user_id);
CREATE INDEX transactions_date_idx ON public.transactions(date DESC);
CREATE INDEX transactions_plaid_id_idx ON public.transactions(plaid_transaction_id);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON public.transactions
  FOR UPDATE USING (auth.uid() = user_id);

-- Service role can insert/update (for Plaid sync)
CREATE POLICY "Service role can manage transactions" ON public.transactions
  FOR ALL USING (auth.role() = 'service_role');
