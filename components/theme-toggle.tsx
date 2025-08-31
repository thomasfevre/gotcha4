"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { NeuButton } from "@/components/ui/neu-button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <NeuButton variant="flat" size="icon">
        <Sun className="h-4 w-4" />
      </NeuButton>
    )
  }

  return (
    <NeuButton
      variant="flat"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="transition-all duration-200"
    >
      {theme === "light" ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </NeuButton>
  )
}
