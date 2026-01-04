-- Weekly evaluations
CREATE TABLE public.evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES public.rules(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  actual_spend DECIMAL(10,2) NOT NULL,
  target_spend DECIMAL(10,2) NOT NULL,
  calculated_invest DECIMAL(10,2) NOT NULL,
  final_invest DECIMAL(10,2),
  status TEXT DEFAULT 'pending',
  streak_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'skipped', 'executed'))
);

-- Indexes
CREATE INDEX evaluations_user_id_idx ON public.evaluations(user_id);
CREATE INDEX evaluations_rule_id_idx ON public.evaluations(rule_id);
CREATE INDEX evaluations_status_idx ON public.evaluations(status);
CREATE INDEX evaluations_period_idx ON public.evaluations(period_start, period_end);

-- Enable RLS
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

-- Evaluations policies
CREATE POLICY "Users can view own evaluations" ON public.evaluations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own evaluations" ON public.evaluations
  FOR UPDATE USING (auth.uid() = user_id);

-- Service role can manage
CREATE POLICY "Service role can manage evaluations" ON public.evaluations
  FOR ALL USING (auth.role() = 'service_role');

-- Updated at trigger
CREATE TRIGGER evaluations_updated_at
  BEFORE UPDATE ON public.evaluations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
