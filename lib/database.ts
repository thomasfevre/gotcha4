import { createServerSupabaseClient, createServiceRoleClient } from "./supabase"
import type { Annoyance, Comment, Profile, ExternalLink } from "./schemas"

// Database utility functions
export class DatabaseService {
  private static async getClient() {
    return await createServerSupabaseClient()
  }

  // Public method for webhook access
  static async getSupabaseClient() {
    return await createServerSupabaseClient()
  }

  // Profile operations
  static async getProfile(userId: string): Promise<Profile | null> {
    const supabase = await this.getClient()
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (error) {
      console.error("Error fetching profile:", error)
      return null
    }

    return data
  }

  static async getProfileByUsername(username: string): Promise<Profile | null> {
    const supabase = await this.getClient()
    const { data, error } = await supabase.from("profiles").select("*").eq("username", username).single()

    if (error) {
      console.error("Error fetching profile by username:", error)
      return null
    }

    return data
  }

  static async createProfile(userId: string, username: string, bio?: string): Promise<Profile | null> {
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        username: username,
        bio: bio,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating profile:", error)
      return null
    }

    return data
  }

  static async updateProfile(userId: string, updates: { 
    username?: string; 
    bio?: string; 
    profile_image_url?: string | null;
    notification_email?: string;
    notifications_enabled?: boolean;
  }): Promise<Profile | null> {
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single()

    if (error) {
      console.error("Error updating profile:", error)
      return null
    }

    return data
  }

  // Profile image operations
  static async uploadProfileImage(userId: string, file: File): Promise<string | null> {
    const supabase = createServiceRoleClient()
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `profile-images/${fileName}`

    // Upload file to Supabase storage
    const { data, error } = await supabase.storage
      .from('profile-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (error) {
      console.error("Error uploading profile image:", error)
      return null
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('profile-images')
      .getPublicUrl(filePath)

    return urlData.publicUrl
  }

  static async deleteProfileImage(userId: string, imageUrl: string): Promise<boolean> {
    const supabase = createServiceRoleClient()
    
    try {
      // Extract file path from URL
      const url = new URL(imageUrl)
      const pathSegments = url.pathname.split('/')
      const filePath = pathSegments.slice(-2).join('/') // Get "profile-images/filename"

      const { error } = await supabase.storage
        .from('profile-images')
        .remove([filePath])

      if (error) {
        console.error("Error deleting profile image:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Error parsing image URL:", error)
      return false
    }
  }

  // Annoyance image operations
  static async uploadAnnoyanceImage(userId: string, file: File): Promise<string | null> {
    const supabase = createServiceRoleClient()
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `annoyance-images/${fileName}`

    // Upload file to Supabase storage
    const { data, error } = await supabase.storage
      .from('annoyance-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (error) {
      console.error("Error uploading annoyance image:", error)
      return null
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('annoyance-images')
      .getPublicUrl(filePath)

    return urlData.publicUrl
  }

  static async deleteAnnoyanceImage(imageUrl: string): Promise<boolean> {
    const supabase = createServiceRoleClient()
    
    try {
      // Extract file path from URL
      const url = new URL(imageUrl)
      const pathSegments = url.pathname.split('/')
      const filePath = pathSegments.slice(-2).join('/') // Get "annoyance-images/filename"

      const { error } = await supabase.storage
        .from('annoyance-images')
        .remove([filePath])

      if (error) {
        console.error("Error deleting annoyance image:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Error parsing image URL:", error)
      return false
    }
  }

  // Annoyance operations
  static async getAnnoyances(
    limit = 20,
    offset = 0,
    userId?: string,
    sort = 'default',
    searchQuery?: string,
    categories?: string[],
  ): Promise<{
    data: any[];
    hasMore: boolean;
  }> {
    const supabase = await this.getClient()
    
    try {
      let query;
      
      if (sort === 'recent') {
        // Simple recent sort - just order by created_at
        query = supabase
          .rpc('get_annoyances_for_user', {
            user_id_param: userId || null,
            limit_param: limit + 1,
            offset_param: offset,
            search_query: searchQuery || null,
            category_filter: categories || null
          });
      } else if (sort === 'default' && !searchQuery && !categories?.length) {
        // Use smart feed algorithm for the main feed
        query = supabase
          .rpc('get_smart_feed_for_user', {
            user_id_param: userId || null,
            limit_param: limit + 1, // Get one extra to check if there are more
            offset_param: offset,
            creator_user_id: userId || null // De-prioritize user's own posts
          });
      } else {
        // Use regular feed for search and category filters
        query = supabase
          .rpc('get_annoyances_for_user', {
            user_id_param: userId || null,
            limit_param: limit + 1, // Get one extra to check if there are more
            offset_param: offset,
            search_query: searchQuery || null,
            category_filter: categories || null
          });
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching annoyances:', error);
        throw new Error(`Failed to fetch annoyances: ${error.message}`);
      }
      if (!data) {
        return { data: [], hasMore: false };
      }
      const hasMore = data.length > limit;
      const annoyances = hasMore ? data.slice(0, -1) : data;

      return {
        data: annoyances,
        hasMore,
      };
    } catch (error) {
      console.error('Database error in getAnnoyances:', error);
      throw error;
    }
  }

  static async getAnnoyancesByUserId(authorUserId: string, viewerUserId?: string, limit = 20, offset = 0): Promise<Annoyance[]> {
    const supabase = await this.getClient()
    
    // Get annoyances for a specific user
    const { data, error } = await supabase
      .from("annoyances_with_stats")
      .select("*")
      .eq("user_id", authorUserId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching user annoyances:", error)
      return []
    }

    // Add is_liked status if viewer is authenticated
    if (viewerUserId && data) {
      const annoyanceIds = data.map(a => a.id)
      const { data: likes } = await supabase
        .from("likes")
        .select("annoyance_id")
        .eq("user_id", viewerUserId)
        .in("annoyance_id", annoyanceIds)

      const likedIds = new Set(likes?.map(l => l.annoyance_id) || [])
      
      return data.map(annoyance => ({
        ...annoyance,
        is_liked: likedIds.has(annoyance.id)
      }))
    }

    return data?.map(annoyance => ({ ...annoyance, is_liked: false })) || []
  }

  static async createAnnoyance(
    userId: string,
    title: string,
    description: string,
    imageUrl?: string | null,
    externalLinks?: ExternalLink[] | null,
    categoryIds?: number[],
  ): Promise<Annoyance | null> {
    const supabase = await this.getClient()

    // Create the annoyance
    const { data: annoyance, error: annoyanceError } = await supabase
      .from("annoyances")
      .insert({
        user_id: userId,
        title,
        description,
        image_url: imageUrl,
        external_links: externalLinks || null,
      })
      .select()
      .single()

    if (annoyanceError) {
      console.error("Error creating annoyance:", annoyanceError)
      return null
    }

    // Add categories if provided
    if (categoryIds && categoryIds.length > 0) {
      const categoryInserts = categoryIds.map((categoryId) => ({
        annoyance_id: annoyance.id,
        category_id: categoryId,
      }))

      const { error: categoryError } = await supabase.from("annoyance_categories").insert(categoryInserts)

      if (categoryError) {
        console.error("Error adding categories:", categoryError)
      }
    }

    return annoyance
  }

  // Like operations
  static async toggleLike(userId: string, annoyanceId: number): Promise<boolean> {
    const supabase = await this.getClient()

    // Check if like exists
    const { data: existingLike } = await supabase
      .from("likes")
      .select("*")
      .eq("user_id", userId)
      .eq("annoyance_id", annoyanceId)
      .single()

    if (existingLike) {
      // Remove like
      const { error } = await supabase.from("likes").delete().eq("user_id", userId).eq("annoyance_id", annoyanceId)

      if (error) {
        console.error("Error removing like:", error)
        return false
      }
      return false // Unliked
    } else {
      // Add like
      const { error } = await supabase.from("likes").insert({
        user_id: userId,
        annoyance_id: annoyanceId,
      })

      if (error) {
        console.error("Error adding like:", error)
        return false
      }
      return true // Liked
    }
  }

  // Comment operations
  static async getComments(annoyanceId: number, limit = 50, offset = 0): Promise<Comment[]> {
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .from("comments")
      .select(
        `
        *,
        profiles!inner(username)
      `,
      )
      .eq("annoyance_id", annoyanceId)
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching comments:", error)
      return []
    }

    return (
      data?.map((comment) => ({
        ...comment,
        username: comment.profiles.username,
      })) || []
    )
  }

  static async createComment(userId: string, annoyanceId: number, content: string): Promise<Comment | null> {
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .from("comments")
      .insert({
        user_id: userId,
        annoyance_id: annoyanceId,
        content,
      })
      .select(
        `
        *,
        profiles!inner(username)
      `,
      )
      .single()

    if (error) {
      console.error("Error creating comment:", error)
      return null
    }

    return {
      ...data,
      username: data.profiles.username,
    }
  }

  // Search operations
  static async searchAnnoyances(query: string, limit = 20, offset = 0): Promise<Annoyance[]> {
    const supabase = await this.getClient()
    const { data, error } = await supabase
      .from("annoyances_with_stats")
      .select("*")
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,username.ilike.%${query}%`)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error searching annoyances:", error)
      return []
    }

    return data || []
  }

  // Category operations
  static async getCategories() {
    const supabase = await this.getClient()
    const { data, error } = await supabase.from("categories").select("*").order("name")

    if (error) {
      console.error("Error fetching categories:", error)
      return []
    }

    return data || []
  }

  // Account deletion [not used]
  static async deleteUserAccount(userId: string): Promise<{
    success: boolean;
    error?: string;
    deleted_annoyances?: number;
    deleted_comments?: number;
    deleted_likes?: number;
  }> {
    const supabase = await this.getClient()
    
    try {
      // Retrieve image URLs before deletion
      const { data: profile } = await supabase
        .from("profiles")
        .select("profile_image_url")
        .eq("id", userId)
        .single()

      const { data: annoyances } = await supabase
        .from("annoyances")
        .select("image_url")
        .eq("user_id", userId)

      // Delete data via the PostgreSQL function
      const { data, error } = await supabase
        .rpc('delete_user_account', {
          user_id_param: userId
        })

      if (error) {
        console.error("Error deleting user account:", error)
        return {
          success: false,
          error: error.message
        }
      }

      // Delete images from storage after deleting user data
      if (profile?.profile_image_url) {
        await this.deleteProfileImage(userId, profile.profile_image_url)
      }

      if (annoyances) {
        for (const annoyance of annoyances) {
          if (annoyance.image_url) {
            await this.deleteAnnoyanceImage(annoyance.image_url)
          }
        }
      }

      // Return the data from the function (which now includes counts)
      return data || { success: true }
    } catch (error) {
      console.error("Database error in deleteUserAccount:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}
