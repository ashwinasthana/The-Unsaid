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
  const [loginTime, setLoginTime] = useState<Date | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showAdminIntro, setShowAdminIntro] = useState(false)
  const [showAdminContent, setShowAdminContent] = useState(false)

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
        setLoginTime(new Date())
        setShowAdminIntro(true)
        
        // Hide intro after 3 seconds and show admin content
        setTimeout(() => {
          setShowAdminIntro(false)
          setShowAdminContent(true)
          fetchMessages()
        }, 3000)
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
        console.log("Admin messages fetched:", data.messages)
        setMessages(data.messages)
      }
    } catch (error) {
      setError("Failed to fetch messages")
    }
  }

  const deleteMessage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return

    setDeletingId(id)
    try {
      const response = await fetch(`/api/admin/messages/${id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (response.ok) {
        setTimeout(() => {
          setMessages(messages.filter(msg => msg.id !== id))
          setDeletingId(null)
        }, 300)
      } else {
        setError(`Failed to delete message: ${result.error}`)
        setDeletingId(null)
      }
    } catch (error) {
      setError("Failed to delete message")
      setDeletingId(null)
    }
  }

  if (showAdminIntro) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black overflow-hidden">
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-sans font-bold text-white mb-6 sm:mb-8 tracking-tight intro-title animate-fade-in-up px-4">
          ASHWIN ASTHANA
        </h1>
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-sans font-light text-white/80 text-center max-w-3xl px-6 sm:px-4 tracking-wide intro-quote animate-fade-in-up-delayed leading-relaxed">
          Welcome to the admin panel.
        </p>
        <div className="flex justify-center items-center mt-8 animate-fade-in-up-delayed">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{animationDelay: '0s'}}></div>
            <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
            <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background animate-fade-in">
        <Card className="p-8 max-w-md w-full mx-4 shadow-2xl border border-border/20 animate-scale-in">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-foreground rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <span className="text-2xl text-background">🔐</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Admin Access</h1>
            <p className="text-sm text-muted-foreground mt-2">Secure portal for Ashwin Asthana</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm animate-shake">
                {error}
              </div>
            )}
            <Input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="transition-all duration-300 focus:scale-105"
              required
            />
            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full transition-all duration-300 hover:scale-105"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin"></div>
                  Authenticating...
                </div>
              ) : (
                "Access Admin Panel"
              )}
            </Button>
          </form>
        </Card>
      </div>
    )
  }

  if (!showAdminContent) {
    return null
  }

  return (
    <div className="min-h-screen bg-background p-4 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        <div className="bg-card border border-border/20 rounded-xl p-6 mb-8 shadow-lg animate-slide-in-down">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <span className="w-10 h-10 bg-foreground text-background rounded-full flex items-center justify-center text-lg">👑</span>
                Admin Dashboard
              </h1>
              <div className="mt-2 text-sm text-muted-foreground">
                <p>Welcome back, <span className="font-semibold text-foreground">Ashwin Asthana</span></p>
                {loginTime && (
                  <p>Logged in at {loginTime.toLocaleTimeString()}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-xs font-medium">
                ● Online
              </div>
              <Button 
                onClick={() => {
                  setIsAuthenticated(false)
                  setLoginTime(null)
                }} 
                variant="outline"
                className="transition-all duration-300 hover:scale-105"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400">
            {error}
          </div>
        )}

        <div className="grid gap-4">
          {messages.map((message, index) => (
            <Card 
              key={message.id} 
              className={`p-6 shadow-lg border border-border/20 transition-all duration-500 hover:shadow-xl hover:scale-[1.02] animate-fade-in-up ${
                deletingId === message.id ? 'opacity-50 scale-95 pointer-events-none' : ''
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-foreground/10 rounded-full text-xs font-medium">
                      To: {message.recipient_name}
                    </span>
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <span>📅</span>
                    {new Date(message.created_at).toLocaleString()}
                  </p>
                </div>
                <Button
                  onClick={() => deleteMessage(message.id)}
                  variant="destructive"
                  size="sm"
                  disabled={deletingId === message.id}
                  className="transition-all duration-300 hover:scale-110 disabled:opacity-50"
                >
                  {deletingId === message.id ? (
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
                      Deleting
                    </div>
                  ) : (
                    <span className="flex items-center gap-1">
                      🗑️ Delete
                    </span>
                  )}
                </Button>
              </div>
              <div className="bg-muted/20 rounded-lg p-4 border-l-4 border-l-foreground/30">
                <p className="text-sm leading-relaxed text-foreground">{message.message_text}</p>
              </div>
            </Card>
          ))}
        </div>

        {messages.length === 0 && (
          <div className="text-center py-20 animate-fade-in-up">
            <div className="w-24 h-24 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📬</span>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No Messages Yet</h3>
            <p className="text-muted-foreground">All messages will appear here for management</p>
          </div>
        )}
      </div>
    </div>
  )
}