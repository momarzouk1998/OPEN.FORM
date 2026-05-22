-- Form Templates table for pre-built form templates

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

-- 4. Seed templates
INSERT INTO form_templates (name, description, category, questions_data, form_settings, is_featured, sort_order) VALUES
(
  'تسجيل مريض جديد',
  'نموذج شامل لتسجيل بيانات المرضى الجدد في العيادات والمراكز الطبية',
  'medical',
  '[
    {"id":"t_q_1","text":"الاسم الكامل","type":"text","required":true,"points":0,"options":[],"order_index":0},
    {"id":"t_q_2","text":"رقم الهاتف","type":"text","required":true,"points":0,"options":[],"order_index":1},
    {"id":"t_q_3","text":"تاريخ الميلاد","type":"date","required":true,"points":0,"options":[],"order_index":2},
    {"id":"t_q_4","text":"الجنس","type":"single_choice","required":true,"points":0,"options":[{"id":"t_o_1","text":"ذكر","points":0},{"id":"t_o_2","text":"أنثى","points":0}],"order_index":3},
    {"id":"t_q_5","text":"العنوان","type":"textarea","required":false,"points":0,"options":[],"order_index":4},
    {"id":"t_q_6","text":"البريد الإلكتروني","type":"text","required":false,"points":0,"options":[],"order_index":5},
    {"id":"t_q_7","text":"هل تعاني من أي أمراض مزمنة؟","type":"multiple_choice","required":true,"points":0,"options":[{"id":"t_o_3","text":"السكري","points":0},{"id":"t_o_4","text":"ضغط الدم","points":0},{"id":"t_o_5","text":"أمراض قلب","points":0},{"id":"t_o_6","text":"ربو","points":0},{"id":"t_o_7","text":"لا يوجد","points":0}],"order_index":6},
    {"id":"t_q_8","text":"هل تتناول أي أدوية حالياً؟","type":"single_choice","required":true,"points":0,"options":[{"id":"t_o_8","text":"نعم","points":0},{"id":"t_o_9","text":"لا","points":0}],"order_index":7},
    {"id":"t_q_9","text":"إذا نعم، اذكر اسم الدواء والجرعة","type":"textarea","required":false,"points":0,"options":[],"order_index":8},
    {"id":"t_q_10","text":"سبب الزيارة","type":"textarea","required":true,"points":0,"options":[],"order_index":9},
    {"id":"t_q_11","text":"تاريخ آخر زيارة","type":"date","required":false,"points":0,"options":[],"order_index":10}
  ]'::jsonb,
  '{"allow_multiple":false,"time_limit":null,"randomize_questions":false}'::jsonb,
  true, 1
),
(
  'استبيان رضا العملاء',
  'نموذج لقياس رضا العملاء عن الخدمات المقدمة',
  'survey',
  '[
    {"id":"t_q_12","text":"ما مدى رضاك عن الخدمة المقدمة؟","type":"scale","required":true,"points":0,"options":[{"id":"t_o_10","text":"1","points":1},{"id":"t_o_11","text":"2","points":2},{"id":"t_o_12","text":"3","points":3},{"id":"t_o_13","text":"4","points":4},{"id":"t_o_14","text":"5","points":5},{"id":"t_o_15","text":"6","points":6},{"id":"t_o_16","text":"7","points":7},{"id":"t_o_17","text":"8","points":8},{"id":"t_o_18","text":"9","points":9},{"id":"t_o_19","text":"10","points":10}],"order_index":0},
    {"id":"t_q_13","text":"ما مدى سرعة الاستجابة؟","type":"scale","required":true,"points":0,"options":[{"id":"t_o_20","text":"1","points":1},{"id":"t_o_21","text":"2","points":2},{"id":"t_o_22","text":"3","points":3},{"id":"t_o_23","text":"4","points":4},{"id":"t_o_24","text":"5","points":5},{"id":"t_o_25","text":"6","points":6},{"id":"t_o_26","text":"7","points":7},{"id":"t_o_27","text":"8","points":8},{"id":"t_o_28","text":"9","points":9},{"id":"t_o_29","text":"10","points":10}],"order_index":1},
    {"id":"t_q_14","text":"ما هي أكثر الخدمات التي استخدمتها؟","type":"multiple_choice","required":false,"points":0,"options":[{"id":"t_o_30","text":"خدمة العملاء","points":0},{"id":"t_o_31","text":"الدعم الفني","points":0},{"id":"t_o_32","text":"المبيعات","points":0},{"id":"t_o_33","text":"الاستشارات","points":0}],"order_index":2},
    {"id":"t_q_15","text":"هل توصي بخدماتنا للآخرين؟","type":"single_choice","required":true,"points":0,"options":[{"id":"t_o_34","text":"بالتأكيد","points":0},{"id":"t_o_35","text":"ربما","points":0},{"id":"t_o_36","text":"لا","points":0}],"order_index":3},
    {"id":"t_q_16","text":"ما هي الاقتراحات التي تود إضافتها لتحسين الخدمة؟","type":"textarea","required":false,"points":0,"options":[],"order_index":4}
  ]'::jsonb,
  '{"allow_multiple":true,"time_limit":null,"randomize_questions":false}'::jsonb,
  true, 2
),
(
  'تقديم وظيفة',
  'نموذج تقديم على وظيفة لاستقبال طلبات التوظيف',
  'employment',
  '[
    {"id":"t_q_17","text":"الاسم الكامل","type":"text","required":true,"points":0,"options":[],"order_index":0},
    {"id":"t_q_18","text":"البريد الإلكتروني","type":"text","required":true,"points":0,"options":[],"order_index":1},
    {"id":"t_q_19","text":"رقم الهاتف","type":"text","required":true,"points":0,"options":[],"order_index":2},
    {"id":"t_q_20","text":"الوظيفة المتقدم لها","type":"dropdown","required":true,"points":0,"options":[{"id":"t_o_37","text":"مطور برمجيات","points":0},{"id":"t_o_38","text":"مصمم جرافيك","points":0},{"id":"t_o_39","text":"مسوق إلكتروني","points":0},{"id":"t_o_40","text":"محاسب","points":0},{"id":"t_o_41","text":"إداري","points":0},{"id":"t_o_42","text":"أخرى","points":0}],"order_index":3,"dropdown_type":"single"},
    {"id":"t_q_21","text":"سنوات الخبرة","type":"single_choice","required":true,"points":0,"options":[{"id":"t_o_43","text":"أقل من سنة","points":0},{"id":"t_o_44","text":"1-3 سنوات","points":0},{"id":"t_o_45","text":"3-5 سنوات","points":0},{"id":"t_o_46","text":"5-10 سنوات","points":0},{"id":"t_o_47","text":"أكثر من 10 سنوات","points":0}],"order_index":4},
    {"id":"t_q_22","text":"المؤهل العلمي","type":"single_choice","required":true,"points":0,"options":[{"id":"t_o_48","text":"ثانوية عامة","points":0},{"id":"t_o_49","text":"دبلوم","points":0},{"id":"t_o_50","text":"بكالوريوس","points":0},{"id":"t_o_51","text":"ماجستير","points":0},{"id":"t_o_52","text":"دكتوراه","points":0}],"order_index":5},
    {"id":"t_q_23","text":"المهارات","type":"multiple_choice","required":false,"points":0,"options":[{"id":"t_o_53","text":"العمل ضمن فريق","points":0},{"id":"t_o_54","text":"التواصل الفعال","points":0},{"id":"t_o_55","text":"إدارة الوقت","points":0},{"id":"t_o_56","text":"القيادة","points":0},{"id":"t_o_57","text":"حل المشكلات","points":0}],"order_index":6},
    {"id":"t_q_24","text":"رسالة التوظيف","type":"textarea","required":false,"points":0,"options":[],"order_index":7}
  ]'::jsonb,
  '{"allow_multiple":false,"time_limit":null,"randomize_questions":false}'::jsonb,
  true, 3
),
(
  'عيادة دكتور',
  'نموذج حجز موعد في عيادة طبية مع تحديد المواعيد المتاحة',
  'medical',
  '[
    {"id":"t_q_25","text":"اسم المريض","type":"text","required":true,"points":0,"options":[],"order_index":0},
    {"id":"t_q_26","text":"رقم الهاتف للتواصل","type":"text","required":true,"points":0,"options":[],"order_index":1},
    {"id":"t_q_27","text":"تاريخ الميلاد","type":"date","required":true,"points":0,"options":[],"order_index":2},
    {"id":"t_q_28","text":"نوع الزيارة","type":"single_choice","required":true,"points":0,"options":[{"id":"t_o_58","text":"كشف جديد","points":0},{"id":"t_o_59","text":"متابعة","points":0},{"id":"t_o_60","text":"استشارة سريعة","points":0}],"order_index":3},
    {"id":"t_q_29","text":"التاريخ المطلوب للحجز","type":"date","required":true,"points":0,"options":[],"order_index":4},
    {"id":"t_q_30","text":"الوقت المفضل","type":"time","required":true,"points":0,"options":[],"order_index":5},
    {"id":"t_q_31","text":"وصف الأعراض","type":"textarea","required":true,"points":0,"options":[],"order_index":6},
    {"id":"t_q_32","text":"هل سبق لك زيارة العيادة؟","type":"single_choice","required":true,"points":0,"options":[{"id":"t_o_61","text":"نعم","points":0},{"id":"t_o_62","text":"لا","points":0}],"order_index":7}
  ]'::jsonb,
  '{"allow_multiple":true,"time_limit":null,"randomize_questions":false}'::jsonb,
  true, 4
),
(
  'تسجيل دورة تدريبية',
  'نموذج تسجيل للمشاركة في دورات تدريبية وورش عمل',
  'education',
  '[
    {"id":"t_q_33","text":"الاسم الكامل","type":"text","required":true,"points":0,"options":[],"order_index":0},
    {"id":"t_q_34","text":"البريد الإلكتروني","type":"text","required":true,"points":0,"options":[],"order_index":1},
    {"id":"t_q_35","text":"رقم الهاتف","type":"text","required":true,"points":0,"options":[],"order_index":2},
    {"id":"t_q_36","text":"العمر","type":"text","required":true,"points":0,"options":[],"order_index":3},
    {"id":"t_q_37","text":"المستوى التعليمي","type":"single_choice","required":true,"points":0,"options":[{"id":"t_o_63","text":"طالب","points":0},{"id":"t_o_64","text":"خريج","points":0},{"id":"t_o_65","text":"موظف","points":0}],"order_index":4},
    {"id":"t_q_38","text":"ما هي الدورة التي ترغب بالتسجيل فيها؟","type":"dropdown","required":true,"points":0,"options":[{"id":"t_o_66","text":"تطوير الذات","points":0},{"id":"t_o_67","text":"مهارات القيادة","points":0},{"id":"t_o_68","text":"التسويق الرقمي","points":0},{"id":"t_o_69","text":"البرمجة","points":0},{"id":"t_o_70","text":"التصميم","points":0}],"order_index":5,"dropdown_type":"single"},
    {"id":"t_q_39","text":"هل لديك أي احتياجات خاصة؟","type":"textarea","required":false,"points":0,"options":[],"order_index":6},
    {"id":"t_q_40","text":"كيف عرفت عن هذه الدورة؟","type":"single_choice","required":false,"points":0,"options":[{"id":"t_o_71","text":"فيسبوك","points":0},{"id":"t_o_72","text":"إنستغرام","points":0},{"id":"t_o_73","text":"تويتر","points":0},{"id":"t_o_74","text":"صديق","points":0},{"id":"t_o_75","text":"أخرى","points":0}],"order_index":7}
  ]'::jsonb,
  '{"allow_multiple":true,"time_limit":null,"randomize_questions":false}'::jsonb,
  false, 5
),
(
  'استمارة تغذية راجعة للموظفين',
  'نموذج لجمع التغذية الراجعة من الموظفين حول بيئة العمل',
  'survey',
  '[
    {"id":"t_q_41","text":"ما مدى رضاك عن بيئة العمل الحالية؟","type":"scale","required":true,"points":0,"options":[{"id":"t_o_76","text":"1","points":1},{"id":"t_o_77","text":"2","points":2},{"id":"t_o_78","text":"3","points":3},{"id":"t_o_79","text":"4","points":4},{"id":"t_o_80","text":"5","points":5},{"id":"t_o_81","text":"6","points":6},{"id":"t_o_82","text":"7","points":7},{"id":"t_o_83","text":"8","points":8},{"id":"t_o_84","text":"9","points":9},{"id":"t_o_85","text":"10","points":10}],"order_index":0},
    {"id":"t_q_42","text":"هل تشعر بالتقدير في العمل؟","type":"single_choice","required":true,"points":0,"options":[{"id":"t_o_86","text":"دائماً","points":0},{"id":"t_o_87","text":"أحياناً","points":0},{"id":"t_o_88","text":"نادراً","points":0},{"id":"t_o_89","text":"أبداً","points":0}],"order_index":1},
    {"id":"t_q_43","text":"ما هي جوانب العمل التي ترى أنها تحتاج تحسين؟","type":"multiple_choice","required":false,"points":0,"options":[{"id":"t_o_90","text":"التواصل الداخلي","points":0},{"id":"t_o_91","text":"بيئة العمل","points":0},{"id":"t_o_92","text":"الرواتب","points":0},{"id":"t_o_93","text":"ساعات العمل","points":0},{"id":"t_o_94","text":"التدريب والتطوير","points":0}],"order_index":2},
    {"id":"t_q_44","text":"اقتراحاتك لتطوير بيئة العمل","type":"textarea","required":false,"points":0,"options":[],"order_index":3}
  ]'::jsonb,
  '{"allow_multiple":false,"time_limit":null,"randomize_questions":false}'::jsonb,
  false, 6
),
(
  'حجز فندق',
  'نموذج حجز غرفة فندقية مع تحديد التواريخ والتفضيلات',
  'survey',
  '[
    {"id":"t_q_45","text":"الاسم الكامل","type":"text","required":true,"points":0,"options":[],"order_index":0},
    {"id":"t_q_46","text":"رقم الهاتف","type":"text","required":true,"points":0,"options":[],"order_index":1},
    {"id":"t_q_47","text":"البريد الإلكتروني","type":"text","required":true,"points":0,"options":[],"order_index":2},
    {"id":"t_q_48","text":"تاريخ الوصول","type":"date","required":true,"points":0,"options":[],"order_index":3},
    {"id":"t_q_49","text":"تاريخ المغادرة","type":"date","required":true,"points":0,"options":[],"order_index":4},
    {"id":"t_q_50","text":"نوع الغرفة","type":"single_choice","required":true,"points":0,"options":[{"id":"t_o_95","text":"غرفة عادية","points":0},{"id":"t_o_96","text":"غرفة مزدوجة","points":0},{"id":"t_o_97","text":"جناح","points":0}],"order_index":5},
    {"id":"t_q_51","text":"عدد النزلاء","type":"dropdown","required":true,"points":0,"options":[{"id":"t_o_98","text":"1","points":0},{"id":"t_o_99","text":"2","points":0},{"id":"t_o_100","text":"3","points":0},{"id":"t_o_101","text":"4","points":0},{"id":"t_o_102","text":"أكثر من 4","points":0}],"order_index":6,"dropdown_type":"single"},
    {"id":"t_q_52","text":"طلبات خاصة","type":"textarea","required":false,"points":0,"options":[],"order_index":7}
  ]'::jsonb,
  '{"allow_multiple":true,"time_limit":null,"randomize_questions":false}'::jsonb,
  false, 7
),
(
  'تقييم دورة تدريبية',
  'نموذج لجمع تقييم المشاركين بعد انتهاء دورة تدريبية',
  'education',
  '[
    {"id":"t_q_53","text":"اسم الدورة","type":"text","required":true,"points":0,"options":[],"order_index":0},
    {"id":"t_q_54","text":"مدى استفادتك من الدورة","type":"scale","required":true,"points":0,"options":[{"id":"t_o_103","text":"1","points":1},{"id":"t_o_104","text":"2","points":2},{"id":"t_o_105","text":"3","points":3},{"id":"t_o_106","text":"4","points":4},{"id":"t_o_107","text":"5","points":5},{"id":"t_o_108","text":"6","points":6},{"id":"t_o_109","text":"7","points":7},{"id":"t_o_110","text":"8","points":8},{"id":"t_o_111","text":"9","points":9},{"id":"t_o_112","text":"10","points":10}],"order_index":1},
    {"id":"t_q_55","text":"تقييم المدرب","type":"scale","required":true,"points":0,"options":[{"id":"t_o_113","text":"1","points":1},{"id":"t_o_114","text":"2","points":2},{"id":"t_o_115","text":"3","points":3},{"id":"t_o_116","text":"4","points":4},{"id":"t_o_117","text":"5","points":5},{"id":"t_o_118","text":"6","points":6},{"id":"t_o_119","text":"7","points":7},{"id":"t_o_120","text":"8","points":8},{"id":"t_o_121","text":"9","points":9},{"id":"t_o_122","text":"10","points":10}],"order_index":2},
    {"id":"t_q_56","text":"ما هي أكثر المواضيع التي أعجبتك؟","type":"textarea","required":false,"points":0,"options":[],"order_index":3},
    {"id":"t_q_57","text":"ما هي المواضيع التي ترى أنها بحاجة تحسين؟","type":"textarea","required":false,"points":0,"options":[],"order_index":4},
    {"id":"t_q_58","text":"هل توصي بهذه الدورة للآخرين؟","type":"single_choice","required":true,"points":0,"options":[{"id":"t_o_123","text":"نعم","points":0},{"id":"t_o_124","text":"لا","points":0}],"order_index":5}
  ]'::jsonb,
  '{"allow_multiple":false,"time_limit":null,"randomize_questions":false}'::jsonb,
  false, 8
)
ON CONFLICT (id) DO NOTHING;


