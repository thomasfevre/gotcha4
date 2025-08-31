import type * as React from "react"
import { cn } from "@/lib/utils"

function NeuTextarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "neu-inset placeholder:text-neutral-500 selection:bg-primary selection:text-primary-foreground flex min-h-[80px] w-full rounded-xl border-2 border-neutral-300 bg-gradient-to-br from-neutral-200 to-neutral-100 px-4 py-3 text-base shadow-inner shadow-neutral-300/60 transition-all duration-200 outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus:neu-flat focus:border-neutral-400 focus:ring-2 focus:ring-primary/40 md:text-sm resize-none",
        // Dark mode support
        "dark:border-neutral-600 dark:from-neutral-800 dark:to-neutral-900 dark:bg-gradient-to-br dark:text-neutral-100 dark:placeholder:text-neutral-400 dark:shadow-neutral-900/50 dark:focus:border-neutral-500",
        className,
      )}
      {...props}
    />
  )
}

export { NeuTextarea }
