"use client"

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { usePrivy } from "@privy-io/react-auth"
import type { Annoyance, CreateAnnoyanceRequest, UpdateAnnoyanceRequest } from "@/lib/schemas"

interface AnnoyancesResponse {
  annoyances?: Annoyance[]
  data?: Annoyance[]
  hasMore?: boolean
}

type FeedType = 'default' | 'recent' | 'liked'

export type { FeedType }

async function fetchAnnoyances(token: string | null, pageParam: number, feedType: FeedType = 'default'): Promise<AnnoyancesResponse> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let url: string
  switch (feedType) {
    case 'liked':
      if (!token) {
        throw new Error("Authentication required for liked posts")
      }
      url = `/api/annoyances/liked?limit=20&offset=${pageParam}`
      break
    case 'recent':
      url = `/api/annoyances?limit=20&offset=${pageParam}&sort=recent`
      break
    default:
      url = `/api/annoyances?limit=20&offset=${pageParam}`
  }

  const response = await fetch(url, { headers })

  if (!response.ok) {
    throw new Error("Failed to fetch annoyances")
  }

  return response.json()
}

async function createAnnoyance(token: string, data: CreateAnnoyanceRequest): Promise<{ annoyance: Annoyance }> {
  const response = await fetch("/api/annoyances", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to create annoyance")
  }

  return response.json()
}

async function fetchAnnoyance(annoyanceId: number): Promise<{ annoyance: Annoyance }> {
  const response = await fetch(`/api/annoyances/${annoyanceId}`)

  if (!response.ok) {
    throw new Error("Failed to fetch annoyance")
  }

  return response.json()
}

async function updateAnnoyance(token: string, annoyanceId: number, data: UpdateAnnoyanceRequest): Promise<{ message: string; annoyanceId: number }> {
  const response = await fetch(`/api/annoyances/${annoyanceId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to update annoyance")
  }

  return response.json()
}

async function deleteAnnoyance(token: string, annoyanceId: number): Promise<{ message: string }> {
  const response = await fetch(`/api/annoyances/${annoyanceId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to delete annoyance")
  }

  return response.json()
}

async function toggleLike(token: string, annoyanceId: number): Promise<{ isLiked: boolean }> {
  const response = await fetch(`/api/annoyances/${annoyanceId}/like`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error("Failed to toggle like")
  }

  return response.json()
}

export function useAnnoyances(feedType: FeedType = 'default') {
  const { getAccessToken } = usePrivy()

  return useInfiniteQuery({
    queryKey: ["annoyances", feedType],
    queryFn: async ({ pageParam = 0 }) => {
      const token = await getAccessToken()
      return fetchAnnoyances(token, pageParam, feedType)
    },
    getNextPageParam: (lastPage, allPages) => {
      const annoyances = lastPage.annoyances || lastPage.data || []
      // Check if we have more data based on the response or if we got a full page
      const hasMore = lastPage.hasMore !== false && annoyances.length === 20
      if (!hasMore) return undefined
      return allPages.length * 20
    },
    initialPageParam: 0,
  })
}

export function useCreateAnnoyance() {
  const { getAccessToken } = usePrivy()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateAnnoyanceRequest) => {
      const token = await getAccessToken()
      if (!token) throw new Error("No access token")
      return createAnnoyance(token, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["annoyances"] })
    },
  })
}

export function useLikeAnnoyance() {
  const { getAccessToken } = usePrivy()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (annoyanceId: number) => {
      const token = await getAccessToken()
      if (!token) throw new Error("No access token")
      return toggleLike(token, annoyanceId)
    },
    onMutate: async (annoyanceId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["annoyances"] })

      const previousData = queryClient.getQueryData(["annoyances"])

      queryClient.setQueryData(["annoyances"], (old: any) => {
        if (!old) return old

        return {
          ...old,
          pages: old.pages.map((page: any) => {
            const annoyances = page.annoyances || page.data || []
            return {
              ...page,
              [page.annoyances ? 'annoyances' : 'data']: annoyances.map((annoyance: Annoyance) => {
                if (annoyance.id === annoyanceId) {
                  const newIsLiked = !annoyance.is_liked
                  return {
                    ...annoyance,
                    is_liked: newIsLiked,
                    like_count: (annoyance.like_count || 0) + (newIsLiked ? 1 : -1),
                  }
                }
                return annoyance
              }),
            }
          }),
        }
      })

      return { previousData }
    },
    onError: (err, annoyanceId, context) => {
      // Revert optimistic update on error
      if (context?.previousData) {
        queryClient.setQueryData(["annoyances"], context.previousData)
      }
    },
  })
}

export function useAnnoyance(annoyanceId: number) {
  return useQuery({
    queryKey: ["annoyance", annoyanceId],
    queryFn: () => fetchAnnoyance(annoyanceId),
    enabled: !!annoyanceId,
  })
}

export function useUpdateAnnoyance() {
  const { getAccessToken } = usePrivy()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ annoyanceId, data }: { annoyanceId: number; data: UpdateAnnoyanceRequest }) => {
      const token = await getAccessToken()
      if (!token) throw new Error("No access token")
      return updateAnnoyance(token, annoyanceId, data)
    },
    onSuccess: (_, { annoyanceId }) => {
      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ["annoyance", annoyanceId] })
      queryClient.invalidateQueries({ queryKey: ["annoyances"] })
    },
  })
}

export function useDeleteAnnoyance() {
  const { getAccessToken } = usePrivy()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (annoyanceId: number) => {
      const token = await getAccessToken()
      if (!token) throw new Error("No access token")
      return deleteAnnoyance(token, annoyanceId)
    },
    onSuccess: (_, annoyanceId) => {
      // Remove the deleted annoyance from all relevant queries
      queryClient.invalidateQueries({ queryKey: ["annoyances"] })
      queryClient.removeQueries({ queryKey: ["annoyance", annoyanceId] })
      
      // Optimistically remove from cache
      queryClient.setQueryData(["annoyances"], (oldData: any) => {
        if (!oldData) return oldData
        
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            annoyances: (page.annoyances || page.data || []).filter((a: Annoyance) => a.id !== annoyanceId),
            data: (page.annoyances || page.data || []).filter((a: Annoyance) => a.id !== annoyanceId),
          })),
        }
      })
    },
  })
}
