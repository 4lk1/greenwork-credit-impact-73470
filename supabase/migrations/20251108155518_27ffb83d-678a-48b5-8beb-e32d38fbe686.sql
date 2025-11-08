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