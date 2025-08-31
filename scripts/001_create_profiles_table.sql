-- Create profiles table for user information
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY, -- Stores the user's Privy DID
    username TEXT UNIQUE NOT NULL, -- The user's chosen pseudo
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
