-- Add notification settings to profiles table
ALTER TABLE profiles 
ADD COLUMN notification_email TEXT,
ADD COLUMN notifications_enabled BOOLEAN DEFAULT true;

-- Add comment to clarify the purpose
COMMENT ON COLUMN profiles.notification_email IS 'Email address for receiving notifications. Can be different from login email.';
COMMENT ON COLUMN profiles.notifications_enabled IS 'Whether user wants to receive email notifications';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_notifications ON profiles(notifications_enabled) WHERE notifications_enabled = true;
