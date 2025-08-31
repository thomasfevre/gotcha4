import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { verifyPrivyToken } from '@/lib/auth'

export async function DELETE(request: NextRequest) {
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

    const supabase = await createServerSupabaseClient()

    // Get user's profile image URL before deletion for cleanup
    const { data: profile } = await supabase
      .from('profiles')
      .select('profile_image_url')
      .eq('id', userId)
      .single()

    // Clean up profile image from storage if it exists
    if (profile?.profile_image_url) {
      try {
        const url = new URL(profile.profile_image_url)
        const pathSegments = url.pathname.split('/')
        const filePath = pathSegments.slice(-2).join('/') // Get "userId/filename"
        
        await supabase.storage
          .from('profile-images')
          .remove([filePath])
      } catch (error) {
        console.error('Error deleting profile image:', error)
        // Don't fail the whole deletion for image cleanup errors
      }
    }

    // Start transaction by calling the database function
    const { error: transactionError } = await supabase.rpc('delete_user_account', {
      user_id_param: userId
    })

    if (transactionError) {
      console.error('Account deletion error:', transactionError)
      return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Account successfully deleted',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error deleting account:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
