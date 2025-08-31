"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { MessageCircle, Calendar, ExternalLink } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useLikeAnnoyance, useDeleteAnnoyance } from "@/hooks/use-annoyances"
import { useComments, useCreateComment } from "@/hooks/use-comments"
import { NeuCard } from "@/components/ui/neu-card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AnnoyanceCard } from "@/components/annoyance-card"
import { LoadingCard, LoadingSpinner } from "@/components/loading-spinner"
import { EmptyState } from "@/components/empty-state"
import { CommentModal } from "@/components/comment-modal"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { useToast } from "@/hooks/use-toast"
import type { Annoyance, Profile } from "@/lib/schemas"

interface UserProfileData {
  profile: Profile
  annoyances: Annoyance[]
  stats: {
    totalPosts: number
    totalLikes: number
    totalComments: number
  }
}

export default function UserProfilePage() {
  const params = useParams()
   const router = useRouter()
  const username = params.username as string
  const { userProfile, ready, authenticated } = useAuth()
  const likeAnnoyance = useLikeAnnoyance()
  const deleteAnnoyance = useDeleteAnnoyance()
  const [data, setData] = useState<UserProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [commentModalOpen, setCommentModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedAnnoyance, setSelectedAnnoyance] = useState<Annoyance | null>(null)
  const [annoyanceToDelete, setAnnoyanceToDelete] = useState<number | null>(null)
  const { toast } = useToast()

  // Comments for modal
  const { data: commentsData, isLoading: commentsLoading } = useComments(selectedAnnoyance?.id || 0)
  const createComment = useCreateComment(selectedAnnoyance?.id || 0)

  useEffect(() => {
    if (!username) return

    const fetchUserProfile = async () => {
      try {
        setLoading(true)
        
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        }

        // Add auth header if user is authenticated
        if (ready && authenticated && userProfile) {
          // In a real app, you'd get the actual token here
          headers.Authorization = `Bearer fake-token`
        }

        const response = await fetch(`/api/users/${username}`, {
          headers,
        })

        if (!response.ok) {
          if (response.status === 404) {
            setError("User not found")
          } else {
            setError("Failed to load user profile")
          }
          return
        }

        const profileData = await response.json()
        setData(profileData)
      } catch (err) {
        setError("Failed to load user profile")
        console.error("Error fetching user profile:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [username, ready, authenticated, userProfile])

  const handleLike = (annoyanceId: number) => {
    if (!authenticated) {
      toast({
        title: "Login required",
        description: "Please log in to like posts.",
        variant: "destructive",
      })
      return
    }

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
    if (!authenticated) {
      toast({
        title: "Login required",
        description: "Please log in to comment on posts.",
        variant: "destructive",
      })
      return
    }

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
          // Refresh the data
          if (data) {
            setData({
              ...data,
              annoyances: data.annoyances.filter(a => a.id !== annoyanceToDelete)
            })
          }
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          <div className="flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <LoadingCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-6">
        <EmptyState
          icon={<MessageCircle className="h-12 w-12" />}
          title={error || "User not found"}
          description="The user you're looking for doesn't exist or has been removed."
        />
      </div>
    )
  }

  const isOwnProfile = userProfile?.id === data.profile.id

  return (
    <>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            {isOwnProfile ? "Your Profile" : `${data.profile.username}'s Profile`}
          </h1>
          <p className="text-muted-foreground">
            {isOwnProfile ? "Your ideas and activity" : "Ideas and activity"}
          </p>
        </div>

        {/* Profile Card */}
        <NeuCard className="mb-6">
          <div className="flex items-start gap-4 mb-6">
            <Avatar className="h-16 w-16 neu-raised">
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                {data.profile.username?.charAt(0).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground">{data.profile.username}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Calendar className="h-4 w-4" />
                <span>Member since {new Date(data.profile.created_at).toLocaleDateString()}</span>
              </div>
              {data.profile.bio && (
                <p className="text-foreground leading-relaxed">{data.profile.bio}</p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{data.stats.totalPosts}</p>
              <p className="text-sm text-muted-foreground">Ideas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{data.stats.totalLikes}</p>
              <p className="text-sm text-muted-foreground">Total Likes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{data.stats.totalComments}</p>
              <p className="text-sm text-muted-foreground">Total Comments</p>
            </div>
          </div>
        </NeuCard>

        {/* User's Ideas */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-foreground">
            {isOwnProfile ? "Your Ideas" : `${data.profile.username}'s Ideas`}
          </h3>

          {data.annoyances.length === 0 ? (
            <EmptyState
              icon={<MessageCircle className="h-12 w-12" />}
              title={isOwnProfile ? "No ideas yet" : "No ideas shared"}
              description={
                isOwnProfile
                  ? "You haven't shared any ideas yet. Start by creating your first idea!"
                  : "This user hasn't shared any ideas yet."
              }
            />
          ) : (
            data.annoyances.map((annoyance) => (
              <AnnoyanceCard
                key={annoyance.id}
                annoyance={annoyance}
                onLike={handleLike}
                onComment={() => handleComment(annoyance)}
                onShare={handleShare}
                onEdit={isOwnProfile ? handleEditAnnoyance : undefined}
                onDelete={isOwnProfile ? handleDeleteAnnoyance : undefined}
              />
            ))
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
