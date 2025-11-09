import { Navigation } from "@/components/Navigation";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Send, MessageSquare, Check, X, Inbox, Mail } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Thread {
  id: string;
  updated_at: string;
  other_user: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  last_message: {
    content: string;
    created_at: string;
    sender_id: string;
    is_request: boolean;
    status: string;
  } | null;
  unread_count: number;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_request: boolean;
  status: string;
}

const Messages = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeThreadId = searchParams.get('threadId');
  const startChatUserId = searchParams.get('startChat');
  
  const [loading, setLoading] = useState(true);
  const [inboxThreads, setInboxThreads] = useState<Thread[]>([]);
  const [requestThreads, setRequestThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchThreads();
    }
  }, [user]);

  useEffect(() => {
    if (startChatUserId && user) {
      handleStartChat(startChatUserId);
    } else if (activeThreadId) {
      loadThread(activeThreadId);
    }
  }, [activeThreadId, startChatUserId, user]);

  useEffect(() => {
    if (activeThread) {
      // Subscribe to new messages in active thread
      const channel = supabase
        .channel(`messages-${activeThread.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `thread_id=eq.${activeThread.id}`,
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new as Message]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [activeThread]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchThreads = async () => {
    try {
      setLoading(true);

      // Get all threads user is part of
      const { data: participantData } = await supabase
        .from("message_thread_participants")
        .select("thread_id, last_read_at")
        .eq("user_id", user?.id);

      const threadIds = participantData?.map(p => p.thread_id) || [];

      if (threadIds.length === 0) {
        setLoading(false);
        return;
      }

      // Get thread details
      const { data: threadsData } = await supabase
        .from("message_threads")
        .select("*")
        .in("id", threadIds)
        .order("updated_at", { ascending: false });

      // Get other participants and last messages
      const threadsWithDetails = await Promise.all(
        (threadsData || []).map(async (thread) => {
          // Get other participant
          const { data: otherParticipant } = await supabase
            .from("message_thread_participants")
            .select(`
              user_id,
              profiles (
                username,
                avatar_url
              )
            `)
            .eq("thread_id", thread.id)
            .neq("user_id", user?.id)
            .single();

          // Get last message
          const { data: lastMessage } = await supabase
            .from("messages")
            .select("*")
            .eq("thread_id", thread.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          // Count unread messages
          const userParticipant = participantData?.find(p => p.thread_id === thread.id);
          const { count: unreadCount } = await supabase
            .from("messages")
            .select("*", { count: 'exact', head: true })
            .eq("thread_id", thread.id)
            .neq("sender_id", user?.id)
            .gt("created_at", userParticipant?.last_read_at || "1970-01-01");

          return {
            id: thread.id,
            updated_at: thread.updated_at,
            other_user: {
              id: otherParticipant?.user_id || "",
              username: (otherParticipant?.profiles as any)?.username || "Unknown",
              avatar_url: (otherParticipant?.profiles as any)?.avatar_url || null,
            },
            last_message: lastMessage,
            unread_count: unreadCount || 0,
          };
        })
      );

      // Separate inbox and requests
      const inbox = threadsWithDetails.filter(
        t => !t.last_message?.is_request || t.last_message?.status === 'accepted'
      );
      const requests = threadsWithDetails.filter(
        t => t.last_message?.is_request && t.last_message?.status === 'pending'
      );

      setInboxThreads(inbox);
      setRequestThreads(requests);
    } catch (error) {
      console.error("Error fetching threads:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadThread = async (threadId: string) => {
    try {
      const thread = [...inboxThreads, ...requestThreads].find(t => t.id === threadId);
      setActiveThread(thread || null);

      // Fetch messages
      const { data: messagesData } = await supabase
        .from("messages")
        .select("*")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });

      setMessages(messagesData || []);

      // Mark as read
      await supabase
        .from("message_thread_participants")
        .update({ last_read_at: new Date().toISOString() })
        .eq("thread_id", threadId)
        .eq("user_id", user?.id);
    } catch (error) {
      console.error("Error loading thread:", error);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !activeThread || !user) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          thread_id: activeThread.id,
          sender_id: user.id,
          content: newMessage.trim(),
          is_request: false,
          status: 'accepted'
        });

      if (error) throw error;

      setNewMessage("");
      await loadThread(activeThread.id);
      await fetchThreads();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleAcceptRequest = async (threadId: string) => {
    try {
      // Update all pending messages in thread
      const { error } = await supabase
        .from("messages")
        .update({ status: 'accepted' })
        .eq("thread_id", threadId)
        .eq("status", "pending");

      if (error) throw error;

      toast.success("Message request accepted");
      await fetchThreads();
      if (activeThreadId === threadId) {
        await loadThread(threadId);
      }
    } catch (error) {
      console.error("Error accepting request:", error);
      toast.error("Failed to accept request");
    }
  };

  const handleRejectRequest = async (threadId: string) => {
    try {
      const { error } = await supabase
        .from("messages")
        .update({ status: 'rejected' })
        .eq("thread_id", threadId)
        .eq("status", "pending");

      if (error) throw error;

      toast.success("Message request rejected");
      await fetchThreads();
      if (activeThreadId === threadId) {
        setActiveThread(null);
        setSearchParams({});
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Failed to reject request");
    }
  };

  const handleStartChat = async (otherUserId: string) => {
    try {
      setStartingChat(true);

      const { data, error } = await supabase.functions.invoke('start-message-thread', {
        body: { other_user_id: otherUserId },
      });

      if (error) throw error;

      // Remove startChat param and set threadId
      setSearchParams({ threadId: data.thread_id });
      await fetchThreads();
      await loadThread(data.thread_id);

      if (data.created) {
        toast.success("New conversation started");
      }
    } catch (error) {
      console.error("Error starting chat:", error);
      toast.error("Failed to start conversation");
    } finally {
      setStartingChat(false);
    }
  };

  const ThreadItem = ({ thread }: { thread: Thread }) => (
    <button
      onClick={() => {
        setSearchParams({ threadId: thread.id });
        loadThread(thread.id);
      }}
      className={`w-full text-left p-4 border-b hover:bg-accent transition-colors ${
        activeThreadId === thread.id ? 'bg-accent' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={thread.other_user.avatar_url || undefined} />
          <AvatarFallback>{thread.other_user.username[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="font-semibold truncate">{thread.other_user.username}</p>
            {thread.unread_count > 0 && (
              <Badge variant="default" className="ml-2">{thread.unread_count}</Badge>
            )}
          </div>
          {thread.last_message && (
            <p className="text-sm text-muted-foreground truncate">
              {thread.last_message.content}
            </p>
          )}
        </div>
      </div>
    </button>
  );

  if (loading || startingChat) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">
              {startingChat ? "Starting conversation..." : "Loading..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-8 w-8" />
            Messages
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Thread List */}
          <Card className="md:col-span-1">
            <CardHeader className="pb-3">
              <Tabs defaultValue="inbox">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="inbox">
                    <Inbox className="h-4 w-4 mr-2" />
                    Inbox ({inboxThreads.length})
                  </TabsTrigger>
                  <TabsTrigger value="requests">
                    <Mail className="h-4 w-4 mr-2" />
                    Requests ({requestThreads.length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="inbox" className="mt-4">
                  {inboxThreads.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Inbox className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No messages yet</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {inboxThreads.map(thread => (
                        <ThreadItem key={thread.id} thread={thread} />
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="requests" className="mt-4">
                  {requestThreads.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No requests</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {requestThreads.map(thread => (
                        <ThreadItem key={thread.id} thread={thread} />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>

          {/* Messages View */}
          <Card className="md:col-span-2">
            {activeThread ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={activeThread.other_user.avatar_url || undefined} />
                        <AvatarFallback>
                          {activeThread.other_user.username[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <CardTitle>{activeThread.other_user.username}</CardTitle>
                    </div>
                    {activeThread.last_message?.is_request && activeThread.last_message?.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleAcceptRequest(activeThread.id)}>
                          <Check className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleRejectRequest(activeThread.id)}>
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px] p-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              message.sender_id === user?.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {new Date(message.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                  
                  {/* Message Input */}
                  {(!activeThread.last_message?.is_request || activeThread.last_message?.status === 'accepted') && (
                    <div className="p-4 border-t">
                      <div className="flex gap-2">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSend();
                            }
                          }}
                        />
                        <Button onClick={handleSend} disabled={!newMessage.trim() || sending}>
                          {sending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-[500px]">
                <div className="text-center text-muted-foreground">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Select a conversation to start messaging</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Messages;
