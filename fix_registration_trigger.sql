-- =============================================
-- الحل النهائي لمشكلة التسجيل (الاستغناء عن الـ Triggers)
-- =============================================

-- 1. مسح الدالة التلقائية التي تسبب المشكلة من جذورها
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 2. إعطاء الصلاحية للمستخدم بإنشاء ملفه الشخصي بنفسه مباشرة (بدون دالة تلقائية)
DROP POLICY IF EXISTS "Insert Profiles Policy" ON public.profiles;
CREATE POLICY "Insert Profiles Policy" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);
