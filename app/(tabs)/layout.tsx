"use client"

import type React from "react"

import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Home, Search, Plus, User, Linkedin, Github, Mail } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { ContactModal } from "@/components/contact-modal"

const tabs = [
  { name: "Feed", href: "/feed", icon: Home },
  { name: "Search", href: "/search", icon: Search },
  { name: "Create", href: "/create", icon: Plus },
  { name: "Profile", href: "/profile", icon: User },
]

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { ready, authenticated, needsUsername, isLoadingProfile } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)

  useEffect(() => {
    const controlHeader = () => {
      if (typeof window !== 'undefined') {
        const currentScrollY = window.scrollY
        
        // Show header when scrolling up or at the top
        if (currentScrollY < lastScrollY || currentScrollY < 10) {
          setIsHeaderVisible(true)
        } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
          // Hide header when scrolling down after 100px
          setIsHeaderVisible(false)
        }
        
        setLastScrollY(currentScrollY)
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', controlHeader)
      return () => window.removeEventListener('scroll', controlHeader)
    }
  }, [lastScrollY])

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/")
    } else if (ready && needsUsername) {
      router.push("/username")
    }
  }, [ready, authenticated, needsUsername, router])

  if (!ready || isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!authenticated || needsUsername) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <header className={cn(
        "fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-md border-b border-border neu-flat z-50 transition-transform duration-300 ease-in-out",
        isHeaderVisible ? "translate-y-0" : "-translate-y-full"
      )}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-neutral-800 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <span className="text-xl font-bold text-foreground">Gotcha</span>
          </div>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span className="hidden md:inline">Created by Thomas Fevre</span>
            <button
              onClick={() => setIsContactModalOpen(true)}
              className="flex items-center space-x-1 hover:text-foreground transition-colors cursor-pointer"
            >
              <Mail className="h-4 w-4" />
              <span>Contact</span>
            </button>
            <a 
              href="https://linkedin.com/in/thomas-fevre-6853b51a1" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-2 hover:text-foreground transition-colors"
            >
              <Linkedin className="h-4 w-4" />
            </a>
            <a 
              href="https://github.com/thomasfevre" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="h-5 w-5" />
            </a>
            
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="pt-16 pb-20">{children}</main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border neu-raised">
        <div className="flex items-center justify-around py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = pathname === tab.href

            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200",
                  isActive
                    ? "neu-inset text-primary"
                    : "neu-flat hover:neu-inset text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs mt-1">{tab.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Contact Modal */}
      <ContactModal 
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
    </div>
  )
}
