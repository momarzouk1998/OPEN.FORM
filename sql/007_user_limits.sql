ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS form_limit INTEGER DEFAULT -1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS submission_limit INTEGER DEFAULT -1;

COMMENT ON COLUMN profiles.banned IS 'حظر المستخدم عن استخدام النظام';
COMMENT ON COLUMN profiles.form_limit IS 'الحد الأقصى لعدد الفورمز (-1 يعني غير محدود)';
COMMENT ON COLUMN profiles.submission_limit IS 'الحد الأقصى لعدد الردود لحساب المستخدم (-1 يعني غير محدود)';
