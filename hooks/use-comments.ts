"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { usePrivy } from "@privy-io/react-auth"
import type { Comment, CreateCommentRequest } from "@/lib/schemas"

interface CommentsResponse {
  comments: Comment[]
}

async function fetchComments(annoyanceId: number, limit = 50, offset = 0): Promise<CommentsResponse> {
  const response = await fetch(`/api/annoyances/${annoyanceId}/comments?limit=${limit}&offset=${offset}`)

  if (!response.ok) {
    throw new Error("Failed to fetch comments")
  }

  return response.json()
}

async function createComment(
  token: string,
  annoyanceId: number,
  data: CreateCommentRequest,
): Promise<{ comment: Comment }> {
  const response = await fetch(`/api/annoyances/${annoyanceId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to create comment")
  }

  return response.json()
}

export function useComments(annoyanceId: number) {
  return useQuery({
    queryKey: ["comments", annoyanceId],
    queryFn: () => fetchComments(annoyanceId),
    enabled: !!annoyanceId,
  })
}

export function useCreateComment(annoyanceId: number) {
  const { getAccessToken } = usePrivy()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateCommentRequest) => {
      const token = await getAccessToken()
      if (!token) throw new Error("No access token")
      return createComment(token, annoyanceId, data)
    },
    onSuccess: (data) => {
      // Add the new comment to the cache
      queryClient.setQueryData(["comments", annoyanceId], (old: CommentsResponse | undefined) => {
        if (!old) return { comments: [data.comment] }
        return {
          comments: [...old.comments, data.comment],
        }
      })

      // Update the comment count in the annoyances cache
      queryClient.setQueryData(["annoyances"], (old: any) => {
        if (!old) return old

        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            annoyances: page.annoyances.map((annoyance: any) => {
              if (annoyance.id === annoyanceId) {
                return {
                  ...annoyance,
                  comment_count: (annoyance.comment_count || 0) + 1,
                }
              }
              return annoyance
            }),
          })),
        }
      })
    },
  })
}
