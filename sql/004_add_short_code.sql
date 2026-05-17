-- Add short_code column to forms table for short URLs (e.g., /f/ABC123)

ALTER TABLE forms ADD COLUMN IF NOT EXISTS short_code TEXT UNIQUE;

-- Generate short codes for existing forms that don't have one
-- Uses a 6-character alphanumeric code
UPDATE forms
SET short_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
WHERE short_code IS NULL;

-- Add unique index and NOT NULL constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_forms_short_code ON forms(short_code);
ALTER TABLE forms ALTER COLUMN short_code SET NOT NULL;
