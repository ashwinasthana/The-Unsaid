import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://taccisexfybagywycibm.supabase.co"
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhY2Npc2V4ZnliYWd5d3ljaWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNDI1NDksImV4cCI6MjA3MjkxODU0OX0.k3FqIHKbYDjy50JBFuK0KnMSxtx5Lh3bqnpLQetopZ4"

  console.log("[v0] Supabase URL:", supabaseUrl ? "✓ Found" : "✗ Missing")
  console.log("[v0] Supabase Key:", supabaseAnonKey ? "✓ Found" : "✗ Missing")

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log("[v0] Environment variables check failed")
    throw new Error("Missing Supabase environment variables")
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The "setAll" method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}
