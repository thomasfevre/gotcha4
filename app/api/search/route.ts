import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "20"), 50)
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ error: "Query must be at least 2 characters" }, { status: 400 })
    }

    const annoyances = await DatabaseService.searchAnnoyances(query.trim(), limit, offset)

    return NextResponse.json({ annoyances })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
