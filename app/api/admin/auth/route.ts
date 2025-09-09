import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sign } from "jsonwebtoken"
import crypto from "crypto"

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123"
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex')

// Enhanced security tracking
const loginAttempts = new Map<string, { count: number; lastAttempt: number; blocked: boolean }>()
const activeSessions = new Map<string, { token: string; ip: string; created: number }>()

function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0] || 
         request.headers.get('x-real-ip') || 
         request.headers.get('cf-connecting-ip') ||
         'unknown'
}

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const attempts = loginAttempts.get(ip)
  
  if (!attempts) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now, blocked: false })
    return false
  }
  
  // If blocked, stay blocked for 1 hour
  if (attempts.blocked && now - attempts.lastAttempt < 60 * 60 * 1000) {
    return true
  }
  
  // Reset after 15 minutes if not blocked
  if (now - attempts.lastAttempt > 15 * 60 * 1000) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now, blocked: false })
    return false
  }
  
  // Max 3 attempts per 15 minutes, then block for 1 hour
  if (attempts.count >= 3) {
    attempts.blocked = true
    attempts.lastAttempt = now
    return true
  }
  
  attempts.count++
  attempts.lastAttempt = now
  return false
}

function invalidateAllSessions() {
  activeSessions.clear()
}

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request)
    
    if (isRateLimited(clientIP)) {
      return NextResponse.json({ error: "Too many login attempts. Access blocked for 1 hour." }, { status: 429 })
    }

    const { password } = await request.json()

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 })
    }

    // Invalidate all existing sessions for security
    invalidateAllSessions()

    // Generate secure session ID and JWT token
    const sessionId = crypto.randomBytes(32).toString('hex')
    const token = sign(
      { 
        admin: true, 
        ip: clientIP,
        sessionId,
        iat: Math.floor(Date.now() / 1000)
      },
      JWT_SECRET,
      { expiresIn: '2h' } // Reduced to 2 hours
    )

    // Track active session
    activeSessions.set(sessionId, {
      token,
      ip: clientIP,
      created: Date.now()
    })

    const cookieStore = await cookies()
    cookieStore.set("admin-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 2, // 2 hours
    })

    // Reset rate limit on successful login
    loginAttempts.delete(clientIP)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}

// Add logout endpoint
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("admin-token")?.value

    if (token) {
      // Decode token to get session ID
      try {
        const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
        if (decoded.sessionId) {
          activeSessions.delete(decoded.sessionId)
        }
      } catch {}
    }

    // Clear cookie
    cookieStore.delete("admin-token")
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}