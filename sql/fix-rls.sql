-- ============================================================
-- Open App.Form — إصلاح RLS Infinite Recursion
-- ============================================================

-- 1. دالة لفحص الأدمن بدون recursion (SECURITY DEFINER = تتخطى RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN (SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid());
END;
$$;

-- 2. إصلاح سياسات profiles (سبب المشكلة الأساسي)
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
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles"
ON profiles FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 3. إصلاح سياسات forms (كانت بتستخدم EXISTS profiles → recursion)
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
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 4. إصلاح سياسات questions
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

-- 5. إصلاح سياسات form_responses
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
USING (public.is_admin());

-- 6. إصلاح سياسات form_templates
ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view templates" ON form_templates;
CREATE POLICY "Anyone can view templates"
ON form_templates FOR SELECT
TO public USING (true);

DROP POLICY IF EXISTS "Admins can manage templates" ON form_templates;
CREATE POLICY "Admins can manage templates"
ON form_templates FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 7. إصلاح سياسات app_settings
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to app_settings" ON app_settings;
CREATE POLICY "Allow read access to app_settings"
ON app_settings FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow admin update app_settings" ON app_settings;
CREATE POLICY "Allow admin update app_settings"
ON app_settings FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 8. إصلاح سياسات notifications
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

-- 9. إصلاح سياسات notification_preferences
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

-- ============================================================
-- تم
-- ============================================================
SELECT '✅ تم إصلاح RLS بنجاح' AS result;
