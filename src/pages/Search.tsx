import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Users, Building2, Briefcase, Globe, BookOpen, Loader2, UserPlus, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface SearchResults {
  users: any[];
  communities: any[];
  microjobs: any[];
  regions: any[];
  learning: any[];
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      performSearch(q, 'all');
    }
  }, [searchParams]);

  const performSearch = async (searchQuery: string, type: string = 'all') => {
    if (searchQuery.length < 2) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('global-search', {
        body: { q: searchQuery, type },
      });

      if (error) throw error;
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: "Could not perform search. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.length >= 2) {
      setSearchParams({ q: query });
      performSearch(query, activeTab);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (query.length >= 2) {
      performSearch(query, value);
    }
  };

  const handleSendFriendRequest = async (userId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to send friend requests.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('friendships')
        .insert({
          user_id: user.id,
          friend_user_id: userId,
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: "Friend request sent",
        description: "Your friend request has been sent successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to send request",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleJoinCommunity = async (communityId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to join communities.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('community_memberships')
        .insert({
          community_id: communityId,
          user_id: user.id,
          role: 'member',
        });

      if (error) throw error;

      toast({
        title: "Joined community",
        description: "You've successfully joined the community!",
      });
    } catch (error: any) {
      toast({
        title: "Failed to join",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const totalResults = results
    ? results.users.length + results.communities.length + results.microjobs.length + results.regions.length + results.learning.length
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
            <Search className="h-10 w-10 text-primary" />
            Search Results
          </h1>

          <form onSubmit={handleSearch} className="flex gap-2 mb-6">
            <Input
              type="text"
              placeholder="Search people, communities, jobs, regions..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </form>

          {query && (
            <p className="text-muted-foreground">
              {isLoading ? "Searching..." : `Found ${totalResults} results for "${query}"`}
            </p>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="communities">
              <Building2 className="h-4 w-4 mr-2" />
              Communities
            </TabsTrigger>
            <TabsTrigger value="microjobs">
              <Briefcase className="h-4 w-4 mr-2" />
              Micro-jobs
            </TabsTrigger>
            <TabsTrigger value="regions">
              <Globe className="h-4 w-4 mr-2" />
              Regions
            </TabsTrigger>
            <TabsTrigger value="learning">
              <BookOpen className="h-4 w-4 mr-2" />
              Learning
            </TabsTrigger>
          </TabsList>

          {/* All Results */}
          <TabsContent value="all">
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              </div>
            ) : results ? (
              <div className="space-y-8">
                {results.users.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                      <Users className="h-6 w-6" />
                      Users
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {results.users.slice(0, 6).map((user) => (
                        <Card key={user.id} className="hover:shadow-lg transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <Avatar>
                                <AvatarImage src={user.avatar_url} />
                                <AvatarFallback>{user.display_name?.[0]?.toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{user.display_name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {user.stats.total_credits} credits
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => navigate(`/profile?userId=${user.id}`)} className="flex-1">
                                View
                              </Button>
                              <Button size="sm" onClick={() => handleSendFriendRequest(user.id)}>
                                <UserPlus className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {results.communities.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                      <Building2 className="h-6 w-6" />
                      Communities
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {results.communities.slice(0, 6).map((community) => (
                        <Card key={community.id} className="hover:shadow-lg transition-shadow">
                          <CardHeader>
                            <CardTitle className="text-lg">{community.name}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {community.description || "No description"}
                            </p>
                            <div className="text-sm text-muted-foreground mb-3">
                              {community.member_count} members • {community.region_or_country || 'Global'}
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => navigate(`/communities/${community.id}`)} className="flex-1">
                                View
                              </Button>
                              <Button size="sm" onClick={() => handleJoinCommunity(community.id)}>
                                <LogIn className="h-4 w-4 mr-1" />
                                Join
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {results.microjobs.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                      <Briefcase className="h-6 w-6" />
                      Micro-jobs
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {results.microjobs.slice(0, 6).map((job) => (
                        <Card key={job.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/jobs/${job.id}`)}>
                          <CardHeader>
                            <CardTitle className="text-lg">{job.title}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex gap-2 mb-3">
                              <Badge variant="outline">{job.difficulty_level}</Badge>
                              <Badge variant="secondary">{job.category}</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <div>Reward: {job.reward_credits} credits</div>
                              <div>Duration: {job.estimated_duration_minutes} min</div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {results.regions.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                      <Globe className="h-6 w-6" />
                      Regions / Countries
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {results.regions.slice(0, 6).map((region) => (
                        <Card key={region.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/regions/${region.id}`)}>
                          <CardContent className="p-4">
                            <h3 className="font-semibold text-lg mb-2">{region.country_name}</h3>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div>Code: {region.iso_country}</div>
                              <div>Priority: {region.priority_score.toFixed(1)}</div>
                              <div>Climate Need: {region.climate_need_score.toFixed(1)}</div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {results.learning.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                      <BookOpen className="h-6 w-6" />
                      Learning
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {results.learning.slice(0, 6).map((item) => (
                        <Card key={item.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/quiz?module=${item.id}`)}>
                          <CardContent className="p-4">
                            <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                            <Badge variant="secondary">{item.type}</Badge>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {totalResults === 0 && (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-xl font-semibold mb-2">No results found</h3>
                      <p className="text-muted-foreground">Try adjusting your search query</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : null}
          </TabsContent>

          {/* Individual type tabs would be similar but show more results (20 instead of 6) */}
          {/* For brevity, I'll create one example for users */}
          
          <TabsContent value="users">
            {results && results.users.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.users.map((user) => (
                  <Card key={user.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar>
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback>{user.display_name?.[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{user.display_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {user.stats.total_credits} credits
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => navigate(`/profile?userId=${user.id}`)} className="flex-1">
                          View
                        </Button>
                        <Button size="sm" onClick={() => handleSendFriendRequest(user.id)}>
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No users found</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Similar TabsContent for communities, microjobs, regions, learning */}
          <TabsContent value="communities">
            {results && results.communities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.communities.map((community) => (
                  <Card key={community.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{community.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {community.description || "No description"}
                      </p>
                      <div className="text-sm text-muted-foreground mb-3">
                        {community.member_count} members • {community.region_or_country || 'Global'}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => navigate(`/communities/${community.id}`)} className="flex-1">
                          View
                        </Button>
                        <Button size="sm" onClick={() => handleJoinCommunity(community.id)}>
                          <LogIn className="h-4 w-4 mr-1" />
                          Join
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No communities found</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="microjobs">
            {results && results.microjobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.microjobs.map((job) => (
                  <Card key={job.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/jobs/${job.id}`)}>
                    <CardHeader>
                      <CardTitle className="text-lg">{job.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2 mb-3">
                        <Badge variant="outline">{job.difficulty_level}</Badge>
                        <Badge variant="secondary">{job.category}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <div>Reward: {job.reward_credits} credits</div>
                        <div>Duration: {job.estimated_duration_minutes} min</div>
                        <div>CO₂ Impact: {job.estimated_co2_kg_impact} kg</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Briefcase className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No micro-jobs found</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="regions">
            {results && results.regions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.regions.map((region) => (
                  <Card key={region.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/regions/${region.id}`)}>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-2">{region.country_name}</h3>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div>Code: {region.iso_country}</div>
                        <div>Priority: {region.priority_score.toFixed(1)}</div>
                        <div>Climate Need: {region.climate_need_score.toFixed(1)}</div>
                        <div>Inequality: {region.inequality_score.toFixed(1)}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Globe className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No regions found</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="learning">
            {results && results.learning.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.learning.map((item) => (
                  <Card key={item.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/quiz?module=${item.id}`)}>
                    <CardHeader>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant="secondary" className="mb-3">{item.type}</Badge>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {item.content?.substring(0, 150)}...
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No learning content found</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
