"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

interface Message {
  id: string
  recipient_name: string
  message_text: string
  created_at: string
}

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      if (response.ok) {
        setIsAuthenticated(true)
        fetchMessages()
      } else {
        setError("Invalid password")
      }
    } catch (error) {
      setError("Authentication failed")
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async () => {
    try {
      const response = await fetch("/api/admin/messages")
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages)
      }
    } catch (error) {
      setError("Failed to fetch messages")
    }
  }

  const deleteMessage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return

    try {
      const response = await fetch(`/api/admin/messages/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setMessages(messages.filter(msg => msg.id !== id))
      } else {
        setError("Failed to delete message")
      }
    } catch (error) {
      setError("Failed to delete message")
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 max-w-md w-full mx-4">
          <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                {error}
              </div>
            )}
            <Input
              type="password"
              placeholder="Admin Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Authenticating..." : "Login"}
            </Button>
          </form>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <Button onClick={() => setIsAuthenticated(false)} variant="outline">
            Logout
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400">
            {error}
          </div>
        )}

        <div className="grid gap-4">
          {messages.map((message) => (
            <Card key={message.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold">To: {message.recipient_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(message.created_at).toLocaleString()}
                  </p>
                </div>
                <Button
                  onClick={() => deleteMessage(message.id)}
                  variant="destructive"
                  size="sm"
                >
                  Delete
                </Button>
              </div>
              <p className="text-sm leading-relaxed">{message.message_text}</p>
            </Card>
          ))}
        </div>

        {messages.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No messages found</p>
          </div>
        )}
      </div>
    </div>
  )
}