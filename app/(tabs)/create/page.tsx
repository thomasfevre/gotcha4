"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Camera, X, Plus, ExternalLink } from "lucide-react"
import { useCreateAnnoyance, useAnnoyance, useUpdateAnnoyance } from "@/hooks/use-annoyances"
import { useCategories } from "@/hooks/use-categories"
import { usePrivy } from "@privy-io/react-auth"
import { NeuCard } from "@/components/ui/neu-card"
import { NeuButton } from "@/components/ui/neu-button"
import { NeuInput } from "@/components/ui/neu-input"
import { NeuTextarea } from "@/components/ui/neu-textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CategorySelector } from "@/components/category-selector"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useToast } from "@/hooks/use-toast"
import type { CreateAnnoyanceRequest, UpdateAnnoyanceRequest, ExternalLink as ExternalLinkType } from "@/lib/schemas"

export default function CreatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')
  const isEditMode = !!editId
  
  const { getAccessToken } = usePrivy()
  const createAnnoyance = useCreateAnnoyance()
  const updateAnnoyance = useUpdateAnnoyance()
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories()
  const { data: editData, isLoading: editLoading } = useAnnoyance(editId ? parseInt(editId) : 0)
  const { toast } = useToast()

  const [formData, setFormData] = useState<CreateAnnoyanceRequest>({
    title: "",
    description: "",
    image_url: undefined,
    external_links: [],
    categories: [],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [newLink, setNewLink] = useState<{ type: string; url: string; label: string }>({
    type: "",
    url: "",
    label: "",
  })
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  // Pre-fill form data when editing
  useEffect(() => {
    if (isEditMode && editData?.annoyance) {
      const annoyance = editData.annoyance
      setFormData({
        title: annoyance.title,
        description: annoyance.description,
        image_url: annoyance.image_url,
        external_links: annoyance.external_links || [],
        categories: annoyance.categories?.map(cat => cat.id.toString()) || [],
      })
    }
  }, [isEditMode, editData])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (formData.title.length < 5) {
      newErrors.title = "Title must be at least 5 characters"
    } else if (formData.title.length > 100) {
      newErrors.title = "Title must be less than 100 characters"
    }

    if (formData.description.length < 10) {
      newErrors.description = "Description must be at least 10 characters"
    } else if (formData.description.length > 1000) {
      newErrors.description = "Description must be less than 1000 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Auto-save any pending external link before submitting
    if (newLink.type && newLink.url) {
      try {
        new URL(newLink.url) // Validate URL
        const link: ExternalLinkType = {
          type: newLink.type as ExternalLinkType["type"],
          url: newLink.url,
          label: newLink.label || undefined,
        }
        setFormData((prev) => ({
          ...prev,
          external_links: [...(prev.external_links || []), link],
        }))
        setNewLink({ type: "", url: "", label: "" })
      } catch {
        // Invalid URL, don't auto-add but continue with submission
        console.warn("Invalid URL in external link field, not auto-adding")
      }
    }

    if (!validateForm()) return

    try {
      if (isEditMode && editId) {
        const updateData: UpdateAnnoyanceRequest = {
          title: formData.title,
          description: formData.description,
          image_url: formData.image_url,
          external_links: formData.external_links,
          categories: formData.categories,
        }
        await updateAnnoyance.mutateAsync({ 
          annoyanceId: parseInt(editId), 
          data: updateData 
        })
        toast({
          title: "Idea updated!",
          description: "Your idea has been updated successfully.",
        })
      } else {
        await createAnnoyance.mutateAsync(formData)
        toast({
          title: "Idea shared!",
          description: "Your idea has been shared with the community.",
        })
      }
      router.push("/feed?type=recent")
    } catch (error) {
      toast({
        title: `Failed to ${isEditMode ? 'update' : 'share'} idea`,
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      })
      return
    }

    setIsUploadingImage(true)
    try {
      const token = await getAccessToken()
      if (!token) throw new Error("No access token")

      const formData = new FormData()
      formData.append("image", file)

      const response = await fetch("/api/annoyances/image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to upload image")
      }

      const result = await response.json()
      setFormData((prev) => ({ ...prev, image_url: result.imageUrl }))
      
      toast({
        title: "Image uploaded!",
        description: "Your image has been uploaded successfully.",
      })
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingImage(false)
    }
  }

  const removeImage = async () => {
    const currentImageUrl = formData.image_url
    if (!currentImageUrl) return

    // Remove from form state immediately for UI responsiveness
    setFormData((prev) => ({ ...prev, image_url: undefined }))

    // If this is a blob URL (temporary), don't try to delete from server
    if (currentImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(currentImageUrl)
      return
    }

    try {
      const token = await getAccessToken()
      if (!token) return // Fail silently for image cleanup

      await fetch("/api/annoyances/image", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl: currentImageUrl }),
      })
    } catch (error) {
      console.error("Failed to delete image from storage:", error)
      // Don't show error to user as the image is already removed from UI
    }
  }

  const addExternalLink = () => {
    if (!newLink.type || !newLink.url) return

    try {
      new URL(newLink.url) // Validate URL
    } catch {
      setErrors((prev) => ({ ...prev, externalLink: "Please enter a valid URL" }))
      return
    }

    const link: ExternalLinkType = {
      type: newLink.type as ExternalLinkType["type"],
      url: newLink.url,
      label: newLink.label || undefined,
    }

    setFormData((prev) => ({
      ...prev,
      external_links: [...(prev.external_links || []), link],
    }))

    setNewLink({ type: "", url: "", label: "" })
    setErrors((prev) => ({ ...prev, externalLink: "" }))
  }

  const removeExternalLink = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      external_links: prev.external_links?.filter((_, i) => i !== index),
    }))
  }

  if (categoriesLoading || (isEditMode && editLoading)) {
    return (
      <div className="container mx-auto px-4 py-6 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          {isEditMode ? 'Edit Your Idea' : 'Share Your Ideas'}
        </h1>
        <p className="text-muted-foreground">
          {isEditMode ? 'Update your idea and suggestions' : 'Tell the community about your suggestions and ideas'}
        </p>
      </div>

      <NeuCard className="p-4 sm:p-6 lg:p-8">
        <form className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="px-5">Title *</Label>
            <NeuInput
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="What's your idea or suggestion?"
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
            <p className="text-xs text-muted-foreground px-5">{formData.title.length}/100</p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="px-5">Description *</Label>
            <NeuTextarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your idea in detail. What could be improved and how?"
              className={`min-h-[120px] ${errors.description ? "border-destructive" : ""}`}
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
            <p className="text-xs text-muted-foreground px-5">{formData.description.length}/1000</p>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="px-5">Image (Optional)</Label>
            {formData.image_url ? (
              <div className="relative neu-inset rounded-lg overflow-hidden">
                <img
                  src={formData.image_url || "/placeholder.svg"}
                  alt="Upload preview"
                  className="w-full h-48 object-cover"
                />
                <NeuButton
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={removeImage}
                  className="absolute top-2 right-2"
                >
                  <X className="h-4 w-4" />
                </NeuButton>
              </div>
            ) : (
              <label className={`neu-flat hover:neu-inset transition-all duration-200 cursor-pointer rounded-lg p-8 flex flex-col items-center justify-center text-muted-foreground ${isUploadingImage ? 'pointer-events-none opacity-50' : ''}`}>
                {isUploadingImage ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="text-sm mt-2">Uploading image...</span>
                  </>
                ) : (
                  <>
                    <Camera className="h-8 w-8 mb-2" />
                    <span className="text-sm">Click to add an image</span>
                  </>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  className="hidden" 
                  disabled={isUploadingImage}
                />
              </label>
            )}
          </div>

          {/* Categories */}
          {categoriesData?.categories && (
            <div className="space-y-8 my-20">
              <CategorySelector
                categories={categoriesData.categories}
                selectedCategories={(formData.categories || []).map(Number)}
                onSelectionChange={(categoryIds) => setFormData((prev) => ({ ...prev, categories: categoryIds.map(String) }))}
              />
            </div>
          )}

          {/* External Links */}
          <div className="space-y-4 mt-8">
            <Label>External Links (Optional)</Label>
            
            {/* Existing Links */}
            {formData.external_links && formData.external_links.length > 0 && (
              <div className="space-y-2">
                {formData.external_links.map((link, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 neu-inset rounded-lg">
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {link.label || link.type}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                    </div>
                    <NeuButton
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => removeExternalLink(index)}
                    >
                      <X className="h-4 w-4" />
                    </NeuButton>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Link */}
            <div className={`space-y-3 p-4 rounded-lg transition-all duration-200 ${
              newLink.type && newLink.url ? 'neu-inset border-2 border-primary/30' : 'neu-inset'
            }`}>
              
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-center">
                  {/* <Label htmlFor="linkType" className="text-xs px-5">Type :</Label> */}
                  <Select
                    value={newLink.type}
                    onValueChange={(value) => setNewLink((prev) => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger className="neu-inset bg-gradient-to-br from-neutral-200 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="twitter">Twitter/X</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="github">GitHub</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="linkUrl" className="text-xs mb-2 px-5">URL</Label>
                  <NeuInput
                    id="linkUrl"
                    value={newLink.url}
                    onChange={(e) => setNewLink((prev) => ({ ...prev, url: e.target.value }))}
                    placeholder="https://example.com"
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="linkLabel" className="text-xs mb-2 px-5">Label (Optional)</Label>
                  <NeuInput
                    id="linkLabel"
                    value={newLink.label}
                    onChange={(e) => setNewLink((prev) => ({ ...prev, label: e.target.value }))}
                    placeholder="Custom label"
                    className="text-sm"
                  />
                </div>

                <div className="flex justify-end">
                  <NeuButton
                    type="button"
                    variant={newLink.type && newLink.url ? "primary" : "flat"}
                    size="sm"
                    onClick={addExternalLink}
                    disabled={!newLink.type || !newLink.url}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    {newLink.type && newLink.url ? 'Add This Link' : 'Add Link'}
                  </NeuButton>
                </div>
              </div>

              {errors.externalLink && (
                <p className="text-sm text-destructive">{errors.externalLink}</p>
              )}
              
              {/* Helper text */}
              {!newLink.type && !newLink.url && (
                <p className="text-xs text-muted-foreground px-4">
                  Add links to showcase your idea (GitHub repo, demo, social media, etc.)
                </p>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <NeuButton
              type="button"
              variant="flat"
              onClick={() => router.back()}
              className="flex-1"
              disabled={createAnnoyance.isPending || isUploadingImage}
            >
              Cancel
            </NeuButton>
            <NeuButton
              type="button"
              variant="primary"
              className="flex-1"
              disabled={(isEditMode ? updateAnnoyance.isPending : createAnnoyance.isPending) || !formData.title.trim() || !formData.description.trim() || isUploadingImage}
              onClick={handleSubmit}
            >
              {(isEditMode ? updateAnnoyance.isPending : createAnnoyance.isPending) ? (
                <>
                  <LoadingSpinner size="sm" />
                  {isEditMode ? 'Updating...' : 'Sharing...'}
                </>
              ) : isUploadingImage ? (
                <>
                  <LoadingSpinner size="sm" />
                  Uploading...
                </>
              ) : (
                isEditMode ? 'Update Idea' : 'Share Idea'
              )}
            </NeuButton>
          </div>
        </form>
      </NeuCard>
    </div>
  )
}
