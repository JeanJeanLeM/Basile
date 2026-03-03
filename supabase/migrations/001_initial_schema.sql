-- Basile: initial schema for Auth0 + Supabase migration
-- Run this in Supabase SQL Editor after creating the project

CREATE TABLE crops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'Légume-fruit','Légume-feuille','Légume-racine',
    'Légume-graine','Aromatique','Fleur comestible')),
  image_url TEXT,
  emoji TEXT,
  weeks_between_sowing_and_planting INTEGER NOT NULL DEFAULT 0,
  weeks_between_planting_and_harvest INTEGER NOT NULL DEFAULT 0,
  weeks_between_harvest_and_destruction INTEGER,
  sowing_weeks INTEGER[] NOT NULL DEFAULT '{}',
  planting_weeks INTEGER[] NOT NULL DEFAULT '{}',
  planting_method TEXT NOT NULL CHECK (planting_method IN ('serre','plein_champ','both')),
  user_id TEXT NOT NULL DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  crop_id UUID REFERENCES crops(id) ON DELETE CASCADE,
  crop_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  planting_week INTEGER NOT NULL,
  sowing_week INTEGER NOT NULL,
  notes TEXT,
  sowing_done BOOLEAN NOT NULL DEFAULT false,
  planting_done BOOLEAN NOT NULL DEFAULT false,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  custom_nursery_weeks INTEGER,
  custom_culture_weeks INTEGER,
  custom_harvest_weeks INTEGER
);

CREATE TABLE user_preferences (
  user_id TEXT PRIMARY KEY,
  has_greenhouse BOOLEAN NOT NULL DEFAULT false,
  direct_sowing BOOLEAN NOT NULL DEFAULT false,
  year_long_crops TEXT[] DEFAULT '{}',
  excluded_crops TEXT[] DEFAULT '{}',
  excluded_crop_names TEXT[] DEFAULT '{}',
  winter_cultivation TEXT NOT NULL DEFAULT 'no'
    CHECK (winter_cultivation IN ('yes','little','no')),
  season_extension TEXT NOT NULL DEFAULT 'none'
    CHECK (season_extension IN ('early','late','both','none')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_crops_user_name ON crops(user_id, name);
CREATE INDEX idx_plans_user_planting ON plans(user_id, planting_week);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER crops_updated BEFORE UPDATE ON crops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER plans_updated BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER prefs_updated BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