-- 20 Additional Templates Generated by AI
INSERT INTO form_templates (name, description, category, questions_data, form_settings, is_featured, sort_order) VALUES
(
  'طلب شراء منتجات',
  'نموذج لطلب المنتجات للشركات والمتاجر مع تفاصيل الشحن.',
  'sales',
  '[{"id":"t_q_1000","text":"الاسم الكامل","type":"text","required":true,"points":0,"options":[],"order_index":0},{"id":"t_q_1001","text":"رقم الهاتف للتواصل","type":"text","required":true,"points":0,"options":[],"order_index":1},{"id":"t_q_1002","text":"عنوان التوصيل بالكامل","type":"textarea","required":true,"points":0,"options":[],"order_index":2},{"id":"t_q_1003","text":"المنتجات المطلوبة","type":"textarea","required":true,"points":0,"options":[],"order_index":3},{"id":"t_q_1004","text":"طريقة الدفع المفضلة","type":"single_choice","required":true,"points":0,"options":[{"id":"t_o_2000","text":"الدفع عند الاستلام","points":0},{"id":"t_o_2001","text":"بطاقة ائتمانية","points":0},{"id":"t_o_2002","text":"تحويل بنكي","points":0}],"order_index":4}]'::jsonb,
  '{"allow_multiple":true,"time_limit":null,"randomize_questions":false}'::jsonb,
  false, 9
),
(
  'تأكيد حضور فعالية',
  'استمارة إلكترونية لتسجيل الحضور وتأكيد التواجد في الفعاليات والمؤتمرات.',
  'event',
  '[{"id":"t_q_1005","text":"اسم الحاضر","type":"text","required":true,"points":0,"options":[],"order_index":0},{"id":"t_q_1006","text":"البريد الإلكتروني","type":"text","required":true,"points":0,"options":[],"order_index":1},{"id":"t_q_1007","text":"هل ستتمكن من الحضور؟","type":"single_choice","required":true,"points":0,"options":[{"id":"t_o_2003","text":"نعم، سأحضر","points":0},{"id":"t_o_2004","text":"أعتذر عن الحضور","points":0},{"id":"t_o_2005","text":"غير متأكد بعد","points":0}],"order_index":2},{"id":"t_q_1008","text":"عدد المرافقين","type":"dropdown","required":false,"points":0,"options":[{"id":"t_o_2006","text":"0","points":0},{"id":"t_o_2007","text":"1","points":0},{"id":"t_o_2008","text":"2","points":0},{"id":"t_o_2009","text":"3","points":0},{"id":"t_o_2010","text":"أكثر من 3","points":0}],"order_index":3,"dropdown_type":"single"},{"id":"t_q_1009","text":"هل لديك متطلبات غذائية خاصة؟ (نباتي، حساسية...)","type":"textarea","required":false,"points":0,"options":[],"order_index":4}]'::jsonb,
  '{"allow_multiple":true,"time_limit":null,"randomize_questions":false}'::jsonb,
  false, 10
),
(
  'طلب إجازة للموظفين',
  'نموذج داخلي للموارد البشرية لتقديم طلبات الإجازات.',
  'employment',
  '[{"id":"t_q_1010","text":"اسم الموظف","type":"text","required":true,"points":0,"options":[],"order_index":0},{"id":"t_q_1011","text":"الرقم الوظيفي","type":"text","required":true,"points":0,"options":[],"order_index":1},{"id":"t_q_1012","text":"نوع الإجازة","type":"single_choice","required":true,"points":0,"options":[{"id":"t_o_2011","text":"إجازة سنوية","points":0},{"id":"t_o_2012","text":"إجازة مرضية","points":0},{"id":"t_o_2013","text":"إجازة طارئة","points":0},{"id":"t_o_2014","text":"أخرى","points":0}],"order_index":2},{"id":"t_q_1013","text":"تاريخ بداية الإجازة","type":"date","required":true,"points":0,"options":[],"order_index":3},{"id":"t_q_1014","text":"تاريخ نهاية الإجازة","type":"date","required":true,"points":0,"options":[],"order_index":4},{"id":"t_q_1015","text":"سبب الإجازة / ملاحظات","type":"textarea","required":false,"points":0,"options":[],"order_index":5}]'::jsonb,
  '{"allow_multiple":true,"time_limit":null,"randomize_questions":false}'::jsonb,
  false, 11
),
(
  'شكاوى واقتراحات العملاء',
  'نموذج لجمع شكاوى ومقترحات العملاء لتحسين جودة الخدمة.',
  'survey',
  '[{"id":"t_q_1016","text":"الاسم (اختياري)","type":"text","required":false,"points":0,"options":[],"order_index":0},{"id":"t_q_1017","text":"رقم الهاتف (اختياري)","type":"text","required":false,"points":0,"options":[],"order_index":1},{"id":"t_q_1018","text":"نوع الرسالة","type":"single_choice","required":true,"points":0,"options":[{"id":"t_o_2015","text":"شكوى","points":0},{"id":"t_o_2016","text":"اقتراح","points":0},{"id":"t_o_2017","text":"استفسار","points":0},{"id":"t_o_2018","text":"شكر","points":0}],"order_index":2},{"id":"t_q_1019","text":"تفاصيل الرسالة","type":"textarea","required":true,"points":0,"options":[],"order_index":3},{"id":"t_q_1020","text":"هل ترغب في أن يتواصل معك فريقنا؟","type":"single_choice","required":true,"points":0,"options":[{"id":"t_o_2019","text":"نعم","points":0},{"id":"t_o_2020","text":"لا","points":0}],"order_index":4}]'::jsonb,
  '{"allow_multiple":true,"time_limit":null,"randomize_questions":false}'::jsonb,
  false, 12
),
(
  'تسجيل متطوعين',
  'استمارة تسجيل للراغبين في التطوع في المبادرات والفعاليات.',
  'registration',
  '[{"id":"t_q_1021","text":"الاسم الثلاثي","type":"text","required":true,"points":0,"options":[],"order_index":0},{"id":"t_q_1022","text":"تاريخ الميلاد","type":"date","required":true,"points":0,"options":[],"order_index":1},{"id":"t_q_1023","text":"مجالات التطوع المفضلة","type":"multiple_choice","required":true,"points":0,"options":[{"id":"t_o_2021","text":"التنظيم الميداني","points":0},{"id":"t_o_2022","text":"التسويق والإعلام","points":0},{"id":"t_o_2023","text":"الترجمة","points":0},{"id":"t_o_2024","text":"الدعم اللوجستي","points":0}],"order_index":2},{"id":"t_q_1024","text":"هل لديك خبرة سابقة في التطوع؟","type":"single_choice","required":true,"points":0,"options":[{"id":"t_o_2025","text":"نعم","points":0},{"id":"t_o_2026","text":"لا","points":0}],"order_index":3},{"id":"t_q_1025","text":"أيام التفرغ المتاحة","type":"multiple_choice","required":true,"points":0,"options":[{"id":"t_o_2027","text":"السبت","points":0},{"id":"t_o_2028","text":"الأحد","points":0},{"id":"t_o_2029","text":"الإثنين","points":0},{"id":"t_o_2030","text":"الثلاثاء","points":0},{"id":"t_o_2031","text":"الأربعاء","points":0},{"id":"t_o_2032","text":"الخميس","points":0},{"id":"t_o_2033","text":"الجمعة","points":0}],"order_index":4}]'::jsonb,
  '{"allow_multiple":true,"time_limit":null,"randomize_questions":false}'::jsonb,
  false, 13
),
(
  'طلب تسعيرة مبدئية',
  'نموذج للشركات لتمكين العملاء من طلب عرض سعر للخدمات أو المنتجات.',
  'sales',
  '[{"id":"t_q_1026","text":"اسم الشركة / الفرد","type":"text","required":true,"points":0,"options":[],"order_index":0},{"id":"t_q_1027","text":"البريد الإلكتروني للرد","type":"text","required":true,"points":0,"options":[],"order_index":1},{"id":"t_q_1028","text":"رقم الجوال","type":"text","required":true,"points":0,"options":[],"order_index":2},{"id":"t_q_1029","text":"الخدمة / المنتج المطلوب تسعيره","type":"textarea","required":true,"points":0,"options":[],"order_index":3},{"id":"t_q_1030","text":"الميزانية المتوقعة","type":"dropdown","required":false,"points":0,"options":[{"id":"t_o_2034","text":"أقل من 1000","points":0},{"id":"t_o_2035","text":"1000 - 5000","points":0},{"id":"t_o_2036","text":"5000 - 10000","points":0},{"id":"t_o_2037","text":"أكثر من 10000","points":0},{"id":"t_o_2038","text":"غير محدد","points":0}],"order_index":4,"dropdown_type":"single"}]'::jsonb,
  '{"allow_multiple":true,"time_limit":null,"randomize_questions":false}'::jsonb,
  false, 14
),
(
  'تسجيل مدرسة / روضة',
  'نموذج مبدئي لتسجيل الطلاب في المدارس أو رياض الأطفال.',
  'education',
  '[{"id":"t_q_1031","text":"اسم الطالب رباعي","type":"text","required":true,"points":0,"options":[],"order_index":0},{"id":"t_q_1032","text":"تاريخ ميلاد الطالب","type":"date","required":true,"points":0,"options":[],"order_index":1},{"id":"t_q_1033","text":"المرحلة الدراسية المطلوبة","type":"dropdown","required":true,"points":0,"options":[{"id":"t_o_2039","text":"روضة 1","points":0},{"id":"t_o_2040","text":"روضة 2","points":0},{"id":"t_o_2041","text":"الابتدائية","points":0},{"id":"t_o_2042","text":"الإعدادية","points":0},{"id":"t_o_2043","text":"الثانوية","points":0}],"order_index":2,"dropdown_type":"single"},{"id":"t_q_1034","text":"اسم ولي الأمر","type":"text","required":true,"points":0,"options":[],"order_index":3},{"id":"t_q_1035","text":"رقم هاتف ولي الأمر","type":"text","required":true,"points":0,"options":[],"order_index":4},{"id":"t_q_1036","text":"هل يعاني الطالب من أي ظروف صحية خاصة؟","type":"textarea","required":false,"points":0,"options":[],"order_index":5}]'::jsonb,
  '{"allow_multiple":true,"time_limit":null,"randomize_questions":false}'::jsonb,
  false, 15
),
(
  'طلب صيانة فنية',
  'استمارة للإبلاغ عن الأعطال وطلب فريق الصيانة.',
  'service',
  '[{"id":"t_q_1037","text":"اسم مقدم الطلب","type":"text","required":true,"points":0,"options":[],"order_index":0},{"id":"t_q_1038","text":"رقم الوحدة / القسم","type":"text","required":true,"points":0,"options":[],"order_index":1},{"id":"t_q_1039","text":"نوع العطل","type":"single_choice","required":true,"points":0,"options":[{"id":"t_o_2044","text":"كهرباء","points":0},{"id":"t_o_2045","text":"سباكة","points":0},{"id":"t_o_2046","text":"تكييف","points":0},{"id":"t_o_2047","text":"أجهزة إلكترونية","points":0},{"id":"t_o_2048","text":"أخرى","points":0}],"order_index":2},{"id":"t_q_1040","text":"وصف العطل بالتفصيل","type":"textarea","required":true,"points":0,"options":[],"order_index":3},{"id":"t_q_1041","text":"درجة الأهمية","type":"single_choice","required":true,"points":0,"options":[{"id":"t_o_2049","text":"عاجل جداً","points":0},{"id":"t_o_2050","text":"عادي","points":0},{"id":"t_o_2051","text":"منخفض","points":0}],"order_index":4}]'::jsonb,
  '{"allow_multiple":true,"time_limit":null,"randomize_questions":false}'::jsonb,
  false, 16
),
(
  'تقييم أداء موظف',
  'نموذج دوري للمدراء لتقييم أداء أعضاء الفريق.',
  'employment',
  '[{"id":"t_q_1042","text":"اسم الموظف المقيَّم","type":"text","required":true,"points":0,"options":[],"order_index":0},{"id":"t_q_1043","text":"القسم / الإدارة","type":"text","required":true,"points":0,"options":[],"order_index":1},{"id":"t_q_1044","text":"جودة العمل المنجز","type":"scale","required":true,"points":0,"options":[{"id":"t_o_2052","text":"1","points":1},{"id":"t_o_2053","text":"2","points":2},{"id":"t_o_2054","text":"3","points":3},{"id":"t_o_2055","text":"4","points":4},{"id":"t_o_2056","text":"5","points":5},{"id":"t_o_2057","text":"6","points":6},{"id":"t_o_2058","text":"7","points":7},{"id":"t_o_2059","text":"8","points":8},{"id":"t_o_2060","text":"9","points":9},{"id":"t_o_2061","text":"10","points":10}],"order_index":2},{"id":"t_q_1045","text":"الالتزام بالمواعيد","type":"scale","required":true,"points":0,"options":[{"id":"t_o_2062","text":"1","points":1},{"id":"t_o_2063","text":"2","points":2},{"id":"t_o_2064","text":"3","points":3},{"id":"t_o_2065","text":"4","points":4},{"id":"t_o_2066","text":"5","points":5},{"id":"t_o_2067","text":"6","points":6},{"id":"t_o_2068","text":"7","points":7},{"id":"t_o_2069","text":"8","points":8},{"id":"t_o_2070","text":"9","points":9},{"id":"t_o_2071","text":"10","points":10}],"order_index":3},{"id":"t_q_1046","text":"التعاون مع الزملاء","type":"scale","required":true,"points":0,"options":[{"id":"t_o_2072","text":"1","points":1},{"id":"t_o_2073","text":"2","points":2},{"id":"t_o_2074","text":"3","points":3},{"id":"t_o_2075","text":"4","points":4},{"id":"t_o_2076","text":"5","points":5},{"id":"t_o_2077","text":"6","points":6},{"id":"t_o_2078","text":"7","points":7},{"id":"t_o_2079","text":"8","points":8},{"id":"t_o_2080","text":"9","points":9},{"id":"t_o_2081","text":"10","points":10}],"order_index":4},{"id":"t_q_1047","text":"نقاط القوة","type":"textarea","required":true,"points":0,"options":[],"order_index":5},{"id":"t_q_1048","text":"مجالات تحتاج إلى تطوير","type":"textarea","required":true,"points":0,"options":[],"order_index":6}]'::jsonb,
  '{"allow_multiple":true,"time_limit":null,"randomize_questions":false}'::jsonb,
  false, 17
),
(
  'طلب تمويل عقاري',
  'استمارة مبدئية للبنوك وشركات التمويل لجمع بيانات العميل.',
  'finance',
  '[{"id":"t_q_1049","text":"الاسم الكامل للعميل","type":"text","required":true,"points":0,"options":[],"order_index":0},{"id":"t_q_1050","text":"رقم الهوية / الإقامة","type":"text","required":true,"points":0,"options":[],"order_index":1},{"id":"t_q_1051","text":"جهة العمل","type":"single_choice","required":true,"points":0,"options":[{"id":"t_o_2082","text":"حكومي","points":0},{"id":"t_o_2083","text":"شبه حكومي","points":0},{"id":"t_o_2084","text":"قطاع خاص","points":0},{"id":"t_o_2085","text":"عسكري","points":0},{"id":"t_o_2086","text":"أعمال حرة","points":0}],"order_index":2},{"id":"t_q_1052","text":"الدخل الشهري التقريبي","type":"text","required":true,"points":0,"options":[],"order_index":3},{"id":"t_q_1053","text":"هل يوجد التزامات بنكية أخرى؟","type":"single_choice","required":true,"points":0,"options":[{"id":"t_o_2087","text":"نعم","points":0},{"id":"t_o_2088","text":"لا","points":0}],"order_index":4},{"id":"t_q_1054","text":"قيمة العقار المراد تمويله","type":"text","required":true,"points":0,"options":[],"order_index":5}]'::jsonb,
  '{"allow_multiple":true,"time_limit":null,"randomize_questions":false}'::jsonb,
  false, 18
),
(
  'حجز قاعة أفراح / مناسبات',
  'نموذج لحجز وتأكيد مواعيد القاعات والمناسبات.',
  'booking',
  '[{"id":"t_q_1055","text":"الاسم","type":"text","required":true,"points":0,"options":[],"order_index":0},{"id":"t_q_1056","text":"رقم التواصل","type":"text","required":true,"points":0,"options":[],"order_index":1},{"id":"t_q_1057","text":"تاريخ المناسبة","type":"date","required":true,"points":0,"options":[],"order_index":2},{"id":"t_q_1058","text":"نوع المناسبة","type":"single_choice","required":true,"points":0,"options":[{"id":"t_o_2089","text":"حفل زفاف","points":0},{"id":"t_o_2090","text":"خطوبة","points":0},{"id":"t_o_2091","text":"حفل تخرج","points":0},{"id":"t_o_2092","text":"مؤتمر/ندوة","points":0},{"id":"t_o_2093","text":"أخرى","points":0}],"order_index":3},{"id":"t_q_1059","text":"عدد الحضور المتوقع","type":"dropdown","required":true,"points":0,"options":[{"id":"t_o_2094","text":"50 - 100","points":0},{"id":"t_o_2095","text":"100 - 300","points":0},{"id":"t_o_2096","text":"300 - 500","points":0},{"id":"t_o_2097","text":"أكثر من 500","points":0}],"order_index":4,"dropdown_type":"single"},{"id":"t_q_1060","text":"الخدمات الإضافية المطلوبة","type":"multiple_choice","required":false,"points":0,"options":[{"id":"t_o_2098","text":"بوفيه طعام","points":0},{"id":"t_o_2099","text":"تصوير","points":0},{"id":"t_o_2100","text":"تنسيق زهور","points":0},{"id":"t_o_2101","text":"دي جي / إضاءة","points":0}],"order_index":5}]'::jsonb,
  '{"allow_multiple":true,"time_limit":null,"randomize_questions":false}'::jsonb,
  false, 19
),
(
  'تسجيل موردين / شركات',
  'استمارة لتسجيل بيانات الشركات الموردة الراغبة في التعاون.',
  'business',
  '[{"id":"t_q_1061","text":"اسم الشركة الموردة","type":"text","required":true,"points":0,"options":[],"order_index":0},{"id":"t_q_1062","text":"رقم السجل التجاري","type":"text","required":true,"points":0,"options":[],"order_index":1},{"id":"t_q_1063","text":"مجال التوريد / الخدمات","type":"textarea","required":true,"points":0,"options":[],"order_index":2},{"id":"t_q_1064","text":"البريد الإلكتروني للشركة","type":"text","required":true,"points":0,"options":[],"order_index":3},{"id":"t_q_1065","text":"رقم هاتف مسؤول التواصل","type":"text","required":true,"points":0,"options":[],"order_index":4},{"id":"t_q_1066","text":"هل توجد شهادات أيزو أو اعتمادات دولية؟","type":"textarea","required":false,"points":0,"options":[],"order_index":5}]'::jsonb,
  '{"allow_multiple":true,"time_limit":null,"randomize_questions":false}'::jsonb,
  false, 20
),
(
  'نموذج إرجاع / استبدال منتج',
  'استمارة لخدمة العملاء خاصة بطلبات إرجاع أو استبدال المنتجات.',
  'sales',
  '[{"id":"t_q_1067","text":"الاسم الكامل","type":"text","required":true,"points":0,"options":[],"order_index":0},{"id":"t_q_1068","text":"رقم الطلب","type":"text","required":true,"points":0,"options":[],"order_index":1},{"id":"t_q_1069","text":"نوع الطلب","type":"single_choice","required":true,"points":0,"options":[{"id":"t_o_2102","text":"إرجاع منتج واسترداد المبلغ","points":0},{"id":"t_o_2103","text":"استبدال بمنتج آخر","points":0}],"order_index":2},{"id":"t_q_1070","text":"سبب الإرجاع / الاستبدال","type":"multiple_choice","required":true,"points":0,"options":[{"id":"t_o_2104","text":"مقاس خاطئ","points":0},{"id":"t_o_2105","text":"المنتج تالف","points":0},{"id":"t_o_2106","text":"لا يشبه الصورة","points":0},{"id":"t_o_2107","text":"لم أعد بحاجة إليه","points":0},{"id":"t_o_2108","text":"أخرى","points":0}],"order_index":3},{"id":"t_q_1071","text":"تفاصيل إضافية عن حالة المنتج","type":"textarea","required":true,"points":0,"options":[],"order_index":4}]'::jsonb,
  '{"allow_multiple":true,"time_limit":null,"randomize_questions":false}'::jsonb,
  false, 21
),
(
  'حجز رحلة سياحية',
  'نموذج لشركات السياحة والسفر لجمع بيانات العملاء الراغبين في حجز برامج سياحية.',
  'booking',
  '[{"id":"t_q_1072","text":"الاسم بالكامل كما في الجواز","type":"text","required":true,"points":0,"options":[],"order_index":0},{"id":"t_q_1073","text":"رقم جواز السفر","type":"text","required":true,"points":0,"options":[],"order_index":1},{"id":"t_q_1074","text":"الوجهة السياحية المفضلة","type":"text","required":true,"points":0,"options":[],"order_index":2},{"id":"t_q_1075","text":"تاريخ السفر المقترح","type":"date","required":true,"points":0,"options":[],"order_index":3},{"id":"t_q_1076","text":"عدد المسافرين البالغين","type":"dropdown","required":true,"points":0,"options":[{"id":"t_o_2109","text":"1","points":0},{"id":"t_o_2110","text":"2","points":0},{"id":"t_o_2111","text":"3","points":0},{"id":"t_o_2112","text":"4","points":0},{"id":"t_o_2113","text":"5+","points":0}],"order_index":4,"dropdown_type":"single"},{"id":"t_q_1077","text":"عدد الأطفال","type":"dropdown","required":true,"points":0,"options":[{"id":"t_o_2114","text":"0","points":0},{"id":"t_o_2115","text":"1","points":0},{"id":"t_o_2116","text":"2","points":0},{"id":"t_o_2117","text":"3","points":0},{"id":"t_o_2118","text":"4+","points":0}],"order_index":5,"dropdown_type":"single"},{"id":"t_q_1078","text":"نوع الإقامة المطلوبة","type":"single_choice","required":true,"points":0,"options":[{"id":"t_o_2119","text":"فندق 3 نجوم","points":0},{"id":"t_o_2120","text":"فندق 4 نجوم","points":0},{"id":"t_o_2121","text":"فندق 5 نجوم","points":0},{"id":"t_o_2122","text":"شقق فندقية","points":0}],"order_index":6}]'::jsonb,
  '{"allow_multiple":true,"time_limit":null,"randomize_questions":false}'::jsonb,
  false, 22
),
(
  'استبيان أبحاث السوق',
  'نموذج مخصص للشركات لاختبار المنتجات الجديدة وجمع آراء الشريحة المستهدفة.',
  'survey',
  '[{"id":"t_q_1079","text":"الفئة العمرية","type":"single_choice","required":true,"points":0,"options":[{"id":"t_o_2123","text":"18-24","points":0},{"id":"t_o_2124","text":"25-34","points":0},{"id":"t_o_2125","text":"35-44","points":0},{"id":"t_o_2126","text":"45+","points":0}],"order_index":0},{"id":"t_q_1080","text":"ما هو مدى اهتمامك بالمنتجات التقنية الجديدة؟","type":"scale","required":true,"points":0,"options":[{"id":"t_o_2127","text":"1","points":1},{"id":"t_o_2128","text":"2","points":2},{"id":"t_o_2129","text":"3","points":3},{"id":"t_o_2130","text":"4","points":4},{"id":"t_o_2131","text":"5","points":5},{"id":"t_o_2132","text":"6","points":6},{"id":"t_o_2133","text":"7","points":7},{"id":"t_o_2134","text":"8","points":8},{"id":"t_o_2135","text":"9","points":9},{"id":"t_o_2136","text":"10","points":10}],"order_index":1},{"id":"t_q_1081","text":"ما هو العامل الأهم عند الشراء؟","type":"single_choice","required":true,"points":0,"options":[{"id":"t_o_2137","text":"السعر","points":0},{"id":"t_o_2138","text":"الجودة","points":0},{"id":"t_o_2139","text":"العلامة التجارية","points":0},{"id":"t_o_2140","text":"خدمة ما بعد البيع","points":0}],"order_index":2},{"id":"t_q_1082","text":"ما هي المنتجات التي تتمنى أن تتوفر في السوق ولم تجدها؟","type":"textarea","required":false,"points":0,"options":[],"order_index":3}]'::jsonb,
  '{"allow_multiple":true,"time_limit":null,"randomize_questions":false}'::jsonb,
  false, 23
),
(
  'طلب استشارة قانونية',
  'نموذج لشركات المحاماة يتيح للعملاء طلب استشارة وتوضيح قضيتهم.',
  'service',
  '[{"id":"t_q_1083","text":"الاسم الثلاثي","type":"text","required":true,"points":0,"options":[],"order_index":0},{"id":"t_q_1084","text":"رقم الهاتف للتواصل","type":"text","required":true,"points":0,"options":[],"order_index":1},{"id":"t_q_1085","text":"نوع الاستشارة","type":"single_choice","required":true,"points":0,"options":[{"id":"t_o_2141","text":"قضايا عمالية","points":0},{"id":"t_o_2142","text":"قضايا أحوال شخصية (طلاق/نفقة)","points":0},{"id":"t_o_2143","text":"قضايا تجارية وشركات","points":0},{"id":"t_o_2144","text":"قضايا جنائية","points":0},{"id":"t_o_2145","text":"أخرى","points":0}],"order_index":2},{"id":"t_q_1086","text":"ملخص القضية / المشكلة","type":"textarea","required":true,"points":0,"options":[],"order_index":3},{"id":"t_q_1087","text":"هل لديك مستندات متعلقة بالقضية؟","type":"single_choice","required":true,"points":0,"options":[{"id":"t_o_2146","text":"نعم، جاهزة","points":0},{"id":"t_o_2147","text":"لا","points":0},{"id":"t_o_2148","text":"بعضها","points":0}],"order_index":4}]'::jsonb,
  '{"allow_multiple":true,"time_limit":null,"randomize_questions":false}'::jsonb,
  false, 24
),
(
  'تسجيل في مسابقة رياضية',
  'استمارة لتسجيل المشاركين في البطولات والمسابقات الرياضية.',
  'event',
  '[{"id":"t_q_1088","text":"اسم المشارك / الفريق","type":"text","required":true,"points":0,"options":[],"order_index":0},{"id":"t_q_1089","text":"رقم الهاتف","type":"text","required":true,"points":0,"options":[],"order_index":1},{"id":"t_q_1090","text":"الرياضة أو الفئة","type":"dropdown","required":true,"points":0,"options":[{"id":"t_o_2149","text":"كرة قدم","points":0},{"id":"t_o_2150","text":"كرة سلة","points":0},{"id":"t_o_2151","text":"سباحة","points":0},{"id":"t_o_2152","text":"جري / ماراثون","points":0},{"id":"t_o_2153","text":"بادل","points":0}],"order_index":2,"dropdown_type":"single"},{"id":"t_q_1091","text":"تاريخ الميلاد","type":"date","required":true,"points":0,"options":[],"order_index":3},{"id":"t_q_1092","text":"هل تعاني من أي أمراض تمنع المجهود البدني؟","type":"single_choice","required":true,"points":0,"options":[{"id":"t_o_2154","text":"نعم","points":0},{"id":"t_o_2155","text":"لا","points":0}],"order_index":4}]'::jsonb,
  '{"allow_multiple":true,"time_limit":null,"randomize_questions":false}'::jsonb,
  false, 25
),
(
  'استمارة تبرع وكفالة',
  'نموذج للجمعيات الخيرية لجمع بيانات المتبرعين والبرامج المطلوبة.',
  'finance',
  '[{"id":"t_q_1093","text":"اسم المتبرع (اختياري)","type":"text","required":false,"points":0,"options":[],"order_index":0},{"id":"t_q_1094","text":"رقم الجوال","type":"text","required":true,"points":0,"options":[],"order_index":1},{"id":"t_q_1095","text":"نوع التبرع","type":"single_choice","required":true,"points":0,"options":[{"id":"t_o_2156","text":"كفالة يتيم","points":0},{"id":"t_o_2157","text":"بناء مسجد","points":0},{"id":"t_o_2158","text":"سقيا ماء","points":0},{"id":"t_o_2159","text":"صدقة جارية","points":0},{"id":"t_o_2160","text":"زكاة مال","points":0}],"order_index":2},{"id":"t_q_1096","text":"المبلغ المراد التبرع به","type":"text","required":true,"points":0,"options":[],"order_index":3},{"id":"t_q_1097","text":"طريقة الدفع","type":"single_choice","required":true,"points":0,"options":[{"id":"t_o_2161","text":"تحويل بنكي","points":0},{"id":"t_o_2162","text":"بطاقة فيزا/مدى","points":0},{"id":"t_o_2163","text":"استقطاع شهري","points":0}],"order_index":4}]'::jsonb,
  '{"allow_multiple":true,"time_limit":null,"randomize_questions":false}'::jsonb,
  false, 26
),
(
  'نموذج طلب وكالة / امتياز تجاري',
  'استمارة خاصة بالشركات والمطاعم لمنح حق الامتياز التجاري (الفرنشايز).',
  'business',
  '[{"id":"t_q_1098","text":"اسم مقدم الطلب","type":"text","required":true,"points":0,"options":[],"order_index":0},{"id":"t_q_1099","text":"المدينة المقترحة للافتتاح","type":"text","required":true,"points":0,"options":[],"order_index":1},{"id":"t_q_1100","text":"هل تمتلك خبرة سابقة في إدارة الأعمال؟","type":"single_choice","required":true,"points":0,"options":[{"id":"t_o_2164","text":"نعم","points":0},{"id":"t_o_2165","text":"لا","points":0}],"order_index":2},{"id":"t_q_1101","text":"هل يوجد موقع جاهز للمشروع؟","type":"single_choice","required":true,"points":0,"options":[{"id":"t_o_2166","text":"نعم، الموقع مستأجر/مملوك","points":0},{"id":"t_o_2167","text":"لا، قيد البحث","points":0}],"order_index":3},{"id":"t_q_1102","text":"حجم الميزانية الاستثمارية المتوفرة","type":"dropdown","required":true,"points":0,"options":[{"id":"t_o_2168","text":"أقل من 500 ألف","points":0},{"id":"t_o_2169","text":"500 ألف - مليون","points":0},{"id":"t_o_2170","text":"أكثر من مليون","points":0}],"order_index":4,"dropdown_type":"single"}]'::jsonb,
  '{"allow_multiple":true,"time_limit":null,"randomize_questions":false}'::jsonb,
  false, 27
),
(
  'طلب الانضمام كشريك توصيل',
  'استمارة تسجيل لمناديب التوصيل الجدد في تطبيقات التوصيل.',
  'employment',
  '[{"id":"t_q_1103","text":"الاسم الكامل","type":"text","required":true,"points":0,"options":[],"order_index":0},{"id":"t_q_1104","text":"رقم الهوية / الإقامة","type":"text","required":true,"points":0,"options":[],"order_index":1},{"id":"t_q_1105","text":"نوع المركبة","type":"single_choice","required":true,"points":0,"options":[{"id":"t_o_2171","text":"سيارة سيدان","points":0},{"id":"t_o_2172","text":"سيارة عائلية","points":0},{"id":"t_o_2173","text":"دراجة نارية","points":0},{"id":"t_o_2174","text":"شاحنة صغيرة","points":0}],"order_index":2},{"id":"t_q_1106","text":"موديل وسنة صنع المركبة","type":"text","required":true,"points":0,"options":[],"order_index":3},{"id":"t_q_1107","text":"المدينة التي ترغب بالعمل فيها","type":"text","required":true,"points":0,"options":[],"order_index":4},{"id":"t_q_1108","text":"هل رخصة القيادة سارية المفعول؟","type":"single_choice","required":true,"points":0,"options":[{"id":"t_o_2175","text":"نعم","points":0},{"id":"t_o_2176","text":"لا","points":0}],"order_index":5}]'::jsonb,
  '{"allow_multiple":true,"time_limit":null,"randomize_questions":false}'::jsonb,
  false, 28
)
ON CONFLICT (id) DO NOTHING;


