// Type definitions for social and community features
// These will be replaced by Supabase-generated types after migration

export interface Community {
  id: string;
  name: string;
  description: string | null;
  created_by_user_id: string;
  region_or_country: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommunityMembership {
  id: string;
  community_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_user_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobCompletion {
  id: string;
  user_id: string;
  microjob_id: string;
  community_id: string | null;
  completed_at: string;
  quiz_score_percent: number;
  earned_credits: number;
  estimated_co2_kg_impact: number;
}
