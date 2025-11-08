import { Navigation } from "@/components/Navigation";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, User, Mail, Upload, Save, Briefcase, Award, Leaf } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be less than 20 characters")
  .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores and hyphens");

const avatarUrlSchema = z.string().url("Must be a valid URL").or(z.literal(""));

interface Profile {
  username: string;
  avatar_url: string | null;
}

interface UserStats {
  totalJobs: number;
  totalCredits: number;
  totalCO2Impact: number;
}

import { useLanguage } from "@/contexts/LanguageContext";

const Profile = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<UserStats>({ totalJobs: 0, totalCredits: 0, totalCO2Impact: 0 });
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchStats();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", user?.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setUsername(data.username);
      setAvatarUrl(data.avatar_url || "");
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from("job_completions")
        .select("earned_credits, estimated_co2_kg_impact")
        .eq("user_id", user?.id);

      if (error) throw error;

      const totalJobs = data?.length || 0;
      const totalCredits = data?.reduce((sum, job) => sum + job.earned_credits, 0) || 0;
      const totalCO2Impact = data?.reduce((sum, job) => sum + Number(job.estimated_co2_kg_impact), 0) || 0;

      setStats({
        totalJobs,
        totalCredits,
        totalCO2Impact: Math.round(totalCO2Impact * 100) / 100, // Round to 2 decimals
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be smaller than 2MB");
      return;
    }

    setUploading(true);
    try {
      // Delete old avatar if exists
      if (avatarUrl) {
        const oldPath = avatarUrl.split('/').slice(-2).join('/');
        await supabase.storage.from('avatars').remove([oldPath]);
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const newAvatarUrl = data.publicUrl;

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: newAvatarUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setAvatarUrl(newAvatarUrl);
      setProfile(prev => prev ? { ...prev, avatar_url: newAvatarUrl } : null);
      toast.success("Profile picture updated!");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload profile picture");
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate username
    try {
      usernameSchema.parse(username);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ username })
        .eq("id", user?.id);

      if (error) {
        if (error.message.includes("duplicate key")) {
          toast.error("Username is already taken");
        } else {
          throw error;
        }
      } else {
        setProfile(prev => prev ? { ...prev, username } : null);
        toast.success("Profile updated successfully!");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const getUserInitials = () => {
    if (!username) return "U";
    return username.charAt(0).toUpperCase();
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
        <div className="max-w-2xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold">{t("profile.title")}</h1>
            <p className="text-muted-foreground mt-2">
              {t("profile.subtitle")}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalJobs}</p>
                    <p className="text-xs text-muted-foreground">{t("profile.jobsCompleted")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Award className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalCredits}</p>
                    <p className="text-xs text-muted-foreground">{t("profile.creditsEarned")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <Leaf className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalCO2Impact}</p>
                    <p className="text-xs text-muted-foreground">{t("profile.co2Impact")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t("profile.profileInfo")}</CardTitle>
              <CardDescription>
                {t("profile.profileDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                {/* Avatar Preview and Upload */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage 
                      src={avatarUrl || undefined} 
                      alt={username}
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold">{t("profile.profilePicture")}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {t("profile.uploadImage")}
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("common.uploading")}
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          {t("profile.uploadBtn")}
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Email (read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="email">{t("auth.email")}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("profile.emailCannotChange")}
                  </p>
                </div>

                {/* Username */}
                <div className="space-y-2">
                  <Label htmlFor="username">{t("auth.username")}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="your_username"
                      required
                      disabled={saving}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("profile.usernameRule")}
                  </p>
                </div>

                <Button type="submit" disabled={saving || uploading} className="w-full">
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("common.saving")}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {t("profile.saveChanges")}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
