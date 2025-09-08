import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import crypto from "crypto"

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAuthenticated(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const supabase = await createClient()
    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: "Failed to delete message" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}