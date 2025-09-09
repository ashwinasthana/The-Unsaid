import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

// Emergency session invalidation endpoint
export async function POST(request: NextRequest) {
  try {
    const { emergencyKey } = await request.json()
    
    // Use a different emergency key from environment
    const EMERGENCY_KEY = process.env.EMERGENCY_INVALIDATE_KEY
    
    if (!EMERGENCY_KEY || emergencyKey !== EMERGENCY_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Clear all admin cookies
    const cookieStore = await cookies()
    cookieStore.delete("admin-token")
    
    return NextResponse.json({ 
      success: true, 
      message: "All admin sessions invalidated" 
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to invalidate sessions" }, { status: 500 })
  }
}