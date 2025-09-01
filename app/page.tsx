"use client"

import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Github, Linkedin, Star, Users, MessageCircle, Shield } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function HomePage() {
  const { ready, authenticated, needsUsername, login } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (ready && authenticated && !needsUsername) {
      router.push("/feed")
    } else if (ready && needsUsername) {
      router.push("/username")
    }
  }, [ready, authenticated, needsUsername, router])

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (authenticated) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-primary/10 dark:bg-black/50">  

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Navigation */}
        <nav className="flex justify-between p-5 mt-auto">
          <div className="flex items-center space-x-4 ml-4">
            <div className="w-8 h-8 bg-gradient-to-br from-neutral-800 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <span className="text-xl font-bold text-foreground">Gotcha</span>
          </div>
          
          <div className="flex items-center space-x-4 sm:space-x-10">
            <a 
              href="https://github.com/thomasfevre/gotcha4" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="h-5 w-5" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
            <Button 
              variant="secondary" 
              onClick={login}
              className="text-muted-foreground hover:text-foreground"
            >
              Sign In
            </Button>
            <ThemeToggle />
          </div>
        </nav>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20 flex flex-grow">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                  A simple place to share your{" "}
                  <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    ideas & opinions
                  </span>
                </h1>
                
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Gotcha connects people with ideas and vision to developers with the skills to make them real. Share what you want to see built, or help bring new ideas to life.
                </p>
              </div>

              {/* CTA Buttons */}
              
                <Button onClick={login} size="lg" className="text-lg px-8 py-6">
                    Get Started
                </Button>
             

              {/* Social Proof */}
              <div className="flex items-center space-x-6 text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span className="text-sm">Join thousands of users</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span className="text-sm">Secure & Private</span>
                </div>
              </div>
            </div>

            {/* Right Column - Feature Cards */}
            <div className="space-y-6">
              <Card className="p-6 neu-raised bg-card/90 backdrop-blur-sm border-0">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Share & Connect</h3>
                    <p className="text-muted-foreground">
                      Share your thoughts and ideas and connect with developers who can help bring them to life.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 neu-raised bg-card/90 backdrop-blur-sm border-0">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-bl from-purple-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Find Your Community</h3>
                    <p className="text-muted-foreground">
                      Discover new projects and build a community around innovative ideas.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 neu-raised bg-card/90 backdrop-blur-sm border-0">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Get Support</h3>
                    <p className="text-muted-foreground">
                      Get feedback and support when others relate to your ideas and contribute to making them reality.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-stretch justify-center p-2 sm:p-5 mt-auto">
          <footer className="w-full max-w-7xl mx-4 sm:mx-8 lg:mx-20 p-4 sm:p-6 border-t border-border/50 rounded-2xl bg-background/80 backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                {/* Top section - Creator info and LinkedIn */}
                <div className="flex flex-col sm:flex-row items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-muted-foreground">
                    <span className="text-center sm:text-left">Created by Thomas Fevre</span>
                    <a 
                      href="https://linkedin.com/in/thomas-fevre-6853b51a1" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 hover:text-foreground transition-colors w-[105px]"
                    >
                      <span className="hidden xs:inline">Connect on LinkedIn</span>
                      <span className="xs:hidden">LinkedIn</span>
                      <Linkedin className="h-4 w-4" />
                    
                  </a>
                  <a 
                    href="https://github.com/thomasfevre" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors w-[80px]"
                  >
                    <span>GitHub</span>
                    <Github className="h-5 w-5" />
                  </a>
                  </div>
                </div>
                
                {/* Bottom section - Copyright */}
                <span className="text-xs sm:text-sm text-muted-foreground text-center">
                  © 2025 Gotcha. All rights reserved.
                </span>
              </div>
          </footer>
        </div>
      </div>
    </div>
  )
}
