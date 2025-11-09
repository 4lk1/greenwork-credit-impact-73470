import { Navigation } from "@/components/Navigation";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, User, Mail, Upload, Save, Briefcase, Award, Leaf, UserPlus, UserMinus, MessageSquare } from "lucide-react";
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
  followersCount: number;
  followingCount: number;
}

import { useLanguage } from "@/contexts/LanguageContext";

const Profile = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<UserStats>({ 
    totalJobs: 0, 
    totalCredits: 0, 
    totalCO2Impact: 0,
    followersCount: 0,
    followingCount: 0
  });
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get userId from URL params, default to current user
  const searchParams = new URLSearchParams(window.location.search);
  const profileUserId = searchParams.get('userId') || user?.id;
  const isOwnProfile = profileUserId === user?.id;

  useEffect(() => {
    if (profileUserId) {
      fetchProfile();
      fetchStats();
      checkFollowStatus();
    }
  }, [profileUserId]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", profileUserId)
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
      // Get job stats
      const { data: jobData, error: jobError } = await supabase
        .from("job_completions")
        .select("earned_credits, estimated_co2_kg_impact")
        .eq("user_id", profileUserId);

      if (jobError) throw jobError;

      const totalJobs = jobData?.length || 0;
      const totalCredits = jobData?.reduce((sum, job) => sum + job.earned_credits, 0) || 0;
      const totalCO2Impact = jobData?.reduce((sum, job) => sum + Number(job.estimated_co2_kg_impact), 0) || 0;

      // Get follow stats
      const { data: followData, error: followError } = await supabase
        .from("user_follow_stats")
        .select("followers_count, following_count")
        .eq("user_id", profileUserId)
        .single();

      setStats({
        totalJobs,
        totalCredits,
        totalCO2Impact: Math.round(totalCO2Impact * 100) / 100,
        followersCount: followData?.followers_count || 0,
        followingCount: followData?.following_count || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const checkFollowStatus = async () => {
    if (!user || !profileUserId || isOwnProfile) return;

    try {
      const { data, error } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", profileUserId)
        .maybeSingle();

      if (!error) {
        setIsFollowing(!!data);
      }
    } catch (error) {
      console.error("Error checking follow status:", error);
    }
  };

  const handleFollowToggle = async () => {
    if (!user || !profileUserId) {
      toast.error("You must be logged in to follow users");
      return;
    }

    setFollowLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", profileUserId);

        if (error) throw error;

        setIsFollowing(false);
        setStats(prev => ({
          ...prev,
          followersCount: Math.max(0, prev.followersCount - 1)
        }));
        toast.success("Unfollowed successfully");
      } else {
        // Follow
        const { error } = await supabase
          .from("follows")
          .insert({
            follower_id: user.id,
            following_id: profileUserId
          });

        if (error) throw error;

        setIsFollowing(true);
        setStats(prev => ({
          ...prev,
          followersCount: prev.followersCount + 1
        }));
        toast.success("Following successfully");
      }
    } catch (error: any) {
      console.error("Error toggling follow:", error);
      if (error.message?.includes("duplicate")) {
        toast.error("Already following this user");
      } else {
        toast.error("Failed to update follow status");
      }
    } finally {
      setFollowLoading(false);
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{stats.totalJobs}</p>
                    <p className="text-xs text-muted-foreground">{t("profile.jobsCompleted")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Award className="h-5 w-5 text-warning" />
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{stats.totalCredits}</p>
                    <p className="text-xs text-muted-foreground">{t("profile.creditsEarned")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <Leaf className="h-5 w-5 text-success" />
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{stats.totalCO2Impact}</p>
                    <p className="text-xs text-muted-foreground">{t("profile.co2Impact")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{stats.followersCount}</p>
                    <p className="text-xs text-muted-foreground">
                      <Link to={`/friends?userId=${profileUserId}&tab=followers`} className="hover:underline">
                        Followers
                      </Link>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <UserPlus className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{stats.followingCount}</p>
                    <p className="text-xs text-muted-foreground">
                      <Link to={`/friends?userId=${profileUserId}&tab=following`} className="hover:underline">
                        Following
                      </Link>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{isOwnProfile ? t("profile.profileInfo") : username}</CardTitle>
              <CardDescription>
                {isOwnProfile ? t("profile.profileDesc") : `${stats.totalJobs} jobs completed • ${stats.totalCredits} credits earned`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isOwnProfile ? (
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
              ) : (
                <div className="space-y-6">
                  {/* Viewing another user's profile */}
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
                      <h2 className="text-2xl font-bold">{username}</h2>
                      <p className="text-muted-foreground text-sm">
                        {stats.followersCount} followers • {stats.followingCount} following
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Button
                        onClick={handleFollowToggle}
                        disabled={followLoading}
                        variant={isFollowing ? "outline" : "default"}
                        className="gap-2"
                      >
                        {followLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isFollowing ? (
                          <>
                            <UserMinus className="h-4 w-4" />
                            Unfollow
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4" />
                            Follow
                          </>
                        )}
                      </Button>
                      <Button variant="outline" asChild>
                        <Link to={`/messages?startChat=${profileUserId}`}>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Message
                        </Link>
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-center text-muted-foreground py-4">
                    <p className="text-sm">
                      {username} has completed {stats.totalJobs} jobs and earned {stats.totalCredits} credits,
                      contributing to {stats.totalCO2Impact} kg CO₂ saved!
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
