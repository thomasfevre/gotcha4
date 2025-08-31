-- Update get_annoyances_for_user function to support search and category filtering
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
