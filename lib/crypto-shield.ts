import crypto from "crypto"

// Advanced cryptographic protection layer
export class CryptoShield {
  private static readonly ENCRYPTION_ALGORITHM = 'aes-256-gcm'
  private static readonly KEY_DERIVATION_ITERATIONS = 100000
  private static readonly SALT_LENGTH = 32
  private static readonly IV_LENGTH = 16
  private static readonly TAG_LENGTH = 16

  // Generate cryptographically secure random values
  static generateSecureRandom(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex')
  }

  // Advanced password hashing with PBKDF2
  static hashPasswordAdvanced(password: string, salt?: Buffer): { hash: string, salt: string } {
    const actualSalt = salt || crypto.randomBytes(this.SALT_LENGTH)
    const hash = crypto.pbkdf2Sync(password, actualSalt, this.KEY_DERIVATION_ITERATIONS, 64, 'sha512')
    return {
      hash: hash.toString('hex'),
      salt: actualSalt.toString('hex')
    }
  }

  // Timing-safe password verification
  static verifyPasswordAdvanced(password: string, storedHash: string, salt: string): boolean {
    try {
      const saltBuffer = Buffer.from(salt, 'hex')
      const { hash } = this.hashPasswordAdvanced(password, saltBuffer)
      return crypto.timingSafeEqual(Buffer.from(storedHash, 'hex'), Buffer.from(hash, 'hex'))
    } catch {
      return false
    }
  }

  // AES-256-GCM encryption with authentication
  static encryptSecure(plaintext: string, key?: string): { 
    encrypted: string, 
    key: string, 
    iv: string, 
    tag: string 
  } {
    const actualKey = key ? Buffer.from(key, 'hex') : crypto.randomBytes(32)
    const iv = crypto.randomBytes(this.IV_LENGTH)
    
    const cipher = crypto.createCipherGCM(this.ENCRYPTION_ALGORITHM, actualKey)
    cipher.setAAD(Buffer.from('authenticated-data'))
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const tag = cipher.getAuthTag()
    
    return {
      encrypted,
      key: actualKey.toString('hex'),
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    }
  }

  // AES-256-GCM decryption with authentication verification
  static decryptSecure(encrypted: string, key: string, iv: string, tag: string): string | null {
    try {
      const keyBuffer = Buffer.from(key, 'hex')
      const ivBuffer = Buffer.from(iv, 'hex')
      const tagBuffer = Buffer.from(tag, 'hex')
      
      const decipher = crypto.createDecipherGCM(this.ENCRYPTION_ALGORITHM, keyBuffer)
      decipher.setAAD(Buffer.from('authenticated-data'))
      decipher.setAuthTag(tagBuffer)
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      
      return decrypted
    } catch {
      return null
    }
  }

  // Generate HMAC signature for data integrity
  static generateHMAC(data: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(data).digest('hex')
  }

  // Verify HMAC signature
  static verifyHMAC(data: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateHMAC(data, secret)
    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'))
  }

  // Generate secure session token with expiration
  static generateSessionToken(userId: string, expiresIn: number = 7200): {
    token: string,
    signature: string,
    expires: number
  } {
    const expires = Date.now() + (expiresIn * 1000)
    const payload = JSON.stringify({ userId, expires, nonce: this.generateSecureRandom(16) })
    const token = Buffer.from(payload).toString('base64url')
    const signature = this.generateHMAC(token, process.env.JWT_SECRET || 'fallback-secret')
    
    return { token, signature, expires }
  }

  // Verify session token
  static verifySessionToken(token: string, signature: string): { valid: boolean, userId?: string, expires?: number } {
    try {
      if (!this.verifyHMAC(token, signature, process.env.JWT_SECRET || 'fallback-secret')) {
        return { valid: false }
      }
      
      const payload = JSON.parse(Buffer.from(token, 'base64url').toString())
      
      if (Date.now() > payload.expires) {
        return { valid: false }
      }
      
      return { valid: true, userId: payload.userId, expires: payload.expires }
    } catch {
      return { valid: false }
    }
  }

  // Generate cryptographic proof of work (anti-bot)
  static generateProofOfWork(difficulty: number = 4): { challenge: string, solution: string } {
    const challenge = this.generateSecureRandom(16)
    let nonce = 0
    let hash = ''
    
    do {
      hash = crypto.createHash('sha256').update(challenge + nonce.toString()).digest('hex')
      nonce++
    } while (!hash.startsWith('0'.repeat(difficulty)))
    
    return { challenge, solution: (nonce - 1).toString() }
  }

  // Verify proof of work
  static verifyProofOfWork(challenge: string, solution: string, difficulty: number = 4): boolean {
    const hash = crypto.createHash('sha256').update(challenge + solution).digest('hex')
    return hash.startsWith('0'.repeat(difficulty))
  }

  // Generate secure API key with metadata
  static generateAPIKey(metadata: any = {}): { key: string, hash: string } {
    const keyData = {
      ...metadata,
      timestamp: Date.now(),
      random: this.generateSecureRandom(32)
    }
    
    const key = Buffer.from(JSON.stringify(keyData)).toString('base64url')
    const hash = crypto.createHash('sha256').update(key).digest('hex')
    
    return { key, hash }
  }
}