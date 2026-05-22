-- Create verification codes table for email verification
CREATE TABLE IF NOT EXISTS verification_codes (
  email TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-delete expired codes
CREATE OR REPLACE FUNCTION delete_expired_verification_codes()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM verification_codes WHERE expires_at < NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_delete_expired_codes ON verification_codes;
CREATE TRIGGER trigger_delete_expired_codes
  BEFORE INSERT ON verification_codes
  FOR EACH STATEMENT
  EXECUTE FUNCTION delete_expired_verification_codes();
