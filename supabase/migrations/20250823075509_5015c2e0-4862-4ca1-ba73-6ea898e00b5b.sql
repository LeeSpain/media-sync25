-- Add mobile-specific and onboarding fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tutorial_progress JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS mobile_preferences JSONB DEFAULT '{
  "push_notifications": true,
  "touch_gestures": true,
  "offline_mode": false
}'::jsonb,
ADD COLUMN IF NOT EXISTS accessibility_settings JSONB DEFAULT '{
  "high_contrast": false,
  "large_text": false,
  "reduced_motion": false
}'::jsonb;