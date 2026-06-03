-- ================================================
-- التعديلات النهائية للنماذج - تشغيل لمرة واحدة
-- إزالة target_gender من forms
-- تحديث CHECK constraint للأسئلة
-- ترحيل بيانات sub_options القديمة
-- إنشاء الجداول المفقودة مع RLS
-- ================================================

-- ================================================
-- 1. إزالة target_gender من forms
-- ================================================
ALTER TABLE forms DROP COLUMN IF EXISTS target_gender;

-- ================================================
-- 2. تحديث CHECK constraint على questions.type
-- إزالة single_choice_with_counter إن وجد
-- تصحيح أي صفوف موجودة بقيم غير صالحة أولاً
-- ================================================
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_type_check;

-- تصحيح أي قيم قديمة/غير صالحة قبل إعادة القيد
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

-- ================================================
-- 3. التأكد من وجود جميع الأعمدة المطلوبة في forms
-- ================================================
ALTER TABLE forms ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS instructions TEXT;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS allow_multiple BOOLEAN DEFAULT false;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS max_attempts INTEGER DEFAULT 1;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS show_results BOOLEAN DEFAULT true;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS randomize_questions BOOLEAN DEFAULT false;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS pass_score DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS time_limit INTEGER;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS allow_delete_responses BOOLEAN DEFAULT false;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS image_url TEXT;

-- ================================================
-- 4. التأكد من وجود جميع الأعمدة المطلوبة في questions
-- ================================================
ALTER TABLE questions ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS points DECIMAL(10,2) DEFAULT 0;

-- ================================================
-- 5. التأكد من وجود جميع الأعمدة المطلوبة في projects
-- ================================================
ALTER TABLE projects ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS original_project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS modules JSONB DEFAULT '{"forms": true, "curriculum": false}';

-- ================================================
-- 6. التأكد من وجود جميع الأعمدة المطلوبة في lessons
-- ================================================
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'video';
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS allow_comments BOOLEAN DEFAULT true;
ALTER TABLE lessons ALTER COLUMN youtube_url DROP NOT NULL;

-- ================================================
-- 7. التأكد من وجود curricula.is_sequential
-- ================================================
ALTER TABLE curricula ADD COLUMN IF NOT EXISTS is_sequential BOOLEAN DEFAULT true;

-- ================================================
-- 8. التأكد من وجود updated_at على جميع الجداول
-- ================================================
ALTER TABLE project_invites ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE user_projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE user_projects ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- ================================================
-- 9. إنشاء الجداول (إن لم تكن موجودة)
-- ================================================

-- Project supervisors
CREATE TABLE IF NOT EXISTS project_supervisors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- Project bans
CREATE TABLE IF NOT EXISTS project_bans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- Notifications
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

-- Notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    notification_type TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, notification_type)
);

-- ================================================
-- 10. RLS للجداول الجديدة
-- ================================================

ALTER TABLE project_supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- project_supervisors policies
DROP POLICY IF EXISTS "Anyone can view supervisors" ON project_supervisors;
CREATE POLICY "Anyone can view supervisors" ON project_supervisors FOR SELECT USING (true);

DROP POLICY IF EXISTS "Supervisors and admins can manage supervisors" ON project_supervisors;
CREATE POLICY "Supervisors and admins can manage supervisors" ON project_supervisors FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor', 'admin'))
);

-- project_bans policies
DROP POLICY IF EXISTS "Anyone can view bans" ON project_bans;
CREATE POLICY "Anyone can view bans" ON project_bans FOR SELECT USING (true);

DROP POLICY IF EXISTS "Supervisors and admins can manage bans" ON project_bans;
CREATE POLICY "Supervisors and admins can manage bans" ON project_bans FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor', 'admin'))
);

-- notifications policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- notification_preferences policies
DROP POLICY IF EXISTS "Users can view own preferences" ON notification_preferences;
CREATE POLICY "Users can view own preferences" ON notification_preferences FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own preferences" ON notification_preferences;
CREATE POLICY "Users can manage own preferences" ON notification_preferences FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can read preferences" ON notification_preferences;
CREATE POLICY "System can read preferences" ON notification_preferences FOR SELECT USING (true);

