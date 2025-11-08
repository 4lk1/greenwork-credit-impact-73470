import { Navigation } from "@/components/Navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2, MapPin, Clock, Award, Leaf } from "lucide-react";
import { toast } from "sonner";
import { StaggeredGrid } from "@/components/StaggeredGrid";
import { useLanguage } from "@/contexts/LanguageContext";
import { ChatWidget } from "@/components/ChatWidget";

interface MicroJob {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty_level: string;
  estimated_duration_minutes: number;
  reward_credits: number;
  estimated_co2_kg_impact: number;
  location: string;
}

const Jobs = () => {
  const [searchParams] = useSearchParams();
  const [jobs, setJobs] = useState<MicroJob[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<MicroJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const { t } = useLanguage();

  // Set category filter from URL on mount
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      setCategoryFilter(categoryParam);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [jobs, categoryFilter, difficultyFilter]);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from("micro_jobs")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast.error(t("jobs.loadError") || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...jobs];

    if (categoryFilter !== "all") {
      filtered = filtered.filter((job) => job.category === categoryFilter);
    }

    if (difficultyFilter !== "all") {
      filtered = filtered.filter((job) => job.difficulty_level === difficultyFilter);
    }

    setFilteredJobs(filtered);
  };

  const getCategoryLabel = (category: string) => {
    return category.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case "beginner": return "bg-success/10 text-success border-success/20";
      case "intermediate": return "bg-warning/10 text-warning border-warning/20";
      case "advanced": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "";
    }
  };

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
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">{t("jobs.title")}</h1>
            <p className="text-lg text-muted-foreground">
              {t("jobs.subtitle")}
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("jobs.allCategories")}</SelectItem>
                <SelectItem value="tree_planting">{t("jobs.treePlanting")}</SelectItem>
                <SelectItem value="solar_maintenance">{t("jobs.solarMaintenance")}</SelectItem>
                <SelectItem value="water_harvesting">{t("jobs.waterHarvesting")}</SelectItem>
                <SelectItem value="agroforestry">{t("jobs.agroforestry")}</SelectItem>
                <SelectItem value="home_insulation">{t("jobs.homeInsulation")}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("jobs.allLevels")}</SelectItem>
                <SelectItem value="beginner">{t("jobs.beginner")}</SelectItem>
                <SelectItem value="intermediate">{t("jobs.intermediate")}</SelectItem>
                <SelectItem value="advanced">{t("jobs.advanced")}</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex-1" />

            <div className="text-sm text-muted-foreground flex items-center">
              {t("jobs.showing")} {filteredJobs.length} {t("jobs.of")} {jobs.length} {t("jobs.jobsText")}
            </div>
          </div>

          {/* Jobs Grid */}
          {filteredJobs.length > 0 ? (
            <StaggeredGrid 
              className="grid md:grid-cols-2 gap-6"
              staggerDelay={100}
            >
              {filteredJobs.map((job) => (
                <Card key={job.id} className="gradient-card hover:border-primary transition-smooth hover:shadow-medium">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline" className="border-primary/20 text-primary">
                        {getCategoryLabel(job.category)}
                      </Badge>
                      <Badge variant="outline" className={getDifficultyColor(job.difficulty_level)}>
                        {job.difficulty_level}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{job.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{job.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {t("jobs.time")}: {job.estimated_duration_minutes} {t("jobs.minutes")}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Award className="h-4 w-4 text-warning" />
                        {job.reward_credits} {t("jobs.credits")}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Leaf className="h-4 w-4 text-success" />
                        {t("jobs.climateImpact")}: {job.estimated_co2_kg_impact} kg CO₂
                      </div>
                    </div>
                    <Button asChild className="w-full">
                      <Link to={`/jobs/${job.id}`}>{t("jobs.viewDetails")}</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </StaggeredGrid>
          ) : (
            <div className="text-center py-12 animate-fade-in">
              <p className="text-muted-foreground">{t("jobs.noMatch")}</p>
            </div>
          )}
        </div>
      </div>

      <ChatWidget context="page=jobs; user is browsing micro-jobs with categories like tree_planting, water_harvesting, solar_maintenance, agroforestry, home_insulation" />
    </div>
  );
};

export default Jobs;
