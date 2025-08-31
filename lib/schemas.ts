import { z } from "zod"

// User profile schema
export const ProfileSchema = z.object({
  id: z.string(),
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  bio: z.string().max(500).optional(),
  profile_image_url: z.string().url().optional(),
  notification_email: z.string().email().optional(),
  notifications_enabled: z.boolean().default(true),
  created_at: z.string().datetime(),
})

// External link schema
export const ExternalLinkSchema = z.object({
  type: z.enum(["twitter", "linkedin", "github", "instagram", "youtube", "website", "other"]),
  url: z.string().url(),
  label: z.string().optional(),
})

// Annoyance schema
export const AnnoyanceSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  title: z.string().min(5).max(100),
  description: z.string().min(10).max(1000),
  image_url: z.string().url().optional(),
  external_links: z.array(ExternalLinkSchema).optional().nullable(),
  created_at: z.string().datetime(),
  username: z.string().optional(),
  bio: z.string().optional(),
  profile_image_url: z.string().url().optional(),
  like_count: z.number().optional(),
  comment_count: z.number().optional(),
  is_liked: z.boolean().optional(),
  categories: z.array(z.object({ id: z.number(), name: z.string() })).optional(),
})

// Create annoyance request schema
export const CreateAnnoyanceSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(10).max(1000),
  image_url: z.string().url().optional().nullable(),
  external_links: z.array(ExternalLinkSchema).optional().nullable(),
  categories: z.array(z.string()).optional(),
})

// Comment schema
export const CommentSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  annoyance_id: z.number(),
  content: z.string().min(1).max(500),
  created_at: z.string().datetime(),
  username: z.string().optional(),
})

// Create comment request schema
export const CreateCommentSchema = z.object({
  content: z.string().min(1).max(500),
})

// Update annoyance request schema  
export const UpdateAnnoyanceSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(10).max(1000),
  image_url: z.string().url().optional().nullable(),
  external_links: z.array(ExternalLinkSchema).optional().nullable(),
  categories: z.array(z.string()).optional(),
})

export type Profile = z.infer<typeof ProfileSchema>
export type ExternalLink = z.infer<typeof ExternalLinkSchema>
export type Annoyance = z.infer<typeof AnnoyanceSchema>
export type CreateAnnoyanceRequest = z.infer<typeof CreateAnnoyanceSchema>
export type UpdateAnnoyanceRequest = z.infer<typeof UpdateAnnoyanceSchema>
export type Comment = z.infer<typeof CommentSchema>
export type CreateCommentRequest = z.infer<typeof CreateCommentSchema>
