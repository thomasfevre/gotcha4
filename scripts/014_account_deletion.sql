-- Create account deletion function for soft delete with anonymization
CREATE OR REPLACE FUNCTION delete_user_account(user_id_param TEXT)
RETURNS VOID AS $$
BEGIN
  -- Start transaction
  BEGIN
    -- Create deleted_user placeholder if it doesn't exist
    INSERT INTO profiles (id, username, bio, created_at)
    VALUES ('deleted_user', '[deleted]', 'This user has deleted their account', NOW())
    ON CONFLICT (id) DO NOTHING;
    
    -- 1. Anonymize user's posts (keep content but remove personal connection)
    UPDATE annoyances 
    SET 
      user_id = 'deleted_user',
      updated_at = NOW()
    WHERE user_id = user_id_param;
    
    -- 2. Anonymize user's comments
    UPDATE comments 
    SET 
      user_id = 'deleted_user',
      updated_at = NOW()
    WHERE user_id = user_id_param;
    
    -- 3. Remove user's likes (personal preference data)
    DELETE FROM likes WHERE user_id = user_id_param;
    
    -- 4. Remove user's profile image from storage if exists
    -- Note: The actual file cleanup will be handled by the API
    
    -- 5. Remove user's profile data
    DELETE FROM profiles WHERE id = user_id_param;
    
    -- 6. Log the deletion for audit purposes
    INSERT INTO user_deletions (user_id, deleted_at, deletion_type)
    VALUES (user_id_param, NOW(), 'user_requested');
    
  EXCEPTION WHEN OTHERS THEN
    -- Rollback on error
    RAISE EXCEPTION 'Account deletion failed: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql;

-- Create audit table for deletions
CREATE TABLE IF NOT EXISTS user_deletions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deletion_type TEXT NOT NULL, -- 'user_requested', 'admin_action', 'gdpr_compliance'
  notes TEXT
);

-- Add index for audit queries
CREATE INDEX IF NOT EXISTS idx_user_deletions_user_id ON user_deletions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_deletions_deleted_at ON user_deletions(deleted_at);
