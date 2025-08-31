-- Advanced Smart Feed Algorithm
-- This replaces the simple chronological ordering with a sophisticated ranking system

-- First, create a function to calculate engagement score
CREATE OR REPLACE FUNCTION calculate_engagement_score(
    like_count BIGINT,
    comment_count BIGINT,
    created_at TIMESTAMPTZ
) RETURNS NUMERIC AS $$
DECLARE
    -- Time decay factor (posts lose relevance over time)
    hours_old NUMERIC;
    time_decay NUMERIC;
    
    -- Engagement weights
    like_weight NUMERIC := 1.0;
    comment_weight NUMERIC := 3.0; -- Comments are more valuable than likes
    
    -- Base engagement score
    engagement_score NUMERIC;
    
    -- Popularity bonus for highly engaged posts
    popularity_bonus NUMERIC := 0;
BEGIN
    -- Calculate how old the post is in hours
    hours_old := EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600;
    
    -- Time decay: newer posts get higher scores
    -- After 24 hours, posts lose 50% of their time bonus
    -- After 7 days, posts lose 90% of their time bonus
    time_decay := CASE
        WHEN hours_old <= 1 THEN 2.0          -- Recent posts get 2x boost
        WHEN hours_old <= 6 THEN 1.5          -- Last 6 hours get 1.5x boost
        WHEN hours_old <= 24 THEN 1.0         -- Last day gets normal score
        WHEN hours_old <= 168 THEN 0.5        -- Last week gets 0.5x
        ELSE 0.1                               -- Older posts get minimal score
    END;
    
    -- Calculate base engagement (likes + weighted comments)
    engagement_score := (like_count * like_weight) + (comment_count * comment_weight);
    
    -- Add popularity bonus for highly engaged posts
    IF engagement_score >= 50 THEN
        popularity_bonus := 1.5;
    ELSIF engagement_score >= 20 THEN
        popularity_bonus := 1.2;
    ELSIF engagement_score >= 10 THEN
        popularity_bonus := 1.1;
    END IF;
    
    -- Final score: base engagement * time decay * popularity bonus + randomness
    RETURN (engagement_score * time_decay * (1 + popularity_bonus)) + (RANDOM() * 2);
END;
$$ LANGUAGE plpgsql;

-- Enhanced smart feed function with algorithm
CREATE OR REPLACE FUNCTION get_smart_feed_for_user(
    user_id_param TEXT DEFAULT NULL, 
    limit_param INT DEFAULT 20, 
    offset_param INT DEFAULT 0,
    creator_user_id TEXT DEFAULT NULL -- Your user ID to de-prioritize your own posts
)
RETURNS TABLE (
    id BIGINT,
    user_id TEXT,
    title TEXT,
    description TEXT,
    image_url TEXT,
    external_links JSONB,
    created_at TIMESTAMPTZ,
    username TEXT,
    bio TEXT,
    profile_image_url TEXT,
    like_count BIGINT,
    comment_count BIGINT,
    categories TEXT[],
    is_liked BOOLEAN,
    engagement_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        aws.id,
        aws.user_id,
        aws.title,
        aws.description,
        aws.image_url,
        aws.external_links,
        aws.created_at,
        aws.username,
        aws.bio,
        aws.profile_image_url,
        aws.like_count,
        aws.comment_count,
        aws.categories,
        CASE 
            WHEN user_id_param IS NOT NULL THEN EXISTS(
                SELECT 1 FROM likes l 
                WHERE l.annoyance_id = aws.id AND l.user_id = user_id_param
            )
            ELSE FALSE
        END as is_liked,
        -- Apply the smart algorithm with creator penalty
        CASE 
            WHEN creator_user_id IS NOT NULL AND aws.user_id = creator_user_id THEN
                -- Reduce score for creator's own posts (your requirement)
                calculate_engagement_score(aws.like_count, aws.comment_count, aws.created_at) * 0.1
            ELSE
                calculate_engagement_score(aws.like_count, aws.comment_count, aws.created_at)
        END as engagement_score
    FROM annoyances_with_stats aws
    ORDER BY 
        -- Primary sort: engagement score (descending)
        CASE 
            WHEN creator_user_id IS NOT NULL AND aws.user_id = creator_user_id THEN
                calculate_engagement_score(aws.like_count, aws.comment_count, aws.created_at) * 0.1
            ELSE
                calculate_engagement_score(aws.like_count, aws.comment_count, aws.created_at)
        END DESC,
        -- Secondary sort: creation time for posts with similar scores
        aws.created_at DESC
    LIMIT limit_param
    OFFSET offset_param;
END;
$$ LANGUAGE plpgsql;

-- Create an index to optimize the smart feed queries
CREATE INDEX IF NOT EXISTS idx_annoyances_engagement ON annoyances(created_at DESC, user_id);

-- Create a materialized view for better performance (optional, for high traffic)
-- This can be refreshed periodically to cache engagement calculations
CREATE MATERIALIZED VIEW IF NOT EXISTS smart_feed_cache AS
SELECT 
    aws.*,
    calculate_engagement_score(aws.like_count, aws.comment_count, aws.created_at) as engagement_score,
    EXTRACT(EPOCH FROM (NOW() - aws.created_at)) / 3600 as hours_old
FROM annoyances_with_stats aws
ORDER BY engagement_score DESC;

-- Create index on the materialized view
CREATE INDEX IF NOT EXISTS idx_smart_feed_cache_score ON smart_feed_cache(engagement_score DESC, created_at DESC);
