"use client"
import { useState } from "react"
import { Heart, MessageCircle, Share2, MoreHorizontal, ChevronDown, ChevronUp, Edit2, ExternalLink, Twitter, Linkedin, Github, Instagram, Youtube, Globe, Trash2 } from "lucide-react"
import Link from "next/link"
import { NeuCard } from "@/components/ui/neu-card"
import { NeuButton } from "@/components/ui/neu-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ImageModal } from "@/components/image-modal"
import { useAuth } from "@/hooks/use-auth"
import type { Annoyance } from "@/lib/schemas"
import { formatDistanceToNow } from "date-fns"

interface AnnoyanceCardProps {
  annoyance: Annoyance
  onLike?: (id: number) => void
  onComment?: (id: number) => void
  onShare?: (id: number) => void
  onEdit?: (id: number) => void
  onDelete?: (id: number) => void
  className?: string
}

export function AnnoyanceCard({ annoyance, onLike, onComment, onShare, onEdit, onDelete, className }: AnnoyanceCardProps) {
  const { userProfile } = useAuth()
  const [isLiked, setIsLiked] = useState(annoyance.is_liked || false)
  const [likeCount, setLikeCount] = useState(annoyance.like_count || 0)
  const [isExpanded, setIsExpanded] = useState(false)
  const [imageModalOpen, setImageModalOpen] = useState(false)

  const MAX_DESCRIPTION_LENGTH = 200
  const needsExpansion = annoyance.description ? annoyance.description.length > MAX_DESCRIPTION_LENGTH : false;
  const displayDescription = annoyance.description && needsExpansion && !isExpanded 
    ? annoyance.description.slice(0, MAX_DESCRIPTION_LENGTH) + "..."
    : annoyance.description

  const isOwnAnnoyance = userProfile?.id === annoyance.user_id

  const handleLike = () => {
    const newIsLiked = !isLiked
    setIsLiked(newIsLiked)
    setLikeCount((prev) => (newIsLiked ? prev + 1 : prev - 1))
    onLike?.(annoyance.id)
  }

  const timeAgo = formatDistanceToNow(new Date(annoyance.created_at), { addSuffix: true })

  return (
    <NeuCard className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 neu-raised">
              {annoyance.profile_image_url ? (
                <AvatarImage 
                  src={annoyance.profile_image_url} 
                  alt={`${annoyance.username}'s profile`} 
                  className="object-cover"
                />
              ) : (
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {annoyance.username?.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              )}
              </Avatar>
          <div>
            <Link 
              href={`/${annoyance.username}`}
              className="font-semibold text-foreground hover:text-primary transition-colors"
            >
              {annoyance.username || "Anonymous"}
            </Link>
            <p className="text-sm text-muted-foreground">{timeAgo}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {isOwnAnnoyance && onEdit && (
            <NeuButton variant="flat" size="sm" onClick={() => onEdit(annoyance.id)}>
              <Edit2 className="h-4 w-4" />
            </NeuButton>
          )}
          {isOwnAnnoyance && onDelete && (
            <NeuButton variant="flat" size="sm" onClick={() => onDelete(annoyance.id)}>
              <Trash2 className="h-4 w-4" />
            </NeuButton>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2 mb-4">
        <h3 className="font-bold text-lg text-foreground leading-tight">{annoyance.title}</h3>
        
        <div className="text-foreground leading-relaxed">
          <p>{displayDescription}</p>
          {needsExpansion && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1 transition-colors"
            >
              {isExpanded ? (
                <>
                  Show less <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  Show more <ChevronDown className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>

        {/* Image */}
        {annoyance.image_url && (
          <div 
            className="max-w-3xs neu-inset rounded-lg overflow-hidden cursor-pointer hover:neu-flat transition-all duration-200"
            onClick={() => setImageModalOpen(true)}
          >
            <img
              src={annoyance.image_url || "/placeholder.svg"}
              alt="Annoyance illustration"
              className="max-w-3xs md:max-w-[20rem] aspect-square object-contain"
            />
          </div>
        )}

        {/* Categories */}
        {annoyance.categories && annoyance.categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {annoyance.categories.map((category, index) => (
              <Badge key={index} variant="default" className="neu-flat text-xs">
                {typeof category === 'string' ? category : category.name}
              </Badge>
            ))}
          </div>
        )}

        {/* External Links */}
        {annoyance.external_links && annoyance.external_links.length > 0 && (
          <div className="space-y-2 mt-2">
            <p className="text-sm font-medium text-muted-foreground">Related Links:</p>
            <div className="flex flex-wrap gap-2">
              {annoyance.external_links.map((link, index) => {
                const getIcon = () => {
                  switch (link.type) {
                    case "twitter": return <Twitter className="h-3 w-3" />
                    case "linkedin": return <Linkedin className="h-3 w-3" />
                    case "github": return <Github className="h-3 w-3" />
                    case "instagram": return <Instagram className="h-3 w-3" />
                    case "youtube": return <Youtube className="h-3 w-3" />
                    case "website": return <Globe className="h-3 w-3" />
                    default: return <ExternalLink className="h-3 w-3" />
                  }
                }

                return (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1 neu-flat hover:neu-inset transition-all duration-200 rounded-lg text-xs text-primary hover:text-primary/80"
                  >
                    {getIcon()}
                    {link.label || link.type}
                  </a>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border/50">
        <div className="flex items-center gap-4">
          <NeuButton variant={isLiked ? "primary" : "flat"} size="sm" onClick={handleLike} className="gap-2">
            <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
            <span className="text-sm font-medium">{likeCount}</span>
          </NeuButton>

          <NeuButton variant="flat" size="sm" onClick={() => onComment?.(annoyance.id)} className="gap-2">
            <MessageCircle className="h-4 w-4" />
            <span className="text-sm font-medium">{annoyance.comment_count || 0}</span>
          </NeuButton>
        </div>

        <NeuButton variant="flat" size="sm" onClick={() => onShare?.(annoyance.id)}>
          <Share2 className="h-4 w-4" />
        </NeuButton>
      </div>

      {/* Image Modal */}
      {annoyance.image_url && (
        <ImageModal
          isOpen={imageModalOpen}
          onClose={() => setImageModalOpen(false)}
          src={annoyance.image_url}
          alt="Annoyance illustration"
        />
      )}
    </NeuCard>
  )
}