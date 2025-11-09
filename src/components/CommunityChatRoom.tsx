import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender: {
    username: string;
    avatar_url: string | null;
  };
}

interface CommunityChatRoomProps {
  communityId: string;
  isMember: boolean;
}

export function CommunityChatRoom({ communityId, isMember }: CommunityChatRoomProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (communityId) {
      fetchThread();
    }
  }, [communityId]);

  useEffect(() => {
    if (threadId) {
      fetchMessages();

      // Subscribe to new messages
      const channel = supabase
        .channel(`community-chat-${threadId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `thread_id=eq.${threadId}`,
          },
          async (payload) => {
            // Fetch sender profile
            const { data: profile } = await supabase
              .from("profiles")
              .select("username, avatar_url")
              .eq("id", (payload.new as any).sender_id)
              .single();

            setMessages((prev) => [
              ...prev,
              {
                ...(payload.new as any),
                sender: profile || { username: "Unknown", avatar_url: null },
              },
            ]);

            // Auto-scroll to bottom
            setTimeout(() => {
              scrollRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [threadId]);

  const fetchThread = async () => {
    try {
      const { data, error } = await supabase
        .from("message_threads")
        .select("id")
        .eq("community_id", communityId)
        .eq("is_group", true)
        .single();

      if (error) throw error;
      setThreadId(data.id);
    } catch (error) {
      console.error("Error fetching thread:", error);
      toast.error("Failed to load chat");
    }
  };

  const fetchMessages = async () => {
    if (!threadId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("messages")
        .select(`
          id,
          content,
          sender_id,
          created_at,
          sender:profiles!messages_sender_id_fkey(username, avatar_url)
        `)
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) throw error;

      setMessages(
        (data || []).map((msg: any) => ({
          ...msg,
          sender: msg.sender || { username: "Unknown", avatar_url: null },
        }))
      );

      // Scroll to bottom
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: "auto" });
      }, 100);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!messageText.trim() || !threadId || !user) return;

    try {
      setSending(true);

      const { error } = await supabase.from("messages").insert({
        thread_id: threadId,
        sender_id: user.id,
        content: messageText.trim(),
      });

      if (error) throw error;

      setMessageText("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[500px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!isMember) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-[500px] text-center">
          <p className="text-muted-foreground mb-4">
            Join this community to participate in chat
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Community Chat</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] px-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No messages yet. Start the conversation!
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {messages.map((message) => {
                const isOwnMessage = message.sender_id === user?.id;

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.sender.avatar_url || undefined} />
                      <AvatarFallback>
                        {message.sender.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className={`flex-1 ${isOwnMessage ? "text-right" : ""}`}>
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium">
                          {message.sender.username}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(message.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <div
                        className={`mt-1 inline-block px-3 py-2 rounded-lg max-w-[80%] ${
                          isOwnMessage
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>
          )}
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
              rows={2}
              className="resize-none"
              disabled={sending}
            />
            <Button onClick={handleSend} disabled={sending || !messageText.trim()}>
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
