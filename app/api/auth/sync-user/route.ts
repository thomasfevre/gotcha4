import { type NextRequest, NextResponse } from "next/server"
import { verifyPrivyToken, getOrCreateUser } from "@/lib/auth"
import { validateUsername, createRateLimiter } from "@/lib/security"
import { z } from "zod"

const SyncUserSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
  profile_image_url: z.string().url().optional().nullable(),
})

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

    // Rate limiting check for user sync
    const rateLimiter = createRateLimiter()
    const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const rateLimitKey = `sync_user_${userId}_${clientIp}`
    
    if (!rateLimiter.checkRateLimit(rateLimitKey, 5, 60000)) { // 5 syncs per minute
      return NextResponse.json({ error: "Rate limit exceeded. Please wait before syncing again." }, { status: 429 })
    }

    const body = await request.json()
    const { username, profile_image_url } = SyncUserSchema.parse(body)

    // Validate username if provided
    if (username) {
      const validation = validateUsername(username)
      if (!validation.isValid) {
        return NextResponse.json({ error: validation.errors[0] || "Invalid username" }, { status: 400 })
      }
    }

    // Convert null to undefined for profile_image_url
    const profileImageUrl = profile_image_url || undefined

    const user = await getOrCreateUser(userId, username, profileImageUrl)

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Sync user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
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

    const user = await getOrCreateUser(userId)

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
