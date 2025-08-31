import type * as React from "react"
import { cn } from "@/lib/utils"


function NeuInput({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "neu-inset flex h-12 w-full min-w-0 rounded-xl border-2 border-neutral-300 bg-gradient-to-br from-neutral-200 to-neutral-100 px-5 py-3 text-base shadow-inner shadow-neutral-300/60 focus:from-neutral-100 focus:to-neutral-50 placeholder:text-neutral-500 selection:bg-primary selection:text-primary-foreground transition-all duration-200 outline-none file:inline-flex file:h-8 file:border-0 file:bg-transparent file:text-base file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus:ring-2 focus:ring-primary/40 focus:border-neutral-400 md:text-base",
        // Dark mode support
        "dark:border-neutral-600 dark:from-neutral-800 dark:to-neutral-900 dark:bg-gradient-to-br dark:text-neutral-100 dark:placeholder:text-neutral-400 dark:focus:from-neutral-700 dark:focus:to-neutral-800 dark:shadow-neutral-900/50 dark:focus:border-neutral-500",
        className,
      )}
      {...props}
    />
  )
}

export { NeuInput }
