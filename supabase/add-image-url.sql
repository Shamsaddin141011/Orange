-- Migration: add image_url to universities
-- Run this once in your Supabase SQL editor

ALTER TABLE universities
  ADD COLUMN IF NOT EXISTS image_url TEXT;
