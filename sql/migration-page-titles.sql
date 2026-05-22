-- Migration: Add page support to existing forms
-- Run this in Supabase SQL Editor if your database was created before these columns were added

ALTER TABLE forms ADD COLUMN IF NOT EXISTS page_titles JSONB DEFAULT '{}'::jsonb;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS page INTEGER NOT NULL DEFAULT 1;
