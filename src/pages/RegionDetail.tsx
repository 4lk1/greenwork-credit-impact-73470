import { Navigation } from "@/components/Navigation";
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Wifi, Network, Mountain, ArrowLeft, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { ChatWidget } from "@/components/ChatWidget";
import { useLanguage } from "@/contexts/LanguageContext";

interface CountryScore {
  id: string;
  iso_country: string;
  country_name: string;
  climate_indicator: number;
  inequality_indicator: number;
  internet_users_pct: number;
  climate_need_score: number;
  inequality_score: number;
  priority_score: number;
  recommended_microjob_category: string;
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
  const { t } = useLanguage();
  const [country, setCountry] = useState<CountryScore | null>(null);
  const [matchingJobs, setMatchingJobs] = useState<MicroJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCountryAndJobs();
  }, [id]);

  const fetchCountryAndJobs = async () => {
    try {
      // Fetch country details
      const { data: countryData, error: countryError } = await supabase
        .from("country_scores")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (countryError) throw countryError;
      if (!countryData) {
        toast.error("Country not found");
        navigate("/regions");
        return;
      }

      setCountry(countryData);

      // Fetch matching micro-jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from("micro_jobs")
        .select("id, title, description, difficulty_level, reward_credits, estimated_co2_kg_impact")
        .eq("category", countryData.recommended_microjob_category)
        .eq("is_active", true)
        .limit(5);

      if (jobsError) throw jobsError;
      setMatchingJobs(jobsData || []);
    } catch (error) {
      console.error("Error fetching country:", error);
      toast.error("Failed to load country details");
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

  if (!country) {
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
            Back to Countries
          </Button>

          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">{country.country_name}</h1>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {country.iso_country}
                  </div>
                </div>
              </div>
              <Badge className="text-lg px-4 py-2">
                Priority: {country.priority_score.toFixed(2)}
              </Badge>
            </div>

            <Card className="bg-info/5 border-info/20">
              <CardContent className="pt-6">
                <p className="text-sm leading-relaxed">
                  <strong>Priority Score:</strong> This score combines climate need and inequality to identify where micro-jobs can have the greatest impact.
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
                    country.climate_need_score >= 0.7 
                      ? "bg-destructive/10 text-destructive border-destructive/20" 
                      : country.climate_need_score >= 0.4 
                      ? "bg-warning/10 text-warning border-warning/20" 
                      : "bg-success/10 text-success border-success/20"
                  }>
                    {country.climate_need_score >= 0.7 ? "High" : country.climate_need_score >= 0.4 ? "Medium" : "Low"} ({country.climate_need_score.toFixed(2)})
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Inequality</span>
                  <Badge className={
                    country.inequality_score >= 0.7 
                      ? "bg-destructive/10 text-destructive border-destructive/20" 
                      : country.inequality_score >= 0.4 
                      ? "bg-warning/10 text-warning border-warning/20" 
                      : "bg-success/10 text-success border-success/20"
                  }>
                    {country.inequality_score >= 0.7 ? "High" : country.inequality_score >= 0.4 ? "Medium" : "Low"} ({country.inequality_score.toFixed(2)})
                  </Badge>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Priority Score</span>
                    <span className="text-2xl font-bold text-primary">
                      {country.priority_score.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Country Indicators */}
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-base">Country Indicators</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Climate Indicator</span>
                  <span className="font-medium">{country.climate_indicator.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Inequality Indicator</span>
                  <span className="font-medium">{country.inequality_indicator.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Internet Users</span>
                  <span className="font-medium">{country.internet_users_pct.toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>

            {/* Recommended Category Card */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Recommended Micro-Jobs</CardTitle>
                <CardDescription>Most impactful category for this country</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Badge variant="outline" className="text-lg px-4 py-2 border-primary/20 text-primary">
                    {getCategoryLabel(country.recommended_microjob_category)}
                  </Badge>
                </div>
                <Button 
                  className="w-full"
                  onClick={() => navigate(`/jobs?category=${country.recommended_microjob_category}`)}
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
              <CardTitle>Data Sources & Methodology</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium mb-1">Climate Need Score</p>
                <p className="text-muted-foreground">
                  Derived from temperature-change indicators in the climate change dataset. Higher scores indicate greater climate vulnerability and need for intervention.
                </p>
              </div>
              <div>
                <p className="font-medium mb-1">Inequality Score</p>
                <p className="text-muted-foreground">
                  Combines income inequality data from "Inequality in Income.csv" with internet usage statistics from "internet_usage.csv". This composite score identifies regions where digital access disparities compound economic inequality.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Matching Jobs */}
          {matchingJobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Available {getCategoryLabel(country.recommended_microjob_category)} Micro-Jobs</CardTitle>
                <CardDescription>
                  Jobs in this category are recommended for maximum impact in this country
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

      {country && (
        <ChatWidget 
          context={`page=country_detail; country_name=${country.country_name}; country=${country.iso_country}; climate_need_score=${country.climate_need_score}; inequality_score=${country.inequality_score}; priority_score=${country.priority_score}; recommended_category=${country.recommended_microjob_category}`}
        />
      )}
    </div>
  );
};

export default RegionDetail;
