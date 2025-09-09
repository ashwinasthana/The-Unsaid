import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { SecurityValidator } from "@/lib/security"

// GET /api/messages?name=<recipient_name> (search) or GET /api/messages (all messages)
export async function GET(request: NextRequest) {
  try {
    // Rate limiting for search requests
    const clientIP = SecurityValidator.getClientIP(request)
    const rateLimit = SecurityValidator.checkRateLimit(`search_${clientIP}`, 30, 300000) // 30 requests per 5 minutes
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    const recipientName = searchParams.get("name")

    // Validate and sanitize search input
    if (recipientName) {
      const validation = SecurityValidator.validateRecipientName(recipientName)
      if (!validation.isValid) {
        return NextResponse.json({ error: validation.error }, { status: 400 })
      }
    }

    let supabase
    try {
      supabase = await createClient()
    } catch (clientError) {
      console.error("Failed to create Supabase client:", clientError)
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    let query = supabase.from("messages").select("*").order("created_at", { ascending: false })

    if (recipientName) {
      const sanitizedName = SecurityValidator.sanitizeInput(recipientName)
      query = query.ilike("recipient_name", sanitizedName)
    } else {
      // For homepage, limit to recent messages
      query = query.limit(20)
    }

    const { data: messages, error } = await query

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
    }

    // Sanitize output data
    const sanitizedMessages = (messages || []).map(msg => ({
      ...msg,
      recipient_name: SecurityValidator.sanitizeInput(msg.recipient_name || ''),
      message_text: SecurityValidator.sanitizeInput(msg.message_text || '')
    }))

    return NextResponse.json({ messages: sanitizedMessages })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/messages
export async function POST(request: NextRequest) {
  try {
    // Enhanced rate limiting for submissions
    const clientIP = SecurityValidator.getClientIP(request)
    const rateLimit = SecurityValidator.checkRateLimit(`submit_${clientIP}`, 3, 3600000) // 3 submissions per hour
    
    if (!rateLimit.allowed) {
      const resetTime = rateLimit.resetTime ? new Date(rateLimit.resetTime).toLocaleTimeString() : 'later'
      return NextResponse.json(
        { error: `Too many submissions. Please try again after ${resetTime}.` },
        { status: 429 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON data" }, { status: 400 })
    }

    const { recipientName, messageText } = body

    // Validation
    if (!recipientName || !messageText) {
      return NextResponse.json({ error: "Recipient name and message text are required" }, { status: 400 })
    }

    // Comprehensive security validation
    const nameValidation = SecurityValidator.validateRecipientName(recipientName)
    if (!nameValidation.isValid) {
      return NextResponse.json({ error: nameValidation.error }, { status: 400 })
    }

    const messageValidation = SecurityValidator.validateMessage(messageText)
    if (!messageValidation.isValid) {
      return NextResponse.json({ error: messageValidation.error }, { status: 400 })
    }

    // Sanitize inputs
    const sanitizedName = SecurityValidator.sanitizeInput(recipientName)
    const sanitizedMessage = SecurityValidator.sanitizeInput(messageText)

    // Final validation after sanitization
    if (!sanitizedName || !sanitizedMessage) {
      return NextResponse.json({ error: "Content contains invalid characters" }, { status: 400 })
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

    // Sanitize response data
    const sanitizedResponse = {
      ...message,
      recipient_name: SecurityValidator.sanitizeInput(message.recipient_name),
      message_text: SecurityValidator.sanitizeInput(message.message_text)
    }

    return NextResponse.json({ message: sanitizedResponse }, { status: 201 })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
