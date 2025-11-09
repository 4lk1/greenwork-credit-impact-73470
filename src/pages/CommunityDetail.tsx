import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Globe, Users, Award, Briefcase, TrendingUp, UserPlus, LogOut, Edit, Pin, Megaphone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CommunityChatRoom } from "@/components/CommunityChatRoom";
import { CommunityMissions } from "@/components/CommunityMissions";
import type { Community, CommunityMembership, Profile } from "@/types/social";

interface MemberWithStats extends CommunityMembership {
  profile: Profile;
  totalCredits: number;
  totalCo2: number;
  totalJobs: number;
}

export default function CommunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch community details
  const { data: community, isLoading: loadingCommunity } = useQuery<Community>({
    queryKey: ["community", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("communities")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Community;
    },
  });

  // Fetch current user's membership
  const { data: currentMembership } = useQuery<CommunityMembership | null>({
    queryKey: ["community-membership", id, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("community_memberships")
        .select("*")
        .eq("community_id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data as CommunityMembership | null;
    },
    enabled: !!user?.id,
  });

  // Fetch all members
  const { data: members, isLoading: loadingMembers } = useQuery<MemberWithStats[]>({
    queryKey: ["community-members", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_memberships")
        .select(`
          *,
          profile:profiles(id, username, avatar_url)
        `)
        .eq("community_id", id)
        .order("joined_at", { ascending: true });

      if (error) throw error;

      // Fetch stats for each member
      const membersWithStats = await Promise.all(
        (data || []).map(async (member: any) => {
          const { data: completions, error: completionsError } = await supabase
            .from("job_completions")
            .select("earned_credits, estimated_co2_kg_impact")
            .eq("user_id", member.user_id)
            .eq("community_id", id);

          if (completionsError) throw completionsError;

          const totalCredits = (completions || []).reduce((sum: number, c: any) => sum + (c.earned_credits || 0), 0);
          const totalCo2 = (completions || []).reduce((sum: number, c: any) => sum + (Number(c.estimated_co2_kg_impact) || 0), 0);
          const totalJobs = completions?.length || 0;

          return {
            ...member,
            totalCredits,
            totalCo2,
            totalJobs,
          } as MemberWithStats;
        })
      );

      return membersWithStats;
    },
  });

  // Fetch community stats
  const { data: communityStats } = useQuery({
    queryKey: ["community-stats", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_completions")
        .select("earned_credits, estimated_co2_kg_impact")
        .eq("community_id", id);

      if (error) throw error;

      return {
        totalJobs: data?.length || 0,
        totalCredits: (data || []).reduce((sum: number, c: any) => sum + (c.earned_credits || 0), 0),
        totalCo2: (data || []).reduce((sum: number, c: any) => sum + (Number(c.estimated_co2_kg_impact) || 0), 0),
      };
    },
  });

  // Fetch recent activity
  const { data: recentActivity } = useQuery({
    queryKey: ["community-activity", id],
    queryFn: async () => {
      const { data: completions, error: completionsError } = await supabase
        .from("job_completions")
        .select(`
          *,
          user:profiles!job_completions_user_id_fkey(username, avatar_url),
          job:micro_jobs!job_completions_microjob_id_fkey(title)
        `)
        .eq("community_id", id)
        .order("completed_at", { ascending: false })
        .limit(10);

      if (completionsError) throw completionsError;

      const { data: newMembers, error: membersError } = await supabase
        .from("community_memberships")
        .select(`
          *,
          profile:profiles(username, avatar_url)
        `)
        .eq("community_id", id)
        .order("joined_at", { ascending: false })
        .limit(5);

      if (membersError) throw membersError;

      const activities = [
        ...(completions || []).map((c: any) => ({
          type: "completion",
          timestamp: c.completed_at,
          user: c.user,
          data: {
            job_title: c.job?.title,
            credits: c.earned_credits,
          },
        })),
        ...(newMembers || []).map((m: any) => ({
          type: "join",
          timestamp: m.joined_at,
          user: m.profile,
          data: {},
        })),
      ];

      return activities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 10);
    },
  });

  // Join community mutation
  const joinCommunityMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("community_memberships")
        .insert({
          community_id: id,
          user_id: user.id,
          role: "member",
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-membership", id] });
      queryClient.invalidateQueries({ queryKey: ["community-members", id] });
      toast.success("Successfully joined the community!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to join community");
    },
  });

  // Leave community mutation
  const leaveCommunityMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !currentMembership) throw new Error("Invalid membership");

      const { error } = await supabase
        .from("community_memberships")
        .delete()
        .eq("id", currentMembership.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-membership", id] });
      queryClient.invalidateQueries({ queryKey: ["community-members", id] });
      toast.success("Left the community");
      navigate("/communities");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to leave community");
    },
  });

  if (loadingCommunity) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <h2 className="text-2xl font-bold mb-2">Community not found</h2>
              <Button onClick={() => navigate("/communities")}>
                Back to Communities
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const isOwner = currentMembership?.role === "owner";
  const isAdmin = currentMembership?.role === "admin" || isOwner;
  const isMember = !!currentMembership;

  // Sort members for leaderboard
  const sortedMembers = [...(members || [])].sort((a, b) => b.totalCredits - a.totalCredits);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/communities")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Communities
        </Button>

        {/* Banner Image */}
        {(community as any).banner_url && (
          <div className="mb-6 rounded-lg overflow-hidden">
            <img
              src={(community as any).banner_url}
              alt={community.name}
              className="w-full h-48 object-cover"
            />
          </div>
        )}

        {/* Community Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <h1 className="text-4xl font-bold">{community.name}</h1>
                  {community.is_public && (
                    <Badge variant="secondary">
                      <Globe className="h-3 w-3 mr-1" />
                      Public
                    </Badge>
                  )}
                  {isOwner && (
                    <Badge variant="default">Owner</Badge>
                  )}
                  {isAdmin && !isOwner && (
                    <Badge variant="default">Admin</Badge>
                  )}
                </div>
                {community.description && (
                  <p className="text-muted-foreground mb-3">{community.description}</p>
                )}
                <div className="flex items-center gap-4 flex-wrap">
                  {community.region_or_country && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      {community.region_or_country}
                    </p>
                  )}
                  {(community as any).tags && (community as any).tags.length > 0 && (
                    <div className="flex gap-2">
                      {(community as any).tags.map((tag: string) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {isAdmin && (
                  <Button variant="outline" asChild>
                    <Link to={`/communities/${id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                  </Button>
                )}
                {!isMember && (
                  <Button
                    onClick={() => joinCommunityMutation.mutate()}
                    disabled={joinCommunityMutation.isPending}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Join Community
                  </Button>
                )}
                {isMember && !isOwner && (
                  <Button
                    variant="outline"
                    onClick={() => leaveCommunityMutation.mutate()}
                    disabled={leaveCommunityMutation.isPending}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Leave
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Announcements and Pinned Message */}
        {((community as any).announcement || (community as any).pinned_message) && (
          <div className="space-y-4 mb-6">
            {(community as any).announcement && (
              <Card className="border-primary/50 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Megaphone className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">Announcement</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {(community as any).announcement}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {(community as any).pinned_message && (
              <Card className="border-yellow-500/50 bg-yellow-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Pin className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">Pinned Message</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {(community as any).pinned_message}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Team Members</p>
                  <p className="text-3xl font-bold">{members?.length || 0}</p>
                </div>
                <Users className="h-10 w-10 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Credits</p>
                  <p className="text-3xl font-bold">{communityStats?.totalCredits || 0}</p>
                </div>
                <Award className="h-10 w-10 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">CO₂ Impact</p>
                  <p className="text-3xl font-bold">{communityStats?.totalCo2.toFixed(1) || 0} kg</p>
                </div>
                <TrendingUp className="h-10 w-10 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="missions">Missions</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Rules */}
            {(community as any).rules && (
              <Card>
                <CardHeader>
                  <CardTitle>Community Rules & Guidelines</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm">{(community as any).rules}</p>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {!recentActivity || recentActivity.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No recent activity
                  </p>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((activity: any, index) => (
                      <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={activity.user?.avatar_url || undefined} />
                          <AvatarFallback>
                            {activity.user?.username?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          {activity.type === "completion" ? (
                            <p className="text-sm">
                              <span className="font-medium">{activity.user?.username}</span>
                              {" "}completed{" "}
                              <span className="font-medium">{activity.data.job_title}</span>
                              {" "}(+{activity.data.credits} credits)
                            </p>
                          ) : (
                            <p className="text-sm">
                              <span className="font-medium">{activity.user?.username}</span>
                              {" "}joined the community
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat">
            <CommunityChatRoom communityId={id!} isMember={isMember} />
          </TabsContent>

          <TabsContent value="missions">
            <CommunityMissions communityId={id!} isAdmin={isAdmin} />
          </TabsContent>

          <TabsContent value="leaderboard">
            <Card>
              <CardHeader>
                <CardTitle>Top Contributors</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingMembers ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : sortedMembers.length > 0 ? (
                  <div className="space-y-4">
                    {sortedMembers.map((member, index) => (
                      <div key={member.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-muted-foreground w-8">
                          #{index + 1}
                        </div>
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={member.profile.avatar_url || ""} />
                          <AvatarFallback>
                            {member.profile.display_name?.[0] || member.profile.username?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">
                              {member.profile.username}
                            </h3>
                            {member.role !== "member" && (
                              <Badge variant="secondary" className="text-xs">
                                {member.role}
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              {member.totalJobs} jobs
                            </span>
                            <span>🌍 {member.totalCo2.toFixed(1)} kg CO₂</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-primary">
                            <Award className="h-5 w-5" />
                            <span className="text-2xl font-bold">{member.totalCredits}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">credits</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No contributions yet
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle>All Members ({members?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingMembers ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : members && members.length > 0 ? (
                  <div className="space-y-4">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={member.profile.avatar_url || ""} />
                          <AvatarFallback>
                            {member.profile.display_name?.[0] || member.profile.username?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">
                              {member.profile.username}
                            </h3>
                            {member.role !== "member" && (
                              <Badge variant="secondary">{member.role}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Joined {new Date(member.joined_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {member.totalCredits} credits
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No members yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
