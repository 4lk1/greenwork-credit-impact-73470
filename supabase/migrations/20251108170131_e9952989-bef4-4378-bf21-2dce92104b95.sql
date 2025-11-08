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