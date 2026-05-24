-- Smart professional templates + richer fake success partners
-- Run in Supabase SQL Editor after sql/008_partners.sql and sql/010_add_extra_question_types.sql
-- Safe to run multiple times: fixed UUIDs + ON CONFLICT updates.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

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

INSERT INTO form_templates
  (id, name, description, category, image_url, questions_data, form_settings, is_featured, sort_order)
VALUES
(
  'b1200000-0000-0000-0000-000000000001',
  'اختبار قبول ذكي للأكاديميات والمعسكرات',
  'قالب اختبار احترافي يجمع التصحيح التلقائي، التعليمات الغنية، الفيديو، المطابقة، المصفوفة، الترتيب، رفع ملف، والمنطق الشرطي.',
  'education_centers',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&auto=format&fit=crop',
  $$[
    {"id":"st_q_001","text":"<div style=\"background:#eef2ff;padding:18px;border-radius:14px;border-right:5px solid #4f46e5\"><h2 style=\"margin:0 0 8px;color:#312e81\">اختبار قبول مكثف</h2><p style=\"margin:0;color:#3730a3;line-height:1.8\">أجب بهدوء. ستظهر الأسئلة المناسبة حسب إجاباتك، وسيتم احتساب الدرجة تلقائيا.</p></div>","type":"static_text","required":false,"points":0,"options":[],"order_index":0,"page":1},
    {"id":"st_q_002","text":"الاسم الكامل","type":"text","required":true,"points":0,"options":[],"order_index":1,"page":1,"row_group":101},
    {"id":"st_q_003","text":"البريد الإلكتروني وتأكيده","type":"email_confirm","required":true,"points":0,"options":[],"order_index":2,"page":1,"row_group":101},
    {"id":"st_q_004","text":"شاهد تعليمات الاختبار","type":"youtube","required":false,"points":0,"options":[{"id":"st_o_001","text":"https://www.youtube.com/watch?v=dQw4w9WgXcQ","points":0}],"order_index":3,"page":1},
    {"id":"st_q_005","text":"المسار المطلوب","type":"dropdown","required":true,"points":0,"options":{"dropdown_type":"single","correct_option_ids":[],"options":[{"id":"st_o_002","text":"تطوير واجهات أمامية","points":0},{"id":"st_o_003","text":"تطوير خلفيات وواجهات API","points":0},{"id":"st_o_004","text":"تحليل بيانات وذكاء اصطناعي","points":0},{"id":"st_o_005","text":"تصميم تجربة مستخدم","points":0}]},"order_index":4,"page":1},
    {"id":"st_q_006","text":"سنوات الخبرة العملية","type":"scale","required":true,"points":0,"options":[{"id":"st_o_006","text":"0","points":0},{"id":"st_o_007","text":"1","points":1},{"id":"st_o_008","text":"2","points":2},{"id":"st_o_009","text":"3","points":3},{"id":"st_o_010","text":"4+","points":4}],"order_index":5,"page":1},
    {"id":"st_q_007","text":"هل لديك مشاريع سابقة؟","type":"single_choice","required":true,"points":0,"options":[{"id":"st_o_011","text":"نعم","points":2},{"id":"st_o_012","text":"لا","points":0}],"order_index":6,"page":2},
    {"id":"st_q_008","text":"ارفع ملف أعمالك أو سيرتك الذاتية","type":"file_upload","required":false,"points":0,"options":[{"_visibility_rules":[{"question_id":"st_q_007","operator":"equals","value":"نعم"}]}],"order_index":7,"page":2},
    {"id":"st_q_009","text":"اختر المهارات التي تتقنها","type":"multiple_choice","required":true,"points":0,"options":[{"id":"st_o_013","text":"HTML/CSS","points":1},{"id":"st_o_014","text":"JavaScript","points":2},{"id":"st_o_015","text":"SQL","points":2},{"id":"st_o_016","text":"Git","points":1},{"id":"st_o_017","text":"حل المشكلات","points":2}],"order_index":8,"page":2},
    {"id":"st_q_010","text":"قيّم نفسك في كل مهارة","type":"matrix","required":true,"points":0,"options":{"matrix_rows":[{"id":"st_r_001","text":"المنطق البرمجي","required":true},{"id":"st_r_002","text":"التواصل والعمل الجماعي","required":true},{"id":"st_r_003","text":"الالتزام بالمواعيد","required":true}],"matrix_columns":[{"id":"st_c_001","text":"مبتدئ","points":1},{"id":"st_c_002","text":"متوسط","points":2},{"id":"st_c_003","text":"متقدم","points":3}]},"order_index":9,"page":2},
    {"id":"st_q_011","text":"صل المفهوم بالتعريف الصحيح","type":"match_items","required":true,"points":0,"options":{"left_items":[{"id":"st_l_001","text":"API"},{"id":"st_l_002","text":"Database"},{"id":"st_l_003","text":"Component"}],"right_items":[{"id":"st_m_001","text":"واجهة تواصل بين الأنظمة"},{"id":"st_m_002","text":"تخزين منظم للبيانات"},{"id":"st_m_003","text":"جزء قابل لإعادة الاستخدام في الواجهة"}]},"order_index":10,"page":2},
    {"id":"st_q_012","text":"رتب أولوياتك في التعلم","type":"ranking","required":true,"points":0,"options":[{"id":"st_o_018","text":"مشاريع عملية","points":0},{"id":"st_o_019","text":"متابعة مدرب","points":0},{"id":"st_o_020","text":"شهادة معتمدة","points":0},{"id":"st_o_021","text":"مجتمع ومراجعات","points":0}],"order_index":11,"page":2},
    {"id":"st_q_013","text":"لماذا تريد الانضمام؟","type":"textarea","required":true,"points":5,"options":[],"order_index":12,"page":3},
    {"id":"st_q_014","text":"أوافق على قواعد الاختبار وسياسة الخصوصية","type":"terms","required":true,"points":0,"options":[],"order_index":13,"page":3}
  ]$$::jsonb,
  $${
    "allow_multiple":false,
    "time_limit":45,
    "randomize_questions":true,
    "_is_test":true,
    "_submit_button":{"text":"ابدأ التقييم","color":"#4f46e5","textColor":"#ffffff"}
  }$$::jsonb,
  true,
  101
),
(
  'b1200000-0000-0000-0000-000000000002',
  'حجز عيادة VIP بفرز ذكي للحالات',
  'قالب طبي متقدم لحجز المواعيد، فرز الأولوية، التاريخ المرضي، الدفع، والتوقيع الإلكتروني.',
  'clinics',
  'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=1200&auto=format&fit=crop',
  $$[
    {"id":"st_q_020","text":"الاسم الكامل للمريض","type":"text","required":true,"points":0,"options":[],"order_index":0,"page":1,"row_group":201},
    {"id":"st_q_021","text":"رقم الهاتف","type":"text","required":true,"points":0,"options":[],"order_index":1,"page":1,"row_group":201},
    {"id":"st_q_022","text":"تاريخ الميلاد","type":"date","required":true,"points":0,"options":[],"order_index":2,"page":1,"row_group":202},
    {"id":"st_q_023","text":"وقت التواصل المفضل","type":"time","required":false,"points":0,"options":[],"order_index":3,"page":1,"row_group":202},
    {"id":"st_q_024","text":"اختر موعد الزيارة","type":"appointment","required":true,"points":0,"options":[{"id":"appointment_settings","text":"appointment_settings","points":0,"validation_type":"custom","validation_category":"weekday","validation_value":"single"},{"id":"st_ap_001","text":"10:00","points":0,"validation_category":"weekday","validation_value":"0"},{"id":"st_ap_002","text":"12:00","points":0,"validation_category":"weekday","validation_value":"2"},{"id":"st_ap_003","text":"18:30","points":0,"validation_category":"weekday","validation_value":"4"}],"order_index":4,"page":1},
    {"id":"st_q_025","text":"نوع الزيارة","type":"button_choice","required":true,"points":0,"options":[{"id":"st_o_030","text":"كشف جديد","points":0},{"id":"st_o_031","text":"متابعة","points":0},{"id":"st_o_032","text":"حالة طارئة","points":0}],"order_index":5,"page":2},
    {"id":"st_q_026","text":"درجة الألم الآن","type":"slider","required":true,"points":0,"options":[{"id":"st_o_033","text":"0|10|1","points":0}],"order_index":6,"page":2},
    {"id":"st_q_027","text":"هل لديك حساسية من أدوية؟","type":"single_choice","required":true,"points":0,"options":[{"id":"st_o_034","text":"نعم","points":0},{"id":"st_o_035","text":"لا","points":0}],"order_index":7,"page":2},
    {"id":"st_q_028","text":"اذكر نوع الحساسية","type":"textarea","required":false,"points":0,"options":[{"_visibility_rules":[{"question_id":"st_q_027","operator":"equals","value":"نعم"}]}],"order_index":8,"page":2},
    {"id":"st_q_029","text":"قيّم تجربتك السابقة مع العيادة","type":"star_rating","required":false,"points":0,"options":[{"id":"st_o_036","text":"1","points":1},{"id":"st_o_037","text":"2","points":2},{"id":"st_o_038","text":"3","points":3},{"id":"st_o_039","text":"4","points":4},{"id":"st_o_040","text":"5","points":5}],"order_index":9,"page":3},
    {"id":"st_q_030","text":"بيانات الدفع والحجز","type":"payment_info_block","required":false,"points":0,"options":[{"id":"st_pm_001","method":"instapay","label":"Instapay","value":"clinic.vip@instapay","details":"يرجى كتابة اسم المريض في ملاحظات التحويل"},{"id":"st_pm_002","method":"wallet","label":"محفظة العيادة","value":"01000000000","details":"يمكن دفع عربون الحجز فقط"}],"order_index":10,"page":3},
    {"id":"st_q_031","text":"توقيع المريض أو ولي الأمر","type":"signature","required":true,"points":0,"options":[],"order_index":11,"page":3}
  ]$$::jsonb,
  $${
    "allow_multiple":true,
    "randomize_questions":false,
    "_is_test":false,
    "_submit_button":{"text":"تأكيد الموعد","color":"#0f766e","textColor":"#ffffff"},
    "_availability":{"enabled":true,"mode":"weekly","weekly":[{"day":"0","start":"10:00","end":"14:00"},{"day":"2","start":"10:00","end":"14:00"},{"day":"4","start":"17:00","end":"20:00"}],"starts_at":"","ends_at":""}
  }$$::jsonb,
  true,
  102
),
(
  'b1200000-0000-0000-0000-000000000003',
  'متجر عروض ذكي بمنتجات وسلة ودفع',
  'قالب بيع احترافي بعرض مؤقت، صورة ثابتة، منتجات مصنفة، سلة، بيانات دفع، وتحديد فترة التسليم.',
  'small_business',
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&auto=format&fit=crop',
  $$[
    {"id":"st_q_040","text":"صورة العرض الرئيسية","type":"static_image","required":false,"points":0,"options":[{"id":"st_img_001","text":"صورة العرض","points":0,"validation_value":"https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1200&auto=format&fit=crop"}],"order_index":0,"page":1},
    {"id":"st_q_041","text":"العرض ينتهي خلال","type":"countdown_timer","required":false,"points":0,"options":[{"id":"st_timer_001","text":"2030-12-31T23:59","points":0,"validation_value":"العرض الخاص ينتهي خلال","validation_min":"خصم محدود على الباقات الأكثر طلبا"}],"order_index":1,"page":1},
    {"id":"st_q_042","text":"اسم العميل","type":"text","required":true,"points":0,"options":[],"order_index":2,"page":1,"row_group":301},
    {"id":"st_q_043","text":"رقم واتساب","type":"text","required":true,"points":0,"options":[],"order_index":3,"page":1,"row_group":301},
    {"id":"st_q_044","text":"اختر المنتجات","type":"products_block","required":true,"points":0,"options":[{"id":"st_g_001","name":"باقات جاهزة","items":[{"id":"st_p_001","name":"باقة البداية","description":"منتج أساسي مع دعم سريع","price":490,"image_url":"https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop","available":true},{"id":"st_p_002","name":"باقة النمو","description":"منتجين + متابعة مخصصة","price":990,"image_url":"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop","available":true}]},{"id":"st_g_002","name":"إضافات اختيارية","items":[{"id":"st_p_003","name":"تغليف فاخر","description":"تغليف هدايا احترافي","price":120,"image_url":"https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=600&auto=format&fit=crop","available":true},{"id":"st_p_004","name":"توصيل سريع","description":"داخل المدينة خلال 24 ساعة","price":80,"image_url":"","available":true}]}],"order_index":4,"page":1},
    {"id":"st_q_045","text":"فترة التسليم المناسبة","type":"date_range","required":true,"points":0,"options":[{"id":"st_range_001","text":"","points":0,"validation_type":"datetime"}],"order_index":5,"page":2},
    {"id":"st_q_046","text":"طريقة الاستلام","type":"single_choice","required":true,"points":0,"options":[{"id":"st_o_050","text":"توصيل للمنزل","points":0},{"id":"st_o_051","text":"استلام من الفرع","points":0}],"order_index":6,"page":2},
    {"id":"st_q_047","text":"العنوان بالتفصيل","type":"textarea","required":false,"points":0,"options":[{"_visibility_rules":[{"question_id":"st_q_046","operator":"equals","value":"توصيل للمنزل"}]}],"order_index":7,"page":2},
    {"id":"st_q_048","text":"بيانات الدفع","type":"payment_info_block","required":false,"points":0,"options":[{"id":"st_pm_010","method":"vodafone","label":"Vodafone Cash","value":"01011112222","details":"أرسل صورة التحويل بعد إتمام الطلب"},{"id":"st_pm_011","method":"payment_link","label":"رابط دفع آمن","value":"https://forms.openappo.com/pay/demo","details":"رابط تجريبي قابل للتعديل"}],"order_index":8,"page":2}
  ]$$::jsonb,
  $${
    "allow_multiple":true,
    "randomize_questions":false,
    "_is_test":false,
    "_offer_countdown":"2030-12-31T23:59",
    "_submit_button":{"text":"إتمام الطلب","color":"#ea580c","textColor":"#ffffff"}
  }$$::jsonb,
  true,
  103
),
(
  'b1200000-0000-0000-0000-000000000004',
  'طلب معاينة عقار وتأهيل العميل',
  'قالب عقاري ذكي يجمع ميزانية العميل، نوع العقار، موعد المعاينة، أولويات الشراء، والمنطق الشرطي.',
  'real_estate',
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&auto=format&fit=crop',
  $$[
    {"id":"st_q_060","text":"اسم العميل","type":"text","required":true,"points":0,"options":[],"order_index":0,"page":1,"row_group":401},
    {"id":"st_q_061","text":"رقم الهاتف","type":"text","required":true,"points":0,"options":[],"order_index":1,"page":1,"row_group":401},
    {"id":"st_q_062","text":"نوع العقار المطلوب","type":"button_choice","required":true,"points":0,"options":[{"id":"st_o_060","text":"شقة","points":0},{"id":"st_o_061","text":"فيلا","points":0},{"id":"st_o_062","text":"مكتب إداري","points":0},{"id":"st_o_063","text":"محل تجاري","points":0}],"order_index":2,"page":1},
    {"id":"st_q_063","text":"الميزانية المتوقعة","type":"dropdown","required":true,"points":0,"options":{"dropdown_type":"single","correct_option_ids":[],"options":[{"id":"st_o_064","text":"أقل من 1 مليون","points":0},{"id":"st_o_065","text":"1 - 2 مليون","points":0},{"id":"st_o_066","text":"2 - 5 مليون","points":0},{"id":"st_o_067","text":"أكثر من 5 مليون","points":0}]},"order_index":3,"page":1},
    {"id":"st_q_064","text":"رتب أولويات اختيار العقار","type":"ranking","required":true,"points":0,"options":[{"id":"st_o_068","text":"الموقع"},{"id":"st_o_069","text":"السعر"},{"id":"st_o_070","text":"المساحة"},{"id":"st_o_071","text":"التشطيب"},{"id":"st_o_072","text":"قرب الخدمات"}],"order_index":4,"page":2},
    {"id":"st_q_065","text":"المساحة التقريبية المطلوبة","type":"slider","required":true,"points":0,"options":[{"id":"st_o_073","text":"50|500|10","points":0}],"order_index":5,"page":2},
    {"id":"st_q_066","text":"موعد المعاينة","type":"appointment","required":true,"points":0,"options":[{"id":"appointment_settings","text":"appointment_settings","points":0,"validation_type":"fixed","validation_category":"weekday","validation_value":"shared"},{"id":"st_ap_010","text":"11:00","points":0,"validation_category":"fixed","validation_value":""},{"id":"st_ap_011","text":"17:00","points":0,"validation_category":"fixed","validation_value":""}],"order_index":6,"page":2},
    {"id":"st_q_067","text":"هل تحتاج تمويلا عقاريا؟","type":"single_choice","required":true,"points":0,"options":[{"id":"st_o_074","text":"نعم"},{"id":"st_o_075","text":"لا"}],"order_index":7,"page":2},
    {"id":"st_q_068","text":"اذكر قيمة الدفعة المقدمة المتاحة","type":"text","required":false,"points":0,"options":[{"_visibility_rules":[{"question_id":"st_q_067","operator":"equals","value":"نعم"}]}],"order_index":8,"page":2}
  ]$$::jsonb,
  $${"allow_multiple":true,"randomize_questions":false,"_is_test":false,"_submit_button":{"text":"احجز المعاينة","color":"#2563eb","textColor":"#ffffff"}}$$::jsonb,
  false,
  104
),
(
  'b1200000-0000-0000-0000-000000000005',
  'تسجيل فعالية ومؤتمر احترافي',
  'قالب تسجيل للمؤتمرات يشمل حضور مرافقين، ورش عمل، تفضيلات غذائية، دفع، وبطاقات حضور.',
  'event',
  'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200&auto=format&fit=crop',
  $$[
    {"id":"st_q_080","text":"بيانات الحضور","type":"divider","required":false,"points":0,"options":[],"order_index":0,"page":1},
    {"id":"st_q_081","text":"اسم الحاضر","type":"text","required":true,"points":0,"options":[],"order_index":1,"page":1,"row_group":501},
    {"id":"st_q_082","text":"البريد الإلكتروني","type":"email_confirm","required":true,"points":0,"options":[],"order_index":2,"page":1,"row_group":501},
    {"id":"st_q_083","text":"نوع التذكرة","type":"products_block","required":true,"points":0,"options":[{"id":"st_g_020","name":"تذاكر المؤتمر","items":[{"id":"st_p_020","name":"حضور يوم واحد","description":"دخول الجلسات الرئيسية","price":350,"image_url":"","available":true},{"id":"st_p_021","name":"حضور كامل","description":"كل الأيام + شهادة حضور","price":850,"image_url":"","available":true},{"id":"st_p_022","name":"VIP","description":"مقاعد أمامية + عشاء المتحدثين","price":1800,"image_url":"","available":true}]}],"order_index":3,"page":1},
    {"id":"st_q_084","text":"ورش العمل المطلوبة","type":"multiple_choice","required":false,"points":0,"options":[{"id":"st_o_080","text":"التسويق بالذكاء الاصطناعي"},{"id":"st_o_081","text":"بناء المجتمعات"},{"id":"st_o_082","text":"تحليل البيانات"},{"id":"st_o_083","text":"تجربة العملاء"}],"order_index":4,"page":2},
    {"id":"st_q_085","text":"هل لديك مرافقون؟","type":"single_choice","required":true,"points":0,"options":[{"id":"st_o_084","text":"نعم"},{"id":"st_o_085","text":"لا"}],"order_index":5,"page":2},
    {"id":"st_q_086","text":"عدد المرافقين","type":"scale","required":false,"points":0,"options":[{"id":"st_o_086","text":"1","points":0},{"id":"st_o_087","text":"2","points":0},{"id":"st_o_088","text":"3","points":0},{"id":"st_o_089","text":"4","points":0}],"order_index":6,"page":2,"row_group":502},
    {"id":"st_q_087","text":"تفضيلات غذائية","type":"multiple_choice","required":false,"points":0,"options":[{"id":"st_o_090","text":"نباتي"},{"id":"st_o_091","text":"بدون جلوتين"},{"id":"st_o_092","text":"حساسية مكسرات"},{"id":"st_o_093","text":"لا توجد"}],"order_index":7,"page":2,"row_group":502},
    {"id":"st_q_088","text":"بيانات الدفع","type":"payment_info_block","required":false,"points":0,"options":[{"id":"st_pm_020","method":"bank","label":"حساب المؤتمر","value":"EG00 0000 0000 0000","details":"اكتب رقم التذكرة في سبب التحويل"}],"order_index":8,"page":3}
  ]$$::jsonb,
  $${"allow_multiple":true,"randomize_questions":false,"_is_test":false,"_submit_button":{"text":"تأكيد التسجيل","color":"#7c3aed","textColor":"#ffffff"}}$$::jsonb,
  false,
  105
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  image_url = EXCLUDED.image_url,
  questions_data = EXCLUDED.questions_data,
  form_settings = EXCLUDED.form_settings,
  is_featured = EXCLUDED.is_featured,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

DO $partners$
DECLARE
  partner_seed JSONB := $seed$
  [
    {"email":"asma.design@openappo.demo","name":"أسماء الجندي","company":"Studio Asma CX","bio":"مصممة تجربة عملاء تبني نماذج تسجيل وتحويل عالية الوضوح للعيادات والمتاجر.","code":"ASMA-CX","count":34,"avatar":"https://api.dicebear.com/9.x/avataaars/svg?seed=asma"},
    {"email":"youssef.growth@openappo.demo","name":"يوسف مراد","company":"Growth Forms Lab","bio":"مستشار نمو يركز على قوالب البيع والصفحات القصيرة التي ترفع معدل إكمال الطلب.","code":"YOUSEF-GR","count":51,"avatar":"https://api.dicebear.com/9.x/avataaars/svg?seed=youssef"},
    {"email":"mariam.clinic@openappo.demo","name":"مريم عادل","company":"Clinic Flow","bio":"تساعد المراكز الطبية على تنظيم الحجز والفرز الأولي وتقليل المكالمات المتكررة.","code":"MARIAM-MD","count":29,"avatar":"https://api.dicebear.com/9.x/avataaars/svg?seed=mariam"},
    {"email":"omar.edu@openappo.demo","name":"عمر حسان","company":"EduOps Academy","bio":"يبني اختبارات تحديد مستوى وتسجيل دورات بتصحيح تلقائي وتجربة عربية بسيطة.","code":"OMAR-EDU","count":46,"avatar":"https://api.dicebear.com/9.x/avataaars/svg?seed=omar"},
    {"email":"nada.events@openappo.demo","name":"ندى فؤاد","company":"Event Grid","bio":"منظمة فعاليات تحول التسجيل والدفع وورش العمل إلى مسار واحد واضح.","code":"NADA-EVT","count":23,"avatar":"https://api.dicebear.com/9.x/avataaars/svg?seed=nada"},
    {"email":"hisham.realestate@openappo.demo","name":"هشام ناصر","company":"AqarPilot","bio":"خبير مبيعات عقارية يستخدم النماذج لتأهيل العملاء قبل المعاينة.","code":"HISHAM-RE","count":38,"avatar":"https://api.dicebear.com/9.x/avataaars/svg?seed=hisham"},
    {"email":"salma.shop@openappo.demo","name":"سلمى منصور","company":"Cart Studio","bio":"تجهز متاجر صغيرة بقوالب منتجات وسلة وطرق دفع بدون تعقيد تقني.","code":"SALMA-SHOP","count":57,"avatar":"https://api.dicebear.com/9.x/avataaars/svg?seed=salma"},
    {"email":"karim.hr@openappo.demo","name":"كريم لطفي","company":"People Forms","bio":"يبني نماذج توظيف وإجازات ومراجعات أداء مناسبة للشركات الصغيرة.","code":"KARIM-HR","count":19,"avatar":"https://api.dicebear.com/9.x/avataaars/svg?seed=karim"},
    {"email":"dina.marketing@openappo.demo","name":"دينا شاهين","company":"Launch Metrics","bio":"تستخدم النماذج الذكية لتجارب الإعلانات، انتظار الإطلاق، وطلبات العروض.","code":"DINA-MKT","count":41,"avatar":"https://api.dicebear.com/9.x/avataaars/svg?seed=dina"},
    {"email":"tarek.ops@openappo.demo","name":"طارق سامي","company":"OpsDesk","bio":"يبسط العمليات اليومية بنماذج موافقات داخلية، طلبات شراء، وتذاكر دعم.","code":"TAREK-OPS","count":26,"avatar":"https://api.dicebear.com/9.x/avataaars/svg?seed=tarek"},
    {"email":"rana.beauty@openappo.demo","name":"رنا كمال","company":"Beauty Booking Pro","bio":"متخصصة في حجز خدمات التجميل وباقات العروض محدودة الوقت.","code":"RANA-BEAUTY","count":31,"avatar":"https://api.dicebear.com/9.x/avataaars/svg?seed=rana"},
    {"email":"waleed.logistics@openappo.demo","name":"وليد شوقي","company":"ShipRight","bio":"يصمم نماذج شحن واستلام تربط بيانات العميل بتفاصيل الطلب والتكلفة.","code":"WALEED-SHIP","count":22,"avatar":"https://api.dicebear.com/9.x/avataaars/svg?seed=waleed"},
    {"email":"layla.legal@openappo.demo","name":"ليلى فاضل","company":"Legal Intake Hub","bio":"تجهز نماذج استقبال قانوني تجمع المستندات والمواعيد والتفويض بوضوح.","code":"LAYLA-LAW","count":17,"avatar":"https://api.dicebear.com/9.x/avataaars/svg?seed=layla"},
    {"email":"ziad.creator@openappo.demo","name":"زياد أمين","company":"Creator Forms","bio":"يساعد صناع المحتوى في جمع طلبات التعاون، الاشتراكات، وتقييم الجمهور.","code":"ZIAD-CR","count":44,"avatar":"https://api.dicebear.com/9.x/avataaars/svg?seed=ziad"}
  ]
  $seed$::jsonb;
  item JSONB;
  p_id UUID;
  partner_ids UUID[] := '{}';
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(partner_seed)
  LOOP
    SELECT id INTO p_id FROM auth.users WHERE email = item->>'email';

    IF p_id IS NULL THEN
      p_id := gen_random_uuid();
      INSERT INTO auth.users
        (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
      VALUES
        (p_id, item->>'email', crypt('OpenappoDemo123!', gen_salt('bf')), NOW(), '{"provider":"email"}', jsonb_build_object('name', item->>'name'), NOW(), NOW(), 'authenticated', 'authenticated', '');
    END IF;

    INSERT INTO profiles
      (id, name, email, avatar_url, company, bio, is_partner, referral_code, referral_count, facebook_url, linkedin_url, youtube_url, other_links)
    VALUES
      (p_id, item->>'name', item->>'email', item->>'avatar', item->>'company', item->>'bio', true, item->>'code', (item->>'count')::int,
       'https://facebook.com/' || lower(replace(item->>'code','-','')),
       'https://linkedin.com/in/' || lower(replace(item->>'code','-','')),
       'https://youtube.com/@' || lower(replace(item->>'code','-','')),
       jsonb_build_array(jsonb_build_object('label','صفحة الشريك','url','https://forms.openappo.com/partners')))
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      email = EXCLUDED.email,
      avatar_url = EXCLUDED.avatar_url,
      company = EXCLUDED.company,
      bio = EXCLUDED.bio,
      is_partner = true,
      referral_code = EXCLUDED.referral_code,
      referral_count = EXCLUDED.referral_count,
      facebook_url = EXCLUDED.facebook_url,
      linkedin_url = EXCLUDED.linkedin_url,
      youtube_url = EXCLUDED.youtube_url,
      other_links = EXCLUDED.other_links;

    partner_ids := array_append(partner_ids, p_id);
  END LOOP;

  DELETE FROM partner_likes WHERE partner_id = ANY(partner_ids) OR user_id = ANY(partner_ids);
  DELETE FROM partner_ideas WHERE partner_id = ANY(partner_ids);
  DELETE FROM referrals WHERE referrer_id = ANY(partner_ids);

  INSERT INTO partner_ideas (partner_id, text, implemented)
  SELECT p.id, idea.text, idea.implemented
  FROM profiles p
  CROSS JOIN LATERAL (
    VALUES
      ('قالب ذكي جاهز يغير الأسئلة حسب إجابات العميل بدون أي إعدادات معقدة', true),
      ('مكتبة نصوص عربية جاهزة لأزرار الإرسال ورسائل النجاح حسب المجال', true),
      ('لوحة اقتراحات تعرض أكثر الأسئلة التي يتركها المستخدمون قبل الإرسال', false)
  ) AS idea(text, implemented)
  WHERE p.id = ANY(partner_ids);

  INSERT INTO partner_likes (partner_id, user_id)
  SELECT a.id, b.id
  FROM profiles a
  JOIN profiles b ON b.id = ANY(partner_ids) AND b.id <> a.id
  WHERE a.id = ANY(partner_ids)
    AND (('x' || substr(md5(a.id::text || b.id::text), 1, 7))::bit(28)::int) % 3 <> 0
  ON CONFLICT (partner_id, user_id) DO NOTHING;

  INSERT INTO referrals (referrer_id, referred_email, referred_id, status, created_at)
  SELECT p.id,
         'lead+' || lower(replace(p.referral_code, '-', '')) || '@openappo.demo',
         NULL,
         CASE WHEN p.referral_count > 25 THEN 'completed' ELSE 'pending' END,
         NOW() - (((('x' || substr(md5(p.id::text), 1, 7))::bit(28)::int) % 20) || ' days')::interval
  FROM profiles p
  WHERE p.id = ANY(partner_ids);

  RAISE NOTICE 'Smart templates and fake success partners seeded successfully.';
END $partners$;
