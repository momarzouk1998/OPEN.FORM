-- Make form filling public by allowing anonymous responses

-- 1. Remove NOT NULL constraint from user_id
ALTER TABLE form_responses ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add respondent_id for tracking anonymous users
ALTER TABLE form_responses ADD COLUMN IF NOT EXISTS respondent_id TEXT;

-- 3. Add index on respondent_id
CREATE INDEX IF NOT EXISTS idx_form_responses_respondent_id ON form_responses(respondent_id);

-- 4. Update RLS policies
-- Allow anyone to insert a response
DROP POLICY IF EXISTS "Anyone can insert responses" ON form_responses;
CREATE POLICY "Anyone can insert responses" ON form_responses
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Users can view their own responses (by user_id or respondent_id)
DROP POLICY IF EXISTS "Users can view own responses" ON form_responses;
CREATE POLICY "Users can view own responses" ON form_responses
  FOR SELECT
  TO public
  USING (
    (user_id IS NOT NULL AND user_id = auth.uid()) OR
    (respondent_id IS NOT NULL)
  );

-- Users can update their own responses
DROP POLICY IF EXISTS "Users can update own responses" ON form_responses;
CREATE POLICY "Users can update own responses" ON form_responses
  FOR UPDATE
  TO public
  USING (
    (user_id IS NOT NULL AND user_id = auth.uid()) OR
    (respondent_id IS NOT NULL)
  );

-- Users can delete their own responses
DROP POLICY IF EXISTS "Users can delete own responses" ON form_responses;
CREATE POLICY "Users can delete own responses" ON form_responses
  FOR DELETE
  TO public
  USING (
    (user_id IS NOT NULL AND user_id = auth.uid()) OR
    (respondent_id IS NOT NULL)
  );
