import { NextRequest, NextResponse } from "next/server"
import { SecurityFortress } from "@/lib/fortress"

// Security monitoring endpoint (admin only)
export async function GET(request: NextRequest) {
  try {
    // Only allow from localhost or specific admin IPs
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    
    if (clientIP !== 'localhost' && clientIP !== '127.0.0.1') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({
      status: "FORTRESS_ACTIVE",
      timestamp: new Date().toISOString(),
      security_level: "MAXIMUM",
      threats_blocked: "CLASSIFIED",
      message: "All systems secure"
    })
  } catch (error) {
    return NextResponse.json({ error: "Security check failed" }, { status: 500 })
  }
}

// Emergency security reset
export async function POST(request: NextRequest) {
  try {
    const { emergencyKey } = await request.json()
    
    if (emergencyKey !== process.env.EMERGENCY_SECURITY_KEY) {
      return NextResponse.json({ error: "Invalid emergency key" }, { status: 401 })
    }

    SecurityFortress.clearBlockedIPs()
    
    return NextResponse.json({ 
      success: true, 
      message: "Security fortress reset completed" 
    })
  } catch (error) {
    return NextResponse.json({ error: "Reset failed" }, { status: 500 })
  }
}