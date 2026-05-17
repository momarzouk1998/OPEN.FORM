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
