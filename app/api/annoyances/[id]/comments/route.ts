import { type NextRequest, NextResponse } from "next/server"
import { verifyPrivyToken, moderateContent } from "@/lib/auth"
import { DatabaseService } from "@/lib/database"
import { CreateCommentSchema } from "@/lib/schemas"
import { validateCommentContent, createRateLimiter } from "@/lib/security"

export async function GET(request: NextRequest, contextPromise: Promise<{ params: { id: string } }>) {
  try {
    const { params } = await contextPromise;
    
    /* @next-codemod-ignore */
    const annoyanceId = Number.parseInt(params.id)
    if (isNaN(annoyanceId)) {
      return NextResponse.json({ error: "Invalid annoyance ID" }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "50"), 100)
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const comments = await DatabaseService.getComments(annoyanceId, limit, offset)

    return NextResponse.json({ comments })
  } catch (error) {
    console.error("Get comments error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, contextPromise: Promise<{ params: { id: string } }>) {
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

    // Rate limiting check
    const rateLimiter = createRateLimiter()
    const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const rateLimitKey = `comment_${userId}_${clientIp}`
    
    if (!rateLimiter.checkRateLimit(rateLimitKey)) {
      return NextResponse.json({ error: "Rate limit exceeded. Please wait before posting another comment." }, { status: 429 })
    }

    const { params } = await contextPromise
    /* @next-codemod-ignore */
    const annoyanceId = Number.parseInt(params.id)
    if (isNaN(annoyanceId)) {
      return NextResponse.json({ error: "Invalid annoyance ID" }, { status: 400 })
    }

    const body = await request.json()
    const { content } = CreateCommentSchema.parse(body)

    // Security validation
    const validation = validateCommentContent(content)
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.errors[0] || "Invalid comment content" }, { status: 400 })
    }

    // Content moderation (legacy - could be removed as validateCommentContent includes this)
    if (!moderateContent(content)) {
      return NextResponse.json({ error: "Comment contains inappropriate language" }, { status: 400 })
    }

    const comment = await DatabaseService.createComment(userId, annoyanceId, validation.sanitized || content)

    if (!comment) {
      return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
    }

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error("Create comment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
