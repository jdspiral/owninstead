-- Add first_trade_confirmed column to profiles
ALTER TABLE public.profiles
ADD COLUMN first_trade_confirmed BOOLEAN DEFAULT FALSE;

-- Add comment explaining the column
COMMENT ON COLUMN public.profiles.first_trade_confirmed IS 'Whether the user has explicitly confirmed their first trade';
