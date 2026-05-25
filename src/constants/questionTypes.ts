export const QUESTION_TYPES: Record<string, { label: string; icon: string; description: string; explanation: string; category: string }> = {
  text: { label: 'نص', icon: 'T', description: 'إجابة نصية قصيرة', explanation: 'مثال: "ما اسمك؟"', category: 'basic' },
  textarea: { label: 'نص طويل', icon: '¶', description: 'إجابة مفصلة', explanation: 'مثال: "صف تجربتك"', category: 'basic' },
  single_choice: { label: 'اختيار واحد', icon: '○', description: 'اختيار إجابة واحدة', explanation: 'مثال: "نعم أو لا"', category: 'basic' },
  multiple_choice: { label: 'اختيار متعدد', icon: '☑', description: 'اختيار عدة إجابات', explanation: 'مثال: "الهوايات"', category: 'basic' },
  dropdown: { label: 'قائمة منسدلة', icon: '▼', description: 'اختيار من قائمة', explanation: 'قائمة مضغوطة لتوفير المساحة', category: 'basic' },
  scale: { label: 'تقييم', icon: '⭐', description: 'تقييم من 1 إلى 10', explanation: 'مثال: تقييم الأداء', category: 'advanced' },
  ranking: { label: 'ترتيب', icon: '#', description: 'ترتيب العناصر', explanation: 'ترتيب العناصر حسب الأولوية', category: 'advanced' },
  matrix: { label: 'مصفوفة', icon: '⊞', description: 'خيارات مشتركة', explanation: 'عدة أسئلة مع نفس الخيارات', category: 'advanced' },
  date: { label: 'تاريخ', icon: '📅', description: 'إدخال تاريخ', explanation: 'مثال: "تاريخ الميلاد"', category: 'advanced' },
  time: { label: 'وقت', icon: '⏰', description: 'إدخال وقت', explanation: 'مثال: "وقت الحضور"', category: 'advanced' },
  date_range: { label: 'نطاق وقت وتاريخ', icon: '📆', description: 'من وقت/تاريخ إلى وقت/تاريخ', explanation: 'مثال: فترة حجز أو إجازة', category: 'advanced' },
  slider: { label: 'شريط رقمي', icon: '🎚️', description: 'اختيار قيمة بالسحب', explanation: 'مثال: تحديد ميزانية أو عمر', category: 'advanced' },
  button_choice: { label: 'اختيار بأزرار', icon: '🔘', description: 'خيارات كأزرار مرئية', explanation: 'بديل جميل للاختيار الواحد', category: 'advanced' },
  star_rating: { label: 'تقييم بالنجوم', icon: '⭐', description: 'تقييم باستخدام النجوم', explanation: 'بديل مرئي للتقييم الرقمي', category: 'advanced' },
  appointment: { label: 'حجز موعد', icon: '📅', description: 'اختيار تاريخ ووقت للحجز', explanation: 'مثال: حجز موعد استشارة', category: 'advanced' },
  match_items: { label: 'توصيل العناصر', icon: '🔗', description: 'مطابقة عمودين', explanation: 'مثال: وصّل الكلمة بمعناها', category: 'advanced' },
  file_upload: { label: 'رفع ملف', icon: '📎', description: 'إرفاق ملف أو صورة', explanation: 'مثال: رفع السيرة الذاتية أو صورة', category: 'advanced' },
  email_confirm: { label: 'تأكيد البريد', icon: '✉️', description: 'إدخال الإيميل مرتين', explanation: 'للتأكد من صحة البريد الإلكتروني', category: 'advanced' },
  static_text: { label: 'فقرة (نص ثابت)', icon: '📝', description: 'نص للقراءة فقط', explanation: 'لعرض تعليمات أو معلومات', category: 'display' },
  static_image: { label: 'صورة ثابتة', icon: '🖼️', description: 'عرض صورة', explanation: 'لعرض شعار أو توضيح', category: 'display' },
  youtube: { label: 'فيديو يوتيوب', icon: '▶️', description: 'تضمين فيديو يوتيوب', explanation: 'لعرض فيديو توضيحي داخل النموذج', category: 'display' },
  divider: { label: 'فاصل', icon: '➖', description: 'خط فاصل', explanation: 'للفصل بين الأقسام', category: 'display' },
  terms: { label: 'الشروط والأحكام', icon: '📋', description: 'موافقة على الشروط', explanation: 'المستخدم يقرأ ويوافق على نص', category: 'display' },
  signature: { label: 'التوقيع', icon: '✍️', description: 'حقل توقيع', explanation: 'للحصول على توقيع رقمي', category: 'display' },
  countdown_timer: { label: 'العد التنازلي', icon: '⏳', description: 'عرض العد التنازلي', explanation: 'مؤقت لانتهاء العرض', category: 'widgets' },
  products_block: { label: 'المنتجات', icon: '📦', description: 'قائمة منتجات', explanation: 'عرض منتجات للاختيار والطلب', category: 'widgets' },
  payment_info_block: { label: 'بيانات الدفع', icon: '💳', description: 'عرض طرق الدفع', explanation: 'عرض معلومات الدفع', category: 'widgets' },
} as const

export const ITEM_CATEGORIES: Record<string, { label: string; icon: string; color: string }> = {
  basic: { label: 'أسئلة أساسية', icon: '❓', color: 'blue' },
  advanced: { label: 'أسئلة متقدمة', icon: '🔬', color: 'purple' },
  display: { label: 'عناصر عرض', icon: '👁️', color: 'green' },
  widgets: { label: 'إضافات', icon: '⚙️', color: 'amber' },
} as const

export const DISPLAY_ONLY_QUESTION_TYPES: readonly string[] = [
  'static_text',
  'static_image',
  'youtube',
  'divider',
  'terms',
  'countdown_timer',
  'products_block',
  'payment_info_block',
]

export const DATE_RANGE_MODE_OPTIONS = [
  { value: 'time', label: 'نطاق وقت' },
  { value: 'date', label: 'نطاق تاريخ' },
  { value: 'datetime', label: 'نطاق وقت وتاريخ' },
]

export const APPOINTMENT_META_ID = 'appointment_settings'

export const WEEKDAY_OPTIONS = [
  { value: '0', label: 'الأحد' },
  { value: '1', label: 'الإثنين' },
  { value: '2', label: 'الثلاثاء' },
  { value: '3', label: 'الأربعاء' },
  { value: '4', label: 'الخميس' },
  { value: '5', label: 'الجمعة' },
  { value: '6', label: 'السبت' },
]
