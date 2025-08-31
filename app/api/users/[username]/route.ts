import { type NextRequest, NextResponse } from "next/server"
import { verifyPrivyToken } from "@/lib/auth"
import { DatabaseService } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { username: string } }) {
  try {
    const { username } = params
    
    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 })
    }

    // Get the profile by username
    const profile = await DatabaseService.getProfileByUsername(username)

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get user ID if authenticated (for like status in user's posts)
    let viewerUserId: string | null = null
    const authHeader = request.headers.get("authorization")
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7)
      viewerUserId = await verifyPrivyToken(token)
    }

    // Get the user's annoyances
    const annoyances = await DatabaseService.getAnnoyancesByUserId(profile.id, viewerUserId || undefined)

    // Calculate stats
    const totalLikes = annoyances.reduce((sum, annoyance) => sum + (annoyance.like_count || 0), 0)
    const totalComments = annoyances.reduce((sum, annoyance) => sum + (annoyance.comment_count || 0), 0)

    return NextResponse.json({
      profile,
      annoyances,
      stats: {
        totalPosts: annoyances.length,
        totalLikes,
        totalComments,
      },
    })
  } catch (error) {
    console.error("Get user profile error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
