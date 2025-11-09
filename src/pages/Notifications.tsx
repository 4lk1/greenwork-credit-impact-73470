import { Navigation } from "@/components/Navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Bell, UserPlus, MessageSquare, Users, Briefcase, Check, Filter } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Notification {
  id: string;
  type: string;
  data: any;
  is_read: boolean;
  created_at: string;
}

const Notifications = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filterStatus, setFilterStatus] = useState<"all" | "unread" | "read">("all");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Subscribe to new notifications
      const channel = supabase
        .channel('notifications-page')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            setNotifications((prev) => [payload.new as Notification, ...prev]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user?.id)
        .eq("is_read", false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Failed to mark all as read");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_follower': return <UserPlus className="h-5 w-5 text-blue-500" />;
      case 'new_message': return <MessageSquare className="h-5 w-5 text-green-500" />;
      case 'message_request': return <MessageSquare className="h-5 w-5 text-yellow-500" />;
      case 'community_join': return <Users className="h-5 w-5 text-purple-500" />;
      case 'job_completed': return <Briefcase className="h-5 w-5 text-primary" />;
      default: return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getNotificationText = (notification: Notification) => {
    const data = notification.data;
    switch (notification.type) {
      case 'new_follower':
        return `${data.follower_name} started following you`;
      case 'new_message':
        return `${data.sender_name} sent you a message`;
      case 'message_request':
        return `${data.sender_name} sent you a message request`;
      case 'community_join':
        return `${data.username} joined ${data.community_name}`;
      case 'job_completed':
        return `You completed a job!`;
      default:
        return 'New notification';
    }
  };

  const getNotificationLink = (notification: Notification) => {
    const data = notification.data;
    switch (notification.type) {
      case 'new_follower':
        return `/profile?userId=${data.follower_id}`;
      case 'new_message':
      case 'message_request':
        return `/messages?threadId=${data.thread_id}`;
      case 'community_join':
        return `/communities/${data.community_id}`;
      default:
        return null;
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    // Filter by read status
    if (filterStatus === "unread" && n.is_read) return false;
    if (filterStatus === "read" && !n.is_read) return false;
    
    // Filter by type
    if (filterType !== "all" && n.type !== filterType) return false;
    
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Bell className="h-8 w-8" />
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <p className="text-muted-foreground mt-1">
                    You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
              {unreadCount > 0 && (
                <Button variant="outline" onClick={markAllAsRead}>
                  <Check className="mr-2 h-4 w-4" />
                  Mark all as read
                </Button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)} className="flex-1">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="unread">Unread</TabsTrigger>
                  <TabsTrigger value="read">Read</TabsTrigger>
                </TabsList>
              </Tabs>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="new_follower">New followers</SelectItem>
                  <SelectItem value="new_message">Messages</SelectItem>
                  <SelectItem value="message_request">Message requests</SelectItem>
                  <SelectItem value="community_join">Community joins</SelectItem>
                  <SelectItem value="job_completed">Job completions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>
                    {notifications.length === 0
                      ? "No notifications yet"
                      : "No notifications match your filters"}
                  </p>
                  <p className="text-sm mt-2">
                    {notifications.length === 0
                      ? "We'll notify you when something important happens"
                      : "Try adjusting your filters"}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredNotifications.map((notification) => {
                    const link = getNotificationLink(notification);
                    const content = (
                      <div
                        className={`flex items-start gap-4 p-4 hover:bg-accent transition-colors cursor-pointer ${
                          !notification.is_read ? 'bg-primary/5' : ''
                        }`}
                        onClick={() => !notification.is_read && markAsRead(notification.id)}
                      >
                        <div className="mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">
                            {getNotificationText(notification)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <Badge variant="default" className="shrink-0">New</Badge>
                        )}
                      </div>
                    );

                    return link ? (
                      <Link key={notification.id} to={link}>
                        {content}
                      </Link>
                    ) : (
                      <div key={notification.id}>{content}</div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
