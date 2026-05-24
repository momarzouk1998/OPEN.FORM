-- Professional Form Templates (21 templates, 3 per business category)
-- All question IDs (tb_q_*) and option IDs (tb_o_*) are globally unique across all templates
-- Covers all 27 question types including appointment, countdown_timer, products_block, payment_info_block, etc.

-- 1. Create form_templates table
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

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_form_templates_category ON form_templates(category);
CREATE INDEX IF NOT EXISTS idx_form_templates_featured ON form_templates(is_featured) WHERE is_featured = true;

-- 3. RLS
ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view templates" ON form_templates;
CREATE POLICY "Anyone can view templates" ON form_templates
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Admins can manage templates" ON form_templates;
CREATE POLICY "Admins can manage templates" ON form_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 4. Seed 21 professional templates
INSERT INTO form_templates (id, name, description, category, questions_data, form_settings, is_featured, sort_order) VALUES

-- ====================================================================
-- Category 1: education_centers (مراكز تعليم)
-- ====================================================================

-- Template 1: التسجيل في معسكر البرمجة المكثف
(
  'a1000000-0000-0000-0000-000000000001',
  'التسجيل في معسكر البرمجة المكثف',
  'نموذج تسجيل شامل للمعسكرات البرمجية المكثفة في مراكز التعليم التقني',
  'education_centers',
  '[
    {"id":"tb_q_1","text":"الاسم الكامل","type":"text","required":true,"points":0,"options":[],"order_index":0,"page":1},
    {"id":"tb_q_2","text":"البريد الإلكتروني","type":"email_confirm","required":true,"points":0,"options":[],"order_index":1,"page":1},
    {"id":"tb_q_3","text":"رقم الهاتف","type":"text","required":true,"points":0,"options":[],"order_index":2,"page":1,"row_group":"row1"},
    {"id":"tb_q_4","text":"تاريخ الميلاد","type":"date","required":true,"points":0,"options":[],"order_index":3,"page":1,"row_group":"row1"},
    {"id":"tb_q_5","text":"المسار البرمجي المطلوب","type":"dropdown","required":true,"points":0,"options":[{"id":"tb_o_1","text":"تطوير واجهات أمامية (Frontend)","points":0},{"id":"tb_o_2","text":"تطوير واجهات خلفية (Backend)","points":0},{"id":"tb_o_3","text":"تطوير تطبيقات جوال","points":0},{"id":"tb_o_4","text":"علم البيانات والذكاء الاصطناعي","points":0},{"id":"tb_o_5","text":"الأمن السيبراني","points":0}],"order_index":4,"page":1,"dropdown_type":"single"},
    {"id":"tb_q_6","text":"المستوى الحالي","type":"single_choice","required":true,"points":0,"options":[{"id":"tb_o_6","text":"مبتدئ (لا توجد خبرة)","points":0},{"id":"tb_o_7","text":"متوسط (أساسيات البرمجة)","points":0},{"id":"tb_o_8","text":"متقدم (لديه مشاريع سابقة)","points":0}],"order_index":5,"page":1},
    {"id":"tb_q_7","text":"نرحب بك في معسكر البرمجة!","type":"divider","required":false,"points":0,"options":[],"order_index":6,"page":1},
    {"id":"tb_q_8","text":"هل لديك خبرة سابقة في البرمجة؟","type":"single_choice","required":true,"points":0,"options":[{"id":"tb_o_9","text":"نعم","points":0},{"id":"tb_o_10","text":"لا","points":0}],"order_index":7,"page":2},
    {"id":"tb_q_9","text":"صف خبرتك البرمجية السابقة بالتفصيل","type":"textarea","required":false,"points":0,"options":[{"id":"_vr_1","_visibility_rules":[{"question_id":"tb_q_8","operator":"equals","value":"نعم"}]}],"order_index":8,"page":2},
    {"id":"tb_q_10","text":"لغات البرمجة التي تجيدها","type":"multiple_choice","required":false,"points":0,"options":[{"id":"tb_o_11","text":"JavaScript / TypeScript","points":0},{"id":"tb_o_12","text":"Python","points":0},{"id":"tb_o_13","text":"Java / C#","points":0},{"id":"tb_o_14","text":"PHP","points":0},{"id":"tb_o_15","text":"Swift / Kotlin","points":0},{"id":"tb_o_16","text":"C / C++","points":0},{"id":"tb_o_17","text":"Rust / Go","points":0},{"id":"_vr_2","_visibility_rules":[{"question_id":"tb_q_8","operator":"equals","value":"نعم"}]}],"order_index":9,"page":2},
    {"id":"tb_q_11","text":"عدد الساعات الأسبوعية المتاحة للدراسة","type":"slider","required":true,"points":0,"options":[{"id":"tb_o_18","text":"5 ساعات","points":1},{"id":"tb_o_19","text":"10 ساعات","points":2},{"id":"tb_o_20","text":"15 ساعة","points":3},{"id":"tb_o_21","text":"20+ ساعة","points":4}],"order_index":10,"page":2},
    {"id":"tb_q_12","text":"باقات التسجيل المتاحة","type":"products_block","required":false,"points":0,"options":[],"order_index":11,"page":2},
    {"id":"tb_q_13","text":"معلومات الدفع","type":"payment_info_block","required":false,"points":0,"options":[],"order_index":12,"page":2},
    {"id":"tb_q_14","text":"أوافق على شروط وأحكام المعسكر البرمجي","type":"terms","required":true,"points":0,"options":[],"order_index":13,"page":2}
  ]'::jsonb,
  '{
    "allow_multiple":false,
    "randomize_questions":false,
    "time_limit":null,
    "_submit_button":{"text":"سجل الآن","color":"#8B5CF6","textColor":"#ffffff"},
    "_is_test":false,
    "_offer_countdown":null
  }'::jsonb,
  true, 1
),

-- Template 2: اختبار تحديد مستوى اللغة الإنجليزية
(
  'a1000000-0000-0000-0000-000000000002',
  'اختبار تحديد مستوى اللغة الإنجليزية',
  'نموذج اختبار تحديد مستوى للمتقدمين لدورات اللغة في معاهد اللغات',
  'education_centers',
  '[
    {"id":"tb_q_15","text":"الاسم الثلاثي","type":"text","required":true,"points":0,"options":[],"order_index":0,"page":1},
    {"id":"tb_q_16","text":"البريد الإلكتروني","type":"text","required":true,"points":0,"options":[],"order_index":1,"page":1,"row_group":"contact"},
    {"id":"tb_q_17","text":"رقم الجوال","type":"text","required":true,"points":0,"options":[],"order_index":2,"page":1,"row_group":"contact"},
    {"id":"tb_q_18","text":"<div style=\"background:#FEF3C7;padding:16px;border-radius:12px;border-right:4px solid #F59E0B;font-family:''Noto Sans Arabic'',sans-serif;\"><h2 style=\"color:#92400E;font-size:20px;margin:0 0 8px;\">📝 تعليمات الاختبار</h2><p style=\"color:#78350F;font-size:14px;line-height:1.8;\">يرجى قراءة كل سؤال بعناية قبل الإجابة.<br>مدة الاختبار <strong>60 دقيقة</strong>، وسيتم احتساب الدرجة تلقائياً.<br>لا يمكنك العودة إلى الأسئلة السابقة بعد إكمال الصفحة.</p></div>","type":"static_text","required":false,"points":0,"options":[],"order_index":3,"page":1},
    {"id":"tb_q_19","text":"شاهد فيديو التعريف بالاختبار","type":"youtube","required":false,"points":0,"options":[],"order_index":4,"page":1},
    {"id":"tb_q_20","text":"كم سنة درست اللغة الإنجليزية؟","type":"scale","required":true,"points":0,"options":[{"id":"tb_o_22","text":"1","points":1},{"id":"tb_o_23","text":"2","points":2},{"id":"tb_o_24","text":"3","points":3},{"id":"tb_o_25","text":"4","points":4},{"id":"tb_o_26","text":"5","points":5},{"id":"tb_o_27","text":"6","points":6},{"id":"tb_o_28","text":"7","points":7},{"id":"tb_o_29","text":"8","points":8},{"id":"tb_o_30","text":"9","points":9},{"id":"tb_o_31","text":"10+","points":10}],"order_index":5,"page":2},
    {"id":"tb_q_21","text":"قيم مهاراتك الحالية","type":"matrix","required":true,"points":0,"options":[{"id":"tb_o_32","text":"القراءة","points":0},{"id":"tb_o_33","text":"الكتابة","points":0},{"id":"tb_o_34","text":"الاستماع","points":0},{"id":"tb_o_35","text":"التحدث","points":0},{"id":"tb_o_36","text":"القواعد","points":0}],"order_index":6,"page":2},
    {"id":"tb_q_22","text":"صل الكلمة بمعناها (مثال)","type":"match_items","required":true,"points":0,"options":[{"id":"tb_o_37","text":"Beautiful","points":0},{"id":"tb_o_38","text":"Important","points":0},{"id":"tb_o_39","text":"Difficult","points":0},{"id":"tb_o_40","text":"Interesting","points":0}],"order_index":7,"page":2},
    {"id":"tb_q_23","text":"الهدف من تعلم اللغة","type":"single_choice","required":true,"points":0,"options":[{"id":"tb_o_41","text":"الدراسة في الخارج","points":0},{"id":"tb_o_42","text":"تطوير العمل","points":0},{"id":"tb_o_43","text":"السفر والسياحة","points":0},{"id":"tb_o_44","text":"الاستخدام الشخصي","points":0}],"order_index":8,"page":2},
    {"id":"tb_q_24","text":"الفترة المناسبة للدراسة","type":"single_choice","required":true,"points":0,"options":[{"id":"tb_o_45","text":"صباحية (9-12)","points":0},{"id":"tb_o_46","text":"مسائية (4-7)","points":0},{"id":"tb_o_47","text":"مسائية (7-10)","points":0},{"id":"tb_o_48","text":"عن بُعد (أونلاين)","points":0}],"order_index":9,"page":2},
    {"id":"tb_q_25","text":"هل لديك أي استفسارات؟","type":"textarea","required":false,"points":0,"options":[],"order_index":10,"page":2}
  ]'::jsonb,
  '{
    "allow_multiple":false,
    "randomize_questions":false,
    "time_limit":60,
    "_submit_button":{"text":"إرسال الاختبار","color":"#10B981","textColor":"#ffffff"},
    "_is_test":true,
    "_offer_countdown":null
  }'::jsonb,
  true, 2
),

-- Template 3: حجز حصة تجريبية مجانية
(
  'a1000000-0000-0000-0000-000000000003',
  'حجز حصة تجريبية مجانية',
  'نموذج حجز حصة تجريبية مجانية في مراكز التعليم والتدريب',
  'education_centers',
  '[
    {"id":"tb_q_26","text":"اسم الطالب","type":"text","required":true,"points":0,"options":[],"order_index":0,"page":1},
    {"id":"tb_q_27","text":"العمر","type":"text","required":true,"points":0,"options":[],"order_index":1,"page":1},
    {"id":"tb_q_28","text":"البريد الإلكتروني","type":"email_confirm","required":true,"points":0,"options":[],"order_index":2,"page":1},
    {"id":"tb_q_29","text":"رقم ولي الأمر (للتواصل)","type":"text","required":true,"points":0,"options":[],"order_index":3,"page":1},
    {"id":"tb_q_30","text":"المادة أو المجال المطلوب","type":"dropdown","required":true,"points":0,"options":[{"id":"tb_o_49","text":"البرمجة للأطفال","points":0},{"id":"tb_o_50","text":"الرياضيات المتقدمة","points":0},{"id":"tb_o_51","text":"العلوم والفيزياء","points":0},{"id":"tb_o_52","text":"اللغة الإنجليزية","points":0},{"id":"tb_o_53","text":"التصميم والإبداع","points":0}],"order_index":4,"page":1,"dropdown_type":"single"},
    {"id":"tb_q_31","text":"حدد موعداً للحصة التجريبية","type":"appointment","required":true,"points":0,"options":[],"order_index":5,"page":1},
    {"id":"tb_q_32","text":"هل سبق لك الدراسة في هذا المركز؟","type":"single_choice","required":true,"points":0,"options":[{"id":"tb_o_54","text":"نعم","points":0},{"id":"tb_o_55","text":"لا","points":0}],"order_index":6,"page":2},
    {"id":"tb_q_33","text":"إذا سبق لك الدراسة، قيم تجربتك السابقة","type":"star_rating","required":false,"points":0,"options":[{"id":"_vr_3","_visibility_rules":[{"question_id":"tb_q_32","operator":"equals","value":"نعم"}]}],"order_index":7,"page":2},
    {"id":"tb_q_34","text":"رتب المواضيع حسب الأهمية بالنسبة لك","type":"ranking","required":true,"points":0,"options":[{"id":"tb_o_56","text":"جودة التدريس","points":0},{"id":"tb_o_57","text":"المرونة في المواعيد","points":0},{"id":"tb_o_58","text":"السعر المناسب","points":0},{"id":"tb_o_59","text":"سمعة المركز","points":0}],"order_index":8,"page":2},
    {"id":"tb_q_35","text":"أي وقت يناسبك للحصة؟","type":"time","required":true,"points":0,"options":[],"order_index":9,"page":2,"row_group":"slot"},
    {"id":"tb_q_36","text":"أي يوم يناسبك؟","type":"single_choice","required":true,"points":0,"options":[{"id":"tb_o_60","text":"السبت","points":0},{"id":"tb_o_61","text":"الأحد","points":0},{"id":"tb_o_62","text":"الإثنين","points":0},{"id":"tb_o_63","text":"الثلاثاء","points":0},{"id":"tb_o_64","text":"الأربعاء","points":0}],"order_index":10,"page":2,"row_group":"slot"},
    {"id":"tb_q_37","text":"ملاحظات إضافية","type":"textarea","required":false,"points":0,"options":[],"order_index":11,"page":2}
  ]'::jsonb,
  '{
    "allow_multiple":true,
    "randomize_questions":false,
    "time_limit":null,
    "_submit_button":{"text":"تأكيد الحجز","color":"#3B82F6","textColor":"#ffffff"},
    "_is_test":false,
    "_offer_countdown":null
  }'::jsonb,
  true, 3
),

-- ====================================================================
-- Category 2: clinics (عيادات)
-- ====================================================================

-- Template 4: حجز موعد عيادة أسنان
(
  'a1000000-0000-0000-0000-000000000004',
  'حجز موعد عيادة أسنان',
  'نموذج حجز موعد لمرضى عيادات الأسنان مع تحديد نوع الخدمة',
  'clinics',
  '[
    {"id":"tb_q_38","text":"الاسم الكامل للمريض","type":"text","required":true,"points":0,"options":[],"order_index":0,"page":1},
    {"id":"tb_q_39","text":"رقم الهاتف","type":"text","required":true,"points":0,"options":[],"order_index":1,"page":1,"row_group":"pat"},
    {"id":"tb_q_40","text":"تاريخ الميلاد","type":"date","required":true,"points":0,"options":[],"order_index":2,"page":1,"row_group":"pat"},
    {"id":"tb_q_41","text":"هل سبق لك زيارة العيادة؟","type":"single_choice","required":true,"points":0,"options":[{"id":"tb_o_65","text":"مريض قديم","points":0},{"id":"tb_o_66","text":"مريض جديد","points":0}],"order_index":3,"page":1},
    {"id":"tb_q_42","text":"نوع الخدمة المطلوبة","type":"single_choice","required":true,"points":0,"options":[{"id":"tb_o_67","text":"كشف وتشخيص","points":0},{"id":"tb_o_68","text":"تنظيف أسنان","points":0},{"id":"tb_o_69","text":"حشو عصب","points":0},{"id":"tb_o_70","text":"تركيب أسنان / تجميل","points":0},{"id":"tb_o_71","text":"خلع وقلع","points":0},{"id":"tb_o_72","text":"تقويم أسنان","points":0}],"order_index":4,"page":1},
    {"id":"tb_q_43","text":"اختر الموعد المناسب","type":"appointment","required":true,"points":0,"options":[],"order_index":5,"page":1},
    {"id":"tb_q_44","text":"هل تعاني من أي ألم حالياً؟","type":"button_choice","required":true,"points":0,"options":[{"id":"tb_o_73","text":"ألم حاد مستمر","points":3},{"id":"tb_o_74","text":"ألم خفيف متقطع","points":2},{"id":"tb_o_75","text":"لا يوجد ألم","points":1}],"order_index":6,"page":2},
    {"id":"tb_q_45","text":"صفي الأعراض التي تعاني منها","type":"textarea","required":true,"points":0,"options":[],"order_index":7,"page":2},
    {"id":"tb_q_46","text":"هل تتناول أدوية مميعة للدم؟","type":"single_choice","required":true,"points":0,"options":[{"id":"tb_o_76","text":"نعم","points":0},{"id":"tb_o_77","text":"لا","points":0},{"id":"tb_o_78","text":"لا أعرف","points":0}],"order_index":8,"page":2},
    {"id":"tb_q_47","text":"هل لديك حساسية من أي أدوية؟","type":"single_choice","required":true,"points":0,"options":[{"id":"tb_o_79","text":"نعم","points":0},{"id":"tb_o_80","text":"لا","points":0}],"order_index":9,"page":2},
    {"id":"tb_q_48","text":"إذا نعم، اذكر نوع الحساسية","type":"textarea","required":false,"points":0,"options":[{"id":"_vr_4","_visibility_rules":[{"question_id":"tb_q_47","operator":"equals","value":"نعم"}]}],"order_index":10,"page":2},
    {"id":"tb_q_49","text":"باقة العناية بالأسنان","type":"products_block","required":false,"points":0,"options":[],"order_index":11,"page":2},
    {"id":"tb_q_50","text":"معلومات الدفع والتأمين","type":"payment_info_block","required":false,"points":0,"options":[],"order_index":12,"page":2}
  ]'::jsonb,
  '{
    "allow_multiple":true,
    "randomize_questions":false,
    "time_limit":null,
    "_submit_button":{"text":"تأكيد الحجز","color":"#EF4444","textColor":"#ffffff"},
    "_is_test":false,
    "_offer_countdown":null
  }'::jsonb,
  true, 4
),

-- Template 5: استشارة جلدية عن بعد
(
  'a1000000-0000-0000-0000-000000000005',
  'استشارة جلدية عن بُعد',
  'نموذج حجز استشارة جلدية مع إمكانية رفع صور المنطقة المصابة',
  'clinics',
  '[
    {"id":"tb_q_51","text":"الاسم الكامل","type":"text","required":true,"points":0,"options":[],"order_index":0,"page":1},
    {"id":"tb_q_52","text":"رقم الجوال للتواصل","type":"text","required":true,"points":0,"options":[],"order_index":1,"page":1},
    {"id":"tb_q_53","text":"البريد الإلكتروني (لإرسال التقرير)","type":"text","required":true,"points":0,"options":[],"order_index":2,"page":1},
    {"id":"tb_q_54","text":"الفئة العمرية","type":"single_choice","required":true,"points":0,"options":[{"id":"tb_o_81","text":"طفل (أقل من 12 سنة)","points":0},{"id":"tb_o_82","text":"مراهق (12-18)","points":0},{"id":"tb_o_83","text":"بالغ (18-60)","points":0},{"id":"tb_o_84","text":"كبير سن (أكثر من 60)","points":0}],"order_index":3,"page":1},
    {"id":"tb_q_55","text":"المنطقة المصابة في الجسم","type":"dropdown","required":true,"points":0,"options":[{"id":"tb_o_85","text":"الوجه","points":0},{"id":"tb_o_86","text":"فروة الرأس","points":0},{"id":"tb_o_87","text":"الرقبة","points":0},{"id":"tb_o_88","text":"الجذع (الصدر/البطن/الظهر)","points":0},{"id":"tb_o_89","text":"الأطراف العلوية","points":0},{"id":"tb_o_90","text":"الأطراف السفلية","points":0},{"id":"tb_o_91","text":"منطقة حساسة","points":0}],"order_index":4,"page":1,"dropdown_type":"single"},
    {"id":"tb_q_56","text":"متى بدأت المشكلة؟","type":"date","required":true,"points":0,"options":[],"order_index":5,"page":1},
    {"id":"tb_q_57","text":"شدة الحكة أو الألم (1-10)","type":"slider","required":true,"points":0,"options":[{"id":"tb_o_92","text":"خفيف","points":1},{"id":"tb_o_93","text":"متوسط","points":3},{"id":"tb_o_94","text":"شديد","points":5},{"id":"tb_o_95","text":"شديد جداً","points":10}],"order_index":6,"page":2},
    {"id":"tb_q_58","text":"ارفع صوراً للمنطقة المصابة","type":"file_upload","required":true,"points":0,"options":[],"order_index":7,"page":2},
    {"id":"tb_q_59","text":"هل جربت أي علاج سابق؟","type":"single_choice","required":true,"points":0,"options":[{"id":"tb_o_96","text":"نعم","points":0},{"id":"tb_o_97","text":"لا","points":0}],"order_index":8,"page":2},
    {"id":"tb_q_60","text":"اذكر العلاجات السابقة","type":"textarea","required":false,"points":0,"options":[{"id":"_vr_5","_visibility_rules":[{"question_id":"tb_q_59","operator":"equals","value":"نعم"}]}],"order_index":9,"page":2},
    {"id":"tb_q_61","text":"هل تعاني من أي أمراض جلدية مزمنة؟","type":"multiple_choice","required":false,"points":0,"options":[{"id":"tb_o_98","text":"إكزيما","points":0},{"id":"tb_o_99","text":"صدفية","points":0},{"id":"tb_o_100","text":"حساسية","points":0},{"id":"tb_o_101","text":"حب الشباب","points":0},{"id":"tb_o_102","text":"لا شيء مما ذكر","points":0}],"order_index":10,"page":2},
    {"id":"tb_q_62","text":"اختر موعد الاستشارة","type":"appointment","required":true,"points":0,"options":[],"order_index":11,"page":2}
  ]'::jsonb,
  '{
    "allow_multiple":true,
    "randomize_questions":false,
    "time_limit":null,
    "_submit_button":{"text":"طلب استشارة","color":"#F59E0B","textColor":"#ffffff"},
    "_is_test":false,
    "_offer_countdown":null
  }'::jsonb,
  true, 5
),

-- Template 6: الفحص الطبي الشامل
(
  'a1000000-0000-0000-0000-000000000006',
  'الفحص الطبي الشامل',
  'نموذج حجز الفحص الطبي الشامل للكشف المبكر عن الأمراض',
  'clinics',
  '[
    {"id":"tb_q_63","text":"الاسم الكامل","type":"text","required":true,"points":0,"options":[],"order_index":0,"page":1},
    {"id":"tb_q_64","text":"رقم الهوية الوطنية","type":"text","required":true,"points":0,"options":[],"order_index":1,"page":1},
    {"id":"tb_q_65","text":"رقم الهاتف","type":"text","required":true,"points":0,"options":[],"order_index":2,"page":1,"row_group":"info"},
    {"id":"tb_q_66","text":"تاريخ الميلاد","type":"date","required":true,"points":0,"options":[],"order_index":3,"page":1,"row_group":"info"},
    {"id":"tb_q_67","text":"الجنس","type":"single_choice","required":true,"points":0,"options":[{"id":"tb_o_103","text":"ذكر","points":0},{"id":"tb_o_104","text":"أنثى","points":0}],"order_index":4,"page":1},
    {"id":"tb_q_68","text":"نوع الفحص المطلوب","type":"dropdown","required":true,"points":0,"options":[{"id":"tb_o_105","text":"فحص شامل أساسي","points":0},{"id":"tb_o_106","text":"فحص شامل متقدم","points":0},{"id":"tb_o_107","text":"فحص القلب والشرايين","points":0},{"id":"tb_o_108","text":"فحص السكر والغدد","points":0},{"id":"tb_o_109","text":"فحص الأورام","points":0},{"id":"tb_o_110","text":"فحص وظائف الكبد والكلى","points":0}],"order_index":5,"page":1,"dropdown_type":"single"},
    {"id":"tb_q_69","text":"قسم خاص بالتاريخ المرضي","type":"divider","required":false,"points":0,"options":[],"order_index":6,"page":2},
    {"id":"tb_q_70","text":"هل لديك تاريخ مرضي عائلي؟","type":"multiple_choice","required":true,"points":0,"options":[{"id":"tb_o_111","text":"أمراض القلب","points":0},{"id":"tb_o_112","text":"السكري","points":0},{"id":"tb_o_113","text":"السرطان","points":0},{"id":"tb_o_114","text":"ارتفاع ضغط الدم","points":0},{"id":"tb_o_115","text":"لا يوجد تاريخ مرضي عائلي","points":0}],"order_index":7,"page":2},
    {"id":"tb_q_71","text":"هل تدخن؟","type":"single_choice","required":true,"points":0,"options":[{"id":"tb_o_116","text":"مدخن حالي","points":0},{"id":"tb_o_117","text":"مدخن سابق","points":0},{"id":"tb_o_118","text":"غير مدخن","points":0}],"order_index":8,"page":2},
    {"id":"tb_q_72","text":"مستوى النشاط البدني","type":"single_choice","required":true,"points":0,"options":[{"id":"tb_o_119","text":"مستقر (لا أمارس رياضة)","points":0},{"id":"tb_o_120","text":"خفيف (1-2 مرات أسبوعياً)","points":0},{"id":"tb_o_121","text":"معتدل (3-4 مرات أسبوعياً)","points":0},{"id":"tb_o_122","text":"عالي (يومياً)","points":0}],"order_index":9,"page":2},
    {"id":"tb_q_73","text":"الوزن (كجم)","type":"text","required":true,"points":0,"options":[],"order_index":10,"page":2,"row_group":"body"},
    {"id":"tb_q_74","text":"الطول (سم)","type":"text","required":true,"points":0,"options":[],"order_index":11,"page":2,"row_group":"body"},
    {"id":"tb_q_75","text":"اختر موعد الفحص","type":"appointment","required":true,"points":0,"options":[],"order_index":12,"page":2},
    {"id":"tb_q_76","text":"معلومات الدفع والتأمين الصحي","type":"payment_info_block","required":false,"points":0,"options":[],"order_index":13,"page":2}
  ]'::jsonb,
  '{
    "allow_multiple":true,
    "randomize_questions":false,
    "time_limit":null,
    "_submit_button":{"text":"تأكيد حجز الفحص","color":"#059669","textColor":"#ffffff"},
    "_is_test":false,
    "_offer_countdown":null
  }'::jsonb,
  true, 6
),

-- ====================================================================
-- Category 3: restaurants (مطاعم)
-- ====================================================================

-- Template 7: طلب ولائم ومناسبات (Catering)
(
  'a1000000-0000-0000-0000-000000000007',
  'طلب ولائم ومناسبات',
  'نموذج طلب خدمات الولائم للمناسبات الخاصة والشركات',
  'restaurants',
  '[
    {"id":"tb_q_77","text":"اسم الجهة أو الشخص","type":"text","required":true,"points":0,"options":[],"order_index":0,"page":1},
    {"id":"tb_q_78","text":"رقم الجوال للتواصل","type":"text","required":true,"points":0,"options":[],"order_index":1,"page":1,"row_group":"cont"},
    {"id":"tb_q_79","text":"البريد الإلكتروني","type":"text","required":false,"points":0,"options":[],"order_index":2,"page":1,"row_group":"cont"},
    {"id":"tb_q_80","text":"نوع المناسبة","type":"single_choice","required":true,"points":0,"options":[{"id":"tb_o_123","text":"زواج","points":0},{"id":"tb_o_124","text":"تخرج","points":0},{"id":"tb_o_125","text":"اجتماع عمل","points":0},{"id":"tb_o_126","text":"مؤتمر","points":0},{"id":"tb_o_127","text":"عشاء عائلي","points":0},{"id":"tb_o_128","text":"أخرى","points":0}],"order_index":3,"page":1},
    {"id":"tb_q_81","text":"تاريخ المناسبة","type":"date","required":true,"points":0,"options":[],"order_index":4,"page":1,"row_group":"date1"},
    {"id":"tb_q_82","text":"تاريخ التوصيل المطلوب","type":"date","required":true,"points":0,"options":[],"order_index":5,"page":1,"row_group":"date1"},
    {"id":"tb_q_83","text":"عدد الضيوف المتوقع","type":"dropdown","required":true,"points":0,"options":[{"id":"tb_o_129","text":"أقل من 50 شخص","points":0},{"id":"tb_o_130","text":"50-100 شخص","points":0},{"id":"tb_o_131","text":"100-200 شخص","points":0},{"id":"tb_o_132","text":"200-500 شخص","points":0},{"id":"tb_o_133","text":"أكثر من 500 شخص","points":0}],"order_index":6,"page":1,"dropdown_type":"single"},
    {"id":"tb_q_84","text":"اختر الباقات المتاحة","type":"products_block","required":true,"points":0,"options":[],"order_index":7,"page":2},
    {"id":"tb_q_85","text":"مدى السرعة المطلوبة","type":"button_choice","required":true,"points":0,"options":[{"id":"tb_o_134","text":"عادي","points":0},{"id":"tb_o_135","text":"مستعجل (خلال 24 ساعة)","points":0},{"id":"tb_o_136","text":"فوري (خلال 6 ساعات)","points":0}],"order_index":8,"page":2},
    {"id":"tb_q_86","text":"هل لديك أي متطلبات غذائية خاصة؟","type":"multiple_choice","required":false,"points":0,"options":[{"id":"tb_o_137","text":"وجبات نباتية","points":0},{"id":"tb_o_138","text":"خالية من الجلوتين","points":0},{"id":"tb_o_139","text":"أطباق خاصة للأطفال","points":0},{"id":"tb_o_140","text":"حلويات ومشروبات","points":0},{"id":"tb_o_141","text":"لا يوجد","points":0}],"order_index":9,"page":2},
    {"id":"tb_q_87","text":"تفاصيل إضافية عن الطلب","type":"textarea","required":false,"points":0,"options":[],"order_index":10,"page":2},
    {"id":"tb_q_88","text":"معلومات الدفع","type":"payment_info_block","required":false,"points":0,"options":[],"order_index":11,"page":2}
  ]'::jsonb,
  '{
    "allow_multiple":false,
    "randomize_questions":false,
    "time_limit":null,
    "_submit_button":{"text":"إرسال الطلب","color":"#F59E0B","textColor":"#ffffff"},
    "_is_test":false,
    "_offer_countdown":null
  }'::jsonb,
  true, 7
),

-- Template 8: تقييم قائمة الطعام
(
  'a1000000-0000-0000-0000-000000000008',
  'تقييم قائمة الطعام',
  'نموذج لجمع آراء العملاء حول أطباق القائمة لتحسين الجودة',
  'restaurants',
  '[
    {"id":"tb_q_89","text":"الفرع الذي زرته","type":"dropdown","required":true,"points":0,"options":[{"id":"tb_o_142","text":"الفرع الرئيسي","points":0},{"id":"tb_o_143","text":"فرع المول التجاري","points":0},{"id":"tb_o_144","text":"فرع الجامعة","points":0},{"id":"tb_o_145","text":"فرع الكورنيش","points":0}],"order_index":0,"page":1,"dropdown_type":"single"},
    {"id":"tb_q_90","text":"<div style=\"background:linear-gradient(135deg,#FFFBEB,#FEF3C7);padding:20px;border-radius:16px;font-family:''Noto Sans Arabic'',sans-serif;\"><h3 style=\"color:#B45309;font-size:18px;margin:0 0 10px;\">🌟 شكراً لاختيارك مطعمنا!</h3><p style=\"color:#92400E;font-size:14px;line-height:1.9;\">نحن نسعى دائماً <span style=\"color:#DC2626;font-weight:bold;\">لتقديم أفضل تجربة</span> لعملائنا.<br>ملاحظاتك تساعدنا على تحسين جودة أطباقنا وخدمتنا.<br>يستغرق التقييم <strong>دقيقتين فقط</strong> 🕐</p></div>","type":"static_text","required":false,"points":0,"options":[],"order_index":1,"page":1},
    {"id":"tb_q_91","text":"قيم الأطباق التالية حسب رضاك","type":"matrix","required":true,"points":0,"options":[{"id":"tb_o_146","text":"المقبلات","points":0},{"id":"tb_o_147","text":"الشوربات","points":0},{"id":"tb_o_148","text":"الوجبات الرئيسية","points":0},{"id":"tb_o_149","text":"المشروبات","points":0},{"id":"tb_o_150","text":"الحلويات","points":0}],"order_index":2,"page":1},
    {"id":"tb_q_92","text":"كم مرة تزور مطعمنا شهرياً؟","type":"single_choice","required":true,"points":0,"options":[{"id":"tb_o_151","text":"هذه أول مرة","points":0},{"id":"tb_o_152","text":"1-2 مرات","points":0},{"id":"tb_o_153","text":"3-5 مرات","points":0},{"id":"tb_o_154","text":"أكثر من 5 مرات","points":0}],"order_index":3,"page":1},
    {"id":"tb_q_93","text":"قيم جودة الطعام بشكل عام","type":"star_rating","required":true,"points":0,"options":[],"order_index":4,"page":2},
    {"id":"tb_q_94","text":"رتب العناصر حسب الأهمية عند اختيارك لمطعم","type":"ranking","required":true,"points":0,"options":[{"id":"tb_o_155","text":"جودة الطعام","points":0},{"id":"tb_o_156","text":"السعر المناسب","points":0},{"id":"tb_o_157","text":"سرعة الخدمة","points":0},{"id":"tb_o_158","text":"نظافة المكان","points":0},{"id":"tb_o_159","text":"موقع المطعم","points":0}],"order_index":5,"page":2},
    {"id":"tb_q_95","text":"ما مدى رضاك عن سرعة الخدمة؟ (1-10)","type":"scale","required":true,"points":0,"options":[{"id":"tb_o_160","text":"1","points":1},{"id":"tb_o_161","text":"2","points":2},{"id":"tb_o_162","text":"3","points":3},{"id":"tb_o_163","text":"4","points":4},{"id":"tb_o_164","text":"5","points":5},{"id":"tb_o_165","text":"6","points":6},{"id":"tb_o_166","text":"7","points":7},{"id":"tb_o_167","text":"8","points":8},{"id":"tb_o_168","text":"9","points":9},{"id":"tb_o_169","text":"10","points":10}],"order_index":6,"page":2},
    {"id":"tb_q_96","text":"ما هو الطبق المفضل لديك من قائمتنا؟","type":"text","required":false,"points":0,"options":[],"order_index":7,"page":2},
    {"id":"tb_q_97","text":"ما هو الطبق الذي ترغب في إضافته إلى القائمة؟","type":"textarea","required":false,"points":0,"options":[],"order_index":8,"page":2},
    {"id":"tb_q_98","text":"هل توافق على مشاركة تقييمك على وسائل التواصل؟","type":"single_choice","required":true,"points":0,"options":[{"id":"tb_o_170","text":"نعم","points":0},{"id":"tb_o_171","text":"لا","points":0}],"order_index":9,"page":2}
  ]'::jsonb,
  '{
    "allow_multiple":true,
    "randomize_questions":false,
    "time_limit":null,
    "_submit_button":{"text":"إرسال التقييم","color":"#EF4444","textColor":"#ffffff"},
    "_is_test":false,
    "_offer_countdown":null
  }'::jsonb,
  true, 8
),

-- Template 9: برنامج الولاء والمكافآت
(
  'a1000000-0000-0000-0000-000000000009',
  'التسجيل في برنامج الولاء',
  'نموذج تسجيل العملاء في برنامج الولاء والمكافآت للمطعم',
  'restaurants',
  '[
    {"id":"tb_q_99","text":"الاسم الكامل","type":"text","required":true,"points":0,"options":[],"order_index":0,"page":1},
    {"id":"tb_q_100","text":"البريد الإلكتروني","type":"email_confirm","required":true,"points":0,"options":[],"order_index":1,"page":1},
    {"id":"tb_q_101","text":"رقم الجوال","type":"text","required":true,"points":0,"options":[],"order_index":2,"page":1},
    {"id":"tb_q_102","text":"شاهد فيديو شرح البرنامج","type":"youtube","required":false,"points":0,"options":[],"order_index":3,"page":1},
    {"id":"tb_q_103","text":"تاريخ الميلاد (لإرسال عروض عيد الميلاد)","type":"date","required":false,"points":0,"options":[],"order_index":4,"page":1},
    {"id":"tb_q_104","text":"كيف عرفت عن مطعمنا؟","type":"single_choice","required":true,"points":0,"options":[{"id":"tb_o_172","text":"فيسبوك","points":0},{"id":"tb_o_173","text":"إنستغرام","points":0},{"id":"tb_o_174","text":"تيك توك","points":0},{"id":"tb_o_175","text":"توصية من صديق","points":0},{"id":"tb_o_176","text":"جوجل","points":0}],"order_index":5,"page":1},
    {"id":"tb_q_105","text":"الأقسام المفضلة لديك","type":"multiple_choice","required":false,"points":0,"options":[{"id":"tb_o_177","text":"الوجبات السريعة","points":0},{"id":"tb_o_178","text":"المشاوي","points":0},{"id":"tb_o_179","text":"المقبلات","points":0},{"id":"tb_o_180","text":"العصائر الطازجة","points":0},{"id":"tb_o_181","text":"الحلويات","points":0}],"order_index":6,"page":1},
    {"id":"tb_q_106","text":"وقت الزيارة المفضل","type":"time","required":false,"points":0,"options":[],"order_index":7,"page":2,"row_group":"time"},
    {"id":"tb_q_107","text":"أيام الزيارة المفضلة","type":"multiple_choice","required":false,"points":0,"options":[{"id":"tb_o_182","text":"السبت","points":0},{"id":"tb_o_183","text":"الأحد","points":0},{"id":"tb_o_184","text":"الإثنين","points":0},{"id":"tb_o_185","text":"الثلاثاء","points":0},{"id":"tb_o_186","text":"الأربعاء","points":0},{"id":"tb_o_187","text":"الخميس","points":0},{"id":"tb_o_188","text":"الجمعة","points":0}],"order_index":8,"page":2,"row_group":"time"},
    {"id":"tb_q_108","text":"أوافق على شروط وأحكام برنامج الولاء","type":"terms","required":true,"points":0,"options":[],"order_index":9,"page":2},
    {"id":"tb_q_109","text":"التوقيع الإلكتروني","type":"signature","required":false,"points":0,"options":[],"order_index":10,"page":2}
  ]'::jsonb,
  '{
    "allow_multiple":false,
    "randomize_questions":false,
    "time_limit":null,
    "_submit_button":{"text":"انضم للبرنامج","color":"#8B5CF6","textColor":"#ffffff"},
    "_is_test":false,
    "_offer_countdown":null
  }'::jsonb,
  true, 9
),

-- ====================================================================
-- Category 4: shipping (شحن)
-- ====================================================================

-- Template 10: طلب شحن دولي
(
  'a1000000-0000-0000-0000-000000000010',
  'طلب شحن دولي',
  'نموذج طلب شحن الطرود والبضائع إلى الخارج مع تفاصيل الشحن',
  'shipping',
  '[
    {"id":"tb_q_110","text":"الاسم الكامل (المرسل)","type":"text","required":true,"points":0,"options":[],"order_index":0,"page":1},
    {"id":"tb_q_111","text":"رقم الهاتف","type":"text","required":true,"points":0,"options":[],"order_index":1,"page":1,"row_group":"snd"},
    {"id":"tb_q_112","text":"البريد الإلكتروني","type":"text","required":true,"points":0,"options":[],"order_index":2,"page":1,"row_group":"snd"},
    {"id":"tb_q_113","text":"عنوان الاستلام بالكامل","type":"textarea","required":true,"points":0,"options":[],"order_index":3,"page":1},
    {"id":"tb_q_114","text":"وجهة الشحن (الدولة والمدينة)","type":"textarea","required":true,"points":0,"options":[],"order_index":4,"page":1},
    {"id":"tb_q_115","text":"نوع الشحنة","type":"single_choice","required":true,"points":0,"options":[{"id":"tb_o_189","text":"مستندات وأوراق","points":0},{"id":"tb_o_190","text":"طرود (أقل من 30 كجم)","points":0},{"id":"tb_o_191","text":"بضائع ثقيلة (أكثر من 30 كجم)","points":0},{"id":"tb_o_192","text":"شحنة تجارية","points":0}],"order_index":5,"page":1},
    {"id":"tb_q_116","text":"الوزن التقريبي (كجم)","type":"text","required":true,"points":0,"options":[],"order_index":6,"page":1,"row_group":"dims"},
    {"id":"tb_q_117","text":"الأبعاد التقريبية (طول×عرض×ارتفاع)","type":"text","required":true,"points":0,"options":[],"order_index":7,"page":1,"row_group":"dims"},
    {"id":"tb_q_118","text":"قيمة الشحنة (بالدولار)","type":"text","required":true,"points":0,"options":[],"order_index":8,"page":2},
    {"id":"tb_q_119","text":"طريقة الشحن المفضلة","type":"single_choice","required":true,"points":0,"options":[{"id":"tb_o_193","text":"شحن جوي (سريع - 3-5 أيام)","points":0},{"id":"tb_o_194","text":"شحن بحري (اقتصادي - 15-30 يوم)","points":0},{"id":"tb_o_195","text":"شحن بري (7-14 يوم)","points":0},{"id":"tb_o_196","text":"شحن فائق السرعة (1-2 يوم)","points":0}],"order_index":9,"page":2},
    {"id":"tb_q_120","text":"هل تريد تأمين على الشحنة؟","type":"button_choice","required":true,"points":0,"options":[{"id":"tb_o_197","text":"تأمين كامل","points":0},{"id":"tb_o_198","text":"تأمين جزئي","points":0},{"id":"tb_o_199","text":"بدون تأمين","points":0}],"order_index":10,"page":2},
    {"id":"tb_q_121","text":"معلومات الدفع والشحن","type":"payment_info_block","required":false,"points":0,"options":[],"order_index":11,"page":2},
    {"id":"tb_q_122","text":"ملاحظات إضافية","type":"textarea","required":false,"points":0,"options":[],"order_index":12,"page":2}
  ]'::jsonb,
  '{
    "allow_multiple":true,
    "randomize_questions":false,
    "time_limit":null,
    "_submit_button":{"text":"طلب شحن","color":"#2563EB","textColor":"#ffffff"},
    "_is_test":false,
    "_offer_countdown":null
  }'::jsonb,
  true, 10
),

