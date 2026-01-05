-- Add push_token column to profiles
ALTER TABLE public.profiles
ADD COLUMN push_token TEXT,
ADD COLUMN push_token_updated_at TIMESTAMPTZ;

-- Create index for finding users by push token
CREATE INDEX idx_profiles_push_token ON public.profiles(push_token) WHERE push_token IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.profiles.push_token IS 'Expo push notification token';
