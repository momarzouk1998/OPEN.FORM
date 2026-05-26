# إصلاحات الموبايل — Forms.OpenappO

> ملف يجمع كل مشاكل تجربة الموبايل مع الحل المطلوب لكل مشكلة

---

## 🔴 حرج

### 1. `userScalable: false` — منع تكبير الصفحة
- **الملف:** `src/app/layout.tsx`
- **المشكلة:** `maximumScale: 1` و `userScalable: false` بيمنعوا المستخدم من تكبير أي محتوى على الموبايل. ده يخالف WCAG 1.4.4 وبيضر بضعاف البصر.
- **الحل:**
  ```ts
  // قبل
  export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: "#12D8D8",
  };

  // بعد
  export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    themeColor: "#12D8D8",
  };
  ```

---

## 🟠 عالي

### 3. حقلي كلمة المرور في `grid-cols-2` على الموبايل
- **الملف:** `src/app/register/page.tsx`
- **المشكلة:** الحقلين في صف واحد على كل الشاشات. على موبايل 375px كل حقل عرضه ~160px — ضيق جداً والـ placeholder بيتقطع.
- **الحل:** تغيير الـ grid ليكون عمود واحد على الموبايل:
  ```tsx
  // قبل
  <div className="grid grid-cols-2 gap-4">

  // بعد
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  ```

---

### 4. `pb-16` على الـ body في صفحات النماذج
- **الملف:** `src/app/layout.tsx`
- **المشكلة:** الـ `body` فيه `pb-16` ثابت لكل الصفحات عشان الـ FooterBar. لكن الـ FooterBar بيختفي على صفحات `/forms/` — فبيفضل مساحة فاضية 64px في الأسفل بدون سبب.
- **الحل:** إزالة `pb-16` من الـ body وإضافته فقط للصفحات اللي بتعرض الـ FooterBar، أو استخدام JavaScript في FooterBar نفسه لإضافة padding للـ body:
  ```tsx
  // في layout.tsx — إزالة pb-16
  <body className="min-h-full flex flex-col font-sans antialiased overflow-x-hidden">

  // في FooterBar.tsx — إضافة useEffect يضيف/يشيل padding
  useEffect(() => {
    const shouldShow = pathname !== '/' && pathname !== '/login' && !pathname.startsWith('/forms/')
    document.body.style.paddingBottom = shouldShow ? '4rem' : '0'
    return () => { document.body.style.paddingBottom = '0' }
  }, [pathname])
  ```

---

### 5. PublicHeader مفيش Mobile Menu
- **الملف:** `src/components/PublicHeader.tsx`
- **المشكلة:** الـ nav links (`hidden sm:flex`) بتختفي تحت 640px. مفيش hamburger menu بديل — المستخدم على الموبايل مش قادر يوصل لـ "القوالب" أو "شركاء النجاح" من الـ header.
- **الحل:** إضافة hamburger button + mobile dropdown menu:
  ```tsx
  const [mobileOpen, setMobileOpen] = useState(false)

  // في الـ header — إضافة زر hamburger
  <button
    onClick={() => setMobileOpen(!mobileOpen)}
    className="sm:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
    aria-label="القائمة"
  >
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  </button>

  // بعد الـ header — mobile dropdown
  {mobileOpen && (
    <div className="sm:hidden bg-white border-t border-gray-100 px-4 py-2 flex flex-col gap-1">
      {navItems.map(item => (
        <Link key={item.href} href={item.href}
          onClick={() => setMobileOpen(false)}
          className="px-3 py-2.5 text-gray-700 hover:bg-blue-50 rounded-lg text-sm font-medium"
        >
          {item.label}
        </Link>
      ))}
    </div>
  )}
  ```

---

