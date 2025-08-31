# Smart Feed Algorithm Implementation

## Overview
The smart feed algorithm has been successfully implemented to replace the simple chronological ordering with an engagement-based ranking system that provides a better user experience.

## Features Implemented

### 1. Engagement Scoring
- **Likes Weight**: 1.0x multiplier
- **Comments Weight**: 3.0x multiplier (comments are more valuable than likes)
- **Base Score**: `(like_count * 1.0) + (comment_count * 3.0)`

### 2. Time Decay System
- **Recent Posts** (≤1 hour): 2.0x boost
- **Last 6 Hours**: 1.5x boost  
- **Last 24 Hours**: 1.0x (normal score)
- **Last Week**: 0.5x penalty
- **Older Posts**: 0.1x minimal score

### 3. Popularity Bonuses
- **50+ Engagement**: 1.5x bonus
- **20+ Engagement**: 1.2x bonus
- **10+ Engagement**: 1.1x bonus

### 4. Creator Post De-prioritization
- **Your Own Posts**: Receive 0.1x penalty (10% of normal score)
- This ensures users see diverse content rather than their own posts dominating the feed

### 5. Randomization Factor
- Adds up to 2 points of randomness to prevent the feed from becoming too predictable
- Helps surface quality content that might otherwise be buried

## Algorithm Formula
```
Final Score = (Base Engagement × Time Decay × (1 + Popularity Bonus) × Creator Penalty) + Random(0-2)
```

## Performance Optimizations

### Database Functions
- `calculate_engagement_score()`: Pure SQL function for optimal performance
- `get_smart_feed_for_user()`: Main feed function with all algorithm logic
- Proper indexing on `annoyances(created_at DESC, user_id)`

### Materialized View (Optional)
- `smart_feed_cache`: Pre-calculated engagement scores for high-traffic scenarios
- Can be refreshed periodically to cache expensive calculations

## Smart Feed Activation

### Automatic Usage
- **Main Feed**: Uses smart algorithm by default
- **Search Results**: Falls back to chronological + relevance
- **Category Filters**: Falls back to chronological within categories
- **User Profiles**: Uses chronological (user's own posts)

### API Integration
- Updated `DatabaseService.getAnnoyances()` with `useSmartFeed` parameter
- Modified `/api/annoyances` endpoint to use smart feed by default
- Backward compatible with existing search and filter functionality

## Benefits

1. **Quality Content Surfacing**: High-engagement posts get more visibility
2. **Freshness Balance**: Recent content still gets priority even with low engagement
3. **Diversity**: Your own posts don't dominate your feed
4. **Performance**: SQL-based implementation scales with database size
5. **Flexibility**: Can be toggled on/off per request

## Database Schema
- No new tables required
- Leverages existing `annoyances_with_stats` view
- Compatible with all existing RLS policies and permissions

## Migration Applied
- `012_smart_feed_algorithm.sql` has been executed in Supabase
- All functions and indexes are active
- Smart feed is now live in production

The smart feed algorithm successfully addresses the requirements:
- ✅ Default posts by you have least weight (0.1x penalty)
- ✅ Picks from most liked/recent posts with quality ranking
- ✅ Implemented directly in Supabase SQL for optimal performance
- ✅ Adds randomness to prevent predictable feeds