-- Template 11: توصيل طلبات سريع (Same-Day Delivery)
(
  'a1000000-0000-0000-0000-000000000011',
  'توصيل طلبات - توصيل في نفس اليوم',
  'نموذج طلب توصيل سريع للطلبات في نفس اليوم مع عداد تنازلي للعروض',
  'shipping',
  '[
    {"id":"tb_q_123","text":"اسم المستلم","type":"text","required":true,"points":0,"options":[],"order_index":0,"page":1},
    {"id":"tb_q_124","text":"رقم هاتف المستلم","type":"text","required":true,"points":0,"options":[],"order_index":1,"page":1},
    {"id":"tb_q_125","text":"عنوان التوصيل","type":"textarea","required":true,"points":0,"options":[],"order_index":2,"page":1},
    {"id":"tb_q_126","text":"عنوان الاستلام (من أين نستلم الطلب)","type":"textarea","required":true,"points":0,"options":[],"order_index":3,"page":1},
    {"id":"tb_q_127","text":"تاريخ التوصيل","type":"date","required":true,"points":0,"options":[],"order_index":4,"page":1,"row_group":"del"},
    {"id":"tb_q_128","text":"وقت التوصيل المفضل","type":"time","required":false,"points":0,"options":[],"order_index":5,"page":1,"row_group":"del"},
    {"id":"tb_q_129","text":"عرض التوصيل المجاني - الوقت المتبقي","type":"countdown_timer","required":false,"points":0,"options":[],"order_index":6,"page":1},
    {"id":"tb_q_130","text":"نوع الطرد","type":"single_choice","required":true,"points":0,"options":[{"id":"tb_o_200","text":"طعام ومشروبات","points":0},{"id":"tb_o_201","text":"مستندات","points":0},{"id":"tb_o_202","text":"هدايا","points":0},{"id":"tb_o_203","text":"إلكترونيات","points":0},{"id":"tb_o_204","text":"أغراض شخصية","points":0}],"order_index":7,"page":2},
    {"id":"tb_q_131","text":"هل الطلب قابل للكسر؟","type":"single_choice","required":true,"points":0,"options":[{"id":"tb_o_205","text":"نعم، يحتاج عناية","points":0},{"id":"tb_o_206","text":"لا، عادي","points":0}],"order_index":8,"page":2},
    {"id":"tb_q_132","text":"حجم الطرد","type":"single_choice","required":true,"points":0,"options":[{"id":"tb_o_207","text":"صغير (حتى 2 كجم)","points":0},{"id":"tb_o_208","text":"متوسط (2-10 كجم)","points":0},{"id":"tb_o_209","text":"كبير (أكثر من 10 كجم)","points":0}],"order_index":9,"page":2},
    {"id":"tb_q_133","text":"تعليمات خاصة للمندوب","type":"textarea","required":false,"points":0,"options":[],"order_index":10,"page":2}
  ]'::jsonb,
  '{
    "allow_multiple":true,
    "randomize_questions":false,
    "time_limit":null,
    "_submit_button":{"text":"طلب توصيل","color":"#10B981","textColor":"#ffffff"},
    "_is_test":false,
    "_offer_countdown":"2026-06-01T23:59:59Z"
  }'::jsonb,
  true, 11
),

-- Template 12: فتح حساب شحن تجاري
(
  'a1000000-0000-0000-0000-000000000012',
  'فتح حساب شحن تجاري',
  'نموذج تسجيل الشركات لفتح حساب شحن تجاري مع شركة الشحن',
  'shipping',
  '[
    {"id":"tb_q_134","text":"اسم الشركة","type":"text","required":true,"points":0,"options":[],"order_index":0,"page":1},
    {"id":"tb_q_135","text":"السجل التجاري","type":"text","required":true,"points":0,"options":[],"order_index":1,"page":1,"row_group":"docs"},
    {"id":"tb_q_136","text":"الرقم الضريبي","type":"text","required":false,"points":0,"options":[],"order_index":2,"page":1,"row_group":"docs"},
    {"id":"tb_q_137","text":"اسم المسؤول","type":"text","required":true,"points":0,"options":[],"order_index":3,"page":1},
    {"id":"tb_q_138","text":"رقم جوال المسؤول","type":"text","required":true,"points":0,"options":[],"order_index":4,"page":1,"row_group":"adm"},
    {"id":"tb_q_139","text":"بريد المسؤول الإلكتروني","type":"text","required":true,"points":0,"options":[],"order_index":5,"page":1,"row_group":"adm"},
    {"id":"tb_q_140","text":"عنوان المستودع الرئيسي","type":"textarea","required":true,"points":0,"options":[],"order_index":6,"page":1},
    {"id":"tb_q_141","text":"متوسط عدد الشحنات الشهرية","type":"dropdown","required":true,"points":0,"options":[{"id":"tb_o_210","text":"أقل من 100 شحنة","points":0},{"id":"tb_o_211","text":"100-500 شحنة","points":0},{"id":"tb_o_212","text":"500-1000 شحنة","points":0},{"id":"tb_o_213","text":"أكثر من 1000 شحنة","points":0}],"order_index":7,"page":2,"dropdown_type":"single"},
    {"id":"tb_q_142","text":"الخدمات المطلوبة","type":"multiple_choice","required":true,"points":0,"options":[{"id":"tb_o_214","text":"شحن محلي","points":0},{"id":"tb_o_215","text":"شحن دولي","points":0},{"id":"tb_o_216","text":"تخليص جمركي","points":0},{"id":"tb_o_217","text":"تخزين","points":0},{"id":"tb_o_218","text":"شحن بضائع خطرة","points":0}],"order_index":8,"page":2},
    {"id":"tb_q_143","text":"<div style=\"background:#F8FAFC;padding:18px;border-radius:12px;border:1px solid #E2E8F0;font-family:''Noto Sans Arabic'',sans-serif;\"><h4 style=\"color:#1E40AF;font-size:16px;margin:0 0 10px;\">📋 شروط وأحكام الحساب التجاري</h4><ul style=\"color:#334155;font-size:13px;line-height:2;margin:0;padding-right:20px;\"><li>الحد الأدنى للشحنات التجارية هو <strong>50 شحنة شهرياً</strong></li><li>يتم إصدار فاتورة ضريبية في بداية كل شهر</li><li>فترة السداد: <strong>30 يوماً</strong> من تاريخ الفاتورة</li><li>نسبة التأمين الإلزامي: 2% من قيمة الشحنة</li><li>يمكن إلغاء الحساب بإشعار خطي قبل 30 يوماً</li></ul></div>","type":"static_text","required":false,"points":0,"options":[],"order_index":9,"page":2},
    {"id":"tb_q_144","text":"أوافق على شروط وأحكام الحساب التجاري","type":"terms","required":true,"points":0,"options":[],"order_index":10,"page":2},
    {"id":"tb_q_145","text":"التوقيع الإلكتروني للمسؤول","type":"signature","required":true,"points":0,"options":[],"order_index":11,"page":2}
  ]'::jsonb,
  '{
    "allow_multiple":false,
    "randomize_questions":false,
    "time_limit":null,
    "_submit_button":{"text":"فتح الحساب","color":"#1D4ED8","textColor":"#ffffff"},
    "_is_test":false,
    "_offer_countdown":null
  }'::jsonb,
  true, 12
),

-- ====================================================================
-- Category 5: real_estate (عقارات)
-- ====================================================================

-- Template 13: طلب معاينة عقار
(
  'a1000000-0000-0000-0000-000000000013',
  'طلب معاينة عقار',
  'نموذج حجز موعد لمعاينة العقارات السكنية والتجارية',
  'real_estate',
  '[
    {"id":"tb_q_146","text":"الاسم الكامل","type":"text","required":true,"points":0,"options":[],"order_index":0,"page":1},
    {"id":"tb_q_147","text":"رقم الهاتف","type":"text","required":true,"points":0,"options":[],"order_index":1,"page":1,"row_group":"ct"},
    {"id":"tb_q_148","text":"البريد الإلكتروني","type":"text","required":true,"points":0,"options":[],"order_index":2,"page":1,"row_group":"ct"},
    {"id":"tb_q_149","text":"نوع العقار المطلوب","type":"dropdown","required":true,"points":0,"options":[{"id":"tb_o_219","text":"شقة سكنية","points":0},{"id":"tb_o_220","text":"فيلا","points":0},{"id":"tb_o_221","text":"مكتب تجاري","points":0},{"id":"tb_o_222","text":"محل تجاري","points":0},{"id":"tb_o_223","text":"أرض","points":0},{"id":"tb_o_224","text":"مستودع","points":0}],"order_index":3,"page":1,"dropdown_type":"single"},
    {"id":"tb_q_150","text":"المدينة والحي المطلوب","type":"text","required":true,"points":0,"options":[],"order_index":4,"page":1},
    {"id":"tb_q_151","text":"الميزانية التقريبية","type":"text","required":true,"points":0,"options":[],"order_index":5,"page":1},
    {"id":"tb_q_152","text":"صورة توضيحية للعقار المطلوب (إن وجد)","type":"static_image","required":false,"points":0,"options":[],"order_index":6,"page":1},
    {"id":"tb_q_153","text":"حدد نطاق التواريخ المناسبة للمعاينة","type":"date_range","required":true,"points":0,"options":[],"order_index":7,"page":2},
    {"id":"tb_q_154","text":"احجز موعد المعاينة","type":"appointment","required":true,"points":0,"options":[],"order_index":8,"page":2},
    {"id":"tb_q_155","text":"هل لديك وسيلة نقل خاصة؟","type":"single_choice","required":false,"points":0,"options":[{"id":"tb_o_225","text":"نعم","points":0},{"id":"tb_o_226","text":"لا، أحتاج توصيلة","points":0}],"order_index":9,"page":2},
    {"id":"tb_q_156","text":"ملاحظات إضافية للعقار المطلوب","type":"textarea","required":false,"points":0,"options":[],"order_index":10,"page":2}
  ]'::jsonb,
  '{
    "allow_multiple":true,
    "randomize_questions":false,
    "time_limit":null,
    "_submit_button":{"text":"حجز معاينة","color":"#059669","textColor":"#ffffff"},
    "_is_test":false,
    "_offer_countdown":null
  }'::jsonb,
  true, 13
),

