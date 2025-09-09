import { NextRequest, NextResponse } from "next/server"
import { DDoSShield } from "@/lib/ddos-shield"

// DDoS monitoring endpoint
export async function GET(request: NextRequest) {
  try {
    const stats = DDoSShield.getStats()
    
    return NextResponse.json({
      status: "ACTIVE",
      protection_level: "MAXIMUM",
      ...stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({ error: "Stats unavailable" }, { status: 500 })
  }
}

// Cleanup endpoint
export async function POST(request: NextRequest) {
  try {
    const { cleanupKey } = await request.json()
    
    if (cleanupKey !== process.env.DDOS_CLEANUP_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    DDoSShield.cleanup()
    
    return NextResponse.json({ 
      success: true, 
      message: "DDoS shield cleanup completed" 
    })
  } catch (error) {
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 })
  }
}