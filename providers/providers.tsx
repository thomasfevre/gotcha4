"use client"

import type React from "react"
import { PrivyProvider } from "./privy-provider"
import { ThemeProvider } from "@/components/theme-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <PrivyProvider>
        {children}
      </PrivyProvider>
    </ThemeProvider>
  )
}
