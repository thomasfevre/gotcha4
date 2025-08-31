import { useState } from "react"
import { Filter, ChevronDown } from "lucide-react"
import { NeuButton } from "@/components/ui/neu-button"
import { NeuCard } from "@/components/ui/neu-card"
import type { FeedType } from "@/hooks/use-annoyances"

interface FeedFilterProps {
  currentFilter: FeedType
  onFilterChange: (filter: FeedType) => void
}

const filterOptions = [
  { value: 'default' as const, label: 'Smart Feed', description: 'Curated based on your interests' },
  { value: 'recent' as const, label: 'Most Recent', description: 'Latest posts first' },
  { value: 'liked' as const, label: 'Liked Posts', description: 'Posts you\'ve liked' },
]

export function FeedFilter({ currentFilter, onFilterChange }: FeedFilterProps) {
  const [isOpen, setIsOpen] = useState(false)

  const currentOption = filterOptions.find(option => option.value === currentFilter)

  const handleFilterSelect = (filter: FeedType) => {
    onFilterChange(filter)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <NeuButton
        variant="flat"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2 text-sm"
      >
        <Filter className="h-4 w-4" />
        {currentOption?.label}
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </NeuButton>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <NeuCard className="absolute top-full right-0 mt-2 w-64 z-50 p-2">
            <div className="space-y-1">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleFilterSelect(option.value)}
                  className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
                    currentFilter === option.value
                      ? 'neu-inset bg-primary/10 text-primary'
                      : 'neu-flat hover:bg-primary-foreground'
                  }`}
                >
                  <div className="font-medium text-sm">{option.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
          </NeuCard>
        </>
      )}
    </div>
  )
}
