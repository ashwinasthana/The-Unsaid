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
      <div className="min-h-screen flex flex-col items-center justify-center bg-black overflow-hidden px-4 sm:px-6">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-4 sm:mb-6 md:mb-8 tracking-tight intro-title animate-fade-in-up text-center" style={{fontFamily: 'var(--font-montserrat), system-ui, sans-serif'}}>
          ASHWIN ASTHANA
        </h1>
        <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-light text-white/80 text-center max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl px-2 sm:px-4 tracking-wide intro-quote animate-fade-in-up-delayed leading-relaxed" style={{fontFamily: 'var(--font-montserrat), system-ui, sans-serif'}}>
          Welcome to the admin panel.
        </p>
        <div className="flex justify-center items-center mt-6 sm:mt-8 animate-fade-in-up-delayed">
          <div className="flex space-x-1">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/60 rounded-full animate-pulse" style={{animationDelay: '0s'}}></div>
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/60 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/60 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background animate-fade-in p-4">
        <Card className="p-6 sm:p-8 max-w-sm sm:max-w-md w-full mx-2 sm:mx-4 shadow-2xl border border-border/20 animate-scale-in">
          <div className="text-center mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-foreground rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <span className="text-xl sm:text-2xl text-background">🔐</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground" style={{fontFamily: 'var(--font-montserrat), system-ui, sans-serif'}}>Admin Access</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">Secure portal for Ashwin Asthana</p>
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
        <div className="bg-card border border-border/20 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg animate-slide-in-down">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="w-full sm:w-auto">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2 sm:gap-3" style={{fontFamily: 'var(--font-montserrat), system-ui, sans-serif'}}>
                <span className="w-8 h-8 sm:w-10 sm:h-10 bg-foreground text-background rounded-full flex items-center justify-center text-base sm:text-lg">👑</span>
                <span className="truncate">Admin Dashboard</span>
              </h1>
              <div className="mt-2 text-xs sm:text-sm text-muted-foreground">
                <p>Welcome back, <span className="font-semibold text-foreground">Ashwin Asthana</span></p>
                {loginTime && (
                  <p className="truncate">Logged in at {loginTime.toLocaleTimeString()}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
              <div className="px-2 sm:px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-xs font-medium">
                ● Online
              </div>
              <Button 
                onClick={() => {
                  setIsAuthenticated(false)
                  setLoginTime(null)
                  setShowAdminContent(false)
                }} 
                variant="outline"
                size="sm"
                className="transition-all duration-300 hover:scale-105 text-xs sm:text-sm"
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

        <div className="grid gap-3 sm:gap-4">
          {messages.map((message, index) => (
            <Card 
              key={message.id} 
              className={`p-4 sm:p-6 shadow-lg border border-border/20 transition-all duration-500 hover:shadow-xl hover:scale-[1.01] sm:hover:scale-[1.02] animate-fade-in-up ${
                deletingId === message.id ? 'opacity-50 scale-95 pointer-events-none' : ''
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4 mb-4">
                <div className="flex-1 w-full sm:w-auto">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-foreground/10 rounded-full text-xs font-medium truncate max-w-[200px]">
                      To: {message.recipient_name}
                    </span>
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse flex-shrink-0"></span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                    <span>📅</span>
                    <span className="truncate">{new Date(message.created_at).toLocaleString()}</span>
                  </p>
                </div>
                <Button
                  onClick={() => deleteMessage(message.id)}
                  variant="destructive"
                  size="sm"
                  disabled={deletingId === message.id}
                  className="transition-all duration-300 hover:scale-105 sm:hover:scale-110 disabled:opacity-50 text-xs sm:text-sm w-full sm:w-auto"
                >
                  {deletingId === message.id ? (
                    <div className="flex items-center gap-1 justify-center">
                      <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span className="hidden sm:inline">Deleting</span>
                    </div>
                  ) : (
                    <span className="flex items-center gap-1 justify-center">
                      🗑️ <span className="hidden sm:inline">Delete</span>
                    </span>
                  )}
                </Button>
              </div>
              <div className="bg-muted/20 rounded-lg p-3 sm:p-4 border-l-4 border-l-foreground/30">
                <p className="text-sm leading-relaxed text-foreground break-words">{message.message_text}</p>
              </div>
            </Card>
          ))}
        </div>

        {messages.length === 0 && (
          <div className="text-center py-12 sm:py-20 animate-fade-in-up px-4">
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl sm:text-4xl">📬</span>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2" style={{fontFamily: 'var(--font-montserrat), system-ui, sans-serif'}}>No Messages Yet</h3>
            <p className="text-sm sm:text-base text-muted-foreground">All messages will appear here for management</p>
          </div>
        )}
      </div>
    </div>
  )
}