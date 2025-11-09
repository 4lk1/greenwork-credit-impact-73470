import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Target, Plus, Loader2, Calendar, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Mission {
  id: string;
  title: string;
  description: string | null;
  target_jobs: number | null;
  target_credits: number | null;
  target_co2: number | null;
  due_date: string | null;
  created_at: string;
  is_active: boolean;
}

interface MissionStats {
  total_jobs: number;
  total_credits: number;
  total_co2: number;
}

interface CommunityMissionsProps {
  communityId: string;
  isAdmin: boolean;
}

export function CommunityMissions({ communityId, isAdmin }: CommunityMissionsProps) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [stats, setStats] = useState<MissionStats>({ total_jobs: 0, total_credits: 0, total_co2: 0 });
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newMission, setNewMission] = useState({
    title: "",
    description: "",
    target_jobs: "",
    target_credits: "",
    target_co2: "",
    due_date: "",
  });

  useEffect(() => {
    if (communityId) {
      fetchMissions();
      fetchStats();
    }
  }, [communityId]);

  const fetchMissions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("community_missions")
        .select("*")
        .eq("community_id", communityId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMissions(data || []);
    } catch (error) {
      console.error("Error fetching missions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from("job_completions")
        .select("earned_credits, estimated_co2_kg_impact")
        .eq("community_id", communityId);

      if (error) throw error;

      const total_jobs = data?.length || 0;
      const total_credits = (data || []).reduce((sum, c) => sum + (c.earned_credits || 0), 0);
      const total_co2 = (data || []).reduce((sum, c) => sum + (Number(c.estimated_co2_kg_impact) || 0), 0);

      setStats({ total_jobs, total_credits, total_co2 });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleCreateMission = async () => {
    try {
      setCreating(true);

      if (!newMission.title.trim()) {
        toast.error("Mission title is required");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      const { error } = await supabase.from("community_missions").insert({
        community_id: communityId,
        title: newMission.title.trim(),
        description: newMission.description.trim() || null,
        target_jobs: newMission.target_jobs ? parseInt(newMission.target_jobs) : null,
        target_credits: newMission.target_credits ? parseInt(newMission.target_credits) : null,
        target_co2: newMission.target_co2 ? parseFloat(newMission.target_co2) : null,
        due_date: newMission.due_date || null,
        created_by_user_id: user.id,
      });

      if (error) throw error;

      toast.success("Mission created successfully");
      setCreateDialogOpen(false);
      setNewMission({ title: "", description: "", target_jobs: "", target_credits: "", target_co2: "", due_date: "" });
      fetchMissions();
    } catch (error) {
      console.error("Error creating mission:", error);
      toast.error("Failed to create mission");
    } finally {
      setCreating(false);
    }
  };

  const calculateProgress = (target: number | null, current: number) => {
    if (!target || target === 0) return 0;
    return Math.min(100, (current / target) * 100);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Target className="h-5 w-5" />
          Community Missions
        </h3>
        {isAdmin && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Create Mission
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Mission</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mission-title">
                    Mission Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="mission-title"
                    value={newMission.title}
                    onChange={(e) => setNewMission({ ...newMission, title: e.target.value })}
                    placeholder="e.g., Tree Planting Sprint"
                    maxLength={200}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mission-description">Description</Label>
                  <Textarea
                    id="mission-description"
                    value={newMission.description}
                    onChange={(e) => setNewMission({ ...newMission, description: e.target.value })}
                    placeholder="Describe the mission goals and details..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="target-jobs">Target Jobs</Label>
                    <Input
                      id="target-jobs"
                      type="number"
                      value={newMission.target_jobs}
                      onChange={(e) => setNewMission({ ...newMission, target_jobs: e.target.value })}
                      placeholder="50"
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="target-credits">Target Credits</Label>
                    <Input
                      id="target-credits"
                      type="number"
                      value={newMission.target_credits}
                      onChange={(e) => setNewMission({ ...newMission, target_credits: e.target.value })}
                      placeholder="1000"
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="target-co2">Target CO₂ (kg)</Label>
                    <Input
                      id="target-co2"
                      type="number"
                      step="0.01"
                      value={newMission.target_co2}
                      onChange={(e) => setNewMission({ ...newMission, target_co2: e.target.value })}
                      placeholder="500"
                      min="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due-date">Due Date (optional)</Label>
                  <Input
                    id="due-date"
                    type="date"
                    value={newMission.due_date}
                    onChange={(e) => setNewMission({ ...newMission, due_date: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={creating}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateMission} disabled={creating}>
                    {creating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Mission"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {missions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-[200px] text-center">
            <Target className="h-12 w-12 mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-2">No active missions</p>
            {isAdmin && (
              <p className="text-sm text-muted-foreground">Create a mission to set goals for your community</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {missions.map((mission) => (
            <Card key={mission.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{mission.title}</CardTitle>
                    {mission.description && (
                      <p className="text-sm text-muted-foreground mt-1">{mission.description}</p>
                    )}
                  </div>
                  {mission.due_date && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(mission.due_date), { addSuffix: true })}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {mission.target_jobs && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Jobs Completed</span>
                      <span className="font-medium">
                        {stats.total_jobs} / {mission.target_jobs}
                      </span>
                    </div>
                    <Progress value={calculateProgress(mission.target_jobs, stats.total_jobs)} />
                  </div>
                )}

                {mission.target_credits && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Credits Earned</span>
                      <span className="font-medium">
                        {stats.total_credits} / {mission.target_credits}
                      </span>
                    </div>
                    <Progress value={calculateProgress(mission.target_credits, stats.total_credits)} />
                  </div>
                )}

                {mission.target_co2 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>CO₂ Impact (kg)</span>
                      <span className="font-medium">
                        {stats.total_co2.toFixed(2)} / {mission.target_co2}
                      </span>
                    </div>
                    <Progress value={calculateProgress(mission.target_co2, stats.total_co2)} />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