-- Template 14: تقييم عقار للبيع
(
  'a1000000-0000-0000-0000-000000000014',
  'تقييم عقار للبيع',
  'نموذج لتقييم العقارات المعروضة للبيع من قبل الملاك والوسطاء العقاريين',
  'real_estate',
  '[
    {"id":"tb_q_157","text":"الاسم الكامل للمالك","type":"text","required":true,"points":0,"options":[],"order_index":0,"page":1},
    {"id":"tb_q_158","text":"رقم الهاتف","type":"text","required":true,"points":0,"options":[],"order_index":1,"page":1,"row_group":"ct2"},
    {"id":"tb_q_159","text":"البريد الإلكتروني","type":"text","required":true,"points":0,"options":[],"order_index":2,"page":1,"row_group":"ct2"},
    {"id":"tb_q_160","text":"عنوان العقار الكامل","type":"textarea","required":true,"points":0,"options":[],"order_index":3,"page":1},
    {"id":"tb_q_161","text":"نوع العقار","type":"single_choice","required":true,"points":0,"options":[{"id":"tb_o_227","text":"شقة","points":0},{"id":"tb_o_228","text":"فيلا","points":0},{"id":"tb_o_229","text":"قطعة أرض","points":0},{"id":"tb_o_230","text":"مبنى تجاري","points":0}],"order_index":4,"page":1},
    {"id":"tb_q_162","text":"المساحة (متر مربع)","type":"text","required":true,"points":0,"options":[],"order_index":5,"page":1,"row_group":"size"},
    {"id":"tb_q_163","text":"عدد الغرف","type":"text","required":true,"points":0,"options":[],"order_index":6,"page":1,"row_group":"size"},
    {"id":"tb_q_164","text":"صل كل ميزة بفئتها","type":"match_items","required":false,"points":0,"options":[{"id":"tb_o_231","text":"مكيف مركزي","points":0},{"id":"tb_o_232","text":"مطبخ راكب","points":0},{"id":"tb_o_233","text":"مسبح","points":0},{"id":"tb_o_234","text":"موقف خاص","points":0}],"order_index":7,"page":2},
    {"id":"tb_q_165","text":"قيم حالة العقار في المجالات التالية","type":"matrix","required":true,"points":0,"options":[{"id":"tb_o_235","text":"السباكة","points":0},{"id":"tb_o_236","text":"الكهرباء","points":0},{"id":"tb_o_237","text":"الأرضيات","points":0},{"id":"tb_o_238","text":"الدهانات","points":0},{"id":"tb_o_239","text":"النوافذ","points":0}],"order_index":8,"page":2},
    {"id":"tb_q_166","text":"ارفع صوراً للعقار","type":"file_upload","required":true,"points":0,"options":[],"order_index":9,"page":2},
    {"id":"tb_q_167","text":"السعر المطلوب","type":"text","required":true,"points":0,"options":[],"order_index":10,"page":2},
    {"id":"tb_q_168","text":"وصف العقار","type":"textarea","required":true,"points":0,"options":[],"order_index":11,"page":2}
  ]'::jsonb,
  '{
    "allow_multiple":true,
    "randomize_questions":false,
    "time_limit":null,
    "_submit_button":{"text":"إرسال التقييم","color":"#D97706","textColor":"#ffffff"},
    "_is_test":false,
    "_offer_countdown":null
  }'::jsonb,
  true, 14
),

-- Template 15: استفسار عن وحدات سكنية
(
  'a1000000-0000-0000-0000-000000000015',
  'استفسار عن وحدات سكنية',
  'نموذج استفسار عن الوحدات السكنية المتاحة للبيع أو الإيجار',
  'real_estate',
  '[
    {"id":"tb_q_169","text":"الاسم","type":"text","required":true,"points":0,"options":[],"order_index":0,"page":1},
    {"id":"tb_q_170","text":"رقم الجوال","type":"text","required":true,"points":0,"options":[],"order_index":1,"page":1},
    {"id":"tb_q_171","text":"نوع الطلب","type":"single_choice","required":true,"points":0,"options":[{"id":"tb_o_240","text":"شراء","points":0},{"id":"tb_o_241","text":"إيجار","points":0},{"id":"tb_o_242","text":"استثمار","points":0}],"order_index":2,"page":1},
    {"id":"tb_q_172","text":"فصل: معلومات الوحدة المطلوبة","type":"divider","required":false,"points":0,"options":[],"order_index":3,"page":1},
    {"id":"tb_q_173","text":"نوع الوحدة","type":"dropdown","required":true,"points":0,"options":[{"id":"tb_o_243","text":"شقة","points":0},{"id":"tb_o_244","text":"دوبلكس","points":0},{"id":"tb_o_245","text":"فيلا","points":0},{"id":"tb_o_246","text":"بنتهاوس","points":0},{"id":"tb_o_247","text":"استوديو","points":0}],"order_index":4,"page":1,"dropdown_type":"single"},
    {"id":"tb_q_174","text":"المدينة","type":"single_choice","required":true,"points":0,"options":[{"id":"tb_o_248","text":"الرياض","points":0},{"id":"tb_o_249","text":"جدة","points":0},{"id":"tb_o_250","text":"الدمام","points":0},{"id":"tb_o_251","text":"مكة المكرمة","points":0},{"id":"tb_o_252","text":"المدينة المنورة","points":0}],"order_index":5,"page":1},
    {"id":"tb_q_175","text":"عدد غرف النوم","type":"dropdown","required":true,"points":0,"options":[{"id":"tb_o_253","text":"غرفة واحدة","points":0},{"id":"tb_o_254","text":"غرفتان","points":0},{"id":"tb_o_255","text":"3 غرف","points":0},{"id":"tb_o_256","text":"4 غرف","points":0},{"id":"tb_o_257","text":"5 غرف فأكثر","points":0}],"order_index":6,"page":2,"dropdown_type":"single"},
    {"id":"tb_q_176","text":"الميزانية العليا","type":"text","required":true,"points":0,"options":[],"order_index":7,"page":2,"row_group":"bud"},
    {"id":"tb_q_177","text":"الميزانية الدنيا","type":"text","required":true,"points":0,"options":[],"order_index":8,"page":2,"row_group":"bud"},
    {"id":"tb_q_178","text":"الإضافات المطلوبة","type":"multiple_choice","required":false,"points":0,"options":[{"id":"tb_o_258","text":"مطبخ مجهز","points":0},{"id":"tb_o_259","text":"مكيفات","points":0},{"id":"tb_o_260","text":"موقف سيارة","points":0},{"id":"tb_o_261","text":"مصعد","points":0},{"id":"tb_o_262","text":"غرفة خادمة","points":0}],"order_index":9,"page":2},
    {"id":"tb_q_179","text":"تفاصيل إضافية عن احتياجاتك","type":"textarea","required":false,"points":0,"options":[],"order_index":10,"page":2}
  ]'::jsonb,
  '{
    "allow_multiple":true,
    "randomize_questions":false,
    "time_limit":null,
    "_submit_button":{"text":"إرسال الاستفسار","color":"#7C3AED","textColor":"#ffffff"},
    "_is_test":false,
    "_offer_countdown":null
  }'::jsonb,
  true, 15
),

-- ====================================================================
-- Category 6: schools (مدارس)
-- ====================================================================

-- Template 16: تسجيل طالب جديد في المدرسة
(
  'a1000000-0000-0000-0000-000000000016',
  'تسجيل طالب جديد في المدرسة',
  'نموذج تسجيل شامل للطلاب الجدد في المدارس الخاصة والدولية',
  'schools',
  '[
    {"id":"tb_q_180","text":"الاسم الرباعي للطالب","type":"text","required":true,"points":0,"options":[],"order_index":0,"page":1},
    {"id":"tb_q_181","text":"تاريخ ميلاد الطالب","type":"date","required":true,"points":0,"options":[],"order_index":1,"page":1},
    {"id":"tb_q_182","text":"الجنس","type":"single_choice","required":true,"points":0,"options":[{"id":"tb_o_263","text":"ذكر","points":0},{"id":"tb_o_264","text":"أنثى","points":0}],"order_index":2,"page":1},
    {"id":"tb_q_183","text":"المرحلة الدراسية المطلوبة","type":"dropdown","required":true,"points":0,"options":[{"id":"tb_o_265","text":"تمهيدي (KG1)","points":0},{"id":"tb_o_266","text":"تمهيدي (KG2)","points":0},{"id":"tb_o_267","text":"الصف الأول الابتدائي","points":0},{"id":"tb_o_268","text":"الصف الثاني الابتدائي","points":0},{"id":"tb_o_269","text":"الصف الثالث الابتدائي","points":0},{"id":"tb_o_270","text":"الصف الرابع الابتدائي","points":0},{"id":"tb_o_271","text":"الصف الخامس الابتدائي","points":0},{"id":"tb_o_272","text":"الصف السادس الابتدائي","points":0}],"order_index":3,"page":1,"dropdown_type":"single"},
    {"id":"tb_q_184","text":"اسم ولي الأمر","type":"text","required":true,"points":0,"options":[],"order_index":4,"page":1,"row_group":"parent"},
    {"id":"tb_q_185","text":"رقم هاتف ولي الأمر","type":"text","required":true,"points":0,"options":[],"order_index":5,"page":1,"row_group":"parent"},
    {"id":"tb_q_186","text":"بريد ولي الأمر الإلكتروني","type":"text","required":true,"points":0,"options":[],"order_index":6,"page":1},
    {"id":"tb_q_187","text":"العنوان","type":"textarea","required":true,"points":0,"options":[],"order_index":7,"page":1},
    {"id":"tb_q_188","text":"هل يعاني الطالب من أي حالة صحية؟","type":"single_choice","required":true,"points":0,"options":[{"id":"tb_o_273","text":"نعم","points":0},{"id":"tb_o_274","text":"لا","points":0}],"order_index":8,"page":2},
    {"id":"tb_q_189","text":"إذا نعم، اذكر التفاصيل","type":"textarea","required":false,"points":0,"options":[{"id":"_vr_6","_visibility_rules":[{"question_id":"tb_q_188","operator":"equals","value":"نعم"}]}],"order_index":9,"page":2},
    {"id":"tb_q_190","text":"النشاطات المنهجية المفضلة للطالب","type":"multiple_choice","required":false,"points":0,"options":[{"id":"tb_o_275","text":"الرياضة","points":0},{"id":"tb_o_276","text":"الفنون","points":0},{"id":"tb_o_277","text":"الموسيقى","points":0},{"id":"tb_o_278","text":"الروبوت والتقنية","points":0},{"id":"tb_o_279","text":"القراءة","points":0}],"order_index":10,"page":2},
    {"id":"tb_q_191","text":"الزمن المتبقي للتسجيل المبكر","type":"countdown_timer","required":false,"points":0,"options":[],"order_index":11,"page":2},
    {"id":"tb_q_192","text":"رسوم التسجيل والدفع","type":"payment_info_block","required":false,"points":0,"options":[],"order_index":12,"page":2}
  ]'::jsonb,
  '{
    "allow_multiple":false,
    "randomize_questions":false,
    "time_limit":null,
    "_submit_button":{"text":"تسجيل الطالب","color":"#2563EB","textColor":"#ffffff"},
    "_is_test":false,
    "_offer_countdown":"2026-08-01T23:59:59Z"
  }'::jsonb,
  true, 16
),

