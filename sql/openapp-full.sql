-- ============================================================
-- Open App.Form — FULL DATABASE SCHEMA (من الصفر)
-- شغّل هذا الملف كامل على Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. ENUMS
-- ============================================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('volunteer', 'supervisor', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE gender AS ENUM ('male', 'female');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE account_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 3. TABLES
-- ============================================================

-- ==================== profiles ====================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    phone TEXT,
    name TEXT NOT NULL DEFAULT '',
    gender gender DEFAULT 'male',
    role user_role DEFAULT 'volunteer',
    status account_status DEFAULT 'pending',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    time_limit INTEGER,
    expires_at TIMESTAMP WITH TIME ZONE,
    allow_delete_responses BOOLEAN DEFAULT false,
    randomize_questions BOOLEAN DEFAULT false,
    allow_multiple BOOLEAN DEFAULT false
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ==================== forms ====================
CREATE TABLE IF NOT EXISTS forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID, -- nullable (أزلنا المشاريع)
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    instructions TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    time_limit INTEGER,
    expires_at TIMESTAMP WITH TIME ZONE,
    allow_delete_responses BOOLEAN DEFAULT false,
    randomize_questions BOOLEAN DEFAULT false,
    allow_multiple BOOLEAN DEFAULT false,
    max_attempts INTEGER DEFAULT 1,
    show_results BOOLEAN DEFAULT true,
    pass_score DECIMAL(5,2) DEFAULT 0.00,
    image_url TEXT,
    short_code TEXT UNIQUE,
    serial_number BIGINT UNIQUE,
    page_titles JSONB DEFAULT '{}'::jsonb
);

-- Serial number sequence for forms (starts at 1000)
CREATE SEQUENCE IF NOT EXISTS forms_serial_number_seq START 1000;

CREATE OR REPLACE FUNCTION assign_serial_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.serial_number IS NULL THEN
    NEW.serial_number := nextval('forms_serial_number_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_forms_serial_number ON forms;
CREATE TRIGGER trg_forms_serial_number
  BEFORE INSERT ON forms
  FOR EACH ROW
  EXECUTE FUNCTION assign_serial_number();

-- ==================== questions ====================
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID REFERENCES forms(id) ON DELETE CASCADE NOT NULL,
    text TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'text',
    order_index INTEGER DEFAULT 0,
    required BOOLEAN DEFAULT false,
    points DECIMAL(10,2) DEFAULT 0,
    options JSONB DEFAULT '[]'::jsonb,
    has_counter BOOLEAN DEFAULT false,
    row_group INTEGER,
    page INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE questions ADD CONSTRAINT questions_type_check
  CHECK (type IN (
    'text', 'textarea', 'single_choice', 'multiple_choice',
    'scale', 'ranking', 'matrix', 'dropdown',
    'date', 'time', 'file_upload'
  ));

-- ==================== form_responses ====================
CREATE TABLE IF NOT EXISTS form_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID REFERENCES forms(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    score DECIMAL(10,2) DEFAULT 0,
    max_score DECIMAL(10,2) DEFAULT 0,
    answers JSONB DEFAULT '{}'::jsonb,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== form_templates ====================
CREATE TABLE IF NOT EXISTS form_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'survey',
    image_url TEXT,
    questions_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    form_settings JSONB DEFAULT '{}'::jsonb,
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== notifications ====================
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

-- ==================== notification_preferences ====================
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    notification_type TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, notification_type)
);

-- ==================== app_settings ====================
CREATE TABLE IF NOT EXISTS app_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(id)
);

-- ============================================================
-- 4. FUNCTIONS
-- ============================================================

-- Update updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================

-- ==================== profiles ====================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Insert Profiles Policy" ON profiles;
CREATE POLICY "Insert Profiles Policy"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles"
ON profiles FOR UPDATE
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ==================== forms ====================
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active forms" ON forms;
CREATE POLICY "Anyone can view active forms"
ON forms FOR SELECT
TO public
USING (is_active = true);

DROP POLICY IF EXISTS "Users can view own forms" ON forms;
CREATE POLICY "Users can view own forms"
ON forms FOR SELECT
TO authenticated
USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can create forms" ON forms;
CREATE POLICY "Users can create forms"
ON forms FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can update own forms" ON forms;
CREATE POLICY "Users can update own forms"
ON forms FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can delete own forms" ON forms;
CREATE POLICY "Users can delete own forms"
ON forms FOR DELETE
TO authenticated
USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all forms" ON forms;
CREATE POLICY "Admins can manage all forms"
ON forms FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ==================== questions ====================
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view questions of active forms" ON questions;
CREATE POLICY "Anyone can view questions of active forms"
ON questions FOR SELECT
TO public
USING (EXISTS (SELECT 1 FROM forms WHERE forms.id = questions.form_id AND forms.is_active = true));

