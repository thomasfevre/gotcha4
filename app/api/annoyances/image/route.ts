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

    // Upload image
    const imageUrl = await DatabaseService.uploadAnnoyanceImage(userId, file)
    
    if (!imageUrl) {
      return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
    }

    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error("Upload annoyance image error:", error)
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

    const { imageUrl, annoyanceId } = await request.json()

    if (!imageUrl) {
      return NextResponse.json({ error: "No image URL provided" }, { status: 400 })
    }

    // Delete image from storage
    const deleted = await DatabaseService.deleteAnnoyanceImage(imageUrl)
    
    if (!deleted) {
      return NextResponse.json({ error: "Failed to delete image" }, { status: 500 })
    }

    // If annoyanceId is provided, also clear the image_url from the database
    if (annoyanceId) {
      const updated = await DatabaseService.clearAnnoyanceImage(userId, annoyanceId)
      if (!updated) {
        console.error("Failed to clear image_url from annoyance record")
        // Don't fail the request since storage deletion succeeded
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete annoyance image error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
