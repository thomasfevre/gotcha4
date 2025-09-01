"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAnnoyances, useLikeAnnoyance, useDeleteAnnoyance, type FeedType } from "@/hooks/use-annoyances"
import { useComments, useCreateComment } from "@/hooks/use-comments"
import { AnnoyanceCard } from "@/components/annoyance-card"
import { LoadingCard, LoadingSpinner } from "@/components/loading-spinner"
import { EmptyState } from "@/components/empty-state"
import { CommentModal } from "@/components/comment-modal"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { FeedFilter } from "@/components/feed-filter"
import { MessageCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Annoyance } from "@/lib/schemas"

export default function FeedPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Initialize feedType from URL search params, defaulting to 'default'
  const urlFeedType = searchParams.get('type')
  const validFeedTypes: FeedType[] = ['default', 'recent', 'liked']
  const initialFeedType: FeedType = validFeedTypes.includes(urlFeedType as FeedType) 
    ? (urlFeedType as FeedType) 
    : 'default'
  const [feedType, setFeedType] = useState<FeedType>(initialFeedType)
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } = useAnnoyances(feedType)
  const likeAnnoyance = useLikeAnnoyance()
  const deleteAnnoyance = useDeleteAnnoyance()
  const [commentModalOpen, setCommentModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedAnnoyance, setSelectedAnnoyance] = useState<Annoyance | null>(null)
  const [annoyanceToDelete, setAnnoyanceToDelete] = useState<number | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const lastCardRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Comments for modal
  const { data: commentsData, isLoading: commentsLoading } = useComments(selectedAnnoyance?.id || 0)
  const createComment = useCreateComment(selectedAnnoyance?.id || 0)

  // Handle feedType changes with URL updates
  const handleFeedTypeChange = (newFeedType: FeedType) => {
    setFeedType(newFeedType)
    const params = new URLSearchParams(searchParams.toString())
    if (newFeedType === 'default') {
      params.delete('type')
    } else {
      params.set('type', newFeedType)
    }
    const newUrl = params.toString() ? `/feed?${params.toString()}` : '/feed'
    router.replace(newUrl, { scroll: false })
  }

  // Infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 },
    )

    if (lastCardRef.current) {
      observerRef.current.observe(lastCardRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const handleLike = (annoyanceId: number) => {
    likeAnnoyance.mutate(annoyanceId, {
      onError: () => {
        toast({
          title: "Failed to like",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        })
      },
    })
  }

  const handleComment = (annoyance: Annoyance) => {
    setSelectedAnnoyance(annoyance)
    setCommentModalOpen(true)
  }

  const handleShare = async (annoyanceId: number) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Check out this idea on Gotcha",
          url: `${window.location.origin}/post/${annoyanceId}`,
        })
      } else {
        await navigator.clipboard.writeText(`${window.location.origin}/post/${annoyanceId}`)
        toast({
          title: "Link copied!",
          description: "The link has been copied to your clipboard.",
        })
      }
    } catch (error) {
      // User cancelled sharing or clipboard failed
      if (error instanceof Error && error.name !== "AbortError") {
        toast({
          title: "Failed to share",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const handleAddComment = (content: string) => {
    createComment.mutate(
      { content },
      {
        onSuccess: () => {
          toast({
            title: "Comment posted!",
            description: "Your comment has been added successfully.",
          })
        },
        onError: () => {
          toast({
            title: "Failed to post comment",
            description: "Something went wrong. Please try again.",
            variant: "destructive",
          })
        },
      },
    )
  }

  const handleEditAnnoyance = (annoyanceId: number) => {
    router.push(`/create?edit=${annoyanceId}`)
  }

  const handleDeleteAnnoyance = (annoyanceId: number) => {
    setAnnoyanceToDelete(annoyanceId)
    setDeleteModalOpen(true)
  }

  const confirmDeleteAnnoyance = () => {
    if (annoyanceToDelete) {
      deleteAnnoyance.mutate(annoyanceToDelete, {
        onSuccess: () => {
          toast({
            title: "Post deleted",
            description: "Your post has been deleted successfully.",
          })
          setDeleteModalOpen(false)
          setAnnoyanceToDelete(null)
        },
        onError: () => {
          toast({
            title: "Failed to delete post",
            description: "Something went wrong. Please try again.",
            variant: "destructive",
          })
        },
      })
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <LoadingCard key={i} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <EmptyState
          icon={<MessageCircle className="h-12 w-12" />}
          title="Something went wrong"
          description="We couldn't load the feed. Please try again later."
        />
      </div>
    )
  }

  const allAnnoyances = data?.pages.flatMap((page) => page.annoyances || page.data || []) || []

  const getEmptyStateContent = () => {
    switch (feedType) {
      case 'liked':
        return {
          title: "No liked posts yet",
          description: "Start liking posts to see them here!"
        }
      case 'recent':
        return {
          title: "No recent posts",
          description: "Be the first to share your ideas and suggestions!"
        }
      default:
        return {
          title: "No posts yet",
          description: "Be the first to share your ideas and suggestions!"
        }
    }
  }

  if (allAnnoyances.length === 0) {
    const emptyContent = getEmptyStateContent()
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Feed</h1>
            <p className="text-muted-foreground hidden md:block">
              Discover the latest ideas and suggestions from the community
            </p>
            <p className="text-muted-foreground text-sm md:hidden">
              Discover new ideas from the community
            </p>
          </div>
          <FeedFilter currentFilter={feedType} onFilterChange={handleFeedTypeChange} />
        </div>
        <EmptyState
          icon={<MessageCircle className="h-12 w-12" />}
          title={emptyContent.title}
          description={emptyContent.description}
        />
      </div>
    )
  }


  return (
    <>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Feed</h1>
            <p className="text-muted-foreground hidden md:block">
              Discover the latest ideas and suggestions from the community
            </p>
            <p className="text-muted-foreground text-sm md:hidden">
              Discover new ideas from the community
            </p>
          </div>
          <FeedFilter currentFilter={feedType} onFilterChange={handleFeedTypeChange} />
        </div>

        {/* Feed */}
        <div className="space-y-10">
          {allAnnoyances.map((annoyance, index) => (
            <div key={`${annoyance.id}-${index}`} ref={index === allAnnoyances.length - 1 ? lastCardRef : undefined}>
              <AnnoyanceCard
                annoyance={annoyance}
                onLike={handleLike}
                onComment={() => handleComment(annoyance)}
                onShare={handleShare}
                onEdit={handleEditAnnoyance}
                onDelete={handleDeleteAnnoyance}
              />
            </div>
          ))}

          {/* Loading indicator */}
          {isFetchingNextPage && (
            <div className="flex justify-center py-6">
              <LoadingSpinner size="lg" />
            </div>
          )}
        </div>
      </div>

      {/* Comment Modal */}
      {selectedAnnoyance && (
        <CommentModal
          isOpen={commentModalOpen}
          onClose={() => {
            setCommentModalOpen(false)
            setSelectedAnnoyance(null)
          }}
          annoyanceId={selectedAnnoyance.id}
          annoyanceTitle={selectedAnnoyance.title}
          comments={commentsData?.comments || []}
          onAddComment={handleAddComment}
          isLoading={commentsLoading || createComment.isPending}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationDialog
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setAnnoyanceToDelete(null)
        }}
        onConfirm={confirmDeleteAnnoyance}
        isLoading={deleteAnnoyance.isPending}
        title="Delete Post"
        description="Are you sure you want to delete this post? This action cannot be undone."
      />
    </>
  )
}