-- Template 17: طلب مقابلة أولياء الأمور مع المعلمين
(
  'a1000000-0000-0000-0000-000000000017',
  'طلب مقابلة أولياء الأمور',
  'نموذج حجز موعد لمقابلة أولياء الأمور مع إدارة المدرسة أو المعلمين',
  'schools',
  '[
    {"id":"tb_q_193","text":"اسم ولي الأمر","type":"text","required":true,"points":0,"options":[],"order_index":0,"page":1},
    {"id":"tb_q_194","text":"اسم الطالب","type":"text","required":true,"points":0,"options":[],"order_index":1,"page":1,"row_group":"stu"},
    {"id":"tb_q_195","text":"صف الطالب","type":"dropdown","required":true,"points":0,"options":[{"id":"tb_o_280","text":"الصف الأول","points":0},{"id":"tb_o_281","text":"الصف الثاني","points":0},{"id":"tb_o_282","text":"الصف الثالث","points":0},{"id":"tb_o_283","text":"الصف الرابع","points":0},{"id":"tb_o_284","text":"الصف الخامس","points":0},{"id":"tb_o_285","text":"الصف السادس","points":0}],"order_index":2,"page":1,"row_group":"stu","dropdown_type":"single"},
    {"id":"tb_q_196","text":"رقم هاتف ولي الأمر","type":"text","required":true,"points":0,"options":[],"order_index":3,"page":1},
    {"id":"tb_q_197","text":"سبب طلب المقابلة","type":"single_choice","required":true,"points":0,"options":[{"id":"tb_o_286","text":"متابعة تحصيل الطالب","points":0},{"id":"tb_o_287","text":"مشكلة سلوكية","points":0},{"id":"tb_o_288","text":"استفسار عن المنهج","points":0},{"id":"tb_o_289","text":"طلب تحسين مستوى","points":0},{"id":"tb_o_290","text":"أخرى","points":0}],"order_index":4,"page":1},
    {"id":"tb_q_198","text":"المعلم المطلوب مقابلته","type":"single_choice","required":true,"points":0,"options":[{"id":"tb_o_291","text":"معلم الرياضيات","points":0},{"id":"tb_o_292","text":"معلم العلوم","points":0},{"id":"tb_o_293","text":"معلم اللغة العربية","points":0},{"id":"tb_o_294","text":"معلم اللغة الإنجليزية","points":0},{"id":"tb_o_295","text":"مرشد الطلاب","points":0},{"id":"tb_o_296","text":"مدير المدرسة","points":0}],"order_index":5,"page":1},
    {"id":"tb_q_199","text":"احجز موعد المقابلة","type":"appointment","required":true,"points":0,"options":[],"order_index":6,"page":2},
    {"id":"tb_q_200","text":"تفاصيل إضافية عن سبب المقابلة","type":"textarea","required":false,"points":0,"options":[],"order_index":7,"page":2}
  ]'::jsonb,
  '{
    "allow_multiple":true,
    "randomize_questions":false,
    "time_limit":null,
    "_submit_button":{"text":"طلب مقابلة","color":"#0891B2","textColor":"#ffffff"},
    "_is_test":false,
    "_offer_countdown":null
  }'::jsonb,
  true, 17
),

-- Template 18: استبيان رضا أولياء الأمور
(
  'a1000000-0000-0000-0000-000000000018',
  'استبيان رضا أولياء الأمور',
  'نموذج قياس رضا أولياء الأمور عن الأداء التعليمي والإداري للمدرسة',
  'schools',
  '[
    {"id":"tb_q_201","text":"اسم ولي الأمر (اختياري)","type":"text","required":false,"points":0,"options":[],"order_index":0,"page":1},
    {"id":"tb_q_202","text":"عدد الطلاب المسجلين لدينا","type":"dropdown","required":true,"points":0,"options":[{"id":"tb_o_297","text":"طالب واحد","points":0},{"id":"tb_o_298","text":"طالبان","points":0},{"id":"tb_o_299","text":"3 طلاب فأكثر","points":0}],"order_index":1,"page":1,"dropdown_type":"single"},
    {"id":"tb_q_203","text":"قسم: تقييم الأداء العام","type":"divider","required":false,"points":0,"options":[],"order_index":2,"page":1},
    {"id":"tb_q_204","text":"المستوى التحصيلي للطالب","type":"star_rating","required":true,"points":0,"options":[],"order_index":3,"page":1},
    {"id":"tb_q_205","text":"جودة التواصل مع إدارة المدرسة (1-10)","type":"scale","required":true,"points":0,"options":[{"id":"tb_o_300","text":"1","points":1},{"id":"tb_o_301","text":"2","points":2},{"id":"tb_o_302","text":"3","points":3},{"id":"tb_o_303","text":"4","points":4},{"id":"tb_o_304","text":"5","points":5},{"id":"tb_o_305","text":"6","points":6},{"id":"tb_o_306","text":"7","points":7},{"id":"tb_o_307","text":"8","points":8},{"id":"tb_o_308","text":"9","points":9},{"id":"tb_o_309","text":"10","points":10}],"order_index":4,"page":1},
    {"id":"tb_q_206","text":"مستوى الرضا عن المناهج الدراسية","type":"slider","required":true,"points":0,"options":[{"id":"tb_o_310","text":"غير راضٍ","points":1},{"id":"tb_o_311","text":"راضٍ قليلاً","points":3},{"id":"tb_o_312","text":"راضٍ","points":5},{"id":"tb_o_313","text":"راضٍ جداً","points":7},{"id":"tb_o_314","text":"ممتاز","points":10}],"order_index":5,"page":2},
    {"id":"tb_q_207","text":"ما هي المجالات التي تحتاج تحسين؟","type":"multiple_choice","required":false,"points":0,"options":[{"id":"tb_o_315","text":"المناهج الدراسية","points":0},{"id":"tb_o_316","text":"الأنشطة اللاصفية","points":0},{"id":"tb_o_317","text":"المرافق المدرسية","points":0},{"id":"tb_o_318","text":"الأمن والسلامة","points":0},{"id":"tb_o_319","text":"التواصل مع أولياء الأمور","points":0}],"order_index":6,"page":2},
    {"id":"tb_q_208","text":"هل تنصح المدرسة للآخرين؟","type":"single_choice","required":true,"points":0,"options":[{"id":"tb_o_320","text":"نعم، بالتأكيد","points":0},{"id":"tb_o_321","text":"ربما","points":0},{"id":"tb_o_322","text":"لا","points":0}],"order_index":7,"page":2},
    {"id":"tb_q_209","text":"رتب أولويات التطوير من وجهة نظرك","type":"ranking","required":false,"points":0,"options":[{"id":"tb_o_323","text":"تطوير المناهج","points":0},{"id":"tb_o_324","text":"تدريب المعلمين","points":0},{"id":"tb_o_325","text":"تحسين المرافق","points":0},{"id":"tb_o_326","text":"تكثيف الأنشطة","points":0}],"order_index":8,"page":2},
    {"id":"tb_q_210","text":"اقتراحاتك لتطوير المدرسة","type":"textarea","required":false,"points":0,"options":[],"order_index":9,"page":2}
  ]'::jsonb,
  '{
    "allow_multiple":true,
    "randomize_questions":false,
    "time_limit":null,
    "_submit_button":{"text":"إرسال التقييم","color":"#0EA5E9","textColor":"#ffffff"},
    "_is_test":false,
    "_offer_countdown":null
  }'::jsonb,
  true, 18
),

-- ====================================================================
-- Category 7: small_business (شركات صغيرة)
-- ====================================================================

-- Template 19: طلب تصميم شعار وهوية بصرية
(
  'a1000000-0000-0000-0000-000000000019',
  'طلب تصميم شعار وهوية بصرية',
  'نموذج طلب خدمات تصميم الشعارات والهوية البصرية للشركات الناشئة',
  'small_business',
  '[
    {"id":"tb_q_211","text":"اسم الشركة أو النشاط التجاري","type":"text","required":true,"points":0,"options":[],"order_index":0,"page":1},
    {"id":"tb_q_212","text":"اسم صاحب الطلب","type":"text","required":true,"points":0,"options":[],"order_index":1,"page":1},
    {"id":"tb_q_213","text":"رقم الجوال","type":"text","required":true,"points":0,"options":[],"order_index":2,"page":1,"row_group":"con3"},
    {"id":"tb_q_214","text":"البريد الإلكتروني","type":"text","required":true,"points":0,"options":[],"order_index":3,"page":1,"row_group":"con3"},
    {"id":"tb_q_215","text":"نوع الخدمة المطلوبة","type":"single_choice","required":true,"points":0,"options":[{"id":"tb_o_327","text":"تصميم شعار فقط","points":0},{"id":"tb_o_328","text":"هوية بصرية كاملة","points":0},{"id":"tb_o_329","text":"إعادة تصميم شعار قائم","points":0},{"id":"tb_o_330","text":"باقة متكاملة (شعار + هوية + موقع)","points":0}],"order_index":4,"page":1},
    {"id":"tb_q_216","text":"أمثلة مرجعية (صور إلهام)","type":"file_upload","required":false,"points":0,"options":[],"order_index":5,"page":1},
    {"id":"tb_q_217","text":"شاهد أعمالنا السابقة","type":"youtube","required":false,"points":0,"options":[],"order_index":6,"page":1},
    {"id":"tb_q_218","text":"الألوان المفضلة","type":"text","required":false,"points":0,"options":[],"order_index":7,"page":2},
    {"id":"tb_q_219","text":"المجال والنشاط التجاري","type":"textarea","required":true,"points":0,"options":[],"order_index":8,"page":2},
    {"id":"tb_q_220","text":"باقات التصميم المتاحة","type":"products_block","required":true,"points":0,"options":[],"order_index":9,"page":2},
    {"id":"tb_q_221","text":"الميزانية التقريبية للمشروع","type":"slider","required":true,"points":0,"options":[{"id":"tb_o_331","text":"500 - 1000 ريال","points":1},{"id":"tb_o_332","text":"1000 - 3000 ريال","points":2},{"id":"tb_o_333","text":"3000 - 5000 ريال","points":3},{"id":"tb_o_334","text":"أكثر من 5000 ريال","points":4}],"order_index":10,"page":2},
    {"id":"tb_q_222","text":"الجدول الزمني المطلوب","type":"single_choice","required":true,"points":0,"options":[{"id":"tb_o_335","text":"عادي (أسبوعان)","points":0},{"id":"tb_o_336","text":"مستعجل (أسبوع)","points":0},{"id":"tb_o_337","text":"فائق السرعة (3 أيام)","points":0}],"order_index":11,"page":2}
  ]'::jsonb,
  '{
    "allow_multiple":true,
    "randomize_questions":false,
    "time_limit":null,
    "_submit_button":{"text":"طلب تصميم","color":"#EC4899","textColor":"#ffffff"},
    "_is_test":false,
    "_offer_countdown":null
  }'::jsonb,
  true, 19
),

