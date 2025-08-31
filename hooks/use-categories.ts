"use client"

import { useQuery } from "@tanstack/react-query"

interface Category {
  id: number
  name: string
}

async function fetchCategories(): Promise<{ categories: Category[] }> {
  const response = await fetch("/api/categories")

  if (!response.ok) {
    throw new Error("Failed to fetch categories")
  }

  return response.json()
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
