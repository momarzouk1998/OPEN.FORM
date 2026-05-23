-- Partners / Success Partners System
-- Adds columns to profiles and creates new tables for partner features

-- 1. Add columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS facebook_url TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS youtube_url TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS other_links JSONB DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_partner BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0;

-- 2. Partner Ideas table
CREATE TABLE IF NOT EXISTS partner_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  implemented BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE partner_ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ideas"
  ON partner_ideas FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage ideas"
  ON partner_ideas FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 3. Partner Likes table
CREATE TABLE IF NOT EXISTS partner_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(partner_id, user_id)
);

ALTER TABLE partner_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes"
  ON partner_likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can like/unlike"
  ON partner_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
  ON partner_likes FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_email TEXT,
  referred_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id);

CREATE POLICY "Users can create referrals"
  ON referrals FOR INSERT
  WITH CHECK (auth.uid() = referrer_id);

-- 5. User Templates table (templates created by users from their forms)
CREATE TABLE IF NOT EXISTS user_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'other',
  usage_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved templates"
  ON user_templates FOR SELECT
  USING (approved = true OR auth.uid() = created_by);

CREATE POLICY "Users can create templates from their forms"
  ON user_templates FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own templates"
  ON user_templates FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Admins can manage all templates"
  ON user_templates FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := upper(substr(md5(random()::text), 1, 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate referral code on profile insert
DROP TRIGGER IF EXISTS trg_generate_referral_code ON profiles;
CREATE TRIGGER trg_generate_referral_code
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_referral_code();
