-- ============================================================
-- 1. إصلاح RLS recursion في profiles
-- ============================================================

-- دالة بتفحص الأدمن بدون ما تعمل recursion (SECURITY DEFINER = بتتخطى RLS)
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

-- إسقاط السياسات القديمة اللي بتسبب recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- إعادة إنشائها باستخدام الدالة (بدون recursion)
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
ON profiles FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================================
-- 2. إنشاء المستخدم admin (abomrzk@gmail.com / 123456)
-- ============================================================

-- إنشاء المستخدم في Auth
-- (Note: This must be done from Supabase Auth dashboard or API,
--  but here's the SQL to update their role after they sign up)

-- أولاً: تأكد من إنشاء الحساب من واجهة التسجيل في الموقع
-- ثم شغّل الكود دا عشان تخليه admin:

UPDATE public.profiles
SET role = 'admin',
    status = 'approved'
WHERE email = 'abomrzk@gmail.com';

-- لو الحساب لسه ما اتسجلش، سجل من الموقع الأول
-- وبعدها ارجع شغّل التحديث فوق

SELECT * FROM profiles WHERE email = 'abomrzk@gmail.com';
