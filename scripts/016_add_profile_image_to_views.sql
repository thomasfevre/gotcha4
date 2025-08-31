-- Update the annoyances_with_stats view to include profile_image_url
CREATE OR REPLACE VIEW annoyances_with_stats AS
SELECT 
    a.id,
    a.user_id,
    a.title,
    a.description,
    a.image_url,
    a.external_links,
    a.created_at,
    p.username,
    p.bio,
    p.profile_image_url,
    COALESCE(like_counts.like_count, 0) as like_count,
    COALESCE(comment_counts.comment_count, 0) as comment_count,
    ARRAY_AGG(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL) as categories
FROM annoyances a
LEFT JOIN profiles p ON a.user_id = p.id
LEFT JOIN (
    SELECT annoyance_id, COUNT(*) as like_count
    FROM likes
    GROUP BY annoyance_id
) like_counts ON a.id = like_counts.annoyance_id
LEFT JOIN (
    SELECT annoyance_id, COUNT(*) as comment_count
    FROM comments
    GROUP BY annoyance_id
) comment_counts ON a.id = comment_counts.annoyance_id
LEFT JOIN annoyance_categories ac ON a.id = ac.annoyance_id
LEFT JOIN categories c ON ac.category_id = c.id
GROUP BY a.id, a.user_id, a.title, a.description, a.image_url, a.external_links, a.created_at, p.username, p.bio, p.profile_image_url, like_counts.like_count, comment_counts.comment_count
ORDER BY a.created_at DESC;

-- Update the get_annoyances_for_user function to include profile_image_url
CREATE OR REPLACE FUNCTION get_annoyances_for_user(
    user_id_param TEXT DEFAULT NULL, 
    limit_param INT DEFAULT 20, 
    offset_param INT DEFAULT 0,
    search_query TEXT DEFAULT NULL,
    category_filter TEXT[] DEFAULT NULL
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
    is_liked BOOLEAN
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
        END as is_liked
    FROM annoyances_with_stats aws
    WHERE (
        search_query IS NULL OR (
            aws.title ILIKE '%' || search_query || '%' OR
            aws.description ILIKE '%' || search_query || '%' OR
            aws.username ILIKE '%' || search_query || '%'
        )
    )
    AND (
        category_filter IS NULL OR 
        aws.categories && category_filter  -- Arrays overlap operator
    )
    ORDER BY aws.created_at DESC
    LIMIT limit_param
    OFFSET offset_param;
END;
$$ LANGUAGE plpgsql;

-- Update the smart feed function to include profile_image_url
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
