import { useParams, useNavigate } from "react-router-dom";
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
import { ArrowLeft, Globe, Users, Award, Briefcase, TrendingUp, UserPlus, LogOut } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CommunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch community details
  const { data: community, isLoading: loadingCommunity } = useQuery({
    queryKey: ["community", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("communities")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch current user's membership
  const { data: currentMembership } = useQuery({
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
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch all members
  const { data: members, isLoading: loadingMembers } = useQuery({
    queryKey: ["community-members", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_memberships")
        .select(`
          *,
          profile:profiles(id, username, display_name, avatar_url)
        `)
        .eq("community_id", id)
        .order("joined_at", { ascending: true });

      if (error) throw error;

      // Fetch stats for each member
      const membersWithStats = await Promise.all(
        (data || []).map(async (member) => {
          const { data: completions, error: completionsError } = await supabase
            .from("job_completions")
            .select("earned_credits, estimated_co2_kg_impact")
            .eq("user_id", member.user_id)
            .eq("community_id", id);

          if (completionsError) throw completionsError;

          const totalCredits = completions?.reduce((sum, c) => sum + (c.earned_credits || 0), 0) || 0;
          const totalCo2 = completions?.reduce((sum, c) => sum + (c.estimated_co2_kg_impact || 0), 0) || 0;
          const totalJobs = completions?.length || 0;

          return {
            ...member,
            totalCredits,
            totalCo2,
            totalJobs,
          };
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
        totalCredits: data?.reduce((sum, c) => sum + (c.earned_credits || 0), 0) || 0,
        totalCo2: data?.reduce((sum, c) => sum + (c.estimated_co2_kg_impact || 0), 0) || 0,
      };
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

        {/* Community Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
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
                {community.region_or_country && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    {community.region_or_country}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
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
        <Tabs defaultValue="leaderboard" className="space-y-6">
          <TabsList>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="members">All Members</TabsTrigger>
          </TabsList>

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
                              {member.profile.display_name || member.profile.username}
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
                              {member.profile.display_name || member.profile.username}
                            </h3>
                            {member.role !== "member" && (
                              <Badge variant="secondary">{member.role}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Joined {new Date(member.joined_at).toLocaleDateString()}
                          </p>
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
