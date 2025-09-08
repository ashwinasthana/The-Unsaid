import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

async function isAuthenticated() {
  const cookieStore = await cookies()
  return cookieStore.get("admin-auth")?.value === "authenticated"
}

export async function GET() {
  try {
    if (!(await isAuthenticated())) {
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