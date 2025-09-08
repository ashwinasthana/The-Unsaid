import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// GET /api/messages?name=<recipient_name> (search) or GET /api/messages (all messages)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const recipientName = searchParams.get("name")

    let supabase
    try {
      supabase = await createClient()
    } catch (clientError) {
      console.error("Failed to create Supabase client:", clientError)
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    let query = supabase.from("messages").select("*").order("created_at", { ascending: false })

    if (recipientName) {
      query = query.ilike("recipient_name", recipientName.trim())
    } else {
      // For homepage, limit to recent messages
      query = query.limit(20)
    }

    const { data: messages, error } = await query

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
    }

    return NextResponse.json({ messages: messages || [] })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recipientName, messageText } = body

    // Validation
    if (!recipientName || !messageText) {
      return NextResponse.json({ error: "Recipient name and message text are required" }, { status: 400 })
    }

    // Security: Basic input sanitization
    const sanitizedName = recipientName.trim().slice(0, 100)
    const sanitizedMessage = messageText.trim().slice(0, 2000)

    if (sanitizedName.length < 1 || sanitizedMessage.length < 1) {
      return NextResponse.json({ error: "Name and message cannot be empty" }, { status: 400 })
    }

    // Check for malicious content
    const maliciousPatterns = [/<script/i, /javascript:/i, /on\w+\s*=/i, /<iframe/i, /<object/i, /<embed/i]

    const isMalicious = maliciousPatterns.some(
      (pattern) => pattern.test(sanitizedName) || pattern.test(sanitizedMessage),
    )

    if (isMalicious) {
      return NextResponse.json({ error: "Invalid content detected" }, { status: 400 })
    }

    let supabase
    try {
      supabase = await createClient()
    } catch (clientError) {
      console.error("Failed to create Supabase client:", clientError)
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        recipient_name: sanitizedName,
        message_text: sanitizedMessage,
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to save message" }, { status: 500 })
    }

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
