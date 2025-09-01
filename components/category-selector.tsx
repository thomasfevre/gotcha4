"use client"
import { useState } from "react"
import { Check, X } from "lucide-react"
import { NeuButton } from "@/components/ui/neu-button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { NeuCard } from "./ui/neu-card"

interface Category {
  id: number
  name: string
}

interface CategorySelectorProps {
  categories: Category[]
  selectedCategories: number[]
  onSelectionChange: (categoryIds: number[]) => void
  maxSelections?: number
  className?: string
}

export function CategorySelector({
  categories,
  selectedCategories,
  onSelectionChange,
  maxSelections = 3,
  className,
}: CategorySelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleCategory = (categoryId: number) => {
    const isSelected = selectedCategories.includes(categoryId)

    if (isSelected) {
      onSelectionChange(selectedCategories.filter((id) => id !== categoryId))
    } else if (selectedCategories.length < maxSelections) {
      onSelectionChange([...selectedCategories, categoryId])
    }
  }

  const clearAll = () => {
    onSelectionChange([])
  }

  return (
    <NeuCard 
          className="w-full max-h-[90vh] overflow-y-auto p-4"
          onClick={(e) => e.stopPropagation()}
        >
      {/* Selected Categories */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-muted-foreground">Selected:</span>
          {selectedCategories.map((categoryId) => {
            const category = categories.find((c) => c.id === categoryId)
            return category ? (
              <button
                key={categoryId}
                type="button"
                onClick={() => toggleCategory(categoryId)}
                className="neu-flat gap-1 cursor-pointer hover:neu-inset transition-all rounded-full px-3 py-1 text-sm"
            >
                {category.name}
                <X className="h-3 w-3 inline-block ml-1" />
            </button>
            ) : null
          })}
          <NeuButton variant="flat" size="sm" onClick={clearAll} className="text-xs">
            Clear All
          </NeuButton>
        </div>
      )}

      {/* Category Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            Categories ({selectedCategories.length}/{maxSelections})
          </span>
          {categories.length > 6 && (
            <NeuButton variant="flat" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="text-xs">
              {isExpanded ? "Show Less" : "Show All"}
            </NeuButton>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(isExpanded ? categories : categories.slice(0, 6)).map((category) => {
            const isSelected = selectedCategories.includes(category.id)
            const isDisabled = !isSelected && selectedCategories.length >= maxSelections

            return (
              <NeuButton
                key={category.id}
                variant={isSelected ? "primary" : "flat"}
                size="sm"
                onClick={() => toggleCategory(category.id)}
                disabled={isDisabled}
                className={cn("justify-between text-xs", isDisabled && "opacity-50 cursor-not-allowed")}
              >
                <span className="truncate">{category.name}</span>
                {isSelected && <Check className="h-3 w-3 flex-shrink-0" />}
              </NeuButton>
            )
          })}
        </div>
      </div>
    </NeuCard>
  )
}
