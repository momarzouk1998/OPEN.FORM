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