### 6. Dashboard — أزرار Quick Actions بتتزاحم على الموبايل
- **الملف:** `src/app/dashboard/DashboardContent.tsx`
- **المشكلة:** أزرار "استخدم قالباً" و"إنشاء نموذج جديد" في `flex` بدون `flex-wrap` — على شاشات صغيرة بيتزاحموا ويخرجوا عن الشاشة.
- **الحل:**
  ```tsx
  // قبل
  <div className="flex gap-3">

  // بعد
  <div className="flex flex-wrap gap-3">
  ```

---

### 7. Dashboard Sidebar عرضه ضيق على الموبايل
- **الملف:** `src/app/dashboard/DashboardContent.tsx`
- **المشكلة:** الـ sidebar عرضه `w-2/3` — على iPhone SE (375px) ده ~250px وضيق.
- **الحل:**
  ```tsx
  // قبل
  <aside className={`fixed inset-y-0 right-0 z-50 w-2/3 max-w-sm ...`}>

  // بعد
  <aside className={`fixed inset-y-0 right-0 z-50 w-4/5 max-w-sm ...`}>
  ```

---

### 8. أزرار "معاينة" و"الردود" في كروت النماذج — Touch Target صغير
- **الملف:** `src/app/dashboard/DashboardContent.tsx`
- **المشكلة:** الأزرار جوا كارد قابل للضغط كله. على الموبايل سهل تضغط على الكارد بدل الزر أو العكس.
- **الحل:** تكبير الـ touch target للأزرار:
  ```tsx
  // قبل
  className="text-blue-600 ... px-2 py-1 ..."

  // بعد
  className="text-blue-600 ... px-3 py-2 min-h-[44px] flex items-center ..."
  ```

---

## 🟡 متوسط

