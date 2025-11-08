import { Navigation } from "@/components/Navigation";
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Wifi, Network, Mountain, ArrowLeft, Briefcase } from "lucide-react";
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
  reward_credits: number;
  estimated_co2_kg_impact: number;
}

const RegionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [region, setRegion] = useState<Region | null>(null);
  const [matchingJobs, setMatchingJobs] = useState<MicroJob[]>([]);
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

      // Fetch matching micro-jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from("micro_jobs")
        .select("id, title, description, difficulty_level, reward_credits, estimated_co2_kg_impact")
        .eq("category", regionData.recommended_microjob_category)
        .eq("is_active", true)
        .limit(5);

      if (jobsError) throw jobsError;
      setMatchingJobs(jobsData || []);
    } catch (error) {
      console.error("Error fetching region:", error);
      toast.error("Failed to load region details");
    } finally {
      setLoading(false);
    }
  };

  const getScoreBadge = (score: number, label: string) => {
    let variant = "";
    let level = "";
    
    if (score >= 0.7) {
      variant = "bg-destructive/10 text-destructive border-destructive/20";
      level = "High";
    } else if (score >= 0.4) {
      variant = "bg-warning/10 text-warning border-warning/20";
      level = "Medium";
    } else {
      variant = "bg-success/10 text-success border-success/20";
      level = "Low";
    }

    return (
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <Badge className={variant}>{level} ({score.toFixed(2)})</Badge>
      </div>
    );
  };

  const getCategoryLabel = (category: string) => {
    return category.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
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
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/regions")}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Regions
          </Button>

          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">{region.region_name}</h1>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {region.iso_country}
                  </div>
                  <div>
                    Coordinates: {region.lat.toFixed(2)}°N, {region.lon.toFixed(2)}°E
                  </div>
                </div>
              </div>
              <Badge className="text-lg px-4 py-2">
                Priority: {region.priority_score.toFixed(2)}
              </Badge>
            </div>

            <Card className="bg-info/5 border-info/20">
              <CardContent className="pt-6">
                <p className="text-sm leading-relaxed">
                  <strong>About Priority Scores:</strong> This region's priority score combines climate need and inequality to guide where climate-resilience micro-jobs can have the highest impact. Higher scores indicate areas where interventions can create the most significant positive change for vulnerable communities facing climate challenges.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Scores Card */}
            <Card>
              <CardHeader>
                <CardTitle>Impact Scores</CardTitle>
                <CardDescription>Assessment of climate need and social inequality</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Climate Need</span>
                  <Badge className={
                    region.climate_need_score >= 0.7 
                      ? "bg-destructive/10 text-destructive border-destructive/20" 
                      : region.climate_need_score >= 0.4 
                      ? "bg-warning/10 text-warning border-warning/20" 
                      : "bg-success/10 text-success border-success/20"
                  }>
                    {region.climate_need_score >= 0.7 ? "High" : region.climate_need_score >= 0.4 ? "Medium" : "Low"} ({region.climate_need_score.toFixed(2)})
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Inequality</span>
                  <Badge className={
                    region.inequality_score >= 0.7 
                      ? "bg-destructive/10 text-destructive border-destructive/20" 
                      : region.inequality_score >= 0.4 
                      ? "bg-warning/10 text-warning border-warning/20" 
                      : "bg-success/10 text-success border-success/20"
                  }>
                    {region.inequality_score >= 0.7 ? "High" : region.inequality_score >= 0.4 ? "Medium" : "Low"} ({region.inequality_score.toFixed(2)})
                  </Badge>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Priority Score</span>
                    <span className="text-2xl font-bold text-primary">
                      {region.priority_score.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Connectivity Info Box */}
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-base">Network Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Avg Download</span>
                  <span className="font-medium">{region.avg_download_mbps} Mbps</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Avg Upload</span>
                  <span className="font-medium">{region.avg_upload_mbps} Mbps</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Latency</span>
                  <span className="font-medium">{region.avg_latency_ms} ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Network Type</span>
                  <Badge variant="outline" className="text-xs">{region.network_type}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Land Cover Card */}
            <Card>
              <CardHeader>
                <CardTitle>Land Cover</CardTitle>
                <CardDescription>Dominant landscape type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <Mountain className="h-8 w-8 text-earth" />
                  <div>
                    <p className="font-semibold text-lg capitalize">{region.dominant_land_cover}</p>
                    <p className="text-sm text-muted-foreground">Primary land classification</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommended Category Card */}
            <Card>
              <CardHeader>
                <CardTitle>Recommended Micro-Jobs</CardTitle>
                <CardDescription>Most impactful category for this region</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Badge variant="outline" className="text-lg px-4 py-2 border-primary/20 text-primary">
                    {getCategoryLabel(region.recommended_microjob_category)}
                  </Badge>
                </div>
                <Button 
                  className="w-full"
                  onClick={() => navigate(`/jobs?category=${region.recommended_microjob_category}`)}
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  View Recommended Micro-Jobs
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Data Sources */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Data Sources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium mb-1">Connectivity Metrics</p>
                <p className="text-muted-foreground">
                  Derived from <strong>{region.source_connectivity_dataset}</strong>, providing real-world network performance data including download/upload speeds and latency measurements.
                </p>
              </div>
              <div>
                <p className="font-medium mb-1">Land Cover Classification</p>
                <p className="text-muted-foreground">
                  Derived from <strong>{region.source_landcover_dataset}</strong>, offering detailed 9-class land-cover analysis to understand regional landscape characteristics.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Matching Jobs */}
          {matchingJobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Available {getCategoryLabel(region.recommended_microjob_category)} Micro-Jobs</CardTitle>
                <CardDescription>
                  Jobs in this category are recommended for maximum impact in this region
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {matchingJobs.map((job) => (
                    <div 
                      key={job.id}
                      className="border rounded-lg p-4 hover:border-primary transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold">{job.title}</h3>
                        <Badge variant="outline">{job.difficulty_level}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {job.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-4 text-sm">
                          <span className="text-warning font-medium">{job.reward_credits} credits</span>
                          <span className="text-success font-medium">{job.estimated_co2_kg_impact} kg CO₂</span>
                        </div>
                        <Button size="sm" asChild>
                          <Link to={`/jobs/${job.id}`}>View Details</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegionDetail;
