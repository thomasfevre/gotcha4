-- Fix function overloading conflict for delete_user_account
-- Drop all versions of the function and recreate it with the correct signature

-- Drop all overloaded versions of the function
DROP FUNCTION IF EXISTS delete_user_account(TEXT);
DROP FUNCTION IF EXISTS delete_user_account(UUID);
DROP FUNCTION IF EXISTS delete_user_account;

-- Recreate the function with the correct TEXT parameter type
CREATE OR REPLACE FUNCTION delete_user_account(user_id_param TEXT)
RETURNS JSONB AS $$
DECLARE
  deleted_annoyances_count INTEGER := 0;
  deleted_comments_count INTEGER := 0;
  deleted_likes_count INTEGER := 0;
BEGIN
  -- Start transaction
  BEGIN
    -- Create deleted_user placeholder if it doesn't exist
    INSERT INTO profiles (id, username, bio, created_at)
    VALUES ('deleted_user', '[deleted]', 'This user has deleted their account', NOW())
    ON CONFLICT (id) DO NOTHING;
    
    -- Count and update user's posts (keep content but remove personal connection)
    SELECT COUNT(*) INTO deleted_annoyances_count
    FROM annoyances 
    WHERE user_id = user_id_param;
    
    UPDATE annoyances 
    SET 
      user_id = 'deleted_user',
    WHERE user_id = user_id_param;
    
    -- Count and update user's comments
    SELECT COUNT(*) INTO deleted_comments_count
    FROM comments 
    WHERE user_id = user_id_param;
    
    UPDATE comments 
    SET 
      user_id = 'deleted_user',
    WHERE user_id = user_id_param;
    
    -- Count and remove user's likes (personal preference data)
    SELECT COUNT(*) INTO deleted_likes_count
    FROM likes 
    WHERE user_id = user_id_param;
    
    DELETE FROM likes WHERE user_id = user_id_param;
    
    -- Remove user's profile data
    DELETE FROM profiles WHERE id = user_id_param;
    
    -- Log the deletion for audit purposes (create table if not exists)
    CREATE TABLE IF NOT EXISTS user_deletions (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      deletion_type TEXT DEFAULT 'user_requested',
      deleted_annoyances INTEGER DEFAULT 0,
      deleted_comments INTEGER DEFAULT 0,
      deleted_likes INTEGER DEFAULT 0
    );
    
    INSERT INTO user_deletions (user_id, deleted_at, deletion_type, deleted_annoyances, deleted_comments, deleted_likes)
    VALUES (user_id_param, NOW(), 'user_requested', deleted_annoyances_count, deleted_comments_count, deleted_likes_count);
    
  EXCEPTION WHEN OTHERS THEN
    -- Rollback on error
    RAISE EXCEPTION 'Account deletion failed: %', SQLERRM;
  END;
  
  -- Return success with counts
  RETURN jsonb_build_object(
    'success', true,
    'deleted_annoyances', deleted_annoyances_count,
    'deleted_comments', deleted_comments_count,
    'deleted_likes', deleted_likes_count,
    'message', 'Account successfully deleted'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
