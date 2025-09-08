import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123"

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 })
    }

    const cookieStore = await cookies()
    cookieStore.set("admin-auth", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 24 hours
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}