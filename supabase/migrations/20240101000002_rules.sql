-- Spending rules
CREATE TABLE public.rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  merchant_pattern TEXT,
  period TEXT DEFAULT 'weekly',
  target_spend DECIMAL(10,2) NOT NULL,
  invest_type TEXT NOT NULL,
  invest_amount DECIMAL(10,2),
  streak_enabled BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_invest_type CHECK (invest_type IN ('fixed', 'difference')),
  CONSTRAINT valid_period CHECK (period IN ('weekly')),
  CONSTRAINT valid_category CHECK (category IN (
    'delivery', 'coffee', 'rideshare', 'restaurants', 'bars',
    'shopping', 'entertainment', 'subscriptions', 'custom'
  ))
);

-- Indexes
CREATE INDEX rules_user_id_idx ON public.rules(user_id);
CREATE INDEX rules_active_idx ON public.rules(active);

-- Enable RLS
ALTER TABLE public.rules ENABLE ROW LEVEL SECURITY;

-- Rules policies
CREATE POLICY "Users can view own rules" ON public.rules
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own rules" ON public.rules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rules" ON public.rules
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own rules" ON public.rules
  FOR DELETE USING (auth.uid() = user_id);

-- Updated at trigger
CREATE TRIGGER rules_updated_at
  BEFORE UPDATE ON public.rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
