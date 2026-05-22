const fs = require('fs');
const path = require('path');

const templates = [
  {
    name: 'طلب شراء منتجات',
    description: 'نموذج لطلب المنتجات للشركات والمتاجر مع تفاصيل الشحن.',
    category: 'sales',
    questions: [
      { text: 'الاسم الكامل', type: 'text', required: true },
      { text: 'رقم الهاتف للتواصل', type: 'text', required: true },
      { text: 'عنوان التوصيل بالكامل', type: 'textarea', required: true },
      { text: 'المنتجات المطلوبة', type: 'textarea', required: true },
      { text: 'طريقة الدفع المفضلة', type: 'single_choice', required: true, options: ['الدفع عند الاستلام', 'بطاقة ائتمانية', 'تحويل بنكي'] }
    ],
    sort_order: 9
  },
  {
    name: 'تأكيد حضور فعالية',
    description: 'استمارة إلكترونية لتسجيل الحضور وتأكيد التواجد في الفعاليات والمؤتمرات.',
    category: 'event',
    questions: [
      { text: 'اسم الحاضر', type: 'text', required: true },
      { text: 'البريد الإلكتروني', type: 'text', required: true },
      { text: 'هل ستتمكن من الحضور؟', type: 'single_choice', required: true, options: ['نعم، سأحضر', 'أعتذر عن الحضور', 'غير متأكد بعد'] },
      { text: 'عدد المرافقين', type: 'dropdown', required: false, options: ['0', '1', '2', '3', 'أكثر من 3'] },
      { text: 'هل لديك متطلبات غذائية خاصة؟ (نباتي، حساسية...)', type: 'textarea', required: false }
    ],
    sort_order: 10
  },
  {
    name: 'طلب إجازة للموظفين',
    description: 'نموذج داخلي للموارد البشرية لتقديم طلبات الإجازات.',
    category: 'employment',
    questions: [
      { text: 'اسم الموظف', type: 'text', required: true },
      { text: 'الرقم الوظيفي', type: 'text', required: true },
      { text: 'نوع الإجازة', type: 'single_choice', required: true, options: ['إجازة سنوية', 'إجازة مرضية', 'إجازة طارئة', 'أخرى'] },
      { text: 'تاريخ بداية الإجازة', type: 'date', required: true },
      { text: 'تاريخ نهاية الإجازة', type: 'date', required: true },
      { text: 'سبب الإجازة / ملاحظات', type: 'textarea', required: false }
    ],
    sort_order: 11
  },
  {
    name: 'شكاوى واقتراحات العملاء',
    description: 'نموذج لجمع شكاوى ومقترحات العملاء لتحسين جودة الخدمة.',
    category: 'survey',
    questions: [
      { text: 'الاسم (اختياري)', type: 'text', required: false },
      { text: 'رقم الهاتف (اختياري)', type: 'text', required: false },
      { text: 'نوع الرسالة', type: 'single_choice', required: true, options: ['شكوى', 'اقتراح', 'استفسار', 'شكر'] },
      { text: 'تفاصيل الرسالة', type: 'textarea', required: true },
      { text: 'هل ترغب في أن يتواصل معك فريقنا؟', type: 'single_choice', required: true, options: ['نعم', 'لا'] }
    ],
    sort_order: 12
  },
  {
    name: 'تسجيل متطوعين',
    description: 'استمارة تسجيل للراغبين في التطوع في المبادرات والفعاليات.',
    category: 'registration',
    questions: [
      { text: 'الاسم الثلاثي', type: 'text', required: true },
      { text: 'تاريخ الميلاد', type: 'date', required: true },
      { text: 'مجالات التطوع المفضلة', type: 'multiple_choice', required: true, options: ['التنظيم الميداني', 'التسويق والإعلام', 'الترجمة', 'الدعم اللوجستي'] },
      { text: 'هل لديك خبرة سابقة في التطوع؟', type: 'single_choice', required: true, options: ['نعم', 'لا'] },
      { text: 'أيام التفرغ المتاحة', type: 'multiple_choice', required: true, options: ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'] }
    ],
    sort_order: 13
  },
  {
    name: 'طلب تسعيرة مبدئية',
    description: 'نموذج للشركات لتمكين العملاء من طلب عرض سعر للخدمات أو المنتجات.',
    category: 'sales',
    questions: [
      { text: 'اسم الشركة / الفرد', type: 'text', required: true },
      { text: 'البريد الإلكتروني للرد', type: 'text', required: true },
      { text: 'رقم الجوال', type: 'text', required: true },
      { text: 'الخدمة / المنتج المطلوب تسعيره', type: 'textarea', required: true },
      { text: 'الميزانية المتوقعة', type: 'dropdown', required: false, options: ['أقل من 1000', '1000 - 5000', '5000 - 10000', 'أكثر من 10000', 'غير محدد'] }
    ],
    sort_order: 14
  },
  {
    name: 'تسجيل مدرسة / روضة',
    description: 'نموذج مبدئي لتسجيل الطلاب في المدارس أو رياض الأطفال.',
    category: 'education',
    questions: [
      { text: 'اسم الطالب رباعي', type: 'text', required: true },
      { text: 'تاريخ ميلاد الطالب', type: 'date', required: true },
      { text: 'المرحلة الدراسية المطلوبة', type: 'dropdown', required: true, options: ['روضة 1', 'روضة 2', 'الابتدائية', 'الإعدادية', 'الثانوية'] },
      { text: 'اسم ولي الأمر', type: 'text', required: true },
      { text: 'رقم هاتف ولي الأمر', type: 'text', required: true },
      { text: 'هل يعاني الطالب من أي ظروف صحية خاصة؟', type: 'textarea', required: false }
    ],
    sort_order: 15
  },
  {
    name: 'طلب صيانة فنية',
    description: 'استمارة للإبلاغ عن الأعطال وطلب فريق الصيانة.',
    category: 'service',
    questions: [
      { text: 'اسم مقدم الطلب', type: 'text', required: true },
      { text: 'رقم الوحدة / القسم', type: 'text', required: true },
      { text: 'نوع العطل', type: 'single_choice', required: true, options: ['كهرباء', 'سباكة', 'تكييف', 'أجهزة إلكترونية', 'أخرى'] },
      { text: 'وصف العطل بالتفصيل', type: 'textarea', required: true },
      { text: 'درجة الأهمية', type: 'single_choice', required: true, options: ['عاجل جداً', 'عادي', 'منخفض'] }
    ],
    sort_order: 16
  },
  {
    name: 'تقييم أداء موظف',
    description: 'نموذج دوري للمدراء لتقييم أداء أعضاء الفريق.',
    category: 'employment',
    questions: [
      { text: 'اسم الموظف المقيَّم', type: 'text', required: true },
      { text: 'القسم / الإدارة', type: 'text', required: true },
      { text: 'جودة العمل المنجز', type: 'scale', required: true, options: ['1','2','3','4','5','6','7','8','9','10'] },
      { text: 'الالتزام بالمواعيد', type: 'scale', required: true, options: ['1','2','3','4','5','6','7','8','9','10'] },
      { text: 'التعاون مع الزملاء', type: 'scale', required: true, options: ['1','2','3','4','5','6','7','8','9','10'] },
      { text: 'نقاط القوة', type: 'textarea', required: true },
      { text: 'مجالات تحتاج إلى تطوير', type: 'textarea', required: true }
    ],
    sort_order: 17
  },
  {
    name: 'طلب تمويل عقاري',
    description: 'استمارة مبدئية للبنوك وشركات التمويل لجمع بيانات العميل.',
    category: 'finance',
    questions: [
      { text: 'الاسم الكامل للعميل', type: 'text', required: true },
      { text: 'رقم الهوية / الإقامة', type: 'text', required: true },
      { text: 'جهة العمل', type: 'single_choice', required: true, options: ['حكومي', 'شبه حكومي', 'قطاع خاص', 'عسكري', 'أعمال حرة'] },
      { text: 'الدخل الشهري التقريبي', type: 'text', required: true },
      { text: 'هل يوجد التزامات بنكية أخرى؟', type: 'single_choice', required: true, options: ['نعم', 'لا'] },
      { text: 'قيمة العقار المراد تمويله', type: 'text', required: true }
    ],
    sort_order: 18
  },
  {
    name: 'حجز قاعة أفراح / مناسبات',
    description: 'نموذج لحجز وتأكيد مواعيد القاعات والمناسبات.',
    category: 'booking',
    questions: [
      { text: 'الاسم', type: 'text', required: true },
      { text: 'رقم التواصل', type: 'text', required: true },
      { text: 'تاريخ المناسبة', type: 'date', required: true },
      { text: 'نوع المناسبة', type: 'single_choice', required: true, options: ['حفل زفاف', 'خطوبة', 'حفل تخرج', 'مؤتمر/ندوة', 'أخرى'] },
      { text: 'عدد الحضور المتوقع', type: 'dropdown', required: true, options: ['50 - 100', '100 - 300', '300 - 500', 'أكثر من 500'] },
      { text: 'الخدمات الإضافية المطلوبة', type: 'multiple_choice', required: false, options: ['بوفيه طعام', 'تصوير', 'تنسيق زهور', 'دي جي / إضاءة'] }
    ],
    sort_order: 19
  },
  {
    name: 'تسجيل موردين / شركات',
    description: 'استمارة لتسجيل بيانات الشركات الموردة الراغبة في التعاون.',
    category: 'business',
    questions: [
      { text: 'اسم الشركة الموردة', type: 'text', required: true },
      { text: 'رقم السجل التجاري', type: 'text', required: true },
      { text: 'مجال التوريد / الخدمات', type: 'textarea', required: true },
      { text: 'البريد الإلكتروني للشركة', type: 'text', required: true },
      { text: 'رقم هاتف مسؤول التواصل', type: 'text', required: true },
      { text: 'هل توجد شهادات أيزو أو اعتمادات دولية؟', type: 'textarea', required: false }
    ],
    sort_order: 20
  },
  {
    name: 'نموذج إرجاع / استبدال منتج',
    description: 'استمارة لخدمة العملاء خاصة بطلبات إرجاع أو استبدال المنتجات.',
    category: 'sales',
    questions: [
      { text: 'الاسم الكامل', type: 'text', required: true },
      { text: 'رقم الطلب', type: 'text', required: true },
      { text: 'نوع الطلب', type: 'single_choice', required: true, options: ['إرجاع منتج واسترداد المبلغ', 'استبدال بمنتج آخر'] },
      { text: 'سبب الإرجاع / الاستبدال', type: 'multiple_choice', required: true, options: ['مقاس خاطئ', 'المنتج تالف', 'لا يشبه الصورة', 'لم أعد بحاجة إليه', 'أخرى'] },
      { text: 'تفاصيل إضافية عن حالة المنتج', type: 'textarea', required: true }
    ],
    sort_order: 21
  },
  {
    name: 'حجز رحلة سياحية',
    description: 'نموذج لشركات السياحة والسفر لجمع بيانات العملاء الراغبين في حجز برامج سياحية.',
    category: 'booking',
    questions: [
      { text: 'الاسم بالكامل كما في الجواز', type: 'text', required: true },
      { text: 'رقم جواز السفر', type: 'text', required: true },
      { text: 'الوجهة السياحية المفضلة', type: 'text', required: true },
      { text: 'تاريخ السفر المقترح', type: 'date', required: true },
      { text: 'عدد المسافرين البالغين', type: 'dropdown', required: true, options: ['1','2','3','4','5+'] },
      { text: 'عدد الأطفال', type: 'dropdown', required: true, options: ['0','1','2','3','4+'] },
      { text: 'نوع الإقامة المطلوبة', type: 'single_choice', required: true, options: ['فندق 3 نجوم', 'فندق 4 نجوم', 'فندق 5 نجوم', 'شقق فندقية'] }
    ],
    sort_order: 22
  },
  {
    name: 'استبيان أبحاث السوق',
    description: 'نموذج مخصص للشركات لاختبار المنتجات الجديدة وجمع آراء الشريحة المستهدفة.',
    category: 'survey',
    questions: [
      { text: 'الفئة العمرية', type: 'single_choice', required: true, options: ['18-24', '25-34', '35-44', '45+'] },
      { text: 'ما هو مدى اهتمامك بالمنتجات التقنية الجديدة؟', type: 'scale', required: true, options: ['1','2','3','4','5','6','7','8','9','10'] },
      { text: 'ما هو العامل الأهم عند الشراء؟', type: 'single_choice', required: true, options: ['السعر', 'الجودة', 'العلامة التجارية', 'خدمة ما بعد البيع'] },
      { text: 'ما هي المنتجات التي تتمنى أن تتوفر في السوق ولم تجدها؟', type: 'textarea', required: false }
    ],
    sort_order: 23
  },
  {
    name: 'طلب استشارة قانونية',
    description: 'نموذج لشركات المحاماة يتيح للعملاء طلب استشارة وتوضيح قضيتهم.',
    category: 'service',
    questions: [
      { text: 'الاسم الثلاثي', type: 'text', required: true },
      { text: 'رقم الهاتف للتواصل', type: 'text', required: true },
      { text: 'نوع الاستشارة', type: 'single_choice', required: true, options: ['قضايا عمالية', 'قضايا أحوال شخصية (طلاق/نفقة)', 'قضايا تجارية وشركات', 'قضايا جنائية', 'أخرى'] },
      { text: 'ملخص القضية / المشكلة', type: 'textarea', required: true },
      { text: 'هل لديك مستندات متعلقة بالقضية؟', type: 'single_choice', required: true, options: ['نعم، جاهزة', 'لا', 'بعضها'] }
    ],
    sort_order: 24
  },
  {
    name: 'تسجيل في مسابقة رياضية',
    description: 'استمارة لتسجيل المشاركين في البطولات والمسابقات الرياضية.',
    category: 'event',
    questions: [
      { text: 'اسم المشارك / الفريق', type: 'text', required: true },
      { text: 'رقم الهاتف', type: 'text', required: true },
      { text: 'الرياضة أو الفئة', type: 'dropdown', required: true, options: ['كرة قدم', 'كرة سلة', 'سباحة', 'جري / ماراثون', 'بادل'] },
      { text: 'تاريخ الميلاد', type: 'date', required: true },
      { text: 'هل تعاني من أي أمراض تمنع المجهود البدني؟', type: 'single_choice', required: true, options: ['نعم', 'لا'] }
    ],
    sort_order: 25
  },
  {
    name: 'استمارة تبرع وكفالة',
    description: 'نموذج للجمعيات الخيرية لجمع بيانات المتبرعين والبرامج المطلوبة.',
    category: 'finance',
    questions: [
      { text: 'اسم المتبرع (اختياري)', type: 'text', required: false },
      { text: 'رقم الجوال', type: 'text', required: true },
      { text: 'نوع التبرع', type: 'single_choice', required: true, options: ['كفالة يتيم', 'بناء مسجد', 'سقيا ماء', 'صدقة جارية', 'زكاة مال'] },
      { text: 'المبلغ المراد التبرع به', type: 'text', required: true },
      { text: 'طريقة الدفع', type: 'single_choice', required: true, options: ['تحويل بنكي', 'بطاقة فيزا/مدى', 'استقطاع شهري'] }
    ],
    sort_order: 26
  },
  {
    name: 'نموذج طلب وكالة / امتياز تجاري',
    description: 'استمارة خاصة بالشركات والمطاعم لمنح حق الامتياز التجاري (الفرنشايز).',
    category: 'business',
    questions: [
      { text: 'اسم مقدم الطلب', type: 'text', required: true },
      { text: 'المدينة المقترحة للافتتاح', type: 'text', required: true },
      { text: 'هل تمتلك خبرة سابقة في إدارة الأعمال؟', type: 'single_choice', required: true, options: ['نعم', 'لا'] },
      { text: 'هل يوجد موقع جاهز للمشروع؟', type: 'single_choice', required: true, options: ['نعم، الموقع مستأجر/مملوك', 'لا، قيد البحث'] },
      { text: 'حجم الميزانية الاستثمارية المتوفرة', type: 'dropdown', required: true, options: ['أقل من 500 ألف', '500 ألف - مليون', 'أكثر من مليون'] }
    ],
    sort_order: 27
  },
  {
    name: 'طلب الانضمام كشريك توصيل',
    description: 'استمارة تسجيل لمناديب التوصيل الجدد في تطبيقات التوصيل.',
    category: 'employment',
    questions: [
      { text: 'الاسم الكامل', type: 'text', required: true },
      { text: 'رقم الهوية / الإقامة', type: 'text', required: true },
      { text: 'نوع المركبة', type: 'single_choice', required: true, options: ['سيارة سيدان', 'سيارة عائلية', 'دراجة نارية', 'شاحنة صغيرة'] },
      { text: 'موديل وسنة صنع المركبة', type: 'text', required: true },
      { text: 'المدينة التي ترغب بالعمل فيها', type: 'text', required: true },
      { text: 'هل رخصة القيادة سارية المفعول؟', type: 'single_choice', required: true, options: ['نعم', 'لا'] }
    ],
    sort_order: 28
  }
];

let qIdCount = 1000;
let oIdCount = 2000;

function buildSql(template) {
  const questionsJson = template.questions.map((q, i) => {
    const qObj = {
      id: "t_q_" + (qIdCount++),
      text: q.text,
      type: q.type,
      required: q.required,
      points: 0,
      options: [],
      order_index: i
    };
    if (q.options) {
      qObj.options = q.options.map((opt) => {
        const optionObj = {
          id: "t_o_" + (oIdCount++),
          text: opt,
          points: q.type === 'scale' ? parseInt(opt) : 0
        };
        return optionObj;
      });
      if (q.type === 'dropdown') {
        qObj.dropdown_type = 'single';
      }
    }
    return qObj;
  });

  const qJsonStr = JSON.stringify(questionsJson).replace(/'/g, "''");
  const formSettings = '{"allow_multiple":true,"time_limit":null,"randomize_questions":false}';
  
  return `(
  '${template.name}',
  '${template.description}',
  '${template.category}',
  '${qJsonStr}'::jsonb,
  '${formSettings}'::jsonb,
  false, ${template.sort_order}
)`;
}

const sqlValues = templates.map(buildSql).join(',\n');

const appendSql = `

-- 20 Additional Templates Generated by AI
INSERT INTO form_templates (name, description, category, questions_data, form_settings, is_featured, sort_order) VALUES
${sqlValues}
ON CONFLICT (id) DO NOTHING;
`;

const targetFile = path.join(__dirname, 'sql', '002_form_templates.sql');
fs.appendFileSync(targetFile, appendSql);
console.log('Successfully appended 20 templates to sql/002_form_templates.sql');
