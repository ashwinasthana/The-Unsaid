import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sign } from "jsonwebtoken"
import crypto from "crypto"

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123"
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex')

// Rate limiting
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>()

function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0] || 
         request.headers.get('x-real-ip') || 
         'unknown'
}

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const attempts = loginAttempts.get(ip)
  
  if (!attempts) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now })
    return false
  }
  
  // Reset after 15 minutes
  if (now - attempts.lastAttempt > 15 * 60 * 1000) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now })
    return false
  }
  
  // Max 5 attempts per 15 minutes
  if (attempts.count >= 5) {
    return true
  }
  
  attempts.count++
  attempts.lastAttempt = now
  return false
}

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request)
    
    if (isRateLimited(clientIP)) {
      return NextResponse.json({ error: "Too many login attempts. Try again later." }, { status: 429 })
    }

    const { password } = await request.json()

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 })
    }

    // Generate JWT token
    const token = sign(
      { 
        admin: true, 
        ip: clientIP,
        iat: Math.floor(Date.now() / 1000)
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    const cookieStore = await cookies()
    cookieStore.set("admin-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 24 hours
    })

    // Reset rate limit on successful login
    loginAttempts.delete(clientIP)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}