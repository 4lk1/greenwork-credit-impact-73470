import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { z } from "zod";

const communitySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  description: z.string().trim().max(500, "Description must be less than 500 characters").optional(),
  region_or_country: z.string().trim().max(100).optional(),
  banner_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  tags: z.string().max(200, "Tags must be less than 200 characters").optional(),
  rules: z.string().max(2000, "Rules must be less than 2000 characters").optional(),
  is_public: z.boolean(),
});

export default function CommunityEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    region_or_country: "",
    banner_url: "",
    tags: "",
    rules: "",
    is_public: true,
  });

  useEffect(() => {
    if (user && id) {
      fetchCommunityAndCheckPermissions();
    }
  }, [user, id]);

  const fetchCommunityAndCheckPermissions = async () => {
    try {
      setLoading(true);

      // Check if user is admin/owner
      const { data: membership } = await supabase
        .from("community_memberships")
        .select("role")
        .eq("community_id", id)
        .eq("user_id", user?.id)
        .single();

      if (!membership || !["owner", "admin"].includes(membership.role)) {
        toast.error("You don't have permission to edit this community");
        navigate(`/communities/${id}`);
        return;
      }

      setCanEdit(true);

      // Fetch community data
      const { data: community, error } = await supabase
        .from("communities")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setFormData({
        name: community.name || "",
        description: community.description || "",
        region_or_country: community.region_or_country || "",
        banner_url: community.banner_url || "",
        tags: community.tags?.join(", ") || "",
        rules: community.rules || "",
        is_public: community.is_public ?? true,
      });
    } catch (error) {
      console.error("Error fetching community:", error);
      toast.error("Failed to load community");
      navigate(`/communities/${id}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);

      // Validate
      const validated = communitySchema.parse(formData);

      // Convert tags string to array
      const tagsArray = validated.tags
        ? validated.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [];

      const { error } = await supabase
        .from("communities")
        .update({
          name: validated.name,
          description: validated.description || null,
          region_or_country: validated.region_or_country || null,
          banner_url: validated.banner_url || null,
          tags: tagsArray,
          rules: validated.rules || null,
          is_public: validated.is_public,
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Community updated successfully");
      navigate(`/communities/${id}`);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        console.error("Error updating community:", error);
        toast.error("Failed to update community");
      }
    } finally {
      setSaving(false);
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

  if (!canEdit) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => navigate(`/communities/${id}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to community
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Edit Community</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Community Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Aegean Solar Crew"
                    maxLength={100}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Tell people what your community is about..."
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.description.length}/500
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">Region or Country</Label>
                  <Input
                    id="region"
                    value={formData.region_or_country}
                    onChange={(e) =>
                      setFormData({ ...formData, region_or_country: e.target.value })
                    }
                    placeholder="e.g., Greece, Balkans"
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="banner">Banner Image URL</Label>
                  <Input
                    id="banner"
                    type="url"
                    value={formData.banner_url}
                    onChange={(e) =>
                      setFormData({ ...formData, banner_url: e.target.value })
                    }
                    placeholder="https://example.com/banner.jpg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) =>
                      setFormData({ ...formData, tags: e.target.value })
                    }
                    placeholder="solar, youth, balkans"
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground">
                    Comma-separated tags to help people find your community
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rules">Community Rules & Guidelines</Label>
                  <Textarea
                    id="rules"
                    value={formData.rules}
                    onChange={(e) =>
                      setFormData({ ...formData, rules: e.target.value })
                    }
                    placeholder="1. Be respectful to all members&#10;2. No spam or self-promotion&#10;3. Stay on topic..."
                    rows={6}
                    maxLength={2000}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.rules.length}/2000
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="public"
                    checked={formData.is_public}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_public: checked })
                    }
                  />
                  <Label htmlFor="public">Public community</Label>
                </div>
                <p className="text-xs text-muted-foreground ml-10">
                  Public communities can be discovered and joined by anyone
                </p>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(`/communities/${id}`)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
