import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Users, UserPlus, Check, X, MapPin, Briefcase, Award, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import type { Profile } from "@/types/social";

interface FriendWithStats extends Profile {
  friendship_id: string;
  created_at: string;
}

interface FriendStats {
  userId: string;
  totalJobs: number;
  totalCredits: number;
  totalCo2: number;
}

export default function Friends() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch friends (accepted friendships)
  const { data: friends, isLoading: loadingFriends } = useQuery<FriendWithStats[]>({
    queryKey: ["friends", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("friendships")
        .select(`
          id,
          friend_user_id,
          created_at,
          friend:profiles!friendships_friend_user_id_fkey(
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq("user_id", user?.id)
        .eq("status", "accepted");

      if (error) throw error;

      // Also fetch reverse friendships
      const { data: reverseFriends, error: reverseError } = await (supabase as any)
        .from("friendships")
        .select(`
          id,
          user_id,
          created_at,
          friend:profiles!friendships_user_id_fkey(
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq("friend_user_id", user?.id)
        .eq("status", "accepted");

      if (reverseError) throw reverseError;

      // Combine and deduplicate
      const allFriends = [
        ...(data || []).map((f: any) => ({ ...f.friend, friendship_id: f.id, created_at: f.created_at })),
        ...(reverseFriends || []).map((f: any) => ({ ...f.friend, friendship_id: f.id, created_at: f.created_at }))
      ];

      return allFriends as FriendWithStats[];
    },
    enabled: !!user,
  });

  // Fetch friend stats
  const { data: friendStats } = useQuery<FriendStats[]>({
    queryKey: ["friend-stats", friends],
    queryFn: async () => {
      if (!friends || friends.length === 0) return [];

      const stats = await Promise.all(
        friends.map(async (friend) => {
          const { data, error } = await (supabase as any)
            .from("job_completions")
            .select("earned_credits, estimated_co2_kg_impact", { count: "exact" })
            .eq("user_id", friend.id);

          if (error) throw error;

          return {
            userId: friend.id,
            totalJobs: data?.length || 0,
            totalCredits: (data || []).reduce((sum: number, c: any) => sum + (c.earned_credits || 0), 0),
            totalCo2: (data || []).reduce((sum: number, c: any) => sum + (Number(c.estimated_co2_kg_impact) || 0), 0),
          };
        })
      );

      return stats;
    },
    enabled: !!friends && friends.length > 0,
  });

  // Fetch pending requests
  const { data: pendingRequests, isLoading: loadingPending } = useQuery<{ incoming: any[]; outgoing: any[] }>({
    queryKey: ["pending-requests", user?.id],
    queryFn: async () => {
      // Incoming requests
      const { data: incoming, error: incomingError } = await (supabase as any)
        .from("friendships")
        .select(`
          id,
          user_id,
          created_at,
          requester:profiles!friendships_user_id_fkey(
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq("friend_user_id", user?.id)
        .eq("status", "pending");

      if (incomingError) throw incomingError;

      // Outgoing requests
      const { data: outgoing, error: outgoingError } = await (supabase as any)
        .from("friendships")
        .select(`
          id,
          friend_user_id,
          created_at,
          recipient:profiles!friendships_friend_user_id_fkey(
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq("user_id", user?.id)
        .eq("status", "pending");

      if (outgoingError) throw outgoingError;

      return {
        incoming: incoming || [],
        outgoing: outgoing || [],
      };
    },
    enabled: !!user,
  });

  // Fetch suggested users
  const { data: suggestedUsers, isLoading: loadingSuggested } = useQuery<Profile[]>({
    queryKey: ["suggested-users", user?.id],
    queryFn: async () => {
      // Get users who are not friends and not the current user
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .neq("id", user?.id)
        .limit(10);

      if (error) throw error;

      // Filter out existing friends and pending requests
      const friendIds = new Set([
        ...(friends || []).map(f => f.id),
        ...(pendingRequests?.incoming || []).map((r: any) => r.user_id),
        ...(pendingRequests?.outgoing || []).map((r: any) => r.friend_user_id),
      ]);

      return ((data || []) as Profile[]).filter(u => !friendIds.has(u.id));
    },
    enabled: !!user && !!friends && !!pendingRequests,
  });

  // Send friend request mutation
  const sendRequestMutation = useMutation({
    mutationFn: async (friendId: string) => {
      const { error } = await (supabase as any)
        .from("friendships")
        .insert({
          user_id: user?.id,
          friend_user_id: friendId,
          status: "pending",
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-requests"] });
      queryClient.invalidateQueries({ queryKey: ["suggested-users"] });
      toast.success("Friend request sent!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send friend request");
    },
  });

  // Accept friend request mutation
  const acceptRequestMutation = useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await (supabase as any)
        .from("friendships")
        .update({ status: "accepted" })
        .eq("id", friendshipId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["pending-requests"] });
      toast.success("Friend request accepted!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to accept request");
    },
  });

  // Reject friend request mutation
  const rejectRequestMutation = useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await (supabase as any)
        .from("friendships")
        .update({ status: "rejected" })
        .eq("id", friendshipId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-requests"] });
      toast.success("Friend request rejected");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to reject request");
    },
  });

  const getStats = (userId: string) => {
    return friendStats?.find(s => s.userId === userId) || { totalJobs: 0, totalCredits: 0, totalCo2: 0 };
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Users className="h-10 w-10 text-primary" />
            Friends & Connections
          </h1>
          <p className="text-muted-foreground">
            Connect with other GreenWorks members and track your collective impact
          </p>
        </div>

        <Tabs defaultValue="friends" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends">
              My Friends {friends && `(${friends.length})`}
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending {pendingRequests && `(${pendingRequests.incoming.length + pendingRequests.outgoing.length})`}
            </TabsTrigger>
            <TabsTrigger value="discover">Discover</TabsTrigger>
          </TabsList>

          <TabsContent value="friends">
            <Card>
              <CardHeader>
                <CardTitle>My Friends</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingFriends ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : friends && friends.length > 0 ? (
                  <div className="space-y-4">
                    {friends.map((friend) => {
                      const stats = getStats(friend.id);
                      return (
                        <div key={friend.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent transition-colors">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={friend.avatar_url || ""} />
                            <AvatarFallback>{friend.display_name?.[0] || friend.username?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{friend.display_name || friend.username}</h3>
                            <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Briefcase className="h-4 w-4" />
                                {stats.totalJobs} jobs
                              </span>
                              <span className="flex items-center gap-1">
                                <Award className="h-4 w-4" />
                                {stats.totalCredits} credits
                              </span>
                              <span>🌍 {stats.totalCo2.toFixed(1)} kg CO₂</span>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/messages?startChat=${friend.id}`}>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Message
                            </Link>
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No friends yet. Start connecting with other members!
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending">
            <div className="space-y-6">
              {/* Incoming requests */}
              <Card>
                <CardHeader>
                  <CardTitle>Incoming Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingPending ? (
                    <Skeleton className="h-20 w-full" />
                  ) : pendingRequests && pendingRequests.incoming.length > 0 ? (
                    <div className="space-y-4">
                      {pendingRequests.incoming.map((request) => (
                        <div key={request.id} className="flex items-center gap-4 p-4 border rounded-lg">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={request.requester.avatar_url || ""} />
                            <AvatarFallback>{request.requester.display_name?.[0] || request.requester.username?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-semibold">{request.requester.display_name || request.requester.username}</h3>
                            <p className="text-sm text-muted-foreground">Wants to connect with you</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => acceptRequestMutation.mutate(request.id)}
                              disabled={acceptRequestMutation.isPending}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rejectRequestMutation.mutate(request.id)}
                              disabled={rejectRequestMutation.isPending}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">No incoming requests</p>
                  )}
                </CardContent>
              </Card>

              {/* Outgoing requests */}
              <Card>
                <CardHeader>
                  <CardTitle>Outgoing Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingPending ? (
                    <Skeleton className="h-20 w-full" />
                  ) : pendingRequests && pendingRequests.outgoing.length > 0 ? (
                    <div className="space-y-4">
                      {pendingRequests.outgoing.map((request) => (
                        <div key={request.id} className="flex items-center gap-4 p-4 border rounded-lg">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={request.recipient.avatar_url || ""} />
                            <AvatarFallback>{request.recipient.display_name?.[0] || request.recipient.username?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-semibold">{request.recipient.display_name || request.recipient.username}</h3>
                            <Badge variant="secondary">Pending</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">No outgoing requests</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="discover">
            <Card>
              <CardHeader>
                <CardTitle>Discover Members</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingSuggested ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : suggestedUsers && suggestedUsers.length > 0 ? (
                  <div className="space-y-4">
                    {suggestedUsers.map((user) => (
                      <div key={user.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={user.avatar_url || ""} />
                          <AvatarFallback>{user.display_name?.[0] || user.username?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold">{user.display_name || user.username}</h3>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/messages?startChat=${user.id}`}>
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Message
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => sendRequestMutation.mutate(user.id)}
                            disabled={sendRequestMutation.isPending}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Add Friend
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No suggestions available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