-- 2 Additional Templates (Requested by user)
INSERT INTO form_templates (name, description, category, questions_data, form_settings, is_featured, sort_order) VALUES
(
  'تقييم مطعم / مقهى',
  'نموذج مخصص لأصحاب المطاعم والمقاهي لقياس رضا الزوار عن جودة الطعام والخدمة.',
  'survey',
  '[{"id":"t_q_3000","text":"الفرع الذي قمت بزيارته","type":"dropdown","required":true,"points":0,"options":[{"id":"t_o_4000","text":"الفرع الرئيسي","points":0},{"id":"t_o_4001","text":"فرع المول","points":0},{"id":"t_o_4002","text":"فرع الكورنيش","points":0}],"order_index":0,"dropdown_type":"single"},{"id":"t_q_3001","text":"كيف تقيم جودة ومذاق الطعام؟","type":"scale","required":true,"points":0,"options":[{"id":"t_o_4003","text":"1","points":1},{"id":"t_o_4004","text":"2","points":2},{"id":"t_o_4005","text":"3","points":3},{"id":"t_o_4006","text":"4","points":4},{"id":"t_o_4007","text":"5","points":5}],"order_index":1},{"id":"t_q_3002","text":"كيف تقيم سرعة تقديم الخدمة؟","type":"scale","required":true,"points":0,"options":[{"id":"t_o_4008","text":"1","points":1},{"id":"t_o_4009","text":"2","points":2},{"id":"t_o_4010","text":"3","points":3},{"id":"t_o_4011","text":"4","points":4},{"id":"t_o_4012","text":"5","points":5}],"order_index":2},{"id":"t_q_3003","text":"كيف تقيم نظافة المكان؟","type":"scale","required":true,"points":0,"options":[{"id":"t_o_4013","text":"1","points":1},{"id":"t_o_4014","text":"2","points":2},{"id":"t_o_4015","text":"3","points":3},{"id":"t_o_4016","text":"4","points":4},{"id":"t_o_4017","text":"5","points":5}],"order_index":3},{"id":"t_q_3004","text":"هل واجهتك أي مشكلة أثناء زيارتك؟","type":"textarea","required":false,"points":0,"options":[],"order_index":4},{"id":"t_q_3005","text":"ما هو الطبق المفضل لديك من قائمتنا؟","type":"text","required":false,"points":0,"options":[],"order_index":5}]'::jsonb,
  '{"allow_multiple":true,"time_limit":null,"randomize_questions":false}'::jsonb,
  false, 29
),
(
  'اشتراك في نادي رياضي (جيم)',
  'استمارة تسجيل عضوية جديدة في الأندية الرياضية ومراكز اللياقة البدنية.',
  'registration',
  '[{"id":"t_q_3006","text":"الاسم الثلاثي","type":"text","required":true,"points":0,"options":[],"order_index":0},{"id":"t_q_3007","text":"رقم الجوال","type":"text","required":true,"points":0,"options":[],"order_index":1},{"id":"t_q_3008","text":"الوزن الحالي (كجم)","type":"text","required":true,"points":0,"options":[],"order_index":2},{"id":"t_q_3009","text":"الطول (سم)","type":"text","required":true,"points":0,"options":[],"order_index":3},{"id":"t_q_3010","text":"نوع الاشتراك المطلوب","type":"single_choice","required":true,"points":0,"options":[{"id":"t_o_4018","text":"شهر واحد","points":0},{"id":"t_o_4019","text":"3 أشهر","points":0},{"id":"t_o_4020","text":"6 أشهر","points":0},{"id":"t_o_4021","text":"سنة كاملة","points":0}],"order_index":4},{"id":"t_q_3011","text":"هل ترغب في الحصول على مدرب شخصي (PT)؟","type":"single_choice","required":true,"points":0,"options":[{"id":"t_o_4022","text":"نعم","points":0},{"id":"t_o_4023","text":"لا","points":0}],"order_index":5},{"id":"t_q_3012","text":"هل تعاني من أي إصابات أو أمراض مزمنة؟ (الرجاء التوضيح)","type":"textarea","required":false,"points":0,"options":[],"order_index":6}]'::jsonb,
  '{"allow_multiple":true,"time_limit":null,"randomize_questions":false}'::jsonb,
  false, 30
)
ON CONFLICT (id) DO NOTHING;
