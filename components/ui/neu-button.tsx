import type * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"


const neuButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-base font-semibold shadow-lg transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-5 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/60 bg-gradient-to-br cursor-pointer",
  {
    variants: {
      variant: {
        raised: "from-neutral-200 to-neutral-400 text-foreground hover:from-neutral-300 hover:to-neutral-500 active:from-neutral-400 active:to-neutral-600 shadow-neutral-400/30 border border-neutral-300 dark:from-neutral-600 dark:to-neutral-800 dark:text-neutral-100 dark:hover:from-neutral-500 dark:hover:to-neutral-700 dark:active:from-neutral-700 dark:active:to-neutral-900 dark:shadow-neutral-900/40 dark:border-neutral-700",
        flat: "from-neutral-100 to-neutral-200 text-foreground hover:from-neutral-200 hover:to-neutral-300 active:from-neutral-300 active:to-neutral-400 shadow-neutral-300/40 border border-neutral-200 dark:from-neutral-700 dark:to-neutral-900 dark:text-neutral-100 dark:hover:from-neutral-600 dark:hover:to-neutral-800 dark:active:from-neutral-800 dark:active:to-neutral-950 dark:shadow-neutral-900/50 dark:border-neutral-600",
        inset: "from-neutral-300 to-neutral-200 text-foreground border-2 border-neutral-400 hover:from-neutral-200 hover:to-neutral-100 active:from-neutral-400 active:to-neutral-300 shadow-inner shadow-neutral-400/50 dark:from-neutral-700 dark:to-neutral-600 dark:text-neutral-100 dark:border-neutral-500 dark:hover:from-neutral-600 dark:hover:to-neutral-500 dark:active:from-neutral-800 dark:active:to-neutral-700 dark:shadow-neutral-900/60",
        primary: "from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 active:from-primary/80 active:to-primary/60 shadow-primary/30 border border-primary/20",
        destructive: "from-destructive to-destructive/80 hover:from-destructive/90 hover:to-destructive/70 active:from-destructive/80 active:to-destructive/60 shadow-destructive/30 border border-destructive/20",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-lg px-2",
        lg: "h-14 rounded-2xl px-8 text-lg",
        icon: "size-12",
      },
    },
    defaultVariants: {
      variant: "raised",
      size: "default",
    },
  },
)

function NeuButton({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof neuButtonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return <Comp type="button" className={cn(neuButtonVariants({ variant, size, className }))} {...props} />
}

export { NeuButton, neuButtonVariants }
