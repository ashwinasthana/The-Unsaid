import { NextRequest } from "next/server"
import crypto from "crypto"

// Military-grade security fortress
export class SecurityFortress {
  private static readonly THREAT_SIGNATURES = {
    // SQL Injection patterns
    SQL_INJECTION: [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
      /('|(\\x27)|(\\x2D\\x2D)|(%27)|(%2D%2D))/gi,
      /((\%3D)|(=))[^\n]*((\%27)|(\\x27)|(')|(\-\-)|(%3B)|(;))/gi,
      /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/gi,
      /((\%27)|(\'))union/gi,
      /exec(\s|\+)+(s|x)p\w+/gi,
      /UNION(?:\s+ALL)?\s+SELECT/gi
    ],
    
    // XSS patterns (comprehensive)
    XSS: [
      /<script[^>]*>.*?<\/script>/gis,
      /<iframe[^>]*>.*?<\/iframe>/gis,
      /<object[^>]*>.*?<\/object>/gis,
      /<embed[^>]*>/gi,
      /<applet[^>]*>.*?<\/applet>/gis,
      /<meta[^>]*>/gi,
      /<link[^>]*>/gi,
      /<style[^>]*>.*?<\/style>/gis,
      /<form[^>]*>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /data:text\/html/gi,
      /on\w+\s*=/gi,
      /expression\s*\(/gi,
      /eval\s*\(/gi,
      /@import/gi,
      /url\s*\(/gi,
      /&lt;script/gi,
      /&lt;\/script&gt;/gi,
      /&#x3C;script/gi,
      /String\.fromCharCode/gi,
      /document\.cookie/gi,
      /document\.write/gi,
      /window\.location/gi,
      /alert\s*\(/gi,
      /confirm\s*\(/gi,
      /prompt\s*\(/gi
    ],
    
    // Command injection
    COMMAND_INJECTION: [
      /[;&|`$(){}[\]\\]/g,
      /\|\s*\w+/g,
      /;\s*\w+/g,
      /&&\s*\w+/g,
      /\$\(/g,
      /`[^`]*`/g,
      /(nc|netcat|wget|curl|ping|nslookup|dig)\s/gi,
      /(rm|mv|cp|cat|ls|ps|kill|chmod|chown)\s/gi
    ],
    
    // Path traversal
    PATH_TRAVERSAL: [
      /\.\.[\/\\]/g,
      /%2e%2e[\/\\]/gi,
      /\.\.%2f/gi,
      /\.\.%5c/gi,
      /%252e%252e/gi,
      /\.\.\\/g,
      /\.\.%c0%af/gi,
      /\.\.%c1%9c/gi,
      /%252f/gi,
      /\.\.%252f/gi,
      /\.\.\.%252f\.\.\.%252f/gi
    ],
    
    // LDAP injection
    LDAP_INJECTION: [
      /[()=*!&|]/g,
      /\x00/g,
      /%00/gi,
      /\*\)/g,
      /\(\|/g
    ],
    
    // NoSQL injection
    NOSQL_INJECTION: [
      /\$where/gi,
      /\$ne/gi,
      /\$gt/gi,
      /\$lt/gi,
      /\$regex/gi,
      /\$or/gi,
      /\$and/gi,
      /\$not/gi,
      /\$nor/gi,
      /\$exists/gi,
      /\$type/gi,
      /\$mod/gi,
      /\$all/gi,
      /\$size/gi,
      /\$elemMatch/gi
    ],
    
    // XXE patterns
    XXE: [
      /<!ENTITY/gi,
      /<!DOCTYPE/gi,
      /SYSTEM\s+["'][^"']*["']/gi,
      /PUBLIC\s+["'][^"']*["']/gi,
      /%\w+;/g
    ],
    
    // JSO (JavaScript Object) overlay patterns
    JSO_OVERLAY: [
      /Object\.prototype/gi,
      /__proto__/gi,
      /constructor\.prototype/gi,
      /\.constructor\s*\(/gi,
      /\[\s*["']constructor["']\s*\]/gi,
      /\[\s*["']__proto__["']\s*\]/gi,
      /prototype\s*\[/gi,
      /hasOwnProperty/gi,
      /valueOf\s*\(/gi,
      /toString\s*\(/gi
    ],
    
    // SSRF patterns
    SSRF: [
      /localhost/gi,
      /127\.0\.0\.1/g,
      /0\.0\.0\.0/g,
      /::1/g,
      /169\.254\./g,
      /10\./g,
      /192\.168\./g,
      /172\.(1[6-9]|2[0-9]|3[01])\./g,
      /file:\/\//gi,
      /gopher:\/\//gi,
      /dict:\/\//gi,
      /ftp:\/\//gi,
      /sftp:\/\//gi,
      /\/admin/gi,
      /\/config/gi,
      /192\.168\.\d+\.\d+/g
    ]
  }

  private static readonly MALICIOUS_HEADERS = [
    'x-forwarded-host', 'x-original-url', 'x-rewrite-url', 'x-http-method-override',
    'x-http-method', 'x-method-override', 'x-forwarded-proto', 'x-forwarded-port',
    'x-cluster-client-ip', 'x-real-ip', 'cf-connecting-ip', 'true-client-ip',
    'x-originating-ip', 'x-remote-ip', 'x-client-ip', 'x-host', 'x-forwarded-server'
  ]

  private static readonly ATTACK_TOOLS = [
    /burp/i, /suite/i, /sqlmap/i, /nmap/i, /nikto/i, /dirb/i, /gobuster/i,
    /wfuzz/i, /ffuf/i, /hydra/i, /john/i, /hashcat/i, /metasploit/i,
    /nessus/i, /openvas/i, /acunetix/i, /appscan/i, /webinspect/i,
    /zap/i, /w3af/i, /skipfish/i, /arachni/i, /vega/i, /webscarab/i,
    /paros/i, /ratproxy/i, /websecurify/i, /grendel/i, /n-stalker/i,
    /python-requests/i, /curl/i, /wget/i, /postman/i, /insomnia/i
  ]

  private static blockedIPs = new Set<string>()
  private static suspiciousActivity = new Map<string, number>()
  private static honeypots = new Set(['admin', 'administrator', 'root', 'test', 'demo'])

  static validateRequest(request: NextRequest): {
    isValid: boolean
    threats: string[]
    riskScore: number
    shouldBlock: boolean
  } {
    try {
      const threats: string[] = []
      let riskScore = 0
      const clientIP = this.getClientIP(request)

      // Check if IP is already blocked
      if (this.blockedIPs.has(clientIP)) {
        return { isValid: false, threats: ['BLOCKED_IP'], riskScore: 100, shouldBlock: true }
      }

    // Analyze all request components
    const url = request.url
    const userAgent = request.headers.get('user-agent') || ''
    const referer = request.headers.get('referer') || ''
    const contentType = request.headers.get('content-type') || ''

    // 1. SQL Injection Detection
    if (this.detectPatterns(url, this.THREAT_SIGNATURES.SQL_INJECTION)) {
      threats.push('SQL_INJECTION')
      riskScore += 80
    }

    // 2. XSS Detection
    if (this.detectPatterns(url + userAgent + referer, this.THREAT_SIGNATURES.XSS)) {
      threats.push('XSS_ATTEMPT')
      riskScore += 70
    }

    // 3. Command Injection
    if (this.detectPatterns(url, this.THREAT_SIGNATURES.COMMAND_INJECTION)) {
      threats.push('COMMAND_INJECTION')
      riskScore += 90
    }

    // 4. Path Traversal
    if (this.detectPatterns(url, this.THREAT_SIGNATURES.PATH_TRAVERSAL)) {
      threats.push('PATH_TRAVERSAL')
      riskScore += 60
    }

    // 5. LDAP Injection
    if (this.detectPatterns(url, this.THREAT_SIGNATURES.LDAP_INJECTION)) {
      threats.push('LDAP_INJECTION')
      riskScore += 70
    }

    // 6. NoSQL Injection
    if (this.detectPatterns(url, this.THREAT_SIGNATURES.NOSQL_INJECTION)) {
      threats.push('NOSQL_INJECTION')
      riskScore += 75
    }

    // 7. XXE Detection
    if (this.detectPatterns(url + contentType, this.THREAT_SIGNATURES.XXE)) {
      threats.push('XXE_ATTEMPT')
      riskScore += 85
    }

    // 8. SSRF Detection
    if (this.detectPatterns(url + referer, this.THREAT_SIGNATURES.SSRF)) {
      threats.push('SSRF_ATTEMPT')
      riskScore += 80
    }

    // 9. JSO Overlay Detection
    if (this.detectPatterns(url + userAgent + referer, this.THREAT_SIGNATURES.JSO_OVERLAY)) {
      threats.push('JSO_OVERLAY_ATTEMPT')
      riskScore += 85
    }

    // 10. Attack Tool Detection
    if (this.ATTACK_TOOLS.some(tool => tool.test(userAgent))) {
      threats.push('ATTACK_TOOL')
      riskScore += 60
    }

    // 11. Malicious Headers
    const maliciousHeaderCount = this.MALICIOUS_HEADERS.filter(h => request.headers.has(h)).length
    if (maliciousHeaderCount > 2) {
      threats.push('HEADER_MANIPULATION')
      riskScore += maliciousHeaderCount * 15
    }

    // 12. Suspicious User Agent Patterns
    if (this.detectSuspiciousUserAgent(userAgent)) {
      threats.push('SUSPICIOUS_USER_AGENT')
      riskScore += 40
    }

    // 13. Rate Limiting Violations
    if (this.detectRateLimitViolation(clientIP)) {
      threats.push('RATE_LIMIT_VIOLATION')
      riskScore += 30
    }

    // 14. Honeypot Detection
    if (this.detectHoneypotAccess(url)) {
      threats.push('HONEYPOT_ACCESS')
      riskScore += 95
    }

    // 15. Encoding Evasion
    if (this.detectEncodingEvasion(url)) {
      threats.push('ENCODING_EVASION')
      riskScore += 50
    }

    // 16. Protocol Anomalies
    if (this.detectProtocolAnomalies(request)) {
      threats.push('PROTOCOL_ANOMALY')
      riskScore += 35
    }

    // Update suspicious activity counter
    const currentActivity = this.suspiciousActivity.get(clientIP) || 0
    this.suspiciousActivity.set(clientIP, currentActivity + riskScore)

    // Auto-block high-risk IPs
    const shouldBlock = riskScore >= 80 || (this.suspiciousActivity.get(clientIP) || 0) >= 200
    if (shouldBlock) {
      this.blockedIPs.add(clientIP)
      console.error(`🚨 SECURITY ALERT: IP ${clientIP} blocked - Risk: ${riskScore}, Threats: ${threats.join(', ')}`)
    }

      return {
        isValid: riskScore < 50,
        threats,
        riskScore,
        shouldBlock
      }
    } catch (error) {
      console.error('Fortress validation error:', error)
      return { isValid: true, threats: [], riskScore: 0, shouldBlock: false }
    }
  }

  private static detectPatterns(input: string, patterns: RegExp[]): boolean {
    return patterns.some(pattern => pattern.test(input))
  }

  private static detectSuspiciousUserAgent(userAgent: string): boolean {
    const suspicious = [
      /^$/,  // Empty user agent
      /^Mozilla\/4\.0$/,  // Generic old browser
      /python/i, /perl/i, /ruby/i, /java/i, /go-http/i,
      /bot/i, /crawler/i, /spider/i, /scraper/i,
      /test/i, /scan/i, /probe/i, /check/i
    ]
    return suspicious.some(pattern => pattern.test(userAgent))
  }

  private static detectRateLimitViolation(ip: string): boolean {
    // This would integrate with your existing rate limiting
    return false // Placeholder
  }

  private static detectHoneypotAccess(url: string): boolean {
    return this.honeypots.some(trap => url.toLowerCase().includes(trap))
  }

  private static detectEncodingEvasion(url: string): boolean {
    const evasionPatterns = [
      /%[0-9a-f]{2}/gi,  // URL encoding
      /\\x[0-9a-f]{2}/gi,  // Hex encoding
      /\\u[0-9a-f]{4}/gi,  // Unicode encoding
      /&#x[0-9a-f]+;/gi,   // HTML hex entities
      /&#[0-9]+;/gi,       // HTML decimal entities
      /%u[0-9a-f]{4}/gi    // Unicode URL encoding
    ]
    const encodedCount = evasionPatterns.reduce((count, pattern) => {
      const matches = url.match(pattern)
      return count + (matches ? matches.length : 0)
    }, 0)
    return encodedCount > 5
  }

  private static detectProtocolAnomalies(request: NextRequest): boolean {
    const contentLength = request.headers.get('content-length')
    const transferEncoding = request.headers.get('transfer-encoding')
    const host = request.headers.get('host')
    
    // Check for HTTP request smuggling indicators
    if (contentLength && transferEncoding) return true
    if (host && host.includes('..')) return true
    if (request.headers.get('connection')?.toLowerCase().includes('upgrade')) return true
    
    return false
  }

  private static getClientIP(request: NextRequest): string {
    return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
           request.headers.get('x-real-ip') ||
           request.headers.get('cf-connecting-ip') ||
           'unknown'
  }

  static createFortressHeaders() {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=()',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'same-origin',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet, notranslate, noimageindex'
    }
  }

  static generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  static hashPassword(password: string, salt?: string): { hash: string, salt: string } {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex')
    const hash = crypto.pbkdf2Sync(password, actualSalt, 100000, 64, 'sha512').toString('hex')
    return { hash, salt: actualSalt }
  }

  static verifyPassword(password: string, hash: string, salt: string): boolean {
    const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'))
  }

  static encryptData(data: string, key?: string): { encrypted: string, key: string, iv: string } {
    const actualKey = key || crypto.randomBytes(32).toString('hex')
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipher('aes-256-cbc', actualKey)
    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return { encrypted, key: actualKey, iv: iv.toString('hex') }
  }

  static decryptData(encrypted: string, key: string, iv: string): string {
    const decipher = crypto.createDecipher('aes-256-cbc', key)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  }

  static clearBlockedIPs(): void {
    this.blockedIPs.clear()
    this.suspiciousActivity.clear()
  }
}