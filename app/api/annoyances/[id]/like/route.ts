import { type NextRequest, NextResponse } from "next/server"
import { verifyPrivyToken } from "@/lib/auth"
import { DatabaseService } from "@/lib/database"
import { createRateLimiter } from "@/lib/security"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Rate limiting check for likes
    const rateLimiter = createRateLimiter()
    const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const rateLimitKey = `like_${userId}_${clientIp}`
    
    if (!rateLimiter.checkRateLimit(rateLimitKey, 30, 60000)) { // 30 likes per minute
      return NextResponse.json({ error: "Rate limit exceeded. Please slow down." }, { status: 429 })
    }

    const annoyanceId = Number.parseInt(params.id)
    if (isNaN(annoyanceId)) {
      return NextResponse.json({ error: "Invalid annoyance ID" }, { status: 400 })
    }

    const isLiked = await DatabaseService.toggleLike(userId, annoyanceId)

    return NextResponse.json({ isLiked })
  } catch (error) {
    console.error("Toggle like error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