-- Template 20: طلب صيانة أجهزة إلكترونية
(
  'a1000000-0000-0000-0000-000000000020',
  'طلب صيانة أجهزة إلكترونية',
  'نموذج طلب صيانة وإصلاح الأجهزة الإلكترونية مع عداد للعروض',
  'small_business',
  '[
    {"id":"tb_q_223","text":"الاسم الكامل","type":"text","required":true,"points":0,"options":[],"order_index":0,"page":1},
    {"id":"tb_q_224","text":"رقم الهاتف","type":"text","required":true,"points":0,"options":[],"order_index":1,"page":1},
    {"id":"tb_q_225","text":"نوع الجهاز","type":"dropdown","required":true,"points":0,"options":[{"id":"tb_o_338","text":"هاتف ذكي","points":0},{"id":"tb_o_339","text":"حاسوب محمول","points":0},{"id":"tb_o_340","text":"حاسوب مكتبي","points":0},{"id":"tb_o_341","text":"جهاز لوحي","points":0},{"id":"tb_o_342","text":"طابعة","points":0},{"id":"tb_o_343","text":"جهاز منزلي","points":0}],"order_index":2,"page":1,"dropdown_type":"single"},
    {"id":"tb_q_226","text":"الماركة","type":"text","required":true,"points":0,"options":[],"order_index":3,"page":1,"row_group":"brand"},
    {"id":"tb_q_227","text":"الموديل","type":"text","required":true,"points":0,"options":[],"order_index":4,"page":1,"row_group":"brand"},
    {"id":"tb_q_228","text":"نوع العطل","type":"multiple_choice","required":true,"points":0,"options":[{"id":"tb_o_344","text":"شاشة مكسورة","points":0},{"id":"tb_o_345","text":"بطارية","points":0},{"id":"tb_o_346","text":"شاحن/منفذ شحن","points":0},{"id":"tb_o_347","text":"برمجيات/نظام تشغيل","points":0},{"id":"tb_o_348","text":"صوت/سماعات","points":0},{"id":"tb_o_349","text":"كاميرا","points":0},{"id":"tb_o_350","text":"أخرى","points":0}],"order_index":5,"page":1},
    {"id":"tb_q_229","text":"وصف المشكلة بالتفصيل","type":"textarea","required":true,"points":0,"options":[],"order_index":6,"page":1},
    {"id":"tb_q_230","text":"عرض خصم الصيانة - الوقت المتبقي","type":"countdown_timer","required":false,"points":0,"options":[],"order_index":7,"page":2},
    {"id":"tb_q_231","text":"سرعة المعالجة المطلوبة","type":"button_choice","required":true,"points":0,"options":[{"id":"tb_o_351","text":"معالجة فورية (رسوم إضافية)","points":0},{"id":"tb_o_352","text":"خلال 24 ساعة","points":0},{"id":"tb_o_353","text":"خلال 3 أيام","points":0},{"id":"tb_o_354","text":"أسبوع - المعالجة الاقتصادية","points":0}],"order_index":8,"page":2},
    {"id":"tb_q_232","text":"هل تحتاج خدمة التوصيل والاستلام؟","type":"single_choice","required":true,"points":0,"options":[{"id":"tb_o_355","text":"نعم، استلم من المنزل","points":0},{"id":"tb_o_356","text":"سأحضر الجهاز بنفسي","points":0}],"order_index":9,"page":2},
    {"id":"tb_q_233","text":"أوافق على شروط الصيانة","type":"terms","required":true,"points":0,"options":[],"order_index":10,"page":2}
  ]'::jsonb,
  '{
    "allow_multiple":true,
    "randomize_questions":false,
    "time_limit":null,
    "_submit_button":{"text":"طلب صيانة","color":"#DC2626","textColor":"#ffffff"},
    "_is_test":false,
    "_offer_countdown":"2026-06-15T23:59:59Z"
  }'::jsonb,
  true, 20
),

-- Template 21: استشارة إدارة مشاريع صغيرة
(
  'a1000000-0000-0000-0000-000000000021',
  'استشارة إدارة مشاريع صغيرة',
  'نموذج طلب استشارة إدارية لأصحاب المشاريع الصغيرة والشركات الناشئة',
  'small_business',
  '[
    {"id":"tb_q_234","text":"الاسم الكامل","type":"text","required":true,"points":0,"options":[],"order_index":0,"page":1},
    {"id":"tb_q_235","text":"اسم المشروع أو الشركة","type":"text","required":true,"points":0,"options":[],"order_index":1,"page":1},
    {"id":"tb_q_236","text":"رقم الهاتف","type":"text","required":true,"points":0,"options":[],"order_index":2,"page":1,"row_group":"c4"},
    {"id":"tb_q_237","text":"البريد الإلكتروني","type":"text","required":true,"points":0,"options":[],"order_index":3,"page":1,"row_group":"c4"},
    {"id":"tb_q_238","text":"مرحلة المشروع","type":"single_choice","required":true,"points":0,"options":[{"id":"tb_o_357","text":"فكرة فقط","points":0},{"id":"tb_o_358","text":"قيد التأسيس","points":0},{"id":"tb_o_359","text":"قائم وأحتاج تطوير","points":0},{"id":"tb_o_360","text":"أبحث عن تمويل","points":0}],"order_index":4,"page":1},
    {"id":"tb_q_239","text":"<div style=\"background:linear-gradient(135deg,#EEF2FF,#E0E7FF);padding:20px;border-radius:16px;font-family:''Noto Sans Arabic'',sans-serif;\"><h3 style=\"color:#4338CA;font-size:18px;margin:0 0 12px;\">💡 نصيحة الخبراء لإدارة مشروعك الناشئ</h3><p style=\"color:#3730A3;font-size:14px;line-height:2;\">\"<em>أفضل وقت لبدء مشروعك كان بالأمس، وأفضل وقت تالٍ هو اليوم</em>\"<br>🚀 نقدم لك استشارات مجانية في:<br><span style=\"background:#C7D2FE;padding:4px 12px;border-radius:20px;font-size:13px;margin:4px 4px;display:inline-block;\">التخطيط</span> <span style=\"background:#C7D2FE;padding:4px 12px;border-radius:20px;font-size:13px;margin:4px 4px;display:inline-block;\">التسويق</span> <span style=\"background:#C7D2FE;padding:4px 12px;border-radius:20px;font-size:13px;margin:4px 4px;display:inline-block;\">الإدارة المالية</span> <span style=\"background:#C7D2FE;padding:4px 12px;border-radius:20px;font-size:13px;margin:4px 4px;display:inline-block;\">التحول الرقمي</span></p></div>","type":"static_text","required":false,"points":0,"options":[],"order_index":5,"page":1},
    {"id":"tb_q_240","text":"مجال الاستشارة المطلوب","type":"multiple_choice","required":true,"points":0,"options":[{"id":"tb_o_361","text":"التخطيط الاستراتيجي","points":0},{"id":"tb_o_362","text":"التسويق والمبيعات","points":0},{"id":"tb_o_363","text":"الإدارة المالية","points":0},{"id":"tb_o_364","text":"الموارد البشرية","points":0},{"id":"tb_o_365","text":"التحول الرقمي","points":0},{"id":"tb_o_366","text":"دراسة الجدوى","points":0}],"order_index":6,"page":2},
    {"id":"tb_q_241","text":"قيم مستوى معرفتك بإدارة المشاريع (1-10)","type":"scale","required":true,"points":0,"options":[{"id":"tb_o_367","text":"1","points":1},{"id":"tb_o_368","text":"2","points":2},{"id":"tb_o_369","text":"3","points":3},{"id":"tb_o_370","text":"4","points":4},{"id":"tb_o_371","text":"5","points":5},{"id":"tb_o_372","text":"6","points":6},{"id":"tb_o_373","text":"7","points":7},{"id":"tb_o_374","text":"8","points":8},{"id":"tb_o_375","text":"9","points":9},{"id":"tb_o_376","text":"10","points":10}],"order_index":7,"page":2},
    {"id":"tb_q_242","text":"صف التحديات التي تواجهها","type":"textarea","required":true,"points":0,"options":[],"order_index":8,"page":2},
    {"id":"tb_q_243","text":"قسم: إنهاء الطلب","type":"divider","required":false,"points":0,"options":[],"order_index":9,"page":2},
    {"id":"tb_q_244","text":"أوافق على سياسة الاستشارات وشروطها","type":"terms","required":true,"points":0,"options":[],"order_index":10,"page":2},
    {"id":"tb_q_245","text":"التوقيع الإلكتروني","type":"signature","required":true,"points":0,"options":[],"order_index":11,"page":2}
  ]'::jsonb,
  '{
    "allow_multiple":false,
    "randomize_questions":false,
    "time_limit":null,
    "_submit_button":{"text":"طلب استشارة","color":"#6366F1","textColor":"#ffffff"},
    "_is_test":false,
    "_offer_countdown":null
  }'::jsonb,
  true, 21
)
ON CONFLICT (id) DO NOTHING;
