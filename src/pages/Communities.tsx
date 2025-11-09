import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Globe, Award, Briefcase, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Communities() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState<string>("all");

  // Fetch communities with stats
  const { data: communities, isLoading } = useQuery({
    queryKey: ["communities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("communities")
        .select(`
          *,
          memberships:community_memberships(count)
        `)
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch stats for each community
      const communitiesWithStats = await Promise.all(
        (data || []).map(async (community) => {
          const { data: completions, error: completionsError } = await supabase
            .from("job_completions")
            .select("earned_credits, estimated_co2_kg_impact")
            .eq("community_id", community.id);

          if (completionsError) throw completionsError;

          const totalCredits = completions?.reduce((sum, c) => sum + (c.earned_credits || 0), 0) || 0;
          const totalCo2 = completions?.reduce((sum, c) => sum + (c.estimated_co2_kg_impact || 0), 0) || 0;
          const totalJobs = completions?.length || 0;

          return {
            ...community,
            memberCount: community.memberships?.[0]?.count || 0,
            totalCredits,
            totalCo2,
            totalJobs,
          };
        })
      );

      return communitiesWithStats;
    },
  });

  // Get unique regions for filter
  const regions = Array.from(new Set(communities?.map(c => c.region_or_country).filter(Boolean))) as string[];

  // Filter communities
  const filteredCommunities = communities?.filter(community => {
    const matchesSearch = !searchQuery || 
      community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      community.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRegion = regionFilter === "all" || community.region_or_country === regionFilter;
    
    return matchesSearch && matchesRegion;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <Users className="h-10 w-10 text-primary" />
                Communities
              </h1>
              <p className="text-muted-foreground">
                Join forces with others to amplify your climate impact
              </p>
            </div>
            <Button onClick={() => navigate("/communities/new")} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Create Community
            </Button>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mt-6">
            <Input
              placeholder="Search communities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {regions.map(region => (
                  <SelectItem key={region} value={region}>{region}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCommunities && filteredCommunities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCommunities.map((community) => (
              <Card 
                key={community.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/communities/${community.id}`)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-xl">{community.name}</CardTitle>
                    {community.is_public && (
                      <Badge variant="secondary">
                        <Globe className="h-3 w-3 mr-1" />
                        Public
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2">
                    {community.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {community.region_or_country && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Globe className="h-4 w-4" />
                        {community.region_or_country}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{community.memberCount}</span>
                      <span className="text-muted-foreground">members</span>
                    </div>
                    <div className="pt-3 border-t space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          Jobs
                        </span>
                        <span className="font-semibold">{community.totalJobs}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Award className="h-4 w-4" />
                          Credits
                        </span>
                        <span className="font-semibold">{community.totalCredits}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">CO₂ Impact</span>
                        <span className="font-semibold">{community.totalCo2.toFixed(1)} kg</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No communities found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || regionFilter !== "all" 
                  ? "Try adjusting your filters" 
                  : "Be the first to create a community!"}
              </p>
              <Button onClick={() => navigate("/communities/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Community
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
