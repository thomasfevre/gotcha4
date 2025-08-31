import { type NextRequest, NextResponse } from "next/server"
import { verifyPrivyToken } from "@/lib/auth"
import { DatabaseService } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const userId = await verifyPrivyToken(token)

    if (!userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("image") as File

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 })
    }

    // Get current profile to check for existing image
    const currentProfile = await DatabaseService.getProfile(userId)
    
    // Upload new image
    const imageUrl = await DatabaseService.uploadProfileImage(userId, file)
    
    if (!imageUrl) {
      return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
    }

    // Update profile with new image URL
    const updatedProfile = await DatabaseService.updateProfile(userId, {
      profile_image_url: imageUrl
    })

    if (!updatedProfile) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    // Delete old image if it exists
    if (currentProfile?.profile_image_url) {
      await DatabaseService.deleteProfileImage(userId, currentProfile.profile_image_url)
    }

    return NextResponse.json({ 
      profile: updatedProfile,
      imageUrl 
    })
  } catch (error) {
    console.error("Upload profile image error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const userId = await verifyPrivyToken(token)

    if (!userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Get current profile
    const currentProfile = await DatabaseService.getProfile(userId)
    
    if (!currentProfile?.profile_image_url) {
      return NextResponse.json({ error: "No profile image to delete" }, { status: 400 })
    }

    // Delete image from storage
    const deleted = await DatabaseService.deleteProfileImage(userId, currentProfile.profile_image_url)
    
    if (!deleted) {
      return NextResponse.json({ error: "Failed to delete image" }, { status: 500 })
    }

    // Update profile to remove image URL
    const updatedProfile = await DatabaseService.updateProfile(userId, {
      profile_image_url: null
    })

    if (!updatedProfile) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    return NextResponse.json({ 
      profile: updatedProfile 
    })
  } catch (error) {
    console.error("Delete profile image error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
