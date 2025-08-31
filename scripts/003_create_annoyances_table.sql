-- Create annoyances table for user posts
CREATE TABLE IF NOT EXISTS annoyances (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT, -- Optional URL for an uploaded image
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_annoyances_user_id ON annoyances(user_id);
CREATE INDEX IF NOT EXISTS idx_annoyances_created_at ON annoyances(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_annoyances_title ON annoyances USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_annoyances_description ON annoyances USING gin(to_tsvector('english', description));
