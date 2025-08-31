import { createServerSupabaseClient } from "./supabase"
import { readFileSync } from "fs"
import { join } from "path"
import { PrivyClient } from "@privy-io/server-auth"

// Initialize Privy client for server-side token verification
const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
)

// Load blacklisted words from file
let BLACKLISTED_WORDS: string[] = []

try {
  const blacklistPath = join(process.cwd(), "lib", "blacklisted-words.txt")
  const blacklistContent = readFileSync(blacklistPath, "utf-8")
  BLACKLISTED_WORDS = blacklistContent
    .split('\n')
    .map(word => word.trim().toLowerCase())
    .filter(word => word.length > 0) // Remove empty lines
} catch (error) {
  console.error("Failed to load blacklisted words:", error)
  // Fallback to basic list if file can't be read
  BLACKLISTED_WORDS = [
    "spam",
    "scam", 
    "hate",
    "violence",
    "abuse",
    "harassment",
  ]
}

// Verify Privy JWT and extract user DID using official SDK
export async function verifyPrivyToken(token: string): Promise<string | null> {
  try {
    // Use official Privy SDK for secure token verification
    const verifiedClaims = await privy.verifyAuthToken(token)
    
    // Return the user's Privy DID from the verified claims
    return verifiedClaims.userId
  } catch (error) {
    console.error("Failed to verify Privy token:", error)
    return null
  }
}

// Get user information from Privy using user ID
export async function getPrivyUser(userId: string) {
  try {
    const user = await privy.getUser(userId)
    return user
  } catch (error) {
    console.error("Failed to get Privy user:", error)
    return null
  }
}

export async function getOrCreateUser(userId: string, username?: string, profileImageUrl?: string) {
  const supabase = await createServerSupabaseClient()

  // Check if user exists
  const { data: existingUser } = await supabase.from("profiles").select("*").eq("id", userId).single()

  if (existingUser) {
    // If user exists but doesn't have a profile image and we have one from social login, update it
    if (!existingUser.profile_image_url && profileImageUrl) {
      const { data: updatedUser, error } = await supabase
        .from("profiles")
        .update({ profile_image_url: profileImageUrl })
        .eq("id", userId)
        .select()
        .single()

      if (error) {
        console.error("Failed to update profile image:", error)
        return existingUser // Return existing user even if image update fails
      }

      return updatedUser
    }
    
    return existingUser
  }

  // Create new user if username provided
  if (username) {
    const { data: newUser, error } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        username: username,
        profile_image_url: profileImageUrl,
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return newUser
  }

  return null
}

export function moderateContent(content: string): boolean {
  const lowerContent = content.toLowerCase()
  return !BLACKLISTED_WORDS.some((word) => lowerContent.includes(word))
}
