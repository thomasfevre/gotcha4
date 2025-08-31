"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

export default function UsernamePage() {
  const [username, setUsername] = useState("")
  const [error, setError] = useState("")
  const { createUser, isCreatingUser } = useAuth()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (username.length < 3) {
      setError("Username must be at least 3 characters")
      return
    }

    if (username.length > 20) {
      setError("Username must be less than 20 characters")
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("Username can only contain letters, numbers, and underscores")
      return
    }

    createUser(username)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8 neu-raised bg-card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Choose Your Username</h1>
            <p className="text-muted-foreground">Pick a unique username to get started</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your_username"
              className="neu-inset"
              disabled={isCreatingUser}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <Button
            type="submit"
            className="w-full neu-flat hover:neu-inset transition-all duration-200"
            size="lg"
            disabled={isCreatingUser || !username}
          >
            {isCreatingUser ? "Creating..." : "Continue"}
          </Button>
        </form>
      </Card>
    </div>
  )
}
