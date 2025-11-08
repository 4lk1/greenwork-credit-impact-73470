import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Loader2, Leaf } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatWidgetProps {
  context?: string;
}

export const ChatWidget = ({ context }: ChatWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm GreenBot 🌱 How can I help you learn about GreenWorks CodeX today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("greenbot-chat", {
        body: {
          message: userMessage,
          context: context || "No specific page context",
          history: messages.slice(-6), // Last 6 messages for context
        }
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      setMessages(prev => [
        ...prev,
        { role: "assistant", content: data.reply }
      ]);
    } catch (error: any) {
      console.error("Chat error:", error);
      
      if (error.message?.includes("Rate limit")) {
        toast({
          title: "Slow down! 🐌",
          description: "Please wait a moment before sending another message.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Oops! 😅",
          description: "Sorry, I couldn't reach GreenBot. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Keep within viewport bounds
    const maxX = window.innerWidth - 80; // button/panel width
    const maxY = window.innerHeight - 80; // button/panel height
    
    setPosition({
      x: Math.max(-maxX + 100, Math.min(maxX - 100, newX)),
      y: Math.max(-maxY + 100, Math.min(maxY - 100, newY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart, position]);

  return (
    <>
      {/* Chat Bubble Button */}
      {!isOpen && (
        <div 
          className="fixed z-[99999] animate-fade-in cursor-move"
          style={{ 
            right: position.x === 0 ? '1rem' : 'auto',
            bottom: position.y === 0 ? '1rem' : 'auto',
            left: position.x !== 0 ? `calc(50% + ${position.x}px)` : 'auto',
            top: position.y !== 0 ? `calc(50% + ${position.y}px)` : 'auto',
            transform: position.x !== 0 || position.y !== 0 ? 'translate(-50%, -50%)' : 'none'
          }}
          onMouseDown={handleMouseDown}
        >
          <Button
            onClick={() => setIsOpen(true)}
            size="lg"
            className="relative h-14 w-14 md:h-16 md:w-16 rounded-full shadow-glow gradient-primary hover:scale-110 transition-smooth animate-pulse group"
          >
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            <div className="relative flex flex-col items-center justify-center gap-0.5">
              <Leaf className="h-5 w-5 md:h-6 md:w-6" />
              <span className="text-[9px] md:text-[10px] font-semibold">Chat</span>
            </div>
          </Button>
          <div className="absolute -top-2 -right-2 h-4 w-4 bg-accent rounded-full border-2 border-background animate-pulse" />
        </div>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <Card 
          className="fixed w-[calc(100vw-2rem)] max-w-[400px] h-[70vh] md:h-[600px] max-h-[600px] shadow-large border-2 border-primary/20 flex flex-col z-[99999] animate-scale-in"
          style={{ 
            right: position.x === 0 ? '1rem' : 'auto',
            bottom: position.y === 0 ? '1rem' : 'auto',
            left: position.x !== 0 ? `calc(50% + ${position.x}px)` : 'auto',
            top: position.y !== 0 ? `calc(50% + ${position.y}px)` : 'auto',
            transform: position.x !== 0 || position.y !== 0 ? 'translate(-50%, -50%)' : 'none'
          }}
        >
          <CardHeader 
            className="gradient-primary text-primary-foreground p-3 md:p-4 rounded-t-lg flex-shrink-0 cursor-move"
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <Leaf className="h-4 w-4 md:h-5 md:w-5" />
                </div>
                GreenBot
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-primary-foreground/80 mt-1">
              Your GreenWorks assistant
            </p>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 min-h-0">
            <ScrollArea className="flex-1 p-3 md:p-4" ref={scrollRef}>
              <div className="space-y-3 md:space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg p-2.5 md:p-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {message.role === "assistant" && (
                        <div className="flex items-center gap-2 mb-1">
                          <Leaf className="h-3 w-3 text-primary" />
                          <span className="text-xs font-semibold text-primary">GreenBot</span>
                        </div>
                      )}
                      <div className="text-xs md:text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start animate-fade-in">
                    <div className="bg-muted rounded-lg p-2.5 md:p-3 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-xs md:text-sm text-muted-foreground">GreenBot is thinking...</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="border-t p-3 md:p-4 bg-background flex-shrink-0">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  disabled={isLoading}
                  className="flex-1 text-sm"
                />
                <Button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  size="icon"
                  className="gradient-primary flex-shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Press Enter to send
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};
