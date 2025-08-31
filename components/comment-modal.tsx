"use client"

import type React from "react"
import { useState } from "react"
import { Send, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { NeuButton } from "@/components/ui/neu-button"
import { NeuTextarea } from "@/components/ui/neu-textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Comment } from "@/lib/schemas"
import { formatDistanceToNow } from "date-fns"

interface CommentModalProps {
  isOpen: boolean
  onClose: () => void
  annoyanceId: number
  annoyanceTitle: string
  comments: Comment[]
  onAddComment: (content: string) => void
  isLoading?: boolean
}

export function CommentModal({
  isOpen,
  onClose,
  annoyanceId,
  annoyanceTitle,
  comments,
  onAddComment,
  isLoading = false,
}: CommentModalProps) {
  const [newComment, setNewComment] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newComment.trim()) {
      onAddComment(newComment.trim())
      setNewComment("")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="neu-raised border-0 max-w-lg max-h-[80vh] flex flex-col rounded-3xl" showCloseButton={false}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-lg font-bold pr-8">{annoyanceTitle}</DialogTitle>
          <NeuButton
              variant="flat"
              size="icon"
              onClick={onClose}
              className="absolute top-4 right-5 h-8 w-8"
            >
              <X className="h-3 w-3" />
            </NeuButton>
        </DialogHeader>

        {/* Comments List */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4 py-4">
            {comments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No comments yet. Be the first to share your thoughts!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8 neu-raised flex-shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {comment.username?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm">{comment.username || "Anonymous"}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed break-words">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Add Comment Form */}
        <form onSubmit={handleSubmit} className="flex-shrink-0 space-y-3 pt-4 border-t border-border/50">
          <NeuTextarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            className="min-h-[80px] resize-none"
            disabled={isLoading}
          />
          <div className="flex justify-end">
            <NeuButton
              type="submit"
              variant="primary"
              size="sm"
              disabled={!newComment.trim() || isLoading}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {isLoading ? "Posting..." : "Post Comment"}
            </NeuButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
