import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

async function isAuthenticated() {
  const cookieStore = await cookies()
  return cookieStore.get("admin-auth")?.value === "authenticated"
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("id", params.id)

    if (error) {
      return NextResponse.json({ error: "Failed to delete message" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}