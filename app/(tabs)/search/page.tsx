"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Search, Filter, X } from "lucide-react"
import { useSearch } from "@/hooks/use-search"
import { useCategories } from "@/hooks/use-categories"
import { useLikeAnnoyance, useAnnoyances, useDeleteAnnoyance } from "@/hooks/use-annoyances"
import { NeuInput } from "@/components/ui/neu-input"
import { NeuButton } from "@/components/ui/neu-button"
import { NeuCard } from "@/components/ui/neu-card"
import { Badge } from "@/components/ui/badge"
import { AnnoyanceCard } from "@/components/annoyance-card"
import { LoadingCard } from "@/components/loading-spinner"
import { EmptyState } from "@/components/empty-state"
import { CommentModal } from "@/components/comment-modal"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { useComments, useCreateComment } from "@/hooks/use-comments"
import { useToast } from "@/hooks/use-toast"
import type { Annoyance } from "@/lib/schemas"

export default function SearchPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<number[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [commentModalOpen, setCommentModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedAnnoyance, setSelectedAnnoyance] = useState<Annoyance | null>(null)
  const [annoyanceToDelete, setAnnoyanceToDelete] = useState<number | null>(null)

  const { data: searchData, isLoading: searchLoading, error: searchError } = useSearch(debouncedQuery)
  const { data: categoriesData } = useCategories()
  const { data: allAnnoyances, isLoading: allAnnoyancesLoading } = useAnnoyances('default')
  const likeAnnoyance = useLikeAnnoyance()
  const deleteAnnoyance = useDeleteAnnoyance()
  const { toast } = useToast()

  // Comments for modal
  const { data: commentsData, isLoading: commentsLoading } = useComments(selectedAnnoyance?.id || 0)
  const createComment = useCreateComment(selectedAnnoyance?.id || 0)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Filter results by selected categories
  const filteredResults = useMemo(() => {
    // If we have a search query, use search results
    if (debouncedQuery && searchData?.annoyances) {
      if (selectedCategories.length === 0) {
        return searchData.annoyances
      }

      return searchData.annoyances.filter((annoyance: Annoyance) => {
        if (!annoyance.categories) return false
        return selectedCategories.some((categoryId) => {
          const category = categoriesData?.categories.find((c) => c.id === categoryId)
          return (
            category &&
            annoyance.categories?.some(
              (annoyanceCategory: any) =>
                (typeof annoyanceCategory === "string"
                  ? annoyanceCategory
                  : annoyanceCategory.name) === category.name
            )
          )
        })
      })
    }

    // If no search query but categories are selected, show latest from those categories
    if (!debouncedQuery && selectedCategories.length > 0 && allAnnoyances?.pages) {
      const allAnnoyancesList = allAnnoyances.pages.flatMap(page => page.annoyances || page.data || [])
      return allAnnoyancesList.filter((annoyance: Annoyance) => {
        if (!annoyance.categories) return false
        return selectedCategories.some((categoryId) => {
          const category = categoriesData?.categories.find((c) => c.id === categoryId)
          return (
            category &&
            annoyance.categories?.some(
              (annoyanceCategory: any) =>
                (typeof annoyanceCategory === "string"
                  ? annoyanceCategory
                  : annoyanceCategory.name) === category.name
            )
          )
        })
      })
    }

    // Default: empty array
    return []
  }, [searchData?.annoyances, allAnnoyances?.pages, selectedCategories, categoriesData?.categories, debouncedQuery])

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

  const toggleCategory = (categoryId: number) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    )
  }

  const clearFilters = () => {
    setSelectedCategories([])
    setSearchQuery("")
    setDebouncedQuery("")
    setShowFilters(false)
  }

  return (
    <>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Search</h1>
          <p className="text-muted-foreground">Find ideas, suggestions, and topics</p>
        </div>

        {/* Search Input */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <NeuInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for ideas, suggestions, or topics..."
              className="pl-10 pr-12"
            />
            <NeuButton
              variant="flat"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
            >
              <Filter className="h-4 w-4" />
            </NeuButton>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30">
            <NeuCard className="mt-24 w-full max-w-md mx-auto shadow-lg">
              <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Filters</h3>
            <div className="flex gap-2">
              <NeuButton variant="flat" size="sm" onClick={clearFilters}>
                Clear All
              </NeuButton>
              <NeuButton variant="flat" size="sm" onClick={() => setShowFilters(false)}>
                <X className="h-4 w-4" />
              </NeuButton>
            </div>
          </div>

          {/* Category Filters */}
          {categoriesData?.categories && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Categories</h4>
              <div className="flex flex-wrap gap-2">
                {categoriesData.categories.map((category) => {
            const isSelected = selectedCategories.includes(category.id)
            return (
              <Badge
                key={category.id}
                variant={isSelected ? "default" : "secondary"}
                className={`cursor-pointer transition-all ${
                  isSelected ? "neu-inset" : "neu-flat hover:neu-inset"
                }`}
                onClick={() => toggleCategory(category.id)}
              >
                {category.name}
              </Badge>
            )
                })}
              </div>
            </div>
          )}
              </div>
            </NeuCard>
          </div>
        )}

        {/* Results */}
        <div className="space-y-6">
          {/* Search Status */}
          {(debouncedQuery || selectedCategories.length > 0) && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {(searchLoading && debouncedQuery) || (allAnnoyancesLoading && selectedCategories.length > 0)
                  ? "Loading..."
                  : debouncedQuery
                  ? `${filteredResults.length} result${filteredResults.length !== 1 ? "s" : ""} for "${debouncedQuery}"`
                  : `${filteredResults.length} idea${filteredResults.length !== 1 ? "s" : ""} in selected categories`}
              </p>
              {selectedCategories.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedCategories.length} categor{selectedCategories.length !== 1 ? "ies" : "y"} selected
                </p>
              )}
            </div>
          )}

          {/* Loading State */}
          {((searchLoading && debouncedQuery) || (allAnnoyancesLoading && selectedCategories.length > 0 && !debouncedQuery)) && (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <LoadingCard key={i} />
              ))}
            </div>
          )}

          {/* Error State */}
          {searchError && (
            <EmptyState
              icon={<Search className="h-12 w-12" />}
              title="Search failed"
              description="Something went wrong while searching. Please try again."
            />
          )}

          {/* Empty States */}
          {!searchLoading && !allAnnoyancesLoading && !debouncedQuery && selectedCategories.length === 0 && (
            <EmptyState
              icon={<Search className="h-12 w-12" />}
              title="Start searching"
              description="Enter a search term or select categories to find ideas and suggestions that interest you."
            />
          )}

          {!searchLoading && !allAnnoyancesLoading && (debouncedQuery || selectedCategories.length > 0) && filteredResults.length === 0 && !searchError && (
            <EmptyState
              icon={<Search className="h-12 w-12" />}
              title="No results found"
              description={
                debouncedQuery 
                  ? `No ideas found for "${debouncedQuery}"${selectedCategories.length > 0 ? " with the selected filters" : ""}.`
                  : "No ideas found in the selected categories."
              }
              action={
                (selectedCategories.length > 0 || debouncedQuery) ? (
                  <NeuButton variant="primary" onClick={clearFilters}>
                    Clear All Filters
                  </NeuButton>
                ) : undefined
              }
            />
          )}

          {/* Results */}
          {!searchLoading && !allAnnoyancesLoading && filteredResults.length > 0 && (
            <>
              {filteredResults.map((annoyance: Annoyance) => (
                <AnnoyanceCard
                  key={annoyance.id}
                  annoyance={annoyance}
                  onLike={handleLike}
                  onComment={() => handleComment(annoyance)}
                  onShare={handleShare}
                  onEdit={handleEditAnnoyance}
                  onDelete={handleDeleteAnnoyance}
                />
              ))}
            </>
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
