import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { verifyPrivyToken } from '@/lib/auth'
import { Annoyance } from '@/lib/schemas'

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const userId = await verifyPrivyToken(token)
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = await createServerSupabaseClient()

    // Get liked annoyances for the user with pagination
    const { data: likedAnnoyances, error } = await supabase
      .from('likes')
      .select(`
        annoyance:annoyances (
          *,
          profiles:user_id (
            id,
            username,
            profile_image_url
          ),
          categories:annoyance_categories (
            category:categories (
              id,
              name
            )
          ),
          like_count:likes(count),
          comment_count:comments(count)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching liked annoyances:', error)
      return NextResponse.json({ error: 'Failed to fetch liked posts' }, { status: 500 })
    }

    // Transform the data to match our expected format
    const transformedAnnoyances = (likedAnnoyances || [])
      .filter(like => like.annoyance) // Filter out any null annoyances
      .map(like => {
          const annoyance = like.annoyance as any;
          const profile = annoyance.profiles as { username: string; profile_image_url: string | null } | undefined;
        return {
            ...annoyance,
            username: profile?.username || "Anonymous",
            profile_image_url: profile?.profile_image_url || null,
            categories: annoyance.categories?.map((cat: any) => cat.category) || [],
            like_count: annoyance.like_count?.[0]?.count || 0,
            comment_count: annoyance.comment_count?.[0]?.count || 0,
            is_liked: true, // All these posts are liked by the user
        }
      })

    return NextResponse.json({ 
      data: transformedAnnoyances,
      hasMore: transformedAnnoyances.length === limit 
    })
  } catch (error) {
    console.error('Error in GET /api/annoyances/liked:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
