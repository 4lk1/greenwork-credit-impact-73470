import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Users } from "lucide-react";

export default function CommunityNew() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    region_or_country: "",
    is_public: true,
  });

  const createCommunityMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      // Create community
      const { data: community, error: communityError } = await supabase
        .from("communities")
        .insert({
          name: formData.name,
          description: formData.description,
          region_or_country: formData.region_or_country || null,
          is_public: formData.is_public,
          created_by_user_id: user.id,
        })
        .select()
        .single();

      if (communityError) throw communityError;

      // Add creator as owner member
      const { error: membershipError } = await supabase
        .from("community_memberships")
        .insert({
          community_id: community.id,
          user_id: user.id,
          role: "owner",
        });

      if (membershipError) throw membershipError;

      return community;
    },
    onSuccess: (community) => {
      toast.success("Community created successfully!");
      navigate(`/communities/${community.id}`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create community");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Community name is required");
      return;
    }
    createCommunityMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/communities")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Communities
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-8 w-8 text-primary" />
              <CardTitle className="text-3xl">Create a Community</CardTitle>
            </div>
            <CardDescription>
              Build a team to amplify your climate impact and collaborate on micro-jobs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Community Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Athens Green Warriors"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell others what your community is about..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
                <p className="text-sm text-muted-foreground">
                  Describe your community's mission, goals, or focus areas
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Region or Country</Label>
                <Input
                  id="region"
                  placeholder="e.g., Athens, Greece or Southern Europe"
                  value={formData.region_or_country}
                  onChange={(e) => setFormData({ ...formData, region_or_country: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">
                  Optional: Specify your community's geographic focus
                </p>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="is_public">Public Community</Label>
                  <p className="text-sm text-muted-foreground">
                    Anyone can join a public community. Private communities require approval.
                  </p>
                </div>
                <Switch
                  id="is_public"
                  checked={formData.is_public}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/communities")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createCommunityMutation.isPending}
                  className="flex-1"
                >
                  {createCommunityMutation.isPending ? "Creating..." : "Create Community"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
