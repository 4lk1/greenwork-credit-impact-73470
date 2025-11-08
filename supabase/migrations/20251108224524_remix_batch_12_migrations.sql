
-- Migration: 20251108155515
-- Create users table (public profiles)
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create micro_jobs table
CREATE TABLE public.micro_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('tree_planting', 'solar_maintenance', 'water_harvesting', 'agroforestry', 'home_insulation')),
  difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  estimated_duration_minutes INTEGER NOT NULL,
  reward_credits INTEGER NOT NULL,
  estimated_co2_kg_impact DECIMAL(10,2) NOT NULL,
  location TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create training_modules table
CREATE TABLE public.training_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  microjob_id UUID NOT NULL REFERENCES public.micro_jobs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  learning_objectives TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create quiz_questions table
CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_module_id UUID NOT NULL REFERENCES public.training_modules(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option TEXT NOT NULL CHECK (correct_option IN ('a', 'b', 'c', 'd')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create job_completions table
CREATE TABLE public.job_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  microjob_id UUID NOT NULL REFERENCES public.micro_jobs(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  quiz_score_percent INTEGER NOT NULL CHECK (quiz_score_percent >= 0 AND quiz_score_percent <= 100),
  earned_credits INTEGER NOT NULL,
  estimated_co2_kg_impact DECIMAL(10,2) NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.micro_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_completions ENABLE ROW LEVEL SECURITY;

-- Create policies (public read access for demo purposes)
CREATE POLICY "Public read access for users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Public insert access for users" ON public.users FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read access for micro_jobs" ON public.micro_jobs FOR SELECT USING (true);

CREATE POLICY "Public read access for training_modules" ON public.training_modules FOR SELECT USING (true);

CREATE POLICY "Public read access for quiz_questions" ON public.quiz_questions FOR SELECT USING (true);

CREATE POLICY "Public read access for job_completions" ON public.job_completions FOR SELECT USING (true);
CREATE POLICY "Public insert access for job_completions" ON public.job_completions FOR INSERT WITH CHECK (true);

-- Insert seed data for micro_jobs
INSERT INTO public.micro_jobs (title, description, category, difficulty_level, estimated_duration_minutes, reward_credits, estimated_co2_kg_impact, location) VALUES
('Urban Tree Planting - City Park', 'Plant native tree species in urban parks to improve air quality and reduce urban heat islands. Learn proper planting techniques and tree care.', 'tree_planting', 'beginner', 120, 50, 25.5, 'Tirana, Albania'),
('Community Fruit Tree Orchard', 'Establish a community fruit tree orchard using agroforestry principles. Plant diverse species and learn sustainable maintenance practices.', 'agroforestry', 'intermediate', 180, 75, 40.0, 'Athens, Greece'),
('Solar Panel Cleaning & Inspection', 'Clean and inspect residential solar panels to maintain optimal energy efficiency. Learn safety protocols and inspection checklists.', 'solar_maintenance', 'beginner', 90, 40, 15.0, 'Rome, Italy'),
('Rainwater Harvesting System Installation', 'Install simple rainwater harvesting systems for residential gardens. Learn about water conservation and system maintenance.', 'water_harvesting', 'intermediate', 150, 60, 10.5, 'Barcelona, Spain'),
('Home Attic Insulation Upgrade', 'Install eco-friendly insulation materials in residential attics to reduce heating and cooling energy consumption.', 'home_insulation', 'advanced', 240, 100, 50.0, 'Paris, France'),
('Reforestation Project - Mountain Area', 'Participate in large-scale reforestation efforts in mountainous regions. Plant indigenous tree species and learn forest restoration techniques.', 'tree_planting', 'intermediate', 300, 90, 60.0, 'Dinaric Alps, Albania'),
('Solar Water Heater Maintenance', 'Perform routine maintenance on solar water heating systems. Learn troubleshooting and preventive maintenance schedules.', 'solar_maintenance', 'intermediate', 120, 55, 20.0, 'Lisbon, Portugal'),
('Bioswale Construction for Stormwater', 'Build bioswales (landscape elements) to manage stormwater runoff naturally. Learn about native plant selection and drainage design.', 'water_harvesting', 'advanced', 360, 120, 30.0, 'Amsterdam, Netherlands'),
('Permaculture Food Forest Design', 'Design and implement a permaculture food forest using agroforestry principles. Create multi-layered, self-sustaining ecosystems.', 'agroforestry', 'advanced', 420, 150, 75.0, 'Berlin, Germany'),
('Window and Door Weatherization', 'Seal gaps around windows and doors to prevent heat loss. Learn about different sealing materials and application techniques.', 'home_insulation', 'beginner', 60, 30, 8.0, 'Vienna, Austria');

-- Insert training modules and quiz questions for each micro_job
-- Job 1: Urban Tree Planting
INSERT INTO public.training_modules (microjob_id, title, content, learning_objectives)
SELECT id, 
  'Urban Tree Planting Basics',
  E'Welcome to Urban Tree Planting!\n\nIn this module, you will learn the fundamentals of planting trees in urban environments:\n\n1. **Site Assessment**: Understanding soil conditions, sunlight exposure, and space requirements\n2. **Tree Selection**: Choosing native species that thrive in urban settings\n3. **Planting Technique**: Proper digging depth, root placement, and backfilling methods\n4. **Initial Care**: Watering schedules, mulching, and staking procedures\n\nUrban trees provide numerous benefits:\n- Absorb CO₂ and produce oxygen\n- Reduce urban heat island effect\n- Improve air quality\n- Provide habitat for wildlife\n- Enhance community wellbeing\n\n**Safety Considerations**:\n- Always check for underground utilities before digging\n- Use proper lifting techniques\n- Wear appropriate protective equipment\n- Stay hydrated and take breaks',
  ARRAY['Identify suitable urban planting sites', 'Select appropriate native tree species', 'Execute proper planting technique', 'Implement initial tree care protocols']
FROM public.micro_jobs WHERE title = 'Urban Tree Planting - City Park';

INSERT INTO public.quiz_questions (training_module_id, question_text, option_a, option_b, option_c, option_d, correct_option)
SELECT id,
  'What is the recommended depth for planting a tree?',
  'Same depth as the root ball',
  'Twice as deep as the root ball',
  'Half as deep as the root ball',
  'As deep as possible',
  'a'
FROM public.training_modules WHERE title = 'Urban Tree Planting Basics';

INSERT INTO public.quiz_questions (training_module_id, question_text, option_a, option_b, option_c, option_d, correct_option)
SELECT id,
  'Why are native tree species preferred for urban planting?',
  'They are cheaper',
  'They adapt better to local climate and support local ecosystems',
  'They grow faster',
  'They require no maintenance',
  'b'
FROM public.training_modules WHERE title = 'Urban Tree Planting Basics';

INSERT INTO public.quiz_questions (training_module_id, question_text, option_a, option_b, option_c, option_d, correct_option)
SELECT id,
  'What should you always check before digging?',
  'Weather forecast',
  'Underground utilities location',
  'Tree market prices',
  'Soil color',
  'b'
FROM public.training_modules WHERE title = 'Urban Tree Planting Basics';

-- Job 3: Solar Panel Cleaning
INSERT INTO public.training_modules (microjob_id, title, content, learning_objectives)
SELECT id,
  'Solar Panel Maintenance Essentials',
  E'Solar Panel Cleaning & Inspection Guide\n\nProper maintenance ensures solar panels operate at peak efficiency:\n\n1. **Safety First**: Always work during cooler parts of the day, use proper fall protection on roofs\n2. **Cleaning Process**:\n   - Use soft brushes or squeegees with deionized water\n   - Avoid abrasive materials that can scratch panels\n   - Clean from top to bottom\n3. **Inspection Checklist**:\n   - Check for cracks or damage\n   - Inspect wiring and connections\n   - Look for shading from vegetation growth\n   - Verify mounting system integrity\n4. **Performance Monitoring**: Document energy output before and after cleaning\n\n**Environmental Impact**:\nMaintaining solar panel efficiency maximizes renewable energy production and reduces fossil fuel dependency. A 10% increase in efficiency from cleaning can save significant CO₂ emissions over time.',
  ARRAY['Identify safety protocols for rooftop work', 'Execute proper cleaning techniques', 'Conduct thorough panel inspections', 'Document maintenance activities']
FROM public.micro_jobs WHERE title = 'Solar Panel Cleaning & Inspection';

INSERT INTO public.quiz_questions (training_module_id, question_text, option_a, option_b, option_c, option_d, correct_option)
SELECT id,
  'What type of water is recommended for cleaning solar panels?',
  'Tap water with soap',
  'Deionized water',
  'Salt water',
  'Any water is fine',
  'b'
FROM public.training_modules WHERE title = 'Solar Panel Maintenance Essentials';

INSERT INTO public.quiz_questions (training_module_id, question_text, option_a, option_b, option_c, option_d, correct_option)
SELECT id,
  'When is the best time to clean solar panels?',
  'During peak sunlight hours',
  'During cooler parts of the day',
  'During rain',
  'At night',
  'b'
FROM public.training_modules WHERE title = 'Solar Panel Maintenance Essentials';

INSERT INTO public.quiz_questions (training_module_id, question_text, option_a, option_b, option_c, option_d, correct_option)
SELECT id,
  'What should you avoid using when cleaning panels?',
  'Soft brushes',
  'Squeegees',
  'Abrasive materials',
  'Water',
  'c'
FROM public.training_modules WHERE title = 'Solar Panel Maintenance Essentials';

-- Job 4: Rainwater Harvesting
INSERT INTO public.training_modules (microjob_id, title, content, learning_objectives)
SELECT id,
  'Rainwater Harvesting System Installation',
  E'Build Your Rainwater Harvesting System\n\nWater is precious, especially in climate-vulnerable regions:\n\n1. **System Components**:\n   - Catchment surface (roof)\n   - Gutters and downspouts\n   - First flush diverter\n   - Storage tank (food-grade)\n   - Overflow mechanism\n   - Distribution system\n\n2. **Installation Steps**:\n   - Calculate catchment area and water yield\n   - Position storage tank on stable, level foundation\n   - Install first flush diverter to remove initial dirty water\n   - Connect overflow to appropriate drainage\n   - Add filtration if water will be used for consumption\n\n3. **Maintenance**:\n   - Clean gutters regularly\n   - Inspect and clean first flush system\n   - Check for leaks in storage tank\n   - Prevent mosquito breeding\n\n**Benefits**: A typical system can save 40-50% of household water use for irrigation, reducing municipal water demand and associated energy costs.',
  ARRAY['Calculate rainwater catchment potential', 'Install system components correctly', 'Implement proper filtration', 'Establish maintenance routines']
FROM public.micro_jobs WHERE title = 'Rainwater Harvesting System Installation';

INSERT INTO public.quiz_questions (training_module_id, question_text, option_a, option_b, option_c, option_d, correct_option)
SELECT id,
  'What is the purpose of a first flush diverter?',
  'To store water',
  'To remove initial dirty water from the roof',
  'To pump water',
  'To filter drinking water',
  'b'
FROM public.training_modules WHERE title = 'Rainwater Harvesting System Installation';

INSERT INTO public.quiz_questions (training_module_id, question_text, option_a, option_b, option_c, option_d, correct_option)
SELECT id,
  'What percentage of household water can typically be saved with rainwater harvesting for irrigation?',
  '10-20%',
  '25-30%',
  '40-50%',
  '70-80%',
  'c'
FROM public.training_modules WHERE title = 'Rainwater Harvesting System Installation';

INSERT INTO public.quiz_questions (training_module_id, question_text, option_a, option_b, option_c, option_d, correct_option)
SELECT id,
  'Why must storage tanks be on a stable, level foundation?',
  'For aesthetic purposes',
  'To prevent tipping and ensure proper operation',
  'To make installation easier',
  'It is not necessary',
  'b'
FROM public.training_modules WHERE title = 'Rainwater Harvesting System Installation';

-- Job 5: Home Insulation
INSERT INTO public.training_modules (microjob_id, title, content, learning_objectives)
SELECT id,
  'Advanced Home Insulation Techniques',
  E'Master Attic Insulation Installation\n\nProper insulation is one of the most cost-effective energy efficiency improvements:\n\n1. **Insulation Types**:\n   - Fiberglass batts: Cost-effective, easy to install\n   - Blown cellulose: Good for irregular spaces\n   - Spray foam: Excellent air sealing properties\n   - Natural materials: Sheep wool, hemp (eco-friendly options)\n\n2. **Safety Requirements**:\n   - Respiratory protection (mask/respirator)\n   - Eye protection\n   - Protective clothing\n   - Adequate ventilation\n   - Check for asbestos in older homes\n\n3. **Installation Process**:\n   - Seal air leaks first\n   - Install vapor barriers correctly\n   - Maintain proper ventilation paths\n   - Achieve target R-value for climate zone\n   - Avoid compressing insulation\n\n4. **Quality Checks**:\n   - Uniform coverage with no gaps\n   - Proper depth throughout\n   - Electrical boxes covered safely\n\n**Impact**: Proper attic insulation can reduce heating/cooling energy use by 30-50%, significantly cutting CO₂ emissions.',
  ARRAY['Select appropriate insulation materials', 'Implement safety protocols', 'Install insulation to proper R-values', 'Ensure quality installation']
FROM public.micro_jobs WHERE title = 'Home Attic Insulation Upgrade';

INSERT INTO public.quiz_questions (training_module_id, question_text, option_a, option_b, option_c, option_d, correct_option)
SELECT id,
  'What should be done before installing insulation?',
  'Paint the attic',
  'Seal air leaks',
  'Remove all ventilation',
  'Install new wiring',
  'b'
FROM public.training_modules WHERE title = 'Advanced Home Insulation Techniques';

INSERT INTO public.quiz_questions (training_module_id, question_text, option_a, option_b, option_c, option_d, correct_option)
SELECT id,
  'How much can proper attic insulation reduce heating/cooling energy use?',
  '5-10%',
  '15-20%',
  '30-50%',
  '60-70%',
  'c'
FROM public.training_modules WHERE title = 'Advanced Home Insulation Techniques';

INSERT INTO public.quiz_questions (training_module_id, question_text, option_a, option_b, option_c, option_d, correct_option)
SELECT id,
  'What safety equipment is essential for insulation work?',
  'Only gloves',
  'Respiratory protection, eye protection, and protective clothing',
  'Just safety glasses',
  'No special equipment needed',
  'b'
FROM public.training_modules WHERE title = 'Advanced Home Insulation Techniques';

-- Additional training modules for remaining jobs (abbreviated for brevity)
INSERT INTO public.training_modules (microjob_id, title, content, learning_objectives)
SELECT id,
  'Agroforestry & Food Forests',
  E'Community Fruit Tree Orchard Development\n\nAgroforestry combines agriculture and forestry to create sustainable, productive ecosystems.\n\nKey concepts:\n- Multi-layered planting (canopy, understory, ground cover)\n- Companion planting for pest control\n- Soil health and composting\n- Water management in orchards\n- Pruning and maintenance schedules\n\nBenefits: Food security, carbon sequestration, biodiversity, community resilience.',
  ARRAY['Design multi-layered agroforestry systems', 'Select compatible fruit tree varieties', 'Implement organic pest management', 'Plan long-term orchard maintenance']
FROM public.micro_jobs WHERE title = 'Community Fruit Tree Orchard';

INSERT INTO public.quiz_questions (training_module_id, question_text, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is a key principle of agroforestry?', 'Single crop production', 'Multi-layered planting systems', 'Chemical-intensive farming', 'Annual crops only', 'b'
FROM public.training_modules WHERE title = 'Agroforestry & Food Forests';

INSERT INTO public.quiz_questions (training_module_id, question_text, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'What is companion planting used for?', 'Decoration', 'Natural pest control', 'Faster growth only', 'Reducing water needs', 'b'
FROM public.training_modules WHERE title = 'Agroforestry & Food Forests';

INSERT INTO public.quiz_questions (training_module_id, question_text, option_a, option_b, option_c, option_d, correct_option)
SELECT id, 'Which benefit is NOT provided by agroforestry?', 'Food security', 'Carbon sequestration', 'Reduced biodiversity', 'Community resilience', 'c'
FROM public.training_modules WHERE title = 'Agroforestry & Food Forests';

-- Migration: 20251108170130
-- Create regions table to store European region data with priority scores
CREATE TABLE public.regions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  region_id integer NOT NULL UNIQUE,
  iso_country text NOT NULL,
  region_name text NOT NULL,
  lat numeric NOT NULL,
  lon numeric NOT NULL,
  avg_download_mbps numeric NOT NULL,
  avg_upload_mbps numeric NOT NULL,
  avg_latency_ms numeric NOT NULL,
  network_type text NOT NULL,
  dominant_land_cover text NOT NULL,
  climate_need_score numeric NOT NULL,
  inequality_score numeric NOT NULL,
  priority_score numeric NOT NULL,
  recommended_microjob_category text NOT NULL,
  source_connectivity_dataset text NOT NULL,
  source_landcover_dataset text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Public read access for regions"
ON public.regions
FOR SELECT
USING (true);

-- Create indexes for better query performance
CREATE INDEX idx_regions_iso_country ON public.regions(iso_country);
CREATE INDEX idx_regions_priority_score ON public.regions(priority_score DESC);
CREATE INDEX idx_regions_recommended_category ON public.regions(recommended_microjob_category);

-- Migration: 20251108174534
-- Create function to update timestamps if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create job_progress table to track quiz attempts
CREATE TABLE public.job_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  microjob_id UUID NOT NULL,
  quiz_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_progress ENABLE ROW LEVEL SECURITY;

-- Public read/write access (can be restricted later when auth is added)
CREATE POLICY "Public read access for job_progress" 
ON public.job_progress 
FOR SELECT 
USING (true);

CREATE POLICY "Public insert access for job_progress" 
ON public.job_progress 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public update access for job_progress" 
ON public.job_progress 
FOR UPDATE 
USING (true);

CREATE POLICY "Public delete access for job_progress" 
ON public.job_progress 
FOR DELETE 
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_job_progress_microjob ON public.job_progress(microjob_id);

-- Trigger to update last_updated timestamp
CREATE TRIGGER update_job_progress_updated_at
BEFORE UPDATE ON public.job_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migration: 20251108175013
-- Create profiles table linked to auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles are viewable by everyone
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Create function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update job_completions to require user_id
ALTER TABLE public.job_completions ALTER COLUMN user_id SET NOT NULL;

-- Update job_completions RLS policies
DROP POLICY IF EXISTS "Public insert access for job_completions" ON public.job_completions;
DROP POLICY IF EXISTS "Public read access for job_completions" ON public.job_completions;

CREATE POLICY "Users can view own completions" 
ON public.job_completions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completions" 
ON public.job_completions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view all completions for stats"
ON public.job_completions
FOR SELECT
USING (true);

-- Update job_progress to require user_id
ALTER TABLE public.job_progress ALTER COLUMN user_id SET NOT NULL;

-- Update job_progress RLS policies
DROP POLICY IF EXISTS "Public read access for job_progress" ON public.job_progress;
DROP POLICY IF EXISTS "Public insert access for job_progress" ON public.job_progress;
DROP POLICY IF EXISTS "Public update access for job_progress" ON public.job_progress;
DROP POLICY IF EXISTS "Public delete access for job_progress" ON public.job_progress;

CREATE POLICY "Users can view own progress" 
ON public.job_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" 
ON public.job_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" 
ON public.job_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress" 
ON public.job_progress 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migration: 20251108180107
-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to avatars
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- Migration: 20251108180413
-- Fix the update_updated_at_column function to use correct field name
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Migration: 20251108183631
-- Create verification codes table
CREATE TABLE public.verification_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('signup', 'login')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert verification codes
CREATE POLICY "Anyone can create verification codes"
ON public.verification_codes
FOR INSERT
WITH CHECK (true);

-- Create policy to allow anyone to read their own codes
CREATE POLICY "Users can read their own verification codes"
ON public.verification_codes
FOR SELECT
USING (true);

-- Create policy to allow anyone to update verification codes
CREATE POLICY "Anyone can update verification codes"
ON public.verification_codes
FOR UPDATE
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_verification_codes_email_code ON public.verification_codes(email, code, type);
CREATE INDEX idx_verification_codes_expires_at ON public.verification_codes(expires_at);

-- Create function to clean up expired codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_verification_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.verification_codes
  WHERE expires_at < now() - interval '1 hour';
END;
$$;

-- Migration: 20251108201830
-- Fix security issue 1: verification_codes email exposure
-- Drop the existing insecure SELECT policy
DROP POLICY IF EXISTS "Users can read their own verification codes" ON public.verification_codes;

-- Create secure SELECT policy that only allows users to see codes for their own email
CREATE POLICY "Users can read their own verification codes"
ON public.verification_codes
FOR SELECT
USING (email = auth.jwt()->>'email');

-- Fix security issue 2: users table public exposure
-- Drop the existing public read policy
DROP POLICY IF EXISTS "Public read access for users" ON public.users;

-- Create secure SELECT policy that only allows users to see their own data
CREATE POLICY "Users can read their own data"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Fix security issue 3: verification_codes unrestricted updates
-- Drop the existing insecure UPDATE policy
DROP POLICY IF EXISTS "Anyone can update verification codes" ON public.verification_codes;

-- Create secure UPDATE policy that only allows users to update their own codes
CREATE POLICY "Users can update their own verification codes"
ON public.verification_codes
FOR UPDATE
USING (email = auth.jwt()->>'email');

-- Migration: 20251108202913
-- Fix security issue: Remove public read access to job_completions
-- Users should only see their own completion data
DROP POLICY IF EXISTS "Public can view all completions for stats" ON job_completions;

-- Fix security issue: Remove public insert access to verification_codes
-- This prevents spam and abuse of the verification system
DROP POLICY IF EXISTS "Anyone can create verification codes" ON verification_codes;

-- Create a public view for anonymized aggregate statistics
-- This provides the stats functionality without exposing individual user data
CREATE OR REPLACE VIEW public.job_stats AS
SELECT 
  COUNT(*) as total_jobs,
  SUM(earned_credits) as total_credits,
  SUM(estimated_co2_kg_impact) as total_co2_impact,
  AVG(quiz_score_percent) as avg_score
FROM job_completions;

-- Grant select access on the view to authenticated users
GRANT SELECT ON public.job_stats TO authenticated;

-- Migration: 20251108202926
-- Fix security definer view issue
-- Use SECURITY INVOKER so the view respects the querying user's permissions
DROP VIEW IF EXISTS public.job_stats;

CREATE VIEW public.job_stats 
WITH (security_invoker = true)
AS
SELECT 
  COUNT(*) as total_jobs,
  SUM(earned_credits) as total_credits,
  SUM(estimated_co2_kg_impact) as total_co2_impact,
  AVG(quiz_score_percent) as avg_score
FROM job_completions;

-- Grant select access on the view to authenticated users
GRANT SELECT ON public.job_stats TO authenticated;

-- Migration: 20251108215816
-- Prevent users from inserting verification codes directly
-- Only edge functions with SERVICE_ROLE_KEY can insert (they bypass RLS)
CREATE POLICY "Prevent direct insertion of verification codes"
ON public.verification_codes
FOR INSERT
WITH CHECK (false);

-- Prevent users from deleting verification codes
-- Only edge functions or database functions can manage deletion
CREATE POLICY "Prevent deletion of verification codes"
ON public.verification_codes
FOR DELETE
USING (false);

-- Migration: 20251108220836
-- Create quiz_scores table to track user quiz performance
CREATE TABLE public.quiz_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0),
  total_questions INTEGER NOT NULL CHECK (total_questions > 0),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  percentage NUMERIC GENERATED ALWAYS AS (ROUND((score::NUMERIC / total_questions::NUMERIC) * 100, 2)) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster leaderboard queries
CREATE INDEX idx_quiz_scores_user_id ON public.quiz_scores(user_id);
CREATE INDEX idx_quiz_scores_percentage ON public.quiz_scores(percentage DESC);
CREATE INDEX idx_quiz_scores_created_at ON public.quiz_scores(created_at DESC);

-- Enable RLS
ALTER TABLE public.quiz_scores ENABLE ROW LEVEL SECURITY;

-- Users can insert their own scores
CREATE POLICY "Users can insert own quiz scores"
ON public.quiz_scores
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Everyone can view all scores (public leaderboard)
CREATE POLICY "Public read access for quiz scores"
ON public.quiz_scores
FOR SELECT
USING (true);

-- Users can view their own scores
CREATE POLICY "Users can view own quiz scores"
ON public.quiz_scores
FOR SELECT
USING (auth.uid() = user_id);
