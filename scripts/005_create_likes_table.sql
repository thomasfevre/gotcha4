-- Create likes table for user likes on annoyances
CREATE TABLE IF NOT EXISTS likes (
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    annoyance_id BIGINT NOT NULL REFERENCES annoyances(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, annoyance_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_likes_annoyance_id ON likes(annoyance_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON likes(created_at DESC);
