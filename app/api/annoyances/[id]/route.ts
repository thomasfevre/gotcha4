import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { verifyPrivyToken } from '@/lib/auth'
import { UpdateAnnoyanceRequest, UpdateAnnoyanceSchema } from '@/lib/schemas'
import { DatabaseService } from '@/lib/database'

export async function GET(
  request: NextRequest,
  contextPromise: Promise<{ params: { id: string } }>
) {
  try {
    const { params } = await contextPromise
    const annoyanceId = parseInt(params.id)
    
    if (isNaN(annoyanceId)) {
      return NextResponse.json({ error: 'Invalid annoyance ID' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    
    // Check if user is authenticated for like status
    let userId: string | null = null
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      userId = await verifyPrivyToken(token)
    }
    
    // Get the annoyance with all related data
    const { data: annoyance, error } = await supabase
      .from('annoyances')
      .select(`
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
      `)
      .eq('id', annoyanceId)
      .single()

    if (error) {
      console.log("annoyance id", annoyanceId)
      console.error('Error fetching annoyance:', error)
      return NextResponse.json({ error: 'Annoyance not found' }, { status: 404 })
    }

    if (!annoyance) {
      return NextResponse.json({ error: 'Annoyance not found' }, { status: 404 })
    }

    // Check if user liked this annoyance (only if authenticated)
    let isLiked = false
    if (userId) {
      const { data: likeData } = await supabase
        .from('likes')
        .select('id')
        .eq('annoyance_id', annoyanceId)
        .eq('user_id', userId)
        .single()
      
      isLiked = !!likeData
    }

    // Transform the data to match our schema
    const transformedAnnoyance = {
      ...annoyance,
      user: annoyance.profiles,
      categories: annoyance.categories?.map((cat: any) => cat.category) || [],
      like_count: annoyance.like_count?.[0]?.count || 0,
      comment_count: annoyance.comment_count?.[0]?.count || 0,
      is_liked: isLiked
    }

    return NextResponse.json({ annoyance: transformedAnnoyance })
  } catch (error) {
    console.error('Error in GET /api/annoyances/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  contextPromise: Promise<{ params: { id: string } }>
) {
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

    const { params } = await contextPromise
    const annoyanceId = parseInt(params.id)
    
    if (isNaN(annoyanceId)) {
      return NextResponse.json({ error: 'Invalid annoyance ID' }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = UpdateAnnoyanceSchema.parse(body)

    const supabase = await createServerSupabaseClient()

    // Check if the annoyance exists and belongs to the user
    const { data: existingAnnoyance, error: fetchError } = await supabase
      .from('annoyances')
      .select('id, user_id, image_url')
      .eq('id', annoyanceId)
      .single()

    if (fetchError || !existingAnnoyance) {
      return NextResponse.json({ error: 'Annoyance not found' }, { status: 404 })
    }

    if (existingAnnoyance.user_id !== userId) {
      return NextResponse.json({ error: 'You can only edit your own posts' }, { status: 403 })
    }

    // If image was removed or changed, delete the old one
    if (existingAnnoyance.image_url && existingAnnoyance.image_url !== validatedData.image_url) {
      try {
        await DatabaseService.deleteAnnoyanceImage(existingAnnoyance.image_url)
      } catch (error) {
        console.error('Failed to delete old image:', error)
        // Continue with update even if image deletion fails
      }
    }

    // Update the annoyance
    const { error: updateError } = await supabase
      .from('annoyances')
      .update({
        title: validatedData.title,
        description: validatedData.description,
        image_url: validatedData.image_url,
        external_links: validatedData.external_links && validatedData.external_links.length > 0 ? validatedData.external_links : null,
        created_at: new Date().toISOString()
      })
      .eq('id', annoyanceId)

    if (updateError) {
      console.error('Error updating annoyance:', updateError)
      return NextResponse.json({ error: 'Failed to update annoyance' }, { status: 500 })
    }

    // Update categories if provided
    if (validatedData.categories && validatedData.categories.length > 0) {
      // Delete existing category associations
      await supabase
        .from('annoyance_categories')
        .delete()
        .eq('annoyance_id', annoyanceId)

      // Insert new category associations
      const categoryAssociations = validatedData.categories.map((categoryId: string) => ({
        annoyance_id: annoyanceId,
        category_id: parseInt(categoryId)
      }))

      const { error: categoryError } = await supabase
        .from('annoyance_categories')
        .insert(categoryAssociations)

      if (categoryError) {
        console.error('Error updating categories:', categoryError)
        // Don't fail the whole request for category errors
      }
    }

    return NextResponse.json({ 
      message: 'Annoyance updated successfully',
      annoyanceId 
    })
  } catch (error) {
    console.error('Error in PUT /api/annoyances/[id]:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  contextPromise: Promise<{ params: { id: string } }>
) {
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

    const { params } = await contextPromise
    const annoyanceId = parseInt(params.id)
    
    if (isNaN(annoyanceId)) {
      return NextResponse.json({ error: 'Invalid annoyance ID' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    // Check if the annoyance exists and belongs to the user
    const { data: existingAnnoyance, error: fetchError } = await supabase
      .from('annoyances')
      .select('id, user_id, image_url')
      .eq('id', annoyanceId)
      .single()

    if (fetchError || !existingAnnoyance) {
      return NextResponse.json({ error: 'Annoyance not found' }, { status: 404 })
    }

    if (existingAnnoyance.user_id !== userId) {
      return NextResponse.json({ error: 'You can only delete your own posts' }, { status: 403 })
    }

    // Delete the image from storage if it exists
    if (existingAnnoyance.image_url) {
      try {
        await DatabaseService.deleteAnnoyanceImage(existingAnnoyance.image_url)
      } catch (error) {
        console.error('Failed to delete image during annoyance deletion:', error)
        // Continue with deletion even if image cleanup fails
      }
    }

    // Delete related data first (due to foreign key constraints)
    // Delete likes
    await supabase
      .from('likes')
      .delete()
      .eq('annoyance_id', annoyanceId)

    // Delete comments
    await supabase
      .from('comments')
      .delete()
      .eq('annoyance_id', annoyanceId)

    // Delete category associations
    await supabase
      .from('annoyance_categories')
      .delete()
      .eq('annoyance_id', annoyanceId)

    // Finally, delete the annoyance
    const { error: deleteError } = await supabase
      .from('annoyances')
      .delete()
      .eq('id', annoyanceId)

    if (deleteError) {
      console.error('Error deleting annoyance:', deleteError)
      return NextResponse.json({ error: 'Failed to delete annoyance' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Annoyance deleted successfully' 
    })
  } catch (error) {
    console.error('Error in DELETE /api/annoyances/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
