/**
 * Security validation utilities for user input
 * Prevents malicious content and ensures data integrity
 */

// Common patterns for potentially malicious content
const MALICIOUS_PATTERNS = [
  // SQL injection patterns
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
  
  // XSS patterns
  /<script[^>]*>.*?<\/script>/gi,
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /onload\s*=/gi,
  /onerror\s*=/gi,
  /onclick\s*=/gi,
  /onmouseover\s*=/gi,
  
  // HTML injection
  /<\s*\/?\s*(script|iframe|object|embed|form|input|meta|link)\b[^>]*>/gi,
  
  // Data URIs that could be malicious
  /data:(?!image\/(png|jpg|jpeg|gif|webp|svg\+xml))[^;,]+;base64/gi,
]

// URL patterns (basic detection)
const URL_PATTERNS = [
  // Basic URL detection
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi,
  /www\.[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi,
  // Email-like patterns that might be spam
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
]

// Excessive repetition patterns
const SPAM_PATTERNS = [
  // Repeated characters (more than 5 in a row)
  /(.)\1{5,}/g,
  // Repeated words
  /\b(\w+)\s+\1\s+\1/gi,
  // Excessive caps
  /[A-Z]{10,}/g,
  // Multiple exclamation/question marks
  /[!?]{5,}/g,
]

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  sanitized?: string
}

/**
 * Validates and sanitizes text content
 */
export function validateTextContent(
  content: string,
  options: {
    maxLength?: number
    minLength?: number
    allowUrls?: boolean
    fieldName?: string
  } = {}
): ValidationResult {
  const { maxLength = 1000, minLength = 1, allowUrls = false, fieldName = "content" } = options
  const errors: string[] = []

  // Basic validation
  if (!content || typeof content !== 'string') {
    return { isValid: false, errors: [`${fieldName} is required`] }
  }

  const trimmed = content.trim()

  if (trimmed.length < minLength) {
    errors.push(`${fieldName} must be at least ${minLength} characters`)
  }

  if (trimmed.length > maxLength) {
    errors.push(`${fieldName} must be less than ${maxLength} characters`)
  }

  // Check for malicious patterns
  for (const pattern of MALICIOUS_PATTERNS) {
    if (pattern.test(trimmed)) {
      errors.push(`${fieldName} contains potentially malicious content`)
      break
    }
  }

  // Check for URLs if not allowed
  if (!allowUrls) {
    for (const pattern of URL_PATTERNS) {
      if (pattern.test(trimmed)) {
        errors.push(`${fieldName} cannot contain URLs or links`)
        break
      }
    }
  }

  // Check for spam patterns
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(trimmed)) {
      errors.push(`${fieldName} contains spam-like content`)
      break
    }
  }

  // Sanitize content
  let sanitized = trimmed
    // Remove any remaining dangerous characters
    .replace(/[<>]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim()

  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  }
}

/**
 * Validates username
 */
export function validateUsername(username: string): ValidationResult {
  const errors: string[] = []

  if (!username || typeof username !== 'string') {
    return { isValid: false, errors: ['Username is required'] }
  }

  const trimmed = username.trim()

  // Length checks
  if (trimmed.length < 3) {
    errors.push('Username must be at least 3 characters')
  }

  if (trimmed.length > 20) {
    errors.push('Username must be less than 20 characters')
  }

  // Character validation - only alphanumeric and underscore
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    errors.push('Username can only contain letters, numbers, and underscores')
  }

  // Check for inappropriate content
  const inappropriateWords = ['admin', 'root', 'system', 'test', 'null', 'undefined']
  if (inappropriateWords.some(word => trimmed.toLowerCase().includes(word))) {
    errors.push('Username contains restricted words')
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: trimmed
  }
}

/**
 * Validates annoyance title
 */
export function validateAnnoyanceTitle(title: string): ValidationResult {
  return validateTextContent(title, {
    minLength: 5,
    maxLength: 100,
    allowUrls: false,
    fieldName: 'title'
  })
}

/**
 * Validates annoyance description
 */
export function validateAnnoyanceDescription(description: string): ValidationResult {
  return validateTextContent(description, {
    minLength: 10,
    maxLength: 1000,
    allowUrls: false,
    fieldName: 'description'
  })
}

/**
 * Validates comment content
 */
export function validateCommentContent(content: string): ValidationResult {
  return validateTextContent(content, {
    minLength: 1,
    maxLength: 500,
    allowUrls: false,
    fieldName: 'comment'
  })
}

/**
 * Rate limiting helper
 */
export function createRateLimiter() {
  const requests = new Map<string, number[]>()
  
  return {
    checkRateLimit(identifier: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
      const now = Date.now()
      const windowStart = now - windowMs
      
      if (!requests.has(identifier)) {
        requests.set(identifier, [])
      }
      
      const userRequests = requests.get(identifier)!
      
      // Remove old requests outside the window
      const validRequests = userRequests.filter(time => time > windowStart)
      
      if (validRequests.length >= maxRequests) {
        return false // Rate limit exceeded
      }
      
      // Add current request
      validRequests.push(now)
      requests.set(identifier, validRequests)
      
      return true // Request allowed
    }
  }
}

/**
 * Webhook signature validation for Supabase webhooks
 */
export function validateWebhookSignature(payload: string, signature: string | null): boolean {
  if (!signature) {
    console.warn("No webhook signature provided")
    return false
  }

  const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.warn("SUPABASE_WEBHOOK_SECRET not configured")
    return false
  }

  try {
    const crypto = require('crypto')
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload, 'utf8')
      .digest('hex')

    // Compare signatures securely
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch (error) {
    console.error("Error validating webhook signature:", error)
    return false
  }
}
