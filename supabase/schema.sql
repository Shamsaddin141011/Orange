-- OrangeUni university table
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS universities (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  country       TEXT NOT NULL,        -- 'USA' | 'UK'
  city          TEXT,
  state         TEXT,
  website       TEXT,
  majors        TEXT[]  DEFAULT '{}',
  sat_min       INTEGER,              -- combined SAT 25th percentile
  sat_max       INTEGER,              -- combined SAT 75th percentile
  acceptance_rate REAL,              -- 0–1
  tuition_estimate INTEGER,          -- USD per year (international / out-of-state)
  intl_aid      TEXT DEFAULT 'unknown', -- 'yes' | 'no' | 'unknown'
  tags          TEXT[]  DEFAULT '{}',
  brief_description TEXT,
  student_size  INTEGER,
  image_url     TEXT
);

-- Speed up the filters the app uses
CREATE INDEX IF NOT EXISTS idx_uni_country    ON universities (country);
CREATE INDEX IF NOT EXISTS idx_uni_tuition    ON universities (tuition_estimate);
CREATE INDEX IF NOT EXISTS idx_uni_sat        ON universities (sat_min, sat_max);
CREATE INDEX IF NOT EXISTS idx_uni_acceptance ON universities (acceptance_rate);
CREATE INDEX IF NOT EXISTS idx_uni_name       ON universities USING GIN (to_tsvector('english', name));

-- Allow public read access (anon key)
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON universities
  FOR SELECT USING (true);