### 9. Dropdown في FormFiller بيتغطى بالـ Keyboard على iOS
- **الملف:** `src/app/forms/[id]/FormFiller.tsx`
- **المشكلة:** لما الـ dropdown بيفتح على الموبايل، الـ keyboard بيطلع ويغطي الـ dropdown list.
- **الحل:** إضافة `scrollIntoView` لما الـ dropdown يفتح:
  ```tsx
  // عند فتح الـ dropdown
  setDropdownOpen(prev => ({ ...prev, [q.id]: true }))
  setTimeout(() => {
    document.getElementById(`dropdown-${q.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, 100)
  ```

---

### 10. جدول المصفوفة (Matrix) مش واضح إنه Scrollable
- **الملف:** `src/app/forms/[id]/FormFiller.tsx`
- **المشكلة:** جدول الـ matrix بيستخدم `overflow-x-auto` لكن على الموبايل مش واضح للمستخدم إنه يقدر يسحب أفقياً.
- **الحل:** إضافة hint نصي أو gradient indicator:
  ```tsx
  <div className="relative">
    <div className="overflow-x-auto">
      {/* الجدول */}
    </div>
    <p className="text-xs text-gray-400 mt-1 text-center sm:hidden">← اسحب للمشاهدة →</p>
  </div>
  ```

---

### 11. Countdown Banner بيغطي المحتوى على الموبايل
- **الملف:** `src/app/forms/[id]/FormFiller.tsx`
- **المشكلة:** الـ countdown banner بيظهر بـ `fixed` في الأعلى وبيغطي جزء من المحتوى على الموبايل بدون padding تعويضي.
- **الحل:** إضافة `pt` على الـ form container لما يكون في countdown:
  ```tsx
  <div className={`form-themed-container ... ${offerCountdown > 0 ? 'pt-14' : ''}`}>
  ```

---

### 12. صفحة الردود (admin/results) — الجدول مش Mobile-Friendly
- **الملف:** `src/app/admin/results/page.tsx`
- **المشكلة:** الجدول بيكون عريض جداً على الموبايل (عدد الأسئلة × عرض كل عمود). مفيش mobile view بديل.
- **الحل:** إضافة card view على الموبايل بدل الجدول:
  ```tsx
  // على الموبايل — عرض كل رد كـ card
  <div className="sm:hidden space-y-3">
    {processedResponses.map(r => (
      <div key={r.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <p className="font-bold">{r.profiles?.name || 'مجهول'}</p>
        <p className="text-sm text-gray-500">{formatDate(r.submitted_at)}</p>
        {/* باقي البيانات */}
      </div>
    ))}
  </div>
  // الجدول يظهر فقط على الشاشات الكبيرة
  <div className="hidden sm:block overflow-x-auto">
    {/* الجدول الحالي */}
  </div>
  ```

---

### 13. محرر النماذج (edit/create) مش مصمم للموبايل
- **الملفات:** `src/app/forms/[id]/edit/page.tsx` و `src/app/forms/create/page.tsx`
- **المشكلة:** الـ header فيه 4-5 أزرار في صف واحد — على شاشة 375px بيتزاحموا. الـ editor كله مصمم للـ desktop.
- **الحل:** إخفاء بعض الأزرار على الموبايل أو تجميعها في قائمة:
  ```tsx
  // إخفاء نص الأزرار على الموبايل وإظهار الأيقونة فقط
  <span className="hidden sm:inline">معاينة</span>
  ```

---

### 14. Theme Designer Sidebar — `top-[73px]` ثابت
- **الملف:** `src/app/forms/[id]/edit/page.tsx`
- **المشكلة:** الـ designer sidebar بيبدأ من `top-[73px]` ثابت. لو الـ header اتغير ارتفاعه (مثلاً على موبايل)، الـ sidebar بيتداخل مع الـ header أو بيفضل فيه gap.
- **الحل:** استخدام CSS variable أو حساب الارتفاع ديناميكياً:
  ```tsx
  // بدل top-[73px]
  className="fixed top-[var(--header-height,73px)] right-0 bottom-0 ..."
  ```

---

### 15. `inputMode` ناقص على بعض الحقول
- **الملفات:** `src/app/register/page.tsx`, `src/app/login/page.tsx`
- **المشكلة:** حقل الهاتف `type="tel"` صح، لكن حقول الأرقام في النماذج مش بتستخدم `inputMode="numeric"` — بيفتح keyboard حروف بدل أرقام على بعض الأجهزة.
- **الحل:**
  ```tsx
  <input type="text" inputMode="numeric" pattern="[0-9]*" />
  ```

---

## 🟢 منخفض

### 16. FooterBar فيه Item واحد بس
- **الملف:** `src/components/FooterBar.tsx`
- **المشكلة:** الـ bottom nav bar فيه "الرئيسية" بس — مش مكتمل ومش مفيد.
- **الحل:** إضافة باقي الـ items:
  ```tsx
  const NAV_ITEMS = [
    { href: '/dashboard', label: 'الرئيسية', icon: ... },
    { href: '/forms/create', label: 'إنشاء', icon: ... },
    { href: '/templates', label: 'القوالب', icon: ... },
    { href: '/profile', label: 'حسابي', icon: ... },
  ]
  ```

---

### 17. WhatsApp Button قد يغطي زر الإرسال
- **الملف:** `src/components/PublicProjectsView.tsx`
- **المشكلة:** الـ WhatsApp floating button في `bottom-6 right-6` — على موبايل ممكن يغطي آخر عنصر في الصفحة أو زر الإرسال في نموذج التواصل.
- **الحل:** إضافة `mb-20` على آخر section في الصفحة أو تحريك الزر لـ `bottom-20` على الموبايل:
  ```tsx
  className="fixed bottom-20 sm:bottom-6 right-6 ..."
  ```

---

### 18. Safe Area Insets ناقصة على iOS
- **الملف:** `src/app/globals.css`
- **المشكلة:** `.safe-area-bottom` موجود لكن مش مستخدم على كل العناصر اللي بتظهر في الأسفل (زي الـ submit button في FormFiller).
- **الحل:** إضافة `padding-bottom: env(safe-area-inset-bottom)` على الـ fixed bottom elements:
  ```css
  .fixed-bottom-safe {
    padding-bottom: max(1rem, env(safe-area-inset-bottom));
  }
  ```

---

### 19. أزرار Icon-Only بدون `aria-label`
- **الملفات:** متعددة (Header, Dashboard, edit page)
- **المشكلة:** أزرار زي hamburger menu وزر الحذف وزر الإعدادات مفيش عليها `aria-label` — screen readers على الموبايل مش بتقدر تقراها.
- **الحل:**
  ```tsx
  <button aria-label="فتح القائمة">
    <svg>...</svg>
  </button>
  ```

---

### 20. `backdrop-filter: blur` بيبطئ الأداء على أجهزة ضعيفة
- **الملفات:** `src/app/globals.css`, `src/components/FooterBar.tsx`, `src/components/Header.tsx`
- **المشكلة:** `backdrop-blur-xl` و `backdrop-blur-md` بيستهلكوا GPU على أجهزة Android متوسطة وبيسببوا تأخير في الـ scroll.
- **الحل:** استخدام `@media (prefers-reduced-motion)` أو تقليل الـ blur:
  ```css
  @media (prefers-reduced-motion: reduce) {
    .backdrop-blur-xl, .backdrop-blur-md {
      backdrop-filter: none;
      background-color: rgba(255, 255, 255, 0.95);
    }
  }
  ```

---

### 21. تداخل الحقول الجانبية (Row Groups)
- **الملف:** `src/app/forms/[id]/FormFiller.tsx`
- **المشكلة:** الأسئلة المضبطة لتظهر بجانب بعضها (`flex gap-4`) تسبب ضيقاً في المحتوى أو خروجه عن الشاشة في الموبايل.
- **الحل:** تغيير الـ flex ليكون عمودياً على الموبايل وأفقياً على الشاشات الأكبر.
  ```tsx
  className="flex flex-col sm:flex-row gap-4"
  ```

---

### 22. جداول الأدمن تفتقر للـ Overflow
- **الملفات:** `src/app/admin/users/page.tsx`, `src/app/admin/forms/page.tsx`
- **المشكلة:** الجداول تخرج عن حدود الشاشة في الموبايل ولا يمكن سحبها.
- **الحل:** تغليف الجداول بـ `div` يحتوي على `overflow-x-auto`.

---

### 23. قائمة السؤال العائمة تفتح خارج نطاق الرؤية
- **الملف:** `src/app/forms/[id]/edit/page.tsx`
- **المشكلة:** قائمة التروس (Gear Icon) تفتح لأسفل دائماً؛ إذا كان السؤال في أسفل الشاشة، تفتح القائمة خارج نطاق الرؤية.
- **الحل:** الكشف عن موقع الزر وفتح القائمة للأعلى إذا كان السؤال قريباً من الحافة السفلية.

---

### 24. تحويل المصفوفة (Matrix) إلى بطاقات (Cards)
- **الملف:** `src/components/QuestionRenderer.tsx`
- **المشكلة:** الجداول صعبة جداً في التعامل باللمس على الشاشات الصغيرة.
- **الحل:** عرض كل صف في المصفوفة كبطاقة مستقلة تحتوي على الخيارات كأزرار كبيرة.

---

### 25. لوحة التصميم تغطي المعاينة بالكامل
- **الملف:** `src/app/forms/[id]/edit/page.tsx`
- **المشكلة:** الـ Theme Designer يظهر كشريط جانبي يغطي مساحة كبيرة، مما يمنع رؤية التغييرات بوضوح على الهاتف.
- **الحل:** تحويل اللوحة إلى Drawer يفتح من الأسفل (Bottom Sheet) في وضع الموبايل.

---

### 26. استجابة الـ Hover على أجهزة اللمس
- **الملف:** `src/app/globals.css`
- **المشكلة:** تأثيرات الـ Hover تظل عالقة بعد اللمس (Sticky Hover).
- **الحل:** استخدام media query `@media (hover: hover)` للتأكد من تفعيل التأثيرات فقط للأجهزة التي تدعم الـ pointer.

---

## ترتيب التنفيذ المقترح

| الأولوية | المشكلة | الملف |
|----------|---------|-------|
| 1 | `userScalable: false` | `layout.tsx` |
| 2 | حقلي كلمة المرور `grid-cols-1` على موبايل | `register/page.tsx` |
| 3 | `pb-16` الزيادة على صفحات النماذج | `layout.tsx` + `FooterBar.tsx` |
| 4 | PublicHeader mobile menu | `PublicHeader.tsx` |
| 5 | Dashboard أزرار `flex-wrap` | `DashboardContent.tsx` |
| 6 | Dashboard sidebar `w-4/5` | `DashboardContent.tsx` |
| 7 | Touch targets أكبر للأزرار | `DashboardContent.tsx` |
| 8 | جدول الردود — card view على موبايل | `admin/results/page.tsx` |
| 9 | FooterBar items ناقصة | `FooterBar.tsx` |
| 10 | WhatsApp button position | `PublicProjectsView.tsx` |
| 11 | aria-labels على الأزرار | متعددة |
| 12 | backdrop-filter performance | `globals.css` |
| 13 | تعقيم HTML وXSS عند عرض محتوى المحرر | `src/components/RichTextEditor.tsx`, `src/app/forms/[id]/FormFiller.tsx` |

---

## إضافات بعد المراجعة الشاملة على الهاتف

- 🔴 تعقيم المحتوى (XSS): عند عرض أي HTML قادم من المستخدم (`static_text`, محتوى `RichTextEditor`) يجب تطهيره قبل العرض. أوصي بإضافة `dompurify` واستدعاء `DOMPurify.sanitize(html)` داخل الواجهات التي تعرض HTML. مثال: قبل `dangerouslySetInnerHTML` نفذ:
  ```ts
  import DOMPurify from 'dompurify'
  const safe = DOMPurify.sanitize(rawHtml)
  ```

- 🔴 Service Worker registration: التسجيل الحالي يحاول `register('/sw.js')` دون التحقق من وجود الملف — يؤدّي لخطأ 404 على بعض الهواتف. حل مؤقت: التفاف التسجيل بـ `try/catch` أو التحقق عبر `fetch('/sw.js', {method:'HEAD'})` قبل التسجيل.

- 🟠 تحكم بالوصول للحركة/اللمس: على شاشات اللمس الطويلة، استخدم `touch-action` و `-webkit-overflow-scrolling: touch` على العناصر القابلة للسحب لتحسين السلاسة.

- 🟠 توقيع حقيقي على الموبايل: نوع السؤال `signature` يحتاج `react-signature-canvas` بدل حقل نصي، لتجربة مستخدم طبيعية.

- 🟡 تحسين استرجاع المسودات عند فقدان الاتصال: على الموبايل الاتصالات غير مستقرة — تخزين مسودات محليًا ثم إعادة محاولة الإرسال مع exponential backoff.

- 🟡 تحسين الــfocus عند رفع لوحة المفاتيح: عند فتح input على iOS/Android، استدعاء `scrollIntoView({behavior:'smooth', block:'center'})` للعناصر ذات التركيز لجعلها مرئية خلف الـ keyboard.

- 🟢 إضافات بسيطة لـ a11y على الموبايل: إضافة `role="button"` و `aria-pressed` للأزرار القابلة للتبديل، والتأكد أن جميع الأزرار الأيقونية تحتوي `aria-label`.

- 🟢 Lazy-load للمكونات الثقيلة: استورد `RichTextEditor`, editor toolbars, و `ConfettiButton` ديناميكياً (`next/dynamic`) لتخفيف تحميل الباندل الأولي على الموبايل.

- 🟢 تجنب `alert()` في واجهة الموبايل: استبدلها بـ toasts خفيفة أو inline banners لأنها تقطع تدفق التفاعل وتؤثر على UX في المتصفحات المحمولة.

---

إذا تحب، أبدأ فوراً بتنفيذ أحد هذه التعديلات (أقترح تعقيم HTML أولاً لأن له أثر أمني مباشر). أي خيار تفضّل أن أنفّذه الآن؟
