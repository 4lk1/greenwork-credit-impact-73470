import { Navigation } from "@/components/Navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Loader2, MapPin, Wifi, Sprout, Award, Leaf, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface Region {
  id: string;
  region_id: number;
  iso_country: string;
  region_name: string;
  lat: number;
  lon: number;
  avg_download_mbps: number;
  avg_upload_mbps: number;
  avg_latency_ms: number;
  network_type: string;
  dominant_land_cover: string;
  climate_need_score: number;
  inequality_score: number;
  priority_score: number;
  recommended_microjob_category: string;
  source_connectivity_dataset: string;
  source_landcover_dataset: string;
}

interface MicroJob {
  id: string;
  title: string;
  description: string;
  difficulty_level: string;
  estimated_duration_minutes: number;
  reward_credits: number;
  estimated_co2_kg_impact: number;
  location: string;
}

const RegionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [region, setRegion] = useState<Region | null>(null);
  const [recommendedJobs, setRecommendedJobs] = useState<MicroJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRegionAndJobs();
  }, [id]);

  const fetchRegionAndJobs = async () => {
    try {
      // Fetch region details
      const { data: regionData, error: regionError } = await supabase
        .from("regions")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (regionError) throw regionError;
      if (!regionData) {
        toast.error("Region not found");
        navigate("/regions");
        return;
      }

      setRegion(regionData);

      // Fetch recommended micro-jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from("micro_jobs")
        .select("id, title, description, difficulty_level, estimated_duration_minutes, reward_credits, estimated_co2_kg_impact, location")
        .eq("category", regionData.recommended_microjob_category)
        .eq("is_active", true)
        .limit(3);

      if (jobsError) throw jobsError;
      setRecommendedJobs(jobsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load region details");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    return category.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  const getScoreBadge = (score: number, label: string) => {
    let colorClass = "";
    let level = "";

    if (score < 0.4) {
      colorClass = "bg-success/10 text-success border-success/20";
      level = "Low";
    } else if (score < 0.7) {
      colorClass = "bg-warning/10 text-warning border-warning/20";
      level = "Medium";
    } else {
      colorClass = "bg-destructive/10 text-destructive border-destructive/20";
      level = "High";
    }

    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{label}:</span>
        <Badge variant="outline" className={colorClass}>{level}</Badge>
        <span className="text-sm font-semibold">({score.toFixed(2)})</span>
      </div>
    );
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

  if (!region) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <p className="text-muted-foreground">Region not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Link to="/regions" className="hover:text-primary">Regions</Link>
              <span>/</span>
              <span>{region.region_name}</span>
            </div>
            <h1 className="text-4xl font-bold mb-2">{region.region_name}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{region.iso_country} • {region.lat.toFixed(2)}°N, {region.lon.toFixed(2)}°E</span>
            </div>
          </div>

          {/* Priority Scores Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Priority Assessment</CardTitle>
              <CardDescription>
                This region's priority score combines climate need and inequality to guide where
                climate-resilience micro-jobs can have the highest impact.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
                <span className="text-lg font-semibold">Priority Score</span>
                <span className="text-3xl font-bold text-primary">{region.priority_score.toFixed(2)}</span>
              </div>
              
              <div className="grid gap-3">
                {getScoreBadge(region.climate_need_score, "Climate Need")}
                {getScoreBadge(region.inequality_score, "Inequality")}
              </div>

              <div className="pt-4">
                <Badge variant="outline" className="border-primary/20 text-primary text-base px-4 py-2">
                  <Sprout className="h-4 w-4 mr-2" />
                  Recommended: {getCategoryLabel(region.recommended_microjob_category)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Connectivity & Land Cover */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="h-5 w-5" />
                  Connectivity Metrics
                </CardTitle>
                <CardDescription>
                  Derived from ASDI-style Speedtest data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network Type:</span>
                  <span className="font-semibold capitalize">{region.network_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Download Speed:</span>
                  <span className="font-semibold">{region.avg_download_mbps} Mbps</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Upload Speed:</span>
                  <span className="font-semibold">{region.avg_upload_mbps} Mbps</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Latency:</span>
                  <span className="font-semibold">{region.avg_latency_ms} ms</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sprout className="h-5 w-5" />
                  Land Cover
                </CardTitle>
                <CardDescription>
                  Derived from ASDI-style 9-class land-cover data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dominant Type:</span>
                  <Badge variant="secondary" className="capitalize">{region.dominant_land_cover}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommended Micro-Jobs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recommended Micro-Jobs</CardTitle>
                  <CardDescription>
                    Jobs matching {getCategoryLabel(region.recommended_microjob_category)} category for this region
                  </CardDescription>
                </div>
                <Button asChild>
                  <Link to={`/jobs?category=${region.recommended_microjob_category}`}>
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recommendedJobs.length > 0 ? (
                <div className="space-y-4">
                  {recommendedJobs.map((job) => (
                    <Card key={job.id} className="hover:border-primary transition-colors">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <CardTitle className="text-lg">{job.title}</CardTitle>
                          <Badge variant="outline" className={getDifficultyColor(job.difficulty_level)}>
                            {job.difficulty_level}
                          </Badge>
                        </div>
                        <CardDescription className="line-clamp-2">{job.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Award className="h-4 w-4 text-warning" />
                              {job.reward_credits} credits
                            </div>
                            <div className="flex items-center gap-1">
                              <Leaf className="h-4 w-4 text-success" />
                              {job.estimated_co2_kg_impact} kg CO₂
                            </div>
                          </div>
                          <Button size="sm" asChild>
                            <Link to={`/jobs/${job.id}`}>View Details</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No jobs currently available in this category.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Data Sources */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm">Data Sources</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1">
              <p><strong>Connectivity:</strong> {region.source_connectivity_dataset}</p>
              <p><strong>Land Cover:</strong> {region.source_landcover_dataset}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RegionDetail;
