import { Navigation } from "@/components/Navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Region {
  id: string;
  region_id: number;
  iso_country: string;
  region_name: string;
  climate_need_score: number;
  inequality_score: number;
  priority_score: number;
  recommended_microjob_category: string;
}

const Regions = () => {
  const navigate = useNavigate();
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRegions();
  }, []);

  const fetchRegions = async () => {
    try {
      const { data, error } = await supabase
        .from("regions")
        .select("id, region_id, iso_country, region_name, climate_need_score, inequality_score, priority_score, recommended_microjob_category")
        .order("priority_score", { ascending: false });

      if (error) throw error;
      setRegions(data || []);
    } catch (error) {
      console.error("Error fetching regions:", error);
      toast.error("Failed to load regions");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    return category.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  const getScoreBadge = (score: number) => {
    if (score < 0.4) {
      return <Badge variant="outline" className="bg-success/10 text-success border-success/20">Low</Badge>;
    } else if (score < 0.7) {
      return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">Medium</Badge>;
    } else {
      return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">High</Badge>;
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
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">European Regions</h1>
            <p className="text-lg text-muted-foreground">
              Explore priority regions for climate-resilience micro-jobs across Europe
            </p>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Region Name</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Climate Need</TableHead>
                  <TableHead>Inequality</TableHead>
                  <TableHead>Priority Score</TableHead>
                  <TableHead>Recommended Category</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regions.map((region) => (
                  <TableRow 
                    key={region.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/regions/${region.id}`)}
                  >
                    <TableCell className="font-medium">{region.region_name}</TableCell>
                    <TableCell>{region.iso_country}</TableCell>
                    <TableCell>{getScoreBadge(region.climate_need_score)}</TableCell>
                    <TableCell>{getScoreBadge(region.inequality_score)}</TableCell>
                    <TableCell>
                      <span className="font-semibold text-primary">
                        {region.priority_score.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-primary/20 text-primary">
                        {getCategoryLabel(region.recommended_microjob_category)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/regions/${region.id}`);
                        }}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {regions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No regions found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Regions;
