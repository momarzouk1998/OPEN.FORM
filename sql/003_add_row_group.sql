-- Add row_group column to questions table for side-by-side field layout
-- Questions with the same row_group number will be displayed in the same horizontal row

ALTER TABLE questions ADD COLUMN IF NOT EXISTS row_group INTEGER;

-- Add index for efficient querying by row_group
CREATE INDEX IF NOT EXISTS idx_questions_row_group ON questions(row_group);