DROP POLICY IF EXISTS "Form owners manage questions" ON questions;
CREATE POLICY "Form owners manage questions"
ON questions FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM forms WHERE forms.id = questions.form_id AND forms.created_by = auth.uid()));

-- ==================== form_responses ====================
ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert responses" ON form_responses;
CREATE POLICY "Anyone can insert responses"
ON form_responses FOR INSERT
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own responses" ON form_responses;
CREATE POLICY "Users can view own responses"
ON form_responses FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Form owners can view responses" ON form_responses;
CREATE POLICY "Form owners can view responses"
ON form_responses FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM forms WHERE forms.id = form_responses.form_id AND forms.created_by = auth.uid()));

DROP POLICY IF EXISTS "Admins can view all responses" ON form_responses;
CREATE POLICY "Admins can view all responses"
ON form_responses FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ==================== form_templates ====================
ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view templates" ON form_templates;
CREATE POLICY "Anyone can view templates"
ON form_templates FOR SELECT
TO public USING (true);

DROP POLICY IF EXISTS "Admins can manage templates" ON form_templates;
CREATE POLICY "Admins can manage templates"
ON form_templates FOR ALL
TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ==================== notifications ====================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications"
ON notifications FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id);

-- ==================== notification_preferences ====================
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own preferences" ON notification_preferences;
CREATE POLICY "Users can view own preferences"
ON notification_preferences FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own preferences" ON notification_preferences;
CREATE POLICY "Users can manage own preferences"
ON notification_preferences FOR ALL
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can read preferences" ON notification_preferences;
CREATE POLICY "System can read preferences"
ON notification_preferences FOR SELECT
USING (true);

-- ==================== app_settings ====================
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to app_settings" ON app_settings;
CREATE POLICY "Allow read access to app_settings"
ON app_settings FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow admin update app_settings" ON app_settings;
CREATE POLICY "Allow admin update app_settings"
ON app_settings FOR UPDATE
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ============================================================
-- 6. TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_forms_updated_at ON forms;
CREATE TRIGGER update_forms_updated_at
    BEFORE UPDATE ON forms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_app_settings_updated_at ON app_settings;
CREATE TRIGGER update_app_settings_updated_at
    BEFORE UPDATE ON app_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 7. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_forms_is_active ON forms(is_active);
CREATE INDEX IF NOT EXISTS idx_forms_created_by ON forms(created_by);
CREATE INDEX IF NOT EXISTS idx_forms_short_code ON forms(short_code);
CREATE INDEX IF NOT EXISTS idx_forms_project_id ON forms(project_id);
CREATE INDEX IF NOT EXISTS idx_questions_form_id ON questions(form_id);
CREATE INDEX IF NOT EXISTS idx_questions_row_group ON questions(row_group);
CREATE INDEX IF NOT EXISTS idx_form_responses_form_id ON form_responses(form_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_user_id ON form_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_form_templates_category ON form_templates(category);
CREATE INDEX IF NOT EXISTS idx_form_templates_featured ON form_templates(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);

-- ============================================================
-- 8. SEED DATA
-- ============================================================

-- Default notification preferences لكل المستخدمين الموجودين
INSERT INTO notification_preferences (user_id, notification_type, enabled)
SELECT p.id, 'assignment', true
FROM profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM notification_preferences np WHERE np.user_id = p.id AND np.notification_type = 'assignment'
);

-- إعدادات التطبيق الافتراضية
INSERT INTO app_settings (key, value, description) VALUES
('app_logo', '', 'شعار التطبيق الرئيسي'),
('app_name', 'Forms.OpenappO', 'اسم التطبيق'),
('app_description', 'منصة النماذج والاستبيانات الاحترافية', 'وصف التطبيق')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 9. SHORT CODES للنماذج الموجودة
-- ============================================================
UPDATE forms
SET short_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
WHERE short_code IS NULL;

-- ============================================================
-- ✅ تم
-- ============================================================
SELECT '✅ تم تطبيق قاعدة البيانات بنجاح - Open App.Form' AS result;
