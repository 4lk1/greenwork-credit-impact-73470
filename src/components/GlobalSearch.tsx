import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Users, Building2, Briefcase, Globe, BookOpen, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SearchResults {
  users: any[];
  communities: any[];
  microjobs: any[];
  regions: any[];
  learning: any[];
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();

  // Close dropdown and collapse when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsExpanded(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase.functions.invoke('global-search', {
          body: { q: query },
        });

        if (error) throw error;
        
        setResults(data);
        setIsOpen(true);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  const handleResultClick = (path: string) => {
    setIsOpen(false);
    setQuery("");
    navigate(path);
  };

  const hasResults = results && (
    results.users.length > 0 ||
    results.communities.length > 0 ||
    results.microjobs.length > 0 ||
    results.regions.length > 0 ||
    results.learning.length > 0
  );

  return (
    <div ref={searchRef} className="relative">
      {!isExpanded ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsExpanded(true)}
          className="h-10 w-10 rounded-full hover:bg-accent hover:shadow-glow transition-smooth"
        >
          <Search className="h-5 w-5" />
        </Button>
      ) : (
        <div className="relative w-80 animate-scale-in">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search people, communities..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-4 shadow-medium"
            onFocus={() => query.length >= 2 && setIsOpen(true)}
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      )}

      {isOpen && query.length >= 2 && (
        <Card className="absolute top-full mt-2 w-full max-h-[500px] overflow-y-auto z-50 shadow-lg">
          {isLoading && !results ? (
            <div className="p-4 text-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              Searching...
            </div>
          ) : hasResults ? (
            <div className="p-2">
              {/* Users */}
              {results.users.length > 0 && (
                <div className="mb-4">
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                    <Users className="h-3 w-3" />
                    Users
                  </div>
                  {results.users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleResultClick(`/profile?userId=${user.id}`)}
                      className="w-full flex items-center gap-3 p-2 hover:bg-accent rounded-md text-left"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback>{user.display_name?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{user.display_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {user.stats.total_credits} credits
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Communities */}
              {results.communities.length > 0 && (
                <div className="mb-4">
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                    <Building2 className="h-3 w-3" />
                    Communities
                  </div>
                  {results.communities.map((community) => (
                    <button
                      key={community.id}
                      onClick={() => handleResultClick(`/communities/${community.id}`)}
                      className="w-full flex items-center gap-3 p-2 hover:bg-accent rounded-md text-left"
                    >
                      <Building2 className="h-8 w-8 p-1.5 bg-primary/10 text-primary rounded" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{community.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {community.member_count} members • {community.region_or_country || 'Global'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Micro-jobs */}
              {results.microjobs.length > 0 && (
                <div className="mb-4">
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                    <Briefcase className="h-3 w-3" />
                    Micro-jobs
                  </div>
                  {results.microjobs.map((job) => (
                    <button
                      key={job.id}
                      onClick={() => handleResultClick(`/jobs/${job.id}`)}
                      className="w-full flex items-center gap-3 p-2 hover:bg-accent rounded-md text-left"
                    >
                      <Briefcase className="h-8 w-8 p-1.5 bg-primary/10 text-primary rounded" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{job.title}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{job.difficulty_level}</Badge>
                          <span>{job.category}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Regions */}
              {results.regions.length > 0 && (
                <div className="mb-4">
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                    <Globe className="h-3 w-3" />
                    Regions / Countries
                  </div>
                  {results.regions.map((region) => (
                    <button
                      key={region.id}
                      onClick={() => handleResultClick(`/regions/${region.id}`)}
                      className="w-full flex items-center gap-3 p-2 hover:bg-accent rounded-md text-left"
                    >
                      <Globe className="h-8 w-8 p-1.5 bg-primary/10 text-primary rounded" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{region.country_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {region.iso_country} • Priority: {region.priority_score.toFixed(1)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Learning */}
              {results.learning.length > 0 && (
                <div className="mb-2">
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                    <BookOpen className="h-3 w-3" />
                    Learning
                  </div>
                  {results.learning.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleResultClick(`/quiz?module=${item.id}`)}
                      className="w-full flex items-center gap-3 p-2 hover:bg-accent rounded-md text-left"
                    >
                      <BookOpen className="h-8 w-8 p-1.5 bg-primary/10 text-primary rounded" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.title}</div>
                        <div className="text-xs text-muted-foreground">{item.type}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* View all results */}
              <button
                onClick={() => handleResultClick(`/search?q=${encodeURIComponent(query)}`)}
                className="w-full p-2 text-sm text-primary hover:bg-accent rounded-md text-center font-medium"
              >
                View all results for "{query}"
              </button>
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              No matches found for "{query}"
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
