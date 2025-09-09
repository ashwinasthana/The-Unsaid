import { NextRequest } from "next/server"
import crypto from "crypto"

// Anti-tampering and request validation
export class AntiTamper {
  private static suspiciousHeaders = [
    'x-forwarded-host',
    'x-original-url', 
    'x-rewrite-url',
    'x-http-method-override',
    'x-http-method',
    'x-method-override'
  ]

  private static proxyHeaders = [
    'via',
    'x-forwarded-proto',
    'x-forwarded-port',
    'proxy-connection',
    'proxy-authorization'
  ]

  static validateRequest(request: NextRequest): { 
    isValid: boolean
    reason?: string 
    riskScore: number 
  } {
    let riskScore = 0
    const reasons: string[] = []

    // Check for proxy/interceptor signatures
    const userAgent = request.headers.get('user-agent') || ''
    if (this.detectBurpSuite(userAgent, request)) {
      riskScore += 50
      reasons.push('Proxy tool detected')
    }

    // Check for header manipulation
    if (this.detectHeaderManipulation(request)) {
      riskScore += 30
      reasons.push('Header manipulation detected')
    }

    // Check for timing attacks
    if (this.detectTimingAttack(request)) {
      riskScore += 25
      reasons.push('Timing attack pattern')
    }

    // Check for parameter pollution
    if (this.detectParameterPollution(request)) {
      riskScore += 20
      reasons.push('Parameter pollution')
    }

    return {
      isValid: riskScore < 50,
      reason: reasons.join(', '),
      riskScore
    }
  }

  private static detectBurpSuite(userAgent: string, request: NextRequest): boolean {
    // Burp Suite signatures
    const burpSignatures = [
      /burp/i,
      /suite/i,
      /proxy/i,
      /intercept/i,
      /java.*http/i
    ]

    // Check User-Agent
    if (burpSignatures.some(sig => sig.test(userAgent))) return true

    // Check for Burp's default headers
    const burpHeaders = [
      'x-burp-collaborator',
      'x-scanner-id',
      'x-forwarded-by'
    ]

    return burpHeaders.some(header => request.headers.has(header))
  }

  private static detectHeaderManipulation(request: NextRequest): boolean {
    // Check for suspicious headers
    const hasSuspiciousHeaders = this.suspiciousHeaders.some(header => 
      request.headers.has(header)
    )

    // Check for duplicate headers (header pollution)
    const headerNames = Array.from(request.headers.keys())
    const uniqueHeaders = new Set(headerNames.map(h => h.toLowerCase()))
    
    return hasSuspiciousHeaders || headerNames.length !== uniqueHeaders.size
  }

  private static detectTimingAttack(request: NextRequest): boolean {
    // Check for unusual timing patterns in headers
    const timestamp = request.headers.get('x-timestamp')
    const requestTime = request.headers.get('x-request-time')
    
    return !!(timestamp || requestTime)
  }

  private static detectParameterPollution(request: NextRequest): boolean {
    const url = new URL(request.url)
    const params = Array.from(url.searchParams.keys())
    const uniqueParams = new Set(params)
    
    return params.length !== uniqueParams.size
  }

  static generateCSRFToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  static validateCSRFToken(token: string, expected: string): boolean {
    if (!token || !expected) return false
    return crypto.timingSafeEqual(
      Buffer.from(token, 'hex'),
      Buffer.from(expected, 'hex')
    )
  }

  static createSecurityHeaders() {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    }
  }
}