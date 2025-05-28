"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getClientChatHistory, type ChatInteraction } from "@/lib/chat-utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MessageSquare, Calendar, Bot, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDistanceToNow } from "date-fns"

export default function ChatHistoryPage() {
  const router = useRouter()
  const [chatHistory, setChatHistory] = useState<ChatInteraction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedChat, setSelectedChat] = useState<ChatInteraction | null>(null)

  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const history = await getClientChatHistory(50)
        setChatHistory(history)
      } catch (error) {
        console.error("Failed to load chat history:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadChatHistory()
  }, [])

  // Group chats by date
  const groupedChats = chatHistory.reduce(
    (groups, chat) => {
      const date = new Date(chat.created_at).toLocaleDateString()
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(chat)
      return groups
    },
    {} as Record<string, ChatInteraction[]>,
  )

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => router.push("/dashboard")} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold">Chat History</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Chat List */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Recent Conversations
            </CardTitle>
            <CardDescription>Your previous coaching conversations</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 text-center">Loading conversations...</div>
            ) : chatHistory.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">No conversations yet</div>
            ) : (
              <ScrollArea className="h-[500px]">
                {Object.entries(groupedChats).map(([date, chats]) => (
                  <div key={date}>
                    <div className="sticky top-0 bg-background p-2 border-b">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {date}
                      </div>
                    </div>
                    {chats.map((chat) => (
                      <div
                        key={chat.id}
                        className={`p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                          selectedChat?.id === chat.id ? "bg-muted" : ""
                        }`}
                        onClick={() => setSelectedChat(chat)}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="/placeholder.svg" alt="User" />
                            <AvatarFallback>
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{chat.user_message}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(chat.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Chat Detail */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Conversation Details</CardTitle>
            <CardDescription>
              {selectedChat
                ? `From ${new Date(selectedChat.created_at).toLocaleString()}`
                : "Select a conversation to view details"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedChat ? (
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg" alt="User" />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 bg-primary/10 rounded-lg p-3">
                    <p className="text-sm">{selectedChat.user_message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(selectedChat.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 bg-secondary">
                    <AvatarImage src="/mw3-logo.png" alt="MW3-GPT" />
                    <AvatarFallback>
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 bg-secondary/10 rounded-lg p-3 border">
                    <p className="text-sm whitespace-pre-wrap">{selectedChat.assistant_response}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(selectedChat.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {selectedChat.metadata && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Context</h4>
                    <div className="text-xs text-muted-foreground">
                      {selectedChat.metadata.insightType && (
                        <p>
                          <strong>Insight Type:</strong> {selectedChat.metadata.insightType}
                        </p>
                      )}
                      {selectedChat.metadata.focusArea && (
                        <p>
                          <strong>Focus Area:</strong> {selectedChat.metadata.focusArea}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Select a conversation from the list to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
