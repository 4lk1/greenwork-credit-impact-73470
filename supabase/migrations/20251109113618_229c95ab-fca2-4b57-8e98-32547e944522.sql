-- Add image_url field to training_modules table
ALTER TABLE training_modules
ADD COLUMN IF NOT EXISTS image_url TEXT;