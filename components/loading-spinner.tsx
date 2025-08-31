import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-muted-foreground/20 border-t-primary",
        sizeClasses[size],
        className,
      )}
    />
  )
}

export function LoadingCard() {
  return (
    <div className="neu-raised rounded-xl p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-full bg-muted neu-inset" />
        <div className="space-y-2">
          <div className="h-4 w-24 bg-muted rounded neu-inset" />
          <div className="h-3 w-16 bg-muted rounded neu-inset" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-5 w-3/4 bg-muted rounded neu-inset" />
        <div className="h-4 w-full bg-muted rounded neu-inset" />
        <div className="h-4 w-2/3 bg-muted rounded neu-inset" />
      </div>
    </div>
  )
}
