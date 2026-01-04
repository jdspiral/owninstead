-- Trade orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  evaluation_id UUID REFERENCES public.evaluations(id) ON DELETE SET NULL,
  snaptrade_order_id TEXT,
  symbol TEXT NOT NULL,
  amount_dollars DECIMAL(10,2) NOT NULL,
  shares DECIMAL(12,6),
  order_type TEXT DEFAULT 'market',
  status TEXT DEFAULT 'pending',
  submitted_at TIMESTAMPTZ,
  filled_at TIMESTAMPTZ,
  filled_price DECIMAL(10,4),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_order_status CHECK (status IN ('pending', 'submitted', 'filled', 'failed'))
);

-- Indexes
CREATE INDEX orders_user_id_idx ON public.orders(user_id);
CREATE INDEX orders_evaluation_id_idx ON public.orders(evaluation_id);
CREATE INDEX orders_status_idx ON public.orders(status);
CREATE INDEX orders_snaptrade_id_idx ON public.orders(snaptrade_order_id);
CREATE INDEX orders_created_at_idx ON public.orders(created_at DESC);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Orders policies
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage
CREATE POLICY "Service role can manage orders" ON public.orders
  FOR ALL USING (auth.role() = 'service_role');

-- Updated at trigger
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
