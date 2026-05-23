-- ============================================================
-- Open App.Form — SQL Migration (بدون مشاريع)
-- للاستخدام على Supabase جديد من الصفر
-- ============================================================

-- ============================================================
-- 1. ENABLE EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. ENSURE TABLES EXIST (مع التعليق على المراجع القديمة)
-- ============================================================

-- ==================== forms ====================
ALTER TABLE forms ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS instructions TEXT;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS allow_multiple BOOLEAN DEFAULT false;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS max_attempts INTEGER DEFAULT 1;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS show_results BOOLEAN DEFAULT true;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS time_limit INTEGER;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS randomize_questions BOOLEAN DEFAULT false;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS pass_score DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS allow_delete_responses BOOLEAN DEFAULT false;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS short_code TEXT UNIQUE;

-- Make project_id nullable (لأننا أزلنا المشاريع)
ALTER TABLE forms ALTER COLUMN project_id DROP NOT NULL;

-- Drop deprecated column
ALTER TABLE forms DROP COLUMN IF EXISTS target_gender;

COMMENT ON COLUMN forms.image_url IS 'رابط صورة الفورم';
COMMENT ON COLUMN forms.description IS 'وصف النموذج';
COMMENT ON COLUMN forms.instructions IS 'تعليمات ملء النموذج';
COMMENT ON COLUMN forms.allow_multiple IS 'السماح بإجابات متعددة للسؤال الواحد';
COMMENT ON COLUMN forms.max_attempts IS 'عدد المحاولات المسموحة';
COMMENT ON COLUMN forms.show_results IS 'إظهار النتائج للمستخدم';
COMMENT ON COLUMN forms.time_limit IS 'الحد الزمني بالدقائق';
COMMENT ON COLUMN forms.randomize_questions IS 'ترتيب الأسئلة عشوائياً';
COMMENT ON COLUMN forms.pass_score IS 'درجة النجاح (نسبة مئوية)';

-- ==================== questions ====================
ALTER TABLE questions ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS points DECIMAL(10,2) DEFAULT 0;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS row_group INTEGER;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS has_counter BOOLEAN DEFAULT FALSE;

-- Convert old single_choice_with_counter to new format
UPDATE questions
SET type = 'single_choice',
    has_counter = TRUE
WHERE type = 'single_choice_with_counter';

-- Ensure valid question types
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_type_check;

UPDATE questions
SET type = 'text'
WHERE type NOT IN (
  'text', 'textarea', 'single_choice', 'multiple_choice',
  'scale', 'ranking', 'matrix', 'dropdown',
  'date', 'time', 'file_upload'
);

ALTER TABLE questions ADD CONSTRAINT questions_type_check
  CHECK (type IN (
    'text', 'textarea', 'single_choice', 'multiple_choice',
    'scale', 'ranking', 'matrix', 'dropdown',
    'date', 'time', 'file_upload'
  ));

-- ==================== form_templates (جديد) ====================
CREATE TABLE IF NOT EXISTS form_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    image_url TEXT,
    questions_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    form_settings JSONB DEFAULT '{}'::jsonb,
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE form_templates IS 'قوالب النماذج الجاهزة';

-- ==================== notifications (جديد) ====================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    type TEXT DEFAULT 'info',
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE notifications IS 'الإشعارات';

-- ==================== notification_preferences (جديد) ====================
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    notification_type TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, notification_type)
);

COMMENT ON TABLE notification_preferences IS 'تفضيلات الإشعارات لكل مستخدم';

-- ==================== app_settings (جديد) ====================
CREATE TABLE IF NOT EXISTS app_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(id)
);

COMMENT ON TABLE app_settings IS 'الإعدادات العامة للتطبيق';

-- ============================================================
-- 3. RLS (ROW LEVEL SECURITY)
-- ============================================================

-- ==================== profiles ====================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Insert Profiles Policy" ON public.profiles;
CREATE POLICY "Insert Profiles Policy"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- ==================== forms ====================
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own forms" ON forms;
CREATE POLICY "Users can view own forms" ON forms
  FOR SELECT TO authenticated
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Anyone can view active forms" ON forms;
CREATE POLICY "Anyone can view active forms" ON forms
  FOR SELECT TO public
  USING (is_active = true);

DROP POLICY IF EXISTS "Users can create forms" ON forms;
CREATE POLICY "Users can create forms" ON forms
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can update own forms" ON forms;
CREATE POLICY "Users can update own forms" ON forms
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can delete own forms" ON forms;
CREATE POLICY "Users can delete own forms" ON forms
  FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- ==================== form_templates ====================
ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view templates" ON form_templates;
CREATE POLICY "Anyone can view templates" ON form_templates
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admins can manage templates" ON form_templates;
CREATE POLICY "Admins can manage templates" ON form_templates
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ==================== notifications ====================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ==================== notification_preferences ====================
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own preferences" ON notification_preferences;
CREATE POLICY "Users can view own preferences" ON notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own preferences" ON notification_preferences;
CREATE POLICY "Users can manage own preferences" ON notification_preferences
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can read preferences" ON notification_preferences;
CREATE POLICY "System can read preferences" ON notification_preferences
  FOR SELECT USING (true);

-- ==================== app_settings ====================
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to app_settings" ON app_settings;
CREATE POLICY "Allow read access to app_settings" ON app_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin update app_settings" ON app_settings;
CREATE POLICY "Allow admin update app_settings" ON app_settings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- ============================================================
-- 4. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_forms_project_id ON forms(project_id);
CREATE INDEX IF NOT EXISTS idx_forms_is_active ON forms(is_active);
CREATE INDEX IF NOT EXISTS idx_forms_created_by ON forms(created_by);
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);
CREATE INDEX IF NOT EXISTS idx_questions_form_id ON questions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_form_id ON form_responses(form_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_user_id ON form_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_row_group ON questions(row_group);
CREATE INDEX IF NOT EXISTS idx_forms_short_code ON forms(short_code);
CREATE INDEX IF NOT EXISTS idx_form_templates_category ON form_templates(category);
CREATE INDEX IF NOT EXISTS idx_form_templates_featured ON form_templates(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- ============================================================
-- 5. DATA MIGRATION — short_code للنماذج الحالية
-- ============================================================

UPDATE forms
SET short_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
WHERE short_code IS NULL;

-- ============================================================
-- 6. SEED DATA
-- ============================================================

-- Default notification preferences
INSERT INTO notification_preferences (user_id, notification_type, enabled)
SELECT p.id, 'assignment', true
FROM profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM notification_preferences np WHERE np.user_id = p.id AND np.notification_type = 'assignment'
);

-- Default app settings
INSERT INTO app_settings (key, value, description) VALUES
('app_logo', '', 'شعار التطبيق الرئيسي'),
('app_name', 'Forms.OpenappO', 'اسم التطبيق'),
('app_description', 'منصة النماذج والاستبيانات الاحترافية', 'وصف التطبيق')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 7. STORAGE BUCKET
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('form-images', 'form-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'form-images');

DROP POLICY IF EXISTS "Public can view images" ON storage.objects;
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'form-images');

-- ============================================================
-- تم الانتهاء
-- ============================================================
SELECT '✅ تم تطبيق التعديلات بنجاح' AS result;
