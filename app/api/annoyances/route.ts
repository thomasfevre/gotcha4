import { type NextRequest, NextResponse } from "next/server"
import { verifyPrivyToken } from "@/lib/auth"
import { DatabaseService } from "@/lib/database"
import { CreateAnnoyanceSchema } from "@/lib/schemas"
import { validateAnnoyanceTitle, validateAnnoyanceDescription, createRateLimiter } from "@/lib/security"

// Rate limiter for annoyance creation (max 5 per minute per user)
const rateLimiter = createRateLimiter()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "20"), 50)
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const sort = searchParams.get("sort") || "default" // 'default', 'recent'

    // Get user ID if authenticated (for like status)
    let userId: string | null = null
    const authHeader = request.headers.get("authorization")
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7)
      userId = await verifyPrivyToken(token)
    }

    const annoyances = await DatabaseService.getAnnoyances(
      limit,
      offset,
      userId || undefined,
      sort
    )
    return NextResponse.json({ annoyances: annoyances.data })
  } catch (error) {
    console.error("Get annoyances error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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

    // Rate limiting check
    if (!rateLimiter.checkRateLimit(userId, 5, 60000)) {
      return NextResponse.json({ error: "Too many requests. Please wait before creating another annoyance." }, { status: 429 })
    }

    const body = await request.json()
    const parseResult = CreateAnnoyanceSchema.safeParse(body)
    
    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid data format", details: parseResult.error.errors }, { status: 400 })
    }

    const { title, description, image_url, external_links, categories } = parseResult.data

    // Security validation
    const titleValidation = validateAnnoyanceTitle(title)
    if (!titleValidation.isValid) {
      return NextResponse.json({ error: "Invalid title", details: titleValidation.errors }, { status: 400 })
    }

    const descriptionValidation = validateAnnoyanceDescription(description)
    if (!descriptionValidation.isValid) {
      return NextResponse.json({ error: "Invalid description", details: descriptionValidation.errors }, { status: 400 })
    }

    // Use sanitized content
    const sanitizedTitle = titleValidation.sanitized!
    const sanitizedDescription = descriptionValidation.sanitized!

    // Handle external_links: convert empty array to null for proper storage
    const processedExternalLinks = external_links && external_links.length > 0 ? external_links : null

    // Convert category names to IDs if provided
    let categoryIds: number[] = []
    if (categories && categories.length > 0) {
      const allCategories = await DatabaseService.getCategories()
      categoryIds = categories
        .map(categoryId => {
          const category = allCategories.find(cat => cat.id === Number(categoryId))
          return category?.id
        })
        .filter((id): id is number => id !== undefined)
    }

    const annoyance = await DatabaseService.createAnnoyance(
      userId, 
      sanitizedTitle, 
      sanitizedDescription, 
      image_url, 
      processedExternalLinks, 
      categoryIds
    )

    if (!annoyance) {
      return NextResponse.json({ error: "Failed to create annoyance" }, { status: 500 })
    }

    return NextResponse.json({ annoyance }, { status: 201 })
  } catch (error) {
    console.error("Create annoyance error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
