-- Seed data for شركاء النجاح (Success Partners)
-- Safe to run multiple times: uses existing auth users if emails already exist, upserts profiles, clears/reinserts ideas and likes
-- Run this in Supabase SQL Editor

DO $$
DECLARE
  p1_id UUID;
  p2_id UUID;
  p3_id UUID;
  p4_id UUID;
  idea1_id UUID;
  idea2_id UUID;
  idea3_id UUID;
  idea4_id UUID;
  idea5_id UUID;
  idea6_id UUID;
  idea7_id UUID;
BEGIN

  -- ========================================
  -- 1. Get or create auth users
  -- ========================================

  -- Look up existing users by email first
  SELECT id INTO p1_id FROM auth.users WHERE email = 'ahmed@example.com';
  SELECT id INTO p2_id FROM auth.users WHERE email = 'sara@example.com';
  SELECT id INTO p3_id FROM auth.users WHERE email = 'khaled@example.com';
  SELECT id INTO p4_id FROM auth.users WHERE email = 'nora@example.com';

  -- Create only the ones that don't exist yet
  IF p1_id IS NULL THEN
    p1_id := gen_random_uuid();
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
    VALUES (p1_id, 'ahmed@example.com', crypt('test123', gen_salt('bf')), NOW(), '{"provider":"email"}', '{"name":"أحمد محمد"}', NOW(), NOW(), 'authenticated', 'authenticated', '');
  END IF;

  IF p2_id IS NULL THEN
    p2_id := gen_random_uuid();
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
    VALUES (p2_id, 'sara@example.com', crypt('test123', gen_salt('bf')), NOW(), '{"provider":"email"}', '{"name":"سارة عبدالله"}', NOW(), NOW(), 'authenticated', 'authenticated', '');
  END IF;

  IF p3_id IS NULL THEN
    p3_id := gen_random_uuid();
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
    VALUES (p3_id, 'khaled@example.com', crypt('test123', gen_salt('bf')), NOW(), '{"provider":"email"}', '{"name":"خالد علي"}', NOW(), NOW(), 'authenticated', 'authenticated', '');
  END IF;

  IF p4_id IS NULL THEN
    p4_id := gen_random_uuid();
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
    VALUES (p4_id, 'nora@example.com', crypt('test123', gen_salt('bf')), NOW(), '{"provider":"email"}', '{"name":"نورة أحمد"}', NOW(), NOW(), 'authenticated', 'authenticated', '');
  END IF;

  -- ========================================
  -- 2. Upsert profiles (as partners)
  -- ========================================
  INSERT INTO profiles (id, name, email, avatar_url, company, bio, is_partner, referral_code, referral_count)
  VALUES
    (p1_id, 'أحمد محمد',    'ahmed@example.com',  'https://api.dicebear.com/9.x/avataaars/svg?seed=ahmed',  'شركة التقنية المتطورة',  'مطور ويب وخبير في بناء النماذج الإلكترونية. أساعد الشركات على رقمنة أعمالهم.',  true, 'AHMED1',  12),
    (p2_id, 'سارة عبدالله', 'sara@example.com',   'https://api.dicebear.com/9.x/avataaars/svg?seed=sara',   'مؤسسة إبداع للتسويق',   'مصممة تجارب مستخدم وأخصائية تحسين معدلات التحويل. أكثر من 5 سنوات خبرة.',   true, 'SARA22',   8),
    (p3_id, 'خالد علي',     'khaled@example.com', 'https://api.dicebear.com/9.x/avataaars/svg?seed=khaled', 'أكاديمية التعليم الذكي', 'مدرب معتمد في مجال التكنولوجيا التعليمية. مهتم بتبسيط المفاهيم التقنية.',      true, 'KHALED99', 5),
    (p4_id, 'نورة أحمد',    'nora@example.com',   'https://api.dicebear.com/9.x/avataaars/svg?seed=nora',   'متجر نورة الإلكتروني',   'رائدة أعمال في مجال التجارة الإلكترونية. أدير متجراً ناجحاً للمنتجات الحرفية.',  true, 'NORA88',   15)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    avatar_url = EXCLUDED.avatar_url,
    company = EXCLUDED.company,
    bio = EXCLUDED.bio,
    is_partner = true,
    referral_code = EXCLUDED.referral_code,
    referral_count = EXCLUDED.referral_count;

  -- ========================================
  -- 3. Clear old ideas and reinsert (to avoid duplicates)
  -- ========================================
  DELETE FROM partner_ideas WHERE partner_id IN (p1_id, p2_id, p3_id, p4_id);

  -- أحمد: اقتراحات
  INSERT INTO partner_ideas (partner_id, text, implemented)
  VALUES
    (p1_id, 'إضافة نوع سؤال "ترتيب حسب الأولوية" يسمح للمستخدم بترتيب الخيارات حسب الأهمية', true),
    (p1_id, 'دعم استيراد الأسئلة من Excel لتسريع إنشاء النماذج الكبيرة', false);

  -- سارة: اقتراحات
  INSERT INTO partner_ideas (partner_id, text, implemented)
  VALUES
    (p2_id, 'إضافة قسم "المنتجات" داخل النموذج مع إمكانية عرض السلة وإجمالي الطلب', true),
    (p2_id, 'خاصية "العلامة المائية" على النماذج المدفوعة لحماية المحتوى', false);

  -- خالد: اقتراحات
  INSERT INTO partner_ideas (partner_id, text, implemented)
  VALUES
    (p3_id, 'إضافة اختبارات تفاعلية مع تصحيح تلقائي وعرض النتيجة فور الانتهاء', true),
    (p3_id, 'مكتبة قوالب جاهزة للاختبارات التعليمية مع إمكانية تخصيصها', false);

  -- نورة: اقتراحات
  INSERT INTO partner_ideas (partner_id, text, implemented)
  VALUES
    (p3_id, 'إضافة نظام حجز مواعيد متكامل مع التقويم وإشعارات التذكير', true),
    (p4_id, 'دعم العملات المتعددة في قسم المنتجات لعرض الأسعار بالدولار والريال', false);

  -- ========================================
  -- 4. Clear old likes and reinsert
  -- ========================================
  DELETE FROM partner_likes WHERE partner_id IN (p1_id, p2_id, p3_id, p4_id);

  INSERT INTO partner_likes (partner_id, user_id) VALUES
    (p1_id, p2_id), (p1_id, p3_id), (p1_id, p4_id),
    (p2_id, p1_id), (p2_id, p4_id),
    (p3_id, p1_id),
    (p4_id, p1_id), (p4_id, p2_id), (p4_id, p3_id);

  RAISE NOTICE '✅ Seed data inserted successfully!';
  RAISE NOTICE 'Partners: أحمد, سارة, خالد, نورة';
  RAISE NOTICE 'Total ideas: 7';
  RAISE NOTICE 'Total likes: 9';

END $$;
