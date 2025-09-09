import { NextRequest } from "next/server"

// Advanced DDoS protection system
export class DDoSShield {
  private static requestCounts = new Map<string, { count: number; window: number; blocked: boolean }>()
  private static suspiciousPatterns = new Map<string, number>()
  private static globalRequestCount = 0
  private static lastReset = Date.now()

  static validateRequest(request: NextRequest): {
    allowed: boolean
    reason?: string
    action: 'allow' | 'rate_limit' | 'block' | 'challenge'
  } {
    const now = Date.now()
    const clientIP = this.getClientIP(request)
    const userAgent = request.headers.get('user-agent') || ''
    
    // Reset global counter every minute
    if (now - this.lastReset > 60000) {
      this.globalRequestCount = 0
      this.lastReset = now
    }

    // Global rate limiting (circuit breaker)
    this.globalRequestCount++
    if (this.globalRequestCount > 1000) { // 1000 requests per minute globally
      return { allowed: false, reason: 'Global rate limit exceeded', action: 'block' }
    }

    // Per-IP analysis
    const ipRecord = this.requestCounts.get(clientIP) || { count: 0, window: now, blocked: false }
    
    // Reset IP window every 10 seconds
    if (now - ipRecord.window > 10000) {
      ipRecord.count = 0
      ipRecord.window = now
      ipRecord.blocked = false
    }

    ipRecord.count++
    this.requestCounts.set(clientIP, ipRecord)

    // Aggressive rate limiting per IP
    if (ipRecord.count > 20) { // 20 requests per 10 seconds per IP
      ipRecord.blocked = true
      return { allowed: false, reason: 'IP rate limit exceeded', action: 'block' }
    }

    // Bot detection patterns
    const botScore = this.calculateBotScore(request, userAgent, ipRecord.count)
    if (botScore > 80) {
      return { allowed: false, reason: 'Bot detected', action: 'block' }
    }

    // Suspicious pattern detection
    const suspiciousScore = this.detectSuspiciousPatterns(request, clientIP)
    if (suspiciousScore > 70) {
      return { allowed: false, reason: 'Suspicious patterns', action: 'challenge' }
    }

    return { allowed: true, action: 'allow' }
  }

  private static calculateBotScore(request: NextRequest, userAgent: string, requestCount: number): number {
    let score = 0

    // Empty or suspicious user agents
    if (!userAgent || userAgent.length < 10) score += 40
    if (/bot|crawler|spider|scraper/i.test(userAgent)) score += 60
    if (/curl|wget|python|java|go-http/i.test(userAgent)) score += 50

    // Request frequency (high frequency = likely bot)
    if (requestCount > 15) score += 30
    if (requestCount > 10) score += 20

    // Missing common headers
    if (!request.headers.get('accept')) score += 20
    if (!request.headers.get('accept-language')) score += 15
    if (!request.headers.get('accept-encoding')) score += 15

    // Suspicious header patterns
    const referer = request.headers.get('referer')
    if (referer && !referer.includes(request.headers.get('host') || '')) score += 10

    return Math.min(score, 100)
  }

  private static detectSuspiciousPatterns(request: NextRequest, clientIP: string): number {
    let score = 0
    const url = request.url
    const method = request.method

    // Unusual request patterns
    if (method !== 'GET' && method !== 'POST') score += 30
    if (url.length > 500) score += 20
    if ((url.match(/\//g) || []).length > 10) score += 15

    // Track IP behavior
    const currentSuspicion = this.suspiciousPatterns.get(clientIP) || 0
    this.suspiciousPatterns.set(clientIP, currentSuspicion + 1)
    
    if (currentSuspicion > 50) score += 40

    return Math.min(score, 100)
  }

  private static getClientIP(request: NextRequest): string {
    return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
           request.headers.get('x-real-ip') ||
           request.headers.get('cf-connecting-ip') ||
           'unknown'
  }

  static getStats(): {
    globalRequests: number
    blockedIPs: number
    totalIPs: number
  } {
    const blockedCount = Array.from(this.requestCounts.values()).filter(r => r.blocked).length
    return {
      globalRequests: this.globalRequestCount,
      blockedIPs: blockedCount,
      totalIPs: this.requestCounts.size
    }
  }

  static cleanup(): void {
    const now = Date.now()
    // Clean up old records (older than 1 hour)
    for (const [ip, record] of this.requestCounts.entries()) {
      if (now - record.window > 3600000) {
        this.requestCounts.delete(ip)
      }
    }
    
    // Clean up suspicious patterns
    this.suspiciousPatterns.clear()
  }
}