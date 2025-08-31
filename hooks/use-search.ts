"use client"

import { useQuery } from "@tanstack/react-query"
import type { Annoyance } from "@/lib/schemas"

interface SearchResponse {
  annoyances: Annoyance[]
}

async function searchAnnoyances(query: string, limit = 20, offset = 0): Promise<SearchResponse> {
  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`)

  if (!response.ok) {
    throw new Error("Failed to search annoyances")
  }

  return response.json()
}

export function useSearch(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => searchAnnoyances(query),
    enabled: query.trim().length >= 2,
    staleTime: 30 * 1000, // 30 seconds
  })
}
