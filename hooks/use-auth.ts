"use client"

import { usePrivy } from "@privy-io/react-auth"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import type { Profile } from "@/lib/schemas"

async function syncUser(token: string, username?: string, profileImageUrl?: string): Promise<{ user: Profile }> {
  const bodyData: any = {}
  
  if (username) bodyData.username = username
  if (profileImageUrl) bodyData.profile_image_url = profileImageUrl
  
  const hasBodyData = Object.keys(bodyData).length > 0

  const response = await fetch("/api/auth/sync-user", {
    method: hasBodyData ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: hasBodyData ? JSON.stringify(bodyData) : undefined,
  })

  if (!response.ok) {
    throw new Error("Failed to sync user")
  }

  return response.json()
}

export function useAuth() {
  const { ready, authenticated, getAccessToken, logout: privyLogout, login: privyLogin, user } = usePrivy()
  const router = useRouter()
  const queryClient = useQueryClient()

  // Helper function to get profile picture from social login
  const getProfilePictureUrl = () => {
    if (!user) return null

    // Only Twitter and Farcaster provide profile Picture Url
    if (user.twitter?.profilePictureUrl) return user.twitter.profilePictureUrl
    if (user.farcaster?.url) return user.farcaster.url

    return null
  }

  const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      if (!authenticated) return null
      const token = await getAccessToken()
      if (!token) return null
      
      // Get profile picture from social login if available
      const socialPictureUrl = getProfilePictureUrl()
      
      const result = await syncUser(token, undefined, socialPictureUrl)
      return result.user
    },
    enabled: ready && authenticated,
  })

  const createUserMutation = useMutation({
    mutationFn: async (username: string) => {
      const token = await getAccessToken()
      if (!token) throw new Error("No access token")
      
      // Get profile picture from social login if available
      const socialPictureUrl = getProfilePictureUrl()
      
      return syncUser(token, username, socialPictureUrl)
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["user-profile"], data.user)
      router.push("/feed")
    },
  })

  const logout = () => {
    queryClient.clear()
    privyLogout()
    router.push("/")
  }

  const login = async () => {
    privyLogin()
  }

  // Helper function to get the primary connection method
  const getConnectionMethod = () => {
    if (!user) return null
    console.log(user)
    // Check for social logins first
    if (user.google) return 'Google'
    if (user.twitter) return 'Twitter'
    if (user.github) return 'GitHub'
    if (user.discord) return 'Discord'
    if (user.email) return 'Email'
    if (user.wallet) return 'Wallet'
    
    return null
  }

  return {
    ready,
    authenticated,
    userProfile,
    isLoadingProfile,
    createUser: createUserMutation.mutate,
    isCreatingUser: createUserMutation.isPending,
    logout,
    login,
    needsUsername: authenticated && !isLoadingProfile && !userProfile,
    connectionMethod: getConnectionMethod(),
    socialProfilePicture: getProfilePictureUrl(),
  }
}
