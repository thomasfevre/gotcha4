import { type NextRequest, NextResponse } from "next/server"
import { verifyPrivyToken } from "@/lib/auth"
import { DatabaseService } from "@/lib/database"
import { z } from "zod"

const UpdateProfileSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .optional(),
  bio: z.string().max(500).optional(),
  profile_image_url: z.string().url().optional(),
  notification_email: z.string().email().optional(),
  notifications_enabled: z.boolean().optional(),
})

export async function PATCH(request: NextRequest) {
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

    const body = await request.json()
    const parseResult = UpdateProfileSchema.safeParse(body)
    
    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid data format", details: parseResult.error.errors }, { status: 400 })
    }

    const updates = parseResult.data

    // Check if username is already taken (if updating username)
    if (updates.username) {
      const existingProfile = await DatabaseService.getProfileByUsername(updates.username)
      if (existingProfile && existingProfile.id !== userId) {
        return NextResponse.json({ error: "Username is already taken" }, { status: 409 })
      }
    }

    const updatedProfile = await DatabaseService.updateProfile(userId, updates)

    if (!updatedProfile) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    return NextResponse.json({ profile: updatedProfile })
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
