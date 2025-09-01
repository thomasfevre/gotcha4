import type * as React from "react"
import { cn } from "@/lib/utils"


function NeuCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "neu-raised bg-gradient-to-br from-neutral-100 to-neutral-300 text-card-foreground rounded-3xl p-8 shadow-xl border border-neutral-300 transition-all duration-200 backdrop-blur-sm shadow-neutral-400/40 dark:from-neutral-800 dark:to-neutral-900 dark:border-neutral-600 dark:text-neutral-100 dark:shadow-neutral-900/50",
        className
      )}
      {...props}
    />
  )
}

function NeuCardInset({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "neu-inset bg-gradient-to-br from-neutral-100 to-neutral-200/60 text-card-foreground rounded-3xl p-8 shadow-inner border border-neutral-100 transition-all duration-200 backdrop-blur-sm dark:from-neutral-900 dark:to-neutral-800/60 dark:border-neutral-800 dark:text-neutral-100",
        className
      )}
      {...props}
    />
  )
}

export { NeuCard, NeuCardInset }
