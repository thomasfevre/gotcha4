"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut, Settings, MessageCircle } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useAnnoyances, useLikeAnnoyance, useDeleteAnnoyance } from "@/hooks/use-annoyances"
import { useComments, useCreateComment } from "@/hooks/use-comments"
import { NeuCard } from "@/components/ui/neu-card"
import { NeuButton } from "@/components/ui/neu-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AnnoyanceCard } from "@/components/annoyance-card"
import { LoadingCard } from "@/components/loading-spinner"
import { EmptyState } from "@/components/empty-state"
import { CommentModal } from "@/components/comment-modal"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { ProfileSettingsModal } from "@/components/profile-settings-modal"
import { useToast } from "@/hooks/use-toast"
import type { Annoyance } from "@/lib/schemas"

export default function ProfilePage() {
  const router = useRouter()
  const { userProfile, logout, connectionMethod } = useAuth()
  const { data, isLoading } = useAnnoyances('recent')
  const likeAnnoyance = useLikeAnnoyance()
  const deleteAnnoyance = useDeleteAnnoyance()
  const [commentModalOpen, setCommentModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [selectedAnnoyance, setSelectedAnnoyance] = useState<Annoyance | null>(null)
  const [annoyanceToDelete, setAnnoyanceToDelete] = useState<number | null>(null)
  const { toast } = useToast()

  // Comments for modal
  const { data: commentsData, isLoading: commentsLoading } = useComments(selectedAnnoyance?.id || 0)
  const createComment = useCreateComment(selectedAnnoyance?.id || 0)

  // Filter user's own annoyances
  const userAnnoyances =
    data?.pages.flatMap((page) => page.annoyances || page.data || []).filter((annoyance) => annoyance.user_id === userProfile?.id) || []

  const totalLikes = userAnnoyances.reduce((sum, annoyance) => sum + (annoyance.like_count || 0), 0)
  const totalComments = userAnnoyances.reduce((sum, annoyance) => sum + (annoyance.comment_count || 0), 0)

  const handleLike = (annoyanceId: number) => {
    likeAnnoyance.mutate(annoyanceId)
  }

  const handleComment = (annoyance: Annoyance) => {
    setSelectedAnnoyance(annoyance)
    setCommentModalOpen(true)
  }

  const handleShare = async (annoyanceId: number) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out this idea on Gotcha",
          url: `${window.location.origin}/annoyance/${annoyanceId}`,
        })
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      await navigator.clipboard.writeText(`${window.location.origin}/annoyance/${annoyanceId}`)
    }
  }

  const handleAddComment = (content: string) => {
    createComment.mutate({ content })
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

  return (
    <>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground">Your ideas and activity</p>
        </div>

        {/* Profile Card */}
        <NeuCard className="mb-10 p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 neu-raised">
                {userProfile?.profile_image_url ? (
                  <AvatarImage 
                    src={userProfile.profile_image_url} 
                    alt={userProfile.username} 
                    className="object-cover"
                  />
                ) : (
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                    {userProfile?.username?.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-foreground">
                  <span className="block sm:hidden">
                    {userProfile?.username?.slice(0, 9)}
                    {userProfile?.username && userProfile.username.length > 10 ? "…" : ""}
                  </span>
                  <span className="hidden sm:block">
                    {userProfile?.username}
                  </span>
                </h2>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  Member since {new Date(userProfile?.created_at || "").toLocaleDateString()}
                </p>
                <p className="text-sm text-muted-foreground block sm:hidden">
                  Member since <br />{new Date(userProfile?.created_at || "").toLocaleDateString()}
                </p>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Connected with {connectionMethod}
                </p>
              </div>
            </div>
            
            {/* Bio Section (Desktop) - Separate row for better handling */}
            {userProfile?.bio && (
              <div className="mt-4 hidden sm:block">
                <p className="text-sm text-foreground leading-relaxed break-words whitespace-pre-wrap">
                  {userProfile.bio}
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <NeuButton variant="flat" size="icon" onClick={() => setSettingsModalOpen(true)}>
                <Settings className="h-4 w-4" />
              </NeuButton>
              <NeuButton variant="flat" size="icon" onClick={logout}>
                <LogOut className="h-4 w-4"  />
              </NeuButton>
            </div>
          </div>

          {/* Connection Method */}
          {connectionMethod && (
            <div className="text-center pb-4 block sm:hidden">
              <p className="text-xs text-muted-foreground">
                Connected with {connectionMethod}
              </p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{userAnnoyances.length}</p>
              <p className="text-sm text-muted-foreground">Ideas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{totalLikes}</p>
              <p className="text-sm text-muted-foreground">Total Likes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{totalComments}</p>
              <p className="text-sm text-muted-foreground">Total Comments</p>
            </div>
          </div>

          {/* Bio Section (mobile) - Separate row for better mobile handling */}
            {userProfile?.bio && (
              <div className="mt-4 block sm:hidden">
                <p className="text-sm text-foreground leading-relaxed break-words whitespace-pre-wrap">
                  {userProfile.bio}
                </p>
              </div>
            )}
        </NeuCard>

        {/* User's Annoyances */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-foreground">Your Ideas</h3>

          {isLoading ? (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <LoadingCard key={i} />
              ))}
            </div>
          ) : userAnnoyances.length === 0 ? (
            <EmptyState
              icon={<MessageCircle className="h-12 w-12" />}
              title="No ideas yet"
              description="You haven't shared any ideas yet. Start by creating your first idea!"
            />
          ) : (
            userAnnoyances.map((annoyance) => (
              <AnnoyanceCard
                key={annoyance.id}
                annoyance={annoyance}
                onLike={handleLike}
                onComment={() => handleComment(annoyance)}
                onShare={handleShare}
                onEdit={handleEditAnnoyance}
                onDelete={handleDeleteAnnoyance}
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

      {/* Profile Settings Modal */}
      <ProfileSettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />
    </>
  )
}
