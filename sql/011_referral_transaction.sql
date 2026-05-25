-- Atomic referral recording and template usage increment functions

-- Function to atomically insert referral and increment referrer's count
CREATE OR REPLACE FUNCTION increment_referral(referral_code TEXT, referred_id UUID, referred_email TEXT)
RETURNS void AS $$
DECLARE
  referrer_uuid UUID;
BEGIN
  SELECT id INTO referrer_uuid FROM profiles WHERE referral_code = referral_code FOR UPDATE;
  IF referrer_uuid IS NULL THEN
    RAISE NOTICE 'No referrer found for code %', referral_code;
    RETURN;
  END IF;

  INSERT INTO referrals (referrer_id, referred_email, referred_id, status)
  VALUES (referrer_uuid, referred_email, referred_id, 'completed');

  UPDATE profiles SET referral_count = COALESCE(referral_count, 0) + 1 WHERE id = referrer_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to increment usage_count for a user template
CREATE OR REPLACE FUNCTION increment_user_template_usage(tpl_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE user_templates SET usage_count = COALESCE(usage_count, 0) + 1 WHERE id = tpl_id;
END;
$$ LANGUAGE plpgsql;

-- Safer atomic referral recording and template usage helpers (added — do not remove originals)
-- These functions avoid ambiguous identifier usage, check duplicates, and provide basic exception handling.

CREATE OR REPLACE FUNCTION increment_referral_safe(
  p_referral_code TEXT,
  p_referred_id UUID,
  p_referred_email TEXT
)
RETURNS void AS $$
DECLARE
  referrer_uuid UUID;
  already_exists BOOLEAN := FALSE;
BEGIN
  -- Find the referrer by code and lock the row to avoid race conditions
  SELECT id
    INTO referrer_uuid
    FROM profiles
   WHERE referral_code = p_referral_code
   LIMIT 1
   FOR UPDATE;

  IF referrer_uuid IS NULL THEN
    RAISE NOTICE 'No referrer found for code %', p_referral_code;
    RETURN;
  END IF;

  -- Prevent duplicate referral records for the same referred id/email
  IF p_referred_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM referrals WHERE referrer_id = referrer_uuid AND referred_id = p_referred_id
    ) INTO already_exists;
  ELSE
    SELECT EXISTS(
      SELECT 1 FROM referrals WHERE referrer_id = referrer_uuid AND referred_email = p_referred_email
    ) INTO already_exists;
  END IF;

  IF already_exists THEN
    RAISE NOTICE 'Referral already recorded for referrer % and referred %', referrer_uuid, COALESCE(p_referred_id::text, p_referred_email);
    RETURN;
  END IF;

  -- Insert referral record and increment counter atomically
  INSERT INTO referrals (referrer_id, referred_email, referred_id, status, created_at)
  VALUES (referrer_uuid, p_referred_email, p_referred_id, 'completed', now());

  UPDATE profiles SET referral_count = COALESCE(referral_count, 0) + 1 WHERE id = referrer_uuid;
EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE 'Unique violation while inserting referral for %', COALESCE(p_referred_email, p_referred_id::text);
  WHEN others THEN
    RAISE WARNING 'increment_referral_safe failed: %', SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_user_template_usage_safe(p_tpl_id UUID)
RETURNS void AS $$
DECLARE
  updated_count INT;
BEGIN
  UPDATE user_templates
  SET usage_count = COALESCE(usage_count, 0) + 1
  WHERE id = p_tpl_id
  RETURNING usage_count INTO updated_count;

  IF NOT FOUND THEN
    RAISE NOTICE 'Template % not found', p_tpl_id;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'increment_user_template_usage_safe failed: %', SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql;
