"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getUser } from "@/lib/supabase"
import { getSupabaseClient } from "@/lib/supabase-singleton"
import { getClientChatHistory, saveClientChatInteraction } from "@/lib/chat-utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Send, Loader2, Bot, User, Lightbulb, MessageSquare } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import Image from "next/image"
// Add this import at the top:
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
}

interface Insight {
  id: string
  insight_text: string
  insight_type: string
  focus_area?: string
  created_at: string
}

export default function ChatPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [user, setUser] = useState<any>(null)
  const [userName, setUserName] = useState("User")
  const [insight, setInsight] = useState<Insight | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [userMessage, setUserMessage] = useState("")
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Get insight data from URL parameters
  useEffect(() => {
    const insightId = searchParams.get("insightId")
    const insightText = searchParams.get("insightText")
    const insightType = searchParams.get("insightType")
    const focusArea = searchParams.get("focusArea")
    const createdAt = searchParams.get("createdAt")

    // Only update if we have the required parameters and they're different from current state
    if (insightText && insightType) {
      const decodedText = decodeURIComponent(insightText)
      const decodedType = decodeURIComponent(insightType)
      const decodedFocusArea = focusArea ? decodeURIComponent(focusArea) : undefined

      setInsight((prevInsight) => {
        // If nothing has changed, return the previous state to prevent re-renders
        if (
          prevInsight?.id === insightId &&
          prevInsight?.insight_text === decodedText &&
          prevInsight?.insight_type === decodedType &&
          prevInsight?.focus_area === decodedFocusArea
        ) {
          return prevInsight
        }

        // Otherwise, return the new state
        return {
          id: insightId || "",
          insight_text: decodedText,
          insight_type: decodedType,
          focus_area: decodedFocusArea,
          created_at: createdAt || new Date().toISOString(),
        }
      })
    }
  }, [searchParams])

  // Initialize user and load chat history
  useEffect(() => {
    let isMounted = true

    const initChat = async () => {
      // Skip if no insight or if already initialized
      if (!insight?.id) return

      try {
        setIsLoading(true)

        // Check authentication
        const currentUser = await getUser()
        if (!currentUser) {
          router.push("/login")
          return
        }

        if (!isMounted) return
        setUser(currentUser)

        // Get user profile for name
        const supabase = getSupabaseClient()
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name")
          .eq("user_id", currentUser.id)
          .single()

        if (!isMounted) return
        if (profile?.first_name) {
          setUserName(profile.first_name)
        }

        // Load chat history
        const history = await getClientChatHistory(50, insight.id)

        if (!isMounted) return

        if (history.length > 0) {
          // Convert history to chat messages
          const messages: ChatMessage[] = []

          // Add system message with insight
          messages.push({
            role: "system",
            content: `Daily Insight: ${insight.insight_text}`,
            timestamp: new Date(insight.created_at),
          })

          // Add historical messages
          history
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            .forEach((interaction) => {
              messages.push({
                role: "user",
                content: interaction.user_message,
                timestamp: new Date(interaction.created_at),
              })
              messages.push({
                role: "assistant",
                content: interaction.assistant_response,
                timestamp: new Date(interaction.created_at),
              })
            })

          setChatMessages(messages)
        } else {
          // Initialize with welcome message
          const messages: ChatMessage[] = [
            {
              role: "system",
              content: `Daily Insight: ${insight.insight_text}`,
              timestamp: new Date(insight.created_at),
            },
            {
              role: "assistant",
              content: `Hi ${profile?.first_name || "User"}! I see you're interested in today's insight about ${
                insight.focus_area?.toLowerCase() || "your wellbeing"
              }. I'm here to help you understand and implement this advice. What questions do you have, or how can I help you apply this to your specific situation?`,
              timestamp: new Date(),
            },
          ]

          setChatMessages(messages)
        }
      } catch (error) {
        if (!isMounted) return
        console.error("Error initializing chat:", error)
        toast({
          title: "Error",
          description: "Failed to initialize chat. Please try again.",
          variant: "destructive",
        })
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    initChat()

    return () => {
      isMounted = false
    }
  }, [insight?.id, router, toast])

  // Remove the separate initializeChat function since we've incorporated it directly
  // into the useEffect to avoid potential state update issues

  // Remove this function:
  // const initializeChat = () => {
  //   if (!insight) return
  //
  //   const messages: ChatMessage[] = [
  //     {
  //       role: "system",
  //       content: `Daily Insight: ${insight.insight_text}`,
  //       timestamp: new Date(insight.created_at),
  //     },
  //     {
  //       role: "assistant",
  //       content: `Hi ${userName}! I see you're interested in today's insight about ${
  //         insight.focus_area?.toLowerCase() || "your wellbeing"
  //       }. I'm here to help you understand and implement this advice. What questions do you have, or how can I help you apply this to your specific situation?`,
  //       timestamp: new Date(),
  //     },
  //   ]
  //
  //   setChatMessages(messages)
  // }

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [chatMessages])

  const startNewChat = () => {
    // Clear all messages except keep the insight system message and initial welcome
    if (insight) {
      const messages: ChatMessage[] = [
        {
          role: "system",
          content: `Daily Insight: ${insight.insight_text}`,
          timestamp: new Date(insight.created_at),
        },
        {
          role: "assistant",
          content: `Hi ${userName}! I see you're interested in today's insight about ${
            insight.focus_area?.toLowerCase() || "your wellbeing"
          }. I'm here to help you understand and implement this advice. What questions do you have, or how can I help you apply this to your specific situation?`,
          timestamp: new Date(),
        },
      ]
      setChatMessages(messages)
      setUserMessage("")
      setIsTyping(false)
      setIsSendingMessage(false)
    }
  }

  const stripMarkdown = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold **text**
      .replace(/\*(.*?)\*/g, "$1") // Remove italic *text*
      .replace(/`(.*?)`/g, "$1") // Remove inline code `text`
      .replace(/#{1,6}\s/g, "") // Remove headers # ## ###
      .replace(/^\s*[-*+]\s/gm, "• ") // Convert list items to bullet points
      .replace(/^\s*\d+\.\s/gm, "") // Remove numbered list formatting
      .replace(/\[([^\]]+)\]$$[^)]+$$/g, "$1") // Remove links [text](url) -> text
      .trim()
  }

  const sendChatMessage = async () => {
    if (!userMessage.trim() || !insight) return

    const newUserMessage: ChatMessage = {
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    }

    setChatMessages((prev) => [...prev, newUserMessage])
    setUserMessage("")
    setIsSendingMessage(true)
    setIsTyping(true)

    try {
      // Filter out system messages for the API call
      const chatHistoryForApi = chatMessages.filter((msg) => msg.role !== "system")

      const response = await fetch("/api/chat-with-insight", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          insight: insight.insight_text,
          insightType: insight.insight_type,
          focusArea: insight.focus_area,
          insightId: insight.id,
          chatHistory: chatHistoryForApi,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      // Simulate typing effect
      await new Promise((resolve) => setTimeout(resolve, 500))
      setIsTyping(false)

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: stripMarkdown(data.response),
        timestamp: new Date(),
      }

      setChatMessages((prev) => [...prev, assistantMessage])

      // Save the interaction
      if (insight.id) {
        try {
          await saveClientChatInteraction(userMessage, data.response, insight.id, {
            insightType: insight.insight_type,
            focusArea: insight.focus_area,
          })
        } catch (saveError) {
          console.error("Failed to save chat:", saveError)
        }
      }
    } catch (error) {
      setIsTyping(false)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
      console.error("Chat error:", error)
    } finally {
      setIsSendingMessage(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendChatMessage()
    }
  }

  const formatInsightType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
        <div className="container max-w-4xl mx-auto">
          <Card className="flex items-center justify-center h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading chat...</p>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  if (!insight) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
        <div className="container max-w-4xl mx-auto">
          <Card>
            <CardContent className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No insight data found.</p>
              <Button onClick={() => router.back()}>Return to Dashboard</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="container max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="sr-only">Back</span>
                </Button>
                <div className="flex items-center gap-2">
                  <Image
                    src="/mw3-logo.png"
                    alt="MW3 Logo"
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full bg-white p-1"
                  />
                  <div>
                    <CardTitle className="text-lg">MW3-GPT Chat</CardTitle>
                    <CardDescription className="text-xs">
                      Discussing: {formatInsightType(insight.insight_type)}
                      {insight.focus_area && ` - ${insight.focus_area}`}
                    </CardDescription>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={startNewChat}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  New Chat
                </Button>
                <Button variant="outline" size="sm" onClick={() => router.push("/dashboard")}>
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Breadcrumb Navigation */}
        <div className="mb-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Daily Insight</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <span>Chat</span>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Chat Messages */}
        <Card className="flex flex-col h-[calc(100vh-200px)] overflow-hidden">
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4 pb-4">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex w-full",
                    msg.role === "system" ? "justify-center" : msg.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  {msg.role === "system" ? (
                    <div className="bg-primary/10 rounded-lg px-4 py-3 max-w-[90%] border border-primary/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Lightbulb className="h-4 w-4 text-primary" />
                        <span className="text-xs font-medium text-primary">Today's Insight</span>
                      </div>
                      <p className="text-sm">{msg.content.replace("Daily Insight: ", "")}</p>
                    </div>
                  ) : (
                    <div
                      className={cn("flex gap-3 max-w-[80%]", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
                    >
                      <Avatar className={cn("h-8 w-8", msg.role === "user" ? "bg-primary" : "bg-secondary")}>
                        {msg.role === "user" ? (
                          <>
                            <AvatarImage src="/placeholder.svg" alt={userName} />
                            <AvatarFallback>
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </>
                        ) : (
                          <>
                            <AvatarImage src="/mw3-logo.png" alt="MW3-GPT" />
                            <AvatarFallback>
                              <Bot className="h-4 w-4" />
                            </AvatarFallback>
                          </>
                        )}
                      </Avatar>
                      <div className="space-y-1">
                        <div
                          className={cn(
                            "rounded-lg px-4 py-2",
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted border border-border",
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        <p className="text-xs text-muted-foreground px-1">
                          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex gap-3 max-w-[80%]">
                    <Avatar className="h-8 w-8 bg-secondary">
                      <AvatarImage src="/mw3-logo.png" alt="MW3-GPT" />
                      <AvatarFallback>
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="rounded-lg px-4 py-3 bg-muted border border-border">
                      <div className="flex space-x-1">
                        <div className="h-2 w-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="h-2 w-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="h-2 w-2 bg-current rounded-full animate-bounce"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t p-4 bg-background">
            <div className="flex gap-3">
              <Textarea
                placeholder="Ask a follow-up question..."
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[60px] max-h-[120px] resize-none"
                disabled={isSendingMessage}
              />
              <Button
                size="icon"
                onClick={sendChatMessage}
                disabled={!userMessage.trim() || isSendingMessage}
                className="h-[60px] w-[60px]"
              >
                {isSendingMessage ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