-- ================================================
-- 11. تحديث RLS policy للمشاريع (إظهار المقصوص والمؤرشف)
-- ================================================

DROP POLICY IF EXISTS "Anyone can view public projects" ON projects;
CREATE POLICY "Anyone can view public projects" ON projects FOR SELECT USING (
    is_archived = false
    AND (
        visibility IS DISTINCT FROM 'private'
        OR EXISTS (SELECT 1 FROM user_projects WHERE user_projects.project_id = projects.id AND user_projects.user_id = auth.uid() AND (user_projects.expires_at IS NULL OR user_projects.expires_at > NOW()))
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor', 'admin'))
        OR EXISTS (SELECT 1 FROM project_supervisors WHERE project_supervisors.project_id = projects.id AND project_supervisors.user_id = auth.uid())
    )
    AND NOT EXISTS (SELECT 1 FROM project_bans WHERE project_bans.project_id = projects.id AND project_bans.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins can view archived" ON projects;
CREATE POLICY "Admins can view archived" ON projects FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Supervisors can update their projects" ON projects;
CREATE POLICY "Supervisors can update their projects" ON projects FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM project_supervisors WHERE project_supervisors.project_id = projects.id AND project_supervisors.user_id = auth.uid())
);

-- ================================================
-- 12. تحديث profile trigger (بدون auto-create trigger)
-- ================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

DROP POLICY IF EXISTS "Insert Profiles Policy" ON public.profiles;
CREATE POLICY "Insert Profiles Policy" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ================================================
-- 13. ترحيل بيانات sub_options القديمة إلى JSON object format
-- البيانات القديمة: array of rows + last element has sub_options
-- البيانات الجديدة: { matrix_rows: [...], matrix_columns: [...] }
-- ================================================

DO $$
DECLARE
    q RECORD;
    rows_data JSONB;
    cols_data JSONB;
BEGIN
    FOR q IN
        SELECT id, options FROM questions
        WHERE type = 'matrix'
        AND jsonb_typeof(options) = 'array'
        AND options IS NOT NULL
        AND options->0 ? 'sub_options' = false  -- only old-format arrays
    LOOP
        -- Extract rows (all elements that don't have sub_options)
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', elem->>'id',
                'text', elem->>'text',
                'required', COALESCE((elem->>'required')::boolean, false)
            )
        ) INTO rows_data
        FROM jsonb_array_elements(q.options) AS elem
        WHERE NOT (elem ? 'sub_options');

        -- Extract columns from first element that has sub_options
        SELECT elem->'sub_options' INTO cols_data
        FROM jsonb_array_elements(q.options) AS elem
        WHERE elem ? 'sub_options'
        LIMIT 1;

        -- If we found both rows and columns, update
        IF rows_data IS NOT NULL AND cols_data IS NOT NULL THEN
            UPDATE questions
            SET options = jsonb_build_object(
                'matrix_rows', rows_data,
                'matrix_columns', cols_data
            )
            WHERE id = q.id;
        END IF;
    END LOOP;
END $$;

-- ================================================
-- 14. إضافة الفهارس لتحسين الأداء
-- ================================================

CREATE INDEX IF NOT EXISTS idx_forms_project_id ON forms(project_id);
CREATE INDEX IF NOT EXISTS idx_forms_is_active ON forms(is_active);
CREATE INDEX IF NOT EXISTS idx_questions_form_id ON questions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_form_id ON form_responses(form_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_user_id ON form_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_curricula_project_id ON curricula(project_id);
CREATE INDEX IF NOT EXISTS idx_lessons_curriculum_id ON lessons(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_lesson ON lesson_progress(user_id, lesson_id);

-- ================================================
-- 15. تأكيد الإنجاز
-- ================================================
SELECT 'تم تطبيق جميع التعديلات بنجاح ✓' AS result;
