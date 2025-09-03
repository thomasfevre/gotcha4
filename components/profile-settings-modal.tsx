"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { usePrivy } from "@privy-io/react-auth"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NeuButton } from "@/components/ui/neu-button"
import { NeuInput } from "@/components/ui/neu-input"
import { NeuTextarea } from "@/components/ui/neu-textarea"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload, Trash2, Loader2, User, Bell, ShieldAlert, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useQueryClient } from "@tanstack/react-query"

interface ProfileSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ProfileSettingsModal({ isOpen, onClose }: ProfileSettingsModalProps) {
  const { userProfile, logout } = useAuth()
  const { getAccessToken } = usePrivy()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [username, setUsername] = useState("")
  const [bio, setBio] = useState("")
  const [profileImageUrl, setProfileImageUrl] = useState<string>("")
  const [notificationEmail, setNotificationEmail] = useState("")
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [activeTab, setActiveTab] = useState("account")

  // Initialize form values when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setUsername(userProfile.username || "")
      setBio(userProfile.bio || "")
      setProfileImageUrl(userProfile.profile_image_url || "")
      setNotificationEmail(userProfile.notification_email || "")
      setNotificationsEnabled(userProfile.notifications_enabled ?? true)
    }
  }, [userProfile])

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please select an image file.", variant: "destructive" })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please select an image smaller than 5MB.", variant: "destructive" })
      return
    }

    setIsUploadingImage(true)
    try {
      const token = await getAccessToken()
      if (!token) throw new Error("No access token")

      const formData = new FormData()
      formData.append("image", file)

      const response = await fetch("/api/profile/image", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to upload image")
      }

      const result = await response.json()
      setProfileImageUrl(result.imageUrl)
      queryClient.setQueryData(["user-profile"], result.profile)
      toast({ title: "Image uploaded!", description: "Your profile image has been updated." })
    } catch (error) {
      toast({ title: "Upload failed", description: error instanceof Error ? error.message : "Failed to upload image. Please try again.", variant: "destructive" })
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleRemoveImage = async () => {
    if (!profileImageUrl) return

    setIsUploadingImage(true)
    try {
      const token = await getAccessToken()
      if (!token) throw new Error("No access token")

      const response = await fetch("/api/profile/image", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to remove image")
      }

      const result = await response.json()
      setProfileImageUrl("")
      queryClient.setQueryData(["user-profile"], result.profile)
      toast({ title: "Image removed!", description: "Your profile image has been removed." })
    } catch (error) {
      toast({ title: "Remove failed", description: error instanceof Error ? error.message : "Failed to remove image. Please try again.", variant: "destructive" })
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleUpdateProfile = async () => {
    if (!username.trim()) {
      toast({ title: "Username required", description: "Please enter a username.", variant: "destructive" })
      return
    }

    setIsUpdating(true)
    try {
      const token = await getAccessToken()
      if (!token) throw new Error("No access token")

      const updates: { [key: string]: any } = {}
      if (username !== userProfile?.username && username !== '') updates.username = username
      if (bio !== userProfile?.bio && bio !== '') updates.bio = bio
      if (notificationEmail !== userProfile?.notification_email && notificationEmail !== '') updates.notification_email = notificationEmail
      if (notificationsEnabled !== userProfile?.notifications_enabled) updates.notifications_enabled = notificationsEnabled

      if (Object.keys(updates).length === 0) {
        toast({ title: "No changes detected", description: "Please make changes to your profile before saving." })
        setIsUpdating(false)
        return
      }

      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update profile")
      }

      const result = await response.json()
      queryClient.setQueryData(["user-profile"], result.profile)
      toast({ title: "Profile updated!", description: "Your profile has been successfully updated." })
      onClose()
    } catch (error) {
      toast({ title: "Update failed", description: error instanceof Error ? error.message : "Something went wrong. Please try again.", variant: "destructive" })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteAccount = async () => {
    setIsUpdating(true)
    try {
      const token = await getAccessToken()
      if (!token) throw new Error("No access token")

      const response = await fetch("/api/profile/delete", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete account")
      }

      toast({ title: "Account deleted", description: "Your account has been permanently deleted. You will be signed out shortly." })
      onClose()
      setTimeout(() => { logout() }, 2000)
    } catch (error) {
      toast({ title: "Deletion failed", description: error instanceof Error ? error.message : "Failed to delete account. Please try again.", variant: "destructive" })
    } finally {
      setIsUpdating(false)
      setShowDeleteConfirm(false)
      setDeleteConfirmText("")
    }
  }

  const noChangesMade =
    username === userProfile?.username &&
    bio === userProfile?.bio &&
    notificationEmail === userProfile?.notification_email &&
    notificationsEnabled === userProfile?.notifications_enabled

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-3xl p-4 sm:p-6 lg:p-8" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
          <DialogDescription>
            Update your profile information and settings.
          </DialogDescription>
          <NeuButton
            variant="flat"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-5 h-8 w-8"
          >
            <X className="h-3 w-3" />
          </NeuButton>
        </DialogHeader>

        <Tabs defaultValue="account" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 neu-inset p-1 h-auto">
            <TabsTrigger
              value="account"
              className="gap-2 cursor-pointer  hover:bg-neutral-200 dark:hover:bg-neutral-700"
            >
              <User className="h-4 w-4" />
              Account
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className=" gap-2 cursor-pointer  hover:bg-neutral-200 dark:hover:bg-neutral-700"
            >
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger
              value="danger"
              className=" gap-2 text-destructive/80 data-[state=active]:text-destructive cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700"
            >
              <ShieldAlert className="h-4 w-4" />
              Danger Zone
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="py-4 space-y-6">
            {/* Profile Picture */}
            <div className="space-y-2">
              <Label className="flex justify-center">Profile Picture</Label>
              <div className="flex items-center justify-center gap-4">
                <Avatar className="h-16 w-16 neu-raised">
                  {profileImageUrl ? (
                    <AvatarImage src={profileImageUrl} alt="Profile" className="object-cover" />
                  ) : (
                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                      {userProfile?.username?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex gap-2">
                  <label htmlFor="profile-upload">
                    <NeuButton variant="flat" size="sm" asChild disabled={isUploadingImage}>
                      <span className="cursor-pointer flex items-center">
                        {isUploadingImage ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                        {isUploadingImage ? "Uploading..." : "Upload"}
                      </span>
                    </NeuButton>
                  </label>
                  <input id="profile-upload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={isUploadingImage} />
                  {profileImageUrl && (
                    <NeuButton variant="flat" size="sm" onClick={handleRemoveImage} disabled={isUploadingImage}>
                      {isUploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remove"}
                    </NeuButton>
                  )}
                </div>
              </div>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username" className="px-5">Username</Label>
              <NeuInput id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your username" />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio" className="px-5">Bio</Label>
              <NeuTextarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself..." className="min-h-[80px]" maxLength={500} />
              <p className="text-xs text-muted-foreground px-5">{bio.length}/500</p>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="py-4 space-y-6">
            <div className="space-y-6 my-2">
              <Label htmlFor="notification-email" className="px-5">Notification Email</Label>
              <NeuInput id="notification-email" type="email" value={notificationEmail} onChange={(e) => setNotificationEmail(e.target.value)} placeholder="Enter email for notifications" />
              <p className="text-xs text-muted-foreground px-5">
                We'll email you when someone comments on your posts.
              </p>
            </div>
            <div className="flex items-center justify-between p-5">
              <div className="space-y-1">
                <Label htmlFor="notifications-enabled">Enable Notifications</Label>
                <p className="text-xs text-muted-foreground">Receive email notifications for new comments</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input id="notifications-enabled" type="checkbox" checked={notificationsEnabled} onChange={(e) => setNotificationsEnabled(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </TabsContent>

          <TabsContent value="danger" className="py-4 space-y-4">
            <div className="space-y-6 mt-2 mb-6 text-sm text-muted-foreground">
              <p>Deleting your account will:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Permanently remove your profile and personal information</li>
                <li>Remove all your likes and preferences</li>
                <li>Keep your posts and comments anonymous</li>
                <li>This action cannot be undone</li>
              </ul>
            </div>

            {!showDeleteConfirm ? (
              <div className="justify-center flex flex-col items-center"> 
              <NeuButton variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
                </NeuButton>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive font-medium">⚠️ Are you absolutely sure?</p>
                  <p className="text-xs text-destructive/80 mt-1">Type "DELETE" below to confirm account deletion:</p>
                  <NeuInput value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="Type DELETE to confirm" className="mt-2" />
                </div>
                <div className="flex gap-2">
                  <NeuButton variant="destructive" size="sm" onClick={handleDeleteAccount} disabled={isUpdating || deleteConfirmText !== "DELETE"}>
                    {isUpdating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Deleting...</> : "Delete Forever"}
                  </NeuButton>
                  <NeuButton variant="flat" size="sm" onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}>
                    Cancel
                  </NeuButton>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* only show this footer for the first 2 tabs */}
        {(activeTab === 'account' || activeTab === 'notifications') && (
          <DialogFooter className="flex flex-row justify-end gap-2">
            <NeuButton variant="flat" onClick={onClose}>
              Cancel
            </NeuButton>
            <NeuButton
              variant="primary"
              onClick={handleUpdateProfile}
              disabled={isUpdating || isUploadingImage || !username.trim() || noChangesMade}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Profile"
              )}
            </NeuButton>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
