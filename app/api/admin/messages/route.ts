import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import crypto from "crypto"
import { AntiTamper } from "@/lib/anti-tamper"
import { SecurityFortress } from "@/lib/fortress"

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex')

async function isAuthenticated(request?: NextRequest): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("admin-token")?.value
    
    if (!token) return false
    
    const decoded = verify(token, JWT_SECRET) as any
    
    // Check IP if request is provided
    if (request && decoded.ip) {
      const currentIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                       request.headers.get('x-real-ip') || 
                       'unknown'
      if (decoded.ip !== currentIP) return false
    }
    
    return decoded.admin === true
  } catch (error) {
    return false
  }
}

export async function GET(request: NextRequest) {
  try {
    // Fortress security validation
    const fortressCheck = SecurityFortress.validateRequest(request)
    if (!fortressCheck.isValid || fortressCheck.shouldBlock) {
      const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
      console.error(`🚨 ADMIN FORTRESS BLOCKED: ${clientIP} - Threats: ${fortressCheck.threats.join(', ')}`)
      return NextResponse.json({ error: "Security validation failed" }, { status: 403 })
    }
    
    // Anti-tampering validation
    const tamperCheck = AntiTamper.validateRequest(request)
    if (!tamperCheck.isValid) {
      const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
      console.warn(`Admin tamper attempt from ${clientIP}: ${tamperCheck.reason}`)
      return NextResponse.json({ error: "Request validation failed" }, { status: 403 })
    }
    
    if (!(await isAuthenticated(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
    }

    return NextResponse.json({ messages })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}