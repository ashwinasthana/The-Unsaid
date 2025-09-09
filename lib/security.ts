import DOMPurify from 'isomorphic-dompurify'

// Comprehensive XSS and malicious content patterns
const MALICIOUS_PATTERNS = [
  // Script tags and variations
  /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
  /<script[\s\S]*?>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /data:text\/html/gi,
  
  // Event handlers
  /on\w+\s*=/gi,
  /onclick/gi,
  /onload/gi,
  /onerror/gi,
  /onmouseover/gi,
  /onfocus/gi,
  /onblur/gi,
  
  // HTML tags that can execute code
  /<iframe[\s\S]*?>/gi,
  /<object[\s\S]*?>/gi,
  /<embed[\s\S]*?>/gi,
  /<applet[\s\S]*?>/gi,
  /<meta[\s\S]*?>/gi,
  /<link[\s\S]*?>/gi,
  /<style[\s\S]*?>/gi,
  /<form[\s\S]*?>/gi,
  /<input[\s\S]*?>/gi,
  /<button[\s\S]*?>/gi,
  
  // Base64 encoded scripts
  /data:[\w\/]+;base64,/gi,
  
  // Expression and eval patterns
  /expression\s*\(/gi,
  /eval\s*\(/gi,
  /setTimeout\s*\(/gi,
  /setInterval\s*\(/gi,
  
  // URL schemes
  /file:/gi,
  /ftp:/gi,
  
  // CSS injection
  /url\s*\(/gi,
  /@import/gi,
  
  // SQL injection patterns
  /union\s+select/gi,
  /drop\s+table/gi,
  /delete\s+from/gi,
  /insert\s+into/gi,
  /update\s+set/gi,
  
  // Command injection
  /\|\s*\w+/g,
  /;\s*\w+/g,
  /&&\s*\w+/g,
  /\$\(/g,
  /`[\s\S]*?`/g,
]

// Suspicious character sequences
const SUSPICIOUS_CHARS = [
  /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, // Control characters
  /[\uFEFF\uFFFE\uFFFF]/g, // Unicode BOM and invalid chars
  /[\u202A-\u202E]/g, // Text direction override
]

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export class SecurityValidator {
  /**
   * Comprehensive input sanitization
   */
  static sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') return ''
    
    // Remove suspicious characters
    let sanitized = input
    SUSPICIOUS_CHARS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '')
    })
    
    // Remove malicious patterns
    MALICIOUS_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '')
    })
    
    // Use DOMPurify for additional sanitization
    sanitized = DOMPurify.sanitize(sanitized, {
      ALLOWED_TAGS: [], // No HTML tags allowed
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
    })
    
    // Additional cleanup
    sanitized = sanitized
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
    
    return sanitized
  }

  /**
   * Validate input content and length
   */
  static validateInput(input: string, maxLength = 1000, minLength = 1): {
    isValid: boolean
    error?: string
  } {
    if (!input || typeof input !== 'string') {
      return { isValid: false, error: 'Input is required' }
    }

    if (input.length < minLength) {
      return { isValid: false, error: `Input must be at least ${minLength} characters` }
    }

    if (input.length > maxLength) {
      return { isValid: false, error: `Input must not exceed ${maxLength} characters` }
    }

    // Check for malicious patterns
    const hasMaliciousContent = MALICIOUS_PATTERNS.some(pattern => pattern.test(input))
    if (hasMaliciousContent) {
      return { isValid: false, error: 'Invalid content detected' }
    }

    // Check for suspicious characters
    const hasSuspiciousChars = SUSPICIOUS_CHARS.some(pattern => pattern.test(input))
    if (hasSuspiciousChars) {
      return { isValid: false, error: 'Invalid characters detected' }
    }

    return { isValid: true }
  }

  /**
   * Advanced rate limiting with IP tracking
   */
  static checkRateLimit(
    identifier: string,
    maxRequests = 5,
    windowMs = 3600000 // 1 hour
  ): { allowed: boolean; resetTime?: number } {
    const now = Date.now()
    const record = rateLimitStore.get(identifier)

    if (!record || now > record.resetTime) {
      // Create new record or reset expired one
      rateLimitStore.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      })
      return { allowed: true }
    }

    if (record.count >= maxRequests) {
      return { allowed: false, resetTime: record.resetTime }
    }

    // Increment count
    record.count++
    rateLimitStore.set(identifier, record)
    return { allowed: true }
  }

  /**
   * Validate recipient name specifically
   */
  static validateRecipientName(name: string): { isValid: boolean; error?: string } {
    const sanitized = this.sanitizeInput(name)
    
    // Only allow letters, spaces, hyphens, and apostrophes
    const namePattern = /^[a-zA-Z\s\-']+$/
    if (!namePattern.test(sanitized)) {
      return { isValid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' }
    }

    return this.validateInput(sanitized, 50, 1)
  }

  /**
   * Validate message content
   */
  static validateMessage(message: string): { isValid: boolean; error?: string } {
    const sanitized = this.sanitizeInput(message)
    
    // Check for excessive repetition (spam indicator)
    const words = sanitized.split(/\s+/)
    const uniqueWords = new Set(words)
    if (words.length > 10 && uniqueWords.size / words.length < 0.3) {
      return { isValid: false, error: 'Message appears to be spam' }
    }

    return this.validateInput(sanitized, 2000, 1)
  }

  /**
   * Get client IP from request headers
   */
  static getClientIP(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const cfIP = request.headers.get('cf-connecting-ip')
    
    return (
      forwarded?.split(',')[0]?.trim() ||
      realIP ||
      cfIP ||
      'unknown'
    )
  }

  /**
   * Clean up expired rate limit records
   */
  static cleanupRateLimit(): void {
    const now = Date.now()
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) {
        rateLimitStore.delete(key)
      }
    }
  }
}

// Clean up rate limit records every hour
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    SecurityValidator.cleanupRateLimit()
  }, 3600000) // 1 hour
}