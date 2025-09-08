"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface UnsentMessage {
  id: string
  content: string
  timestamp: Date
  recipient: string
  isAnonymous: boolean
}

interface DatabaseMessage {
  id: string
  recipient_name: string
  message_text: string
  created_at: string
}

const sanitizeInput = (input: string): string => {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove script tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, "") // Remove event handlers
    .trim()
}

const validateInput = (input: string, maxLength = 1000): boolean => {
  if (!input || input.length === 0) return false
  if (input.length > maxLength) return false
  if (input.includes("<script>") || input.includes("javascript:")) return false
  return true
}

const rateLimiter = {
  submissions: new Map<string, number[]>(),
  isAllowed: function (ip = "default"): boolean {
    const now = Date.now()
    const submissions = this.submissions.get(ip) || []

    // Remove submissions older than 1 hour
    const recentSubmissions = submissions.filter((time) => now - time < 3600000)

    // Allow max 5 submissions per hour
    if (recentSubmissions.length >= 5) {
      return false
    }

    recentSubmissions.push(now)
    this.submissions.set(ip, recentSubmissions)
    return true
  },
}

const getSampleMessages = (): UnsentMessage[] => [
  {
    id: "sample-1",
    content:
      "I should have told you how much you meant to me before you moved away. I think about our conversations every day and wonder what could have been if I had been braver.",
    timestamp: new Date(Date.now() - 86400000 * 3),
    recipient: "Priya",
    isAnonymous: true,
  },
  {
    id: "sample-2",
    content:
      "I'm sorry for the way things ended between us. I was scared and I pushed you away when I should have fought for us. You deserved so much better.",
    timestamp: new Date(Date.now() - 86400000 * 7),
    recipient: "Arjun",
    isAnonymous: true,
  },
  {
    id: "sample-3",
    content:
      "Thank you for believing in me when I didn't believe in myself. Your encouragement changed my life, and I never got the chance to tell you that.",
    timestamp: new Date(Date.now() - 86400000 * 12),
    recipient: "Amma",
    isAnonymous: true,
  },
  {
    id: "sample-4",
    content:
      "I loved you more than I ever told you. I wish I had said it more often, shown it better. You were the best thing that ever happened to me.",
    timestamp: new Date(Date.now() - 86400000 * 5),
    recipient: "Priya",
    isAnonymous: true,
  },
  {
    id: "sample-5",
    content:
      "I miss our late-night talks and the way you made me laugh until my stomach hurt. Distance doesn't make the heart grow fonder—it just makes it ache.",
    timestamp: new Date(Date.now() - 86400000 * 15),
    recipient: "Kavya",
    isAnonymous: true,
  },
  {
    id: "sample-6",
    content:
      "You taught me what real friendship looks like. I hope you know that even though we don't talk anymore, you shaped who I am today.",
    timestamp: new Date(Date.now() - 86400000 * 20),
    recipient: "Rohan",
    isAnonymous: true,
  },
  {
    id: "sample-7",
    content:
      "I never said goodbye properly. I was too proud, too stubborn. I regret that silence more than any words I've ever spoken.",
    timestamp: new Date(Date.now() - 86400000 * 8),
    recipient: "Vikram",
    isAnonymous: true,
  },
  {
    id: "sample-8",
    content: "Your smile could light up the darkest days. I wish I had told you that when you needed to hear it most.",
    timestamp: new Date(Date.now() - 86400000 * 11),
    recipient: "Ananya",
    isAnonymous: true,
  },
]

export default function UnsentProject() {
  const [messages, setMessages] = useState<UnsentMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [recipientName, setRecipientName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [showContent, setShowContent] = useState(false)
  const [currentView, setCurrentView] = useState<"search" | "results" | "write">("search")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<UnsentMessage[]>([])
  const [showSubmitForm, setShowSubmitForm] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<UnsentMessage | null>(null)
  const [isClosingMessage, setIsClosingMessage] = useState(false)
  const [isClosingForm, setIsClosingForm] = useState(false)
  const [error, setError] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up')
          }
        })
      },
      { threshold: 0.1, rootMargin: '50px' }
    )

    const elements = document.querySelectorAll('.scroll-animate')
    elements.forEach((el) => observerRef.current?.observe(el))

    return () => {
      observerRef.current?.disconnect()
    }
  }, [currentView])

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/messages")
        if (response.ok) {
          const data = await response.json()
          if (data.messages && data.messages.length > 0) {
            const dbMessages = data.messages.map((msg: DatabaseMessage) => ({
              id: msg.id,
              content: msg.message_text,
              timestamp: new Date(msg.created_at),
              recipient: msg.recipient_name,
              isAnonymous: true,
            }))
            const sampleMessages = getSampleMessages()
            const combinedMessages = [...dbMessages, ...sampleMessages].slice(0, 8)
            setMessages(combinedMessages)
          } else {
            setMessages(getSampleMessages())
          }
        } else {
          setMessages(getSampleMessages())
        }
      } catch (error) {
        console.error("Error fetching messages:", error)
        setMessages(getSampleMessages())
      } finally {
        setIsLoading(false)
      }
    }

    fetchMessages()
  }, [])

  useEffect(() => {
    const hideIntroTimer = setTimeout(() => {
      setShowIntro(false)
      setShowContent(true)
    }, 3000)

    return () => clearTimeout(hideIntroTimer)
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const sanitizedQuery = sanitizeInput(searchQuery)
    if (!validateInput(sanitizedQuery, 50)) {
      setError("Please enter a valid name (max 50 characters)")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/messages?name=${encodeURIComponent(sanitizedQuery)}`)
      if (response.ok) {
        const data = await response.json()
        const dbResults = data.messages.map((msg: DatabaseMessage) => ({
          id: msg.id,
          content: msg.message_text,
          timestamp: new Date(msg.created_at),
          recipient: msg.recipient_name,
          isAnonymous: true,
        }))
        
        // Filter sample messages by search term
        const sampleResults = getSampleMessages().filter(msg => 
          msg.recipient.toLowerCase().includes(sanitizedQuery.toLowerCase())
        )
        
        const combinedResults = [...dbResults, ...sampleResults]
        setSearchResults(combinedResults)
      } else {
        setSearchResults([])
      }
      setCurrentView("results")
    } catch (error) {
      console.error("Search error:", error)
      setError("Failed to search messages. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate and sanitize inputs
    const sanitizedMessage = sanitizeInput(newMessage)
    const sanitizedRecipient = sanitizeInput(recipientName)

    if (!validateInput(sanitizedMessage, 2000)) {
      setError("Message must be between 1-2000 characters and contain no harmful content")
      return
    }

    if (!validateInput(sanitizedRecipient, 50)) {
      setError("Recipient name must be between 1-50 characters and contain no harmful content")
      return
    }

    // Check rate limiting
    if (!rateLimiter.isAllowed()) {
      setError("Too many submissions. Please wait before submitting again.")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientName: sanitizedRecipient,
          messageText: sanitizedMessage,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const newMsg: UnsentMessage = {
          id: data.message.id,
          content: data.message.message_text,
          timestamp: new Date(data.message.created_at),
          recipient: data.message.recipient_name,
          isAnonymous: true,
        }

        setMessages((prev) => {
          const sampleMessages = getSampleMessages()
          const realMessages = prev.filter((msg) => !msg.id.startsWith("sample-"))
          const combinedMessages = [newMsg, ...realMessages, ...sampleMessages].slice(0, 8)
          return combinedMessages
        })
        setNewMessage("")
        setRecipientName("")
        setShowSubmitForm(false)
        setCurrentView("search")
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to submit message")
      }
    } catch (error) {
      console.error("Submit error:", error)
      setError("Failed to submit message. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return "Today"
    if (diffInDays === 1) return "Yesterday"
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    return `${Math.floor(diffInDays / 30)} months ago`
  }

  const handleMessageClick = (message: UnsentMessage) => {
    setSelectedMessage(message)
  }

  const closeMessageDetail = () => {
    setIsClosingMessage(true)
    setTimeout(() => {
      setSelectedMessage(null)
      setIsClosingMessage(false)
    }, 300)
  }

  const closeSubmitForm = () => {
    setIsClosingForm(true)
    setTimeout(() => {
      setShowSubmitForm(false)
      setIsClosingForm(false)
      setError("")
    }, 300)
  }

  if (showIntro) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black overflow-hidden">
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold text-white mb-6 sm:mb-8 tracking-tight intro-title animate-fade-in-up px-4" style={{fontFamily: 'var(--font-montserrat), system-ui, sans-serif'}}>
          THE UNSAID
        </h1>
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-light text-white/80 text-center max-w-3xl px-6 sm:px-4 tracking-wide intro-quote animate-fade-in-up-delayed leading-relaxed">
          The loudest words are the ones we never speak.
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

  if (showContent && currentView === "search") {
    return (
      <div className="min-h-screen flex flex-col bg-background animate-fade-in">
        <header className="flex flex-col sm:flex-row justify-between items-center p-4 sm:p-6 md:p-8 border-b border-border/20 gap-4">
          <div className="hidden sm:block"></div>
          <div className="w-full sm:w-auto flex justify-center">
            <form onSubmit={handleSearch} className="flex items-center gap-2 sm:gap-3 w-full max-w-md sm:max-w-none">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your name..."
                className="flex-1 sm:w-48 md:w-56 lg:w-64 border-0 bg-muted/20 backdrop-blur-sm text-foreground placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-foreground/20 transition-all duration-300 rounded-xl animate-slide-in-right"
                maxLength={50}
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={!searchQuery.trim() || isLoading}
                className="bg-foreground text-background hover:bg-foreground/90 hover:scale-105 px-3 sm:px-4 md:px-6 py-2 rounded-xl text-sm font-medium tracking-wide transition-all duration-300 disabled:opacity-50 animate-slide-in-right-delayed cursor-pointer whitespace-nowrap"
              >
                {isLoading ? "Searching..." : "Search"}
              </Button>
            </form>
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="scroll-animate text-center mb-8 sm:mb-12 content-slide opacity-0 translate-y-8 px-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-foreground tracking-tight mb-4 sm:mb-6 animate-pulse" style={{fontFamily: 'var(--font-montserrat), system-ui, sans-serif'}}>
                THE UNSAID
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground font-light tracking-wide max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed">
                A collection of unsaid text messages to first loves, family members, friends, and others. Search for a
                name to read messages written to people with that name.
              </p>
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}
              <Button
                onClick={() => setShowSubmitForm(true)}
                className="bg-foreground text-background hover:bg-foreground/90 hover:scale-105 px-6 sm:px-8 py-3 rounded-xl text-base font-medium tracking-wide transition-all duration-300 cursor-pointer"
              >
                Submit your unsaid
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground">Loading messages...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 px-4 sm:px-0">
                {messages.slice(0, 6).map((message, index) => (
                  <Card
                    key={message.id}
                    onClick={() => handleMessageClick(message)}
                    className="scroll-animate glass-card p-4 sm:p-6 shadow-lg note-enter border-l-4 border-l-foreground/20 hover:shadow-xl transition-all duration-500 cursor-pointer hover:scale-[1.02] hover:-translate-y-1 opacity-0 translate-y-8"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <span className="text-xs sm:text-sm font-medium text-foreground bg-muted/30 px-3 py-1 rounded-full">
                          To: {message.recipient}
                        </span>
                        <time className="text-xs text-muted-foreground font-light tracking-wider">
                          {formatTimestamp(message.timestamp)}
                        </time>
                      </div>
                      <p className="text-foreground leading-relaxed text-sm whitespace-pre-wrap tracking-wide font-light line-clamp-4">
                        {message.content}
                      </p>
                      <div className="text-xs text-muted-foreground">Anonymous</div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <footer className="border-t border-border/20 p-6 mt-12 animate-fade-in-up">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground text-sm font-light tracking-wide">Made by Ashwin Asthana</p>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/ashwinasthana"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-110"
                aria-label="GitHub"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/in/ashwinasthana"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-110"
                aria-label="LinkedIn"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect width="4" height="12" x="2" y="9" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
            </div>
          </div>
        </footer>

        {selectedMessage && (
          <div className={`fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 transition-opacity duration-300 ${isClosingMessage ? 'opacity-0' : 'opacity-100 animate-fade-in'}`}>
            <Card className={`glass-card p-4 sm:p-6 md:p-8 max-w-2xl w-full mx-3 sm:mx-4 shadow-2xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto bg-black/90 border border-white/20 transition-all duration-300 ${isClosingMessage ? 'scale-95 opacity-0' : 'scale-100 opacity-100 animate-scale-in'}`}>
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div className="animate-fade-in-up">
                    <h2 className="text-xl sm:text-2xl font-light text-white mb-2">To: {selectedMessage.recipient}</h2>
                    <p className="text-white/70 text-sm">{formatTimestamp(selectedMessage.timestamp)}</p>
                  </div>
                  <Button
                    onClick={closeMessageDetail}
                    variant="ghost"
                    size="sm"
                    className="text-white/70 hover:text-white hover:scale-110 transition-all duration-300"
                  >
                    ✕
                  </Button>
                </div>

                <div className="prose prose-invert max-w-none animate-fade-in-up" style={{ animationDelay: "200ms" }}>
                  <p className="text-white leading-relaxed text-base sm:text-lg whitespace-pre-wrap tracking-wide font-light">
                    {selectedMessage.content}
                  </p>
                </div>

                <div
                  className="text-sm text-white/70 border-t border-white/20 pt-4 animate-fade-in-up"
                  style={{ animationDelay: "400ms" }}
                >
                  Anonymous
                </div>
              </div>
            </Card>
          </div>
        )}

        {showSubmitForm && (
          <div className={`fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 transition-opacity duration-300 ${isClosingForm ? 'opacity-0' : 'opacity-100 animate-fade-in'}`}>
            <Card className={`glass-card p-4 sm:p-6 md:p-8 max-w-lg w-full mx-3 sm:mx-4 shadow-2xl bg-black/90 border border-white/20 transition-all duration-300 ${isClosingForm ? 'scale-95 opacity-0' : 'scale-100 opacity-100 animate-scale-in'}`}>
              <div className="space-y-6">
                <div className="text-center animate-fade-in-up">
                  <h2 className="text-xl sm:text-2xl font-light text-white mb-2">Submit an Unsaid Message</h2>
                  <p className="text-white/70 text-sm">Share something you never said</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  <Input
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="To: (first name only)"
                    className="glass-input border-0 text-base sm:text-lg py-3 px-4 rounded-xl bg-white/10 backdrop-blur-sm text-white placeholder:text-white/50 animate-fade-in-up"
                    style={{ animationDelay: "200ms" }}
                    disabled={isSubmitting}
                    maxLength={50}
                  />

                  <Textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Write your unsent message..."
                    className="glass-input border-0 resize-none min-h-[120px] text-base sm:text-lg leading-relaxed bg-white/10 backdrop-blur-sm text-white placeholder:text-white/50 animate-fade-in-up"
                    style={{ animationDelay: "400ms" }}
                    disabled={isSubmitting}
                    maxLength={2000}
                  />

                  <div
                    className="flex justify-end space-x-3 pt-4 animate-fade-in-up"
                    style={{ animationDelay: "600ms" }}
                  >
                    <Button
                      type="button"
                      onClick={() => {
                        setShowSubmitForm(false)
                        setError("")
                      }}
                      variant="ghost"
                      className="px-4 sm:px-6 py-2 rounded-xl text-white/70 hover:text-white hover:scale-105 transition-all duration-300"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={!newMessage.trim() || !recipientName.trim() || isSubmitting}
                      className="bg-white text-black hover:bg-white/90 hover:scale-105 px-6 sm:px-8 py-2 rounded-xl font-medium transition-all duration-300 disabled:opacity-50"
                    >
                      {isSubmitting ? "Submitting..." : "Submit"}
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          </div>
        )}
      </div>
    )
  }

  if (showContent && currentView === "results") {
    return (
      <div className="min-h-screen p-4 sm:p-6 md:p-8 bg-background animate-fade-in">
        <div className="max-w-2xl mx-auto content-slide">
          <div className="text-center mb-8 sm:mb-12 animate-fade-in-up">
            <Button
              onClick={() => {
                setCurrentView("search")
                setSearchQuery("")
                setSearchResults([])
              }}
              variant="ghost"
              className="mb-6 text-muted-foreground hover:text-foreground hover:scale-105 transition-all duration-300"
            >
              ← Back to search
            </Button>
            <h2 className="text-3xl sm:text-4xl font-light text-foreground mb-4 tracking-tight" style={{fontFamily: 'var(--font-montserrat), system-ui, sans-serif'}}>
              Messages for "{searchQuery}"
            </h2>
            <p className="text-muted-foreground">
              {searchResults.length} {searchResults.length === 1 ? "message" : "messages"} found
            </p>
          </div>

          {searchResults.length === 0 ? (
            <div className="text-center py-20 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
              <p className="text-muted-foreground text-lg sm:text-xl font-light tracking-wide leading-relaxed mb-8">
                Nothing left unsaid for you… yet.
              </p>
              <p className="text-muted-foreground text-base mb-8">Be the first to leave an unsaid message for them.</p>
              <Button
                onClick={() => setShowSubmitForm(true)}
                className="bg-foreground text-background hover:bg-foreground/90 hover:scale-105 px-6 sm:px-8 py-3 rounded-xl text-base font-medium tracking-wide transition-all duration-300"
              >
                Write a message
              </Button>
            </div>
          ) : (
            <div className="space-y-6 sm:space-y-8">
              {searchResults.map((message, index) => (
                <Card
                  key={message.id}
                  onClick={() => handleMessageClick(message)}
                  className="scroll-animate glass-card p-6 sm:p-8 shadow-lg note-enter border-l-4 border-l-foreground/20 cursor-pointer hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-500 opacity-0 translate-y-8"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="space-y-4">
                    <p className="text-foreground leading-relaxed text-base sm:text-lg whitespace-pre-wrap tracking-wide font-light line-clamp-6">
                      {message.content}
                    </p>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>Anonymous</span>
                      <time className="font-light tracking-wider">{formatTimestamp(message.timestamp)}</time>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <footer className="border-t border-border/20 p-6 mt-12 animate-fade-in-up">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground text-sm font-light tracking-wide">Made by Ashwin Asthana</p>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/ashwinasthana"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-110"
                aria-label="GitHub"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/in/ashwinasthana"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-110"
                aria-label="LinkedIn"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect width="4" height="12" x="2" y="9" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
            </div>
          </div>
        </footer>

        {selectedMessage && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <Card className={`glass-card p-8 sm:p-10 max-w-2xl w-full shadow-2xl max-h-[80vh] overflow-y-auto bg-black/90 border border-white/20 transition-all duration-300 ${isClosingMessage ? 'scale-95 opacity-0' : 'scale-100 opacity-100 animate-scale-in'}`}>
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div className="animate-fade-in-up">
                    <h2 className="text-xl sm:text-2xl font-light text-white mb-2">To: {selectedMessage.recipient}</h2>
                    <p className="text-white/70 text-sm">{formatTimestamp(selectedMessage.timestamp)}</p>
                  </div>
                  <Button
                    onClick={closeMessageDetail}
                    variant="ghost"
                    size="sm"
                    className="text-white/70 hover:text-white hover:scale-110 transition-all duration-300"
                  >
                    ✕
                  </Button>
                </div>

                <div className="prose prose-invert max-w-none animate-fade-in-up" style={{ animationDelay: "200ms" }}>
                  <p className="text-white leading-relaxed text-base sm:text-lg whitespace-pre-wrap tracking-wide font-light">
                    {selectedMessage.content}
                  </p>
                </div>

                <div
                  className="text-sm text-white/70 border-t border-white/20 pt-4 animate-fade-in-up"
                  style={{ animationDelay: "400ms" }}
                >
                  Anonymous
                </div>
              </div>
            </Card>
          </div>
        )}

        {showSubmitForm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <Card className={`glass-card p-8 sm:p-10 max-w-lg w-full shadow-2xl bg-black/90 border border-white/20 transition-all duration-300 ${isClosingForm ? 'scale-95 opacity-0' : 'scale-100 opacity-100 animate-scale-in'}`}>
              <div className="space-y-6">
                <div className="text-center animate-fade-in-up">
                  <h2 className="text-xl sm:text-2xl font-light text-white mb-2">Submit an Unsaid Message</h2>
                  <p className="text-white/70 text-sm">Share something you never said</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  <Input
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="To: (first name only)"
                    className="glass-input border-0 text-base sm:text-lg py-3 px-4 rounded-xl bg-white/10 backdrop-blur-sm text-white placeholder:text-white/50 animate-fade-in-up"
                    style={{ animationDelay: "200ms" }}
                    disabled={isSubmitting}
                    maxLength={50}
                  />

                  <Textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Write your unsent message..."
                    className="glass-input border-0 resize-none min-h-[120px] text-base sm:text-lg leading-relaxed bg-white/10 backdrop-blur-sm text-white placeholder:text-white/50 animate-fade-in-up"
                    style={{ animationDelay: "400ms" }}
                    disabled={isSubmitting}
                    maxLength={2000}
                  />

                  <div
                    className="flex justify-end space-x-3 pt-4 animate-fade-in-up"
                    style={{ animationDelay: "600ms" }}
                  >
                    <Button
                      type="button"
                      onClick={() => {
                        setShowSubmitForm(false)
                        setError("")
                      }}
                      variant="ghost"
                      className="px-4 sm:px-6 py-2 rounded-xl text-white/70 hover:text-white hover:scale-105 transition-all duration-300"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={!newMessage.trim() || !recipientName.trim() || isSubmitting}
                      className="bg-white text-black hover:bg-white/90 hover:scale-105 px-6 sm:px-8 py-2 rounded-xl font-medium transition-all duration-300 disabled:opacity-50"
                    >
                      {isSubmitting ? "Submitting..." : "Submit"}
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          </div>
        )}
      </div>
    )
  }

  return null
}
