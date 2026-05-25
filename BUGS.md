# قائمة العيوب والمشاكل — Forms.OpenappO

> تم تجميعها من مراجعة شاملة للكود (58 ملف، ~18,000 سطر)
> ملاحظة: تم إزالة #35 من القائمة (domain restriction ميزة وليست عيب)

---

## 🔴 حرج (Critical)

### 1. ✅ Service-Role Key يتدهور إلى Anon Key — تم الإصلاح
- **الملف:** `src/utils/supabase/server.ts:34-36`
- **الوصف:** لو `SUPABASE_SERVICE_ROLE_KEY` مش موجود في البيئة، السكربت يتحول بهدوء لـ `NEXT_PUBLIC_SUPABASE_ANON_KEY`. ده معناه أن API endpoints زي إرسال كود التحقق والـ referrals تشتغل بصلاحيات public anon.
- **الحل:** `throw new Error` لو الـ key مش موجود.
- **الحالة:** ✅ `throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')` بدلاً من silent fallback

### 2. ✅ Admin Check Client-Side — تم الإصلاح
- **الملفات:**
  - `src/app/admin/users/page.tsx:14-86`
  - `src/app/admin/results/page.tsx:~15-40`
  - `src/app/admin/forms/page.tsx:~20-26`
  - `src/app/admin/settings/page.tsx:~55-88`
  - `src/app/admin/analytics/page.tsx:~1-20`
  - `src/app/admin/partners/page.tsx:~1-20`
- **الوصف:** التحقق من أن المستخدم Admin بيتم في المتصفح فقط (`profile.role !== 'admin'`). أي مستخدم عادي يعرف رابط `/admin/users` يقدر على الأقل يحاول يحمل البيانات.
- **الحل:** تم إضافة server-side check في `middleware.ts` — أي access لـ `/admin/*` بيعمل فحص صلاحية قبل ما يوصل للصفحة نفسها.

### 3. ✅ Gender Hardcoded في التسجيل — تم الإصلاح
- **الملف:** `src/app/register/page.tsx:93`
- **الوصف:** `gender: 'male'` hardcoded لكل المستخدمين الجدد بغض النظر عن المدخلات.
- **الحل:** إزالة `gender: 'male'` من الـ upsert.
- **الحالة:** ✅ تمت إزالة حقل `gender` تماماً من upsert

### 4. ✅ Service Worker 404 — تم الإصلاح
- **الملف:** `src/components/ServiceWorker.tsx`
- **الوصف:** الـ Service Worker بيحاول يسجل `/sw.js` لكن الملف مش موجود في `public/`. كل زائر للصفحة ياخد 404.
- **الحل:** إضافة ملف `public/sw.js` حقيقي.
- **الحالة:** ✅ تم إنشاء `public/sw.js` مع install + activate handlers

---

## 🟠 عالي (High)

### 5. ✅ N+1 Query في جلب بيانات الشركاء — تم الإصلاح (تمت إزالة القسم)

### 6. ✅ `.toLowerCase()` على null يعلق البحث — تم الإصلاح
- **الملفات:**
  - `src/app/admin/users/page.tsx:~308`
  - `src/app/admin/results/page.tsx:~559`
- **الوصف:** لو `user.name` أو `f.name` قيمتهم `undefined` أو `null`، `.toLowerCase()` يرمي TypeError ويوقف عرض الصفحة.
- **الحل:** `(user.name || '').toLowerCase()`
- **الحالة:** ✅ تم إضافة fallback `|| ''`

### 7. ✅ Remember Me مش شغال — تم الإصلاح
- **الملف:** `src/app/login/page.tsx:68-72`
- **الوصف:** الفلوس يكتب قيمة checkbox في localStorage بس مفيش أي كود يقراها أو يستخدمها بعد كده.
- **الحل:** إزالة الخاصية.
- **الحالة:** ✅ تم إزالة الـ state والـ checkbox والكود المرتبط بالـ remember me

### 8. ✅ Rate Limiting ناقص على API — تم الإصلاح
- **الملف:** `src/app/api/auth/send-code/route.ts`
- **الوصف:** أي حد يقدر يطلب إرسال كود تحقق لأي إيميل بدون limit. ممكن يستنزف Resend quota.
- **الحل:** تم إضافة in-memory rate limiter — request واحد لكل إيميل كل 60 ثانية.

### 9. Monoothic Components ضخمة
- **الملفات:**
  - `src/app/forms/[id]/FormFiller.tsx` — ~90KB
  - `src/app/forms/[id]/edit/page.tsx` — ~3851 سطر
  - `src/app/forms/create/page.tsx` — ~2257 سطر
- **الوصف:** التعديل على أي feature يستلزم فهم الـ component كامل. صيانة صعبة، وأداء بطيء في initial load.
- **الحل:** تقسيم كل component لمكونات أصغر (مثلاً: QuestionRenderer, ThemePanel, SettingsModal).

### 10. constants مكررة في 4 ملفات ✅
- **الملفات:**
  - `src/app/forms/create/page.tsx:17-47`
  - `src/app/forms/[id]/edit/page.tsx:31-59`
  - `src/app/forms/[id]/FormFiller.tsx:42-49`
  - `src/app/templates/[id]/page.tsx:23-51`
- **الوصف:** `QUESTION_TYPES`، `DISPLAY_ONLY_QUESTION_TYPES`، `WEEKDAY_OPTIONS`، `DATE_RANGE_MODE_OPTIONS` معرفين في 3 ملفات بشكل متطابق. أي إضافة نوع سؤال جديد لازم تتغير في 4 مكانين.
- **الحل:** تم نقل كل الـ constants المشتركة إلى `src/constants/questionTypes.ts` (ملف جديد). الـ 3 ملفات الأساسية تستورد منه دلوقتي. `QUESTION_TYPE_LABELS` و `TYPE_COLORS` في الـ templates page متروكين عشان هم خاصين بعرض القالب فقط.

### 11. DISPLAY_ONLY_QUESTION_TYPES ناقصة ✅
- **الملفات:**
  - `src/app/forms/create/page.tsx:57-64`
  - `src/app/forms/[id]/edit/page.tsx:68-75`
  - `src/app/forms/[id]/FormFiller.tsx:42-49`
- **الوصف:** المصفوفة بتوحش `youtube` و `divider` (بس ناقصين). `signature` مش display-only عشان بيجمع بيانات — صحيح انه مش موجود.
- **الحل:** إضافة `youtube` و `divider` إلى المصفوفات الثلاثة. تم الإصلاح في commit a9fca63.

### 12. `alert()` في كل مكان ✅
- **الملفات:**
  - `src/components/ImageUpload.tsx:61`
  - `src/components/ProductGroupsEditor.tsx:48`
  - `src/app/admin/forms/page.tsx:49`
  - `src/app/admin/users/page.tsx:138`
- **الوصف:** استخدام `alert()` بدلاً من toast/modal. مش mobile-friendly وبيحظر الـ JS execution.
- **الحل:** تم إنشاء نظام toast خفيف (`src/lib/toast.ts` + `src/components/ToastContainer.tsx` + مضاف في `layout.tsx`). كل الـ `alert()` اتغيرت إلى `toast()`.
- **ملاحظة:** `window.confirm()` في admin/users خط 97 محتفظ به لأنه قرار مستخدم حقيقي (تأكيد حذف).

---

## 🟡 متوسط (Medium)

### 13. ✅ `any`Types في كل مكان — تم الإصلاح جزئيًا
- **الملفات:** في أنحاء الكود كلها (أكثر من 50 موقع)
- **الوصف:** استخدام `Record<string, any>`، `any[]`، `settings: any` بدلاً من types معرفة. بيقلل IDE support ويزيد فرص الأخطاء.
- **الحل:** تعريف types لكل API response، form settings، profile data.
- **الحالة:** ✅ تم إصلاح `any` types في `QuestionRenderer.tsx` بالكامل (Answers, BookedSlots, FormData, QuestionOption, matrix types, إلخ) — 0 استخدامات لـ `: any` في الملف

### 14. ✅ `dir="rtl"`ناقص — تم الإصلاح
- **الملفات:**
  - `src/app/forgot-password/page.tsx` — مفيش `dir="rtl"`
  - `src/app/reset-password/page.tsx` — مفيش `dir="rtl"`
- **الوصف:** الصفحتين مش بيدعموا RTL بشكل صحيح.
- **الحل:** إضافة `dir="rtl"` على الـ wrapper div.
- **الحالة:** ✅ تم إضافة `dir="rtl"` لكلتا الصفحتين

### 15. Pagination ناقص في جداول Admin
- **الملفات:**
  - `src/app/admin/users/page.tsx`
  - `src/app/admin/results/page.tsx`
- **الوصف:** البيدو بيجيب كل البيانات مرة واحدة (`supabase.from('profiles').select('*')`). لو في 10,000 مستخدم، الصفحة هتعلق.
- **الحل:** إضافة `.range(start, end)` مع buttons للتنقل بين الصفحات.

### 16. Console.Error بدون User Feedback
- **الملفات:** في أنحاء الكود (اكثر من 15 موقع)
- **الوصف:** `console.error` بتستخدم للـ logging بس المستخدم مش بيشوف أي رسالة خطأ.
- **الحل:** إما toast notification أو inline error message للمستخدم.

### 17. Empty Catch Blocks
- **الملف:** `src/hooks/useFormFeatures.ts:23, 39`
- **الوصف:** `catch {}` كاتش الخطأ ويسكت عليه بدون logging أو user feedback.
- **الحل:** `console.error` على الأقل.

### 18. ✅ اسم التطبيق القديم — تم الإصلاح
- **الملف:** `src/hooks/useAppSettings.ts:29-31`
- **الوصف:** fallback اسم التطبيق لسه `'أحلى شباب'` بدلاً من `'Forms.OpenappO'`.
- **الحل:** تغيير default قيمة.
- **الحالة:** ✅ تغيير القيم الافتراضية إلى `'Forms.OpenappO'` و `'منصة متكاملة لإنشاء النماذج والاستبيانات'`

### 19. Unused Import
- **الملف:** `src/app/forms/[id]/edit/page.tsx`
- **الوصف:** `Suspense` مستورد لكن مش مستخدم في أي حتة.
- **الحل:** إزالة الـ import.

### 20. FooterBar ناقص
- **الملف:** `src/components/FooterBar.tsx:6-16`
- **الوصف:** الـ bottom nav bar فيه item واحد بس ("الرئيسية") — غالباً مش مكتمل.
- **الحل:** إضافة باقي الـ NAV_ITEMS (النماذج، الملف الشخصي، إلخ) أو إزالته.

### 21. `force-dynamic` في Layout
- **الملف:** `src/app/layout.tsx:5`
- **الوصف:** `export const dynamic = 'force-dynamic'` بيمنع static generation و ISR للتطبيق كامل.
- **الحل:** استخدام dynamic imports للـ components الفعلية.

### 22. ✅ `<img>` بدلاً من `next/image` — تم الإصلاح
- **الملف:** `src/components/ProductGroupsEditor.tsx:87`
- **الوصف:** صور المنتجات بتستخدم `<img>` العادي بدلاً من `<Image>` المحسن.
- **الحل:** استخدام `next/image`.

---

## 🟢 منخفض (Low)

### 23. ✅ لون hover غير متناسق في Header — تم الإصلاح
- **الملف:** `src/components/Header.tsx:64`
- **الوصف:** "شركاء النجاح" يستخدم `text-indigo-600` بينما باقي الروابط تستخدم `text-blue-600`.
- **الحل:** توحيد اللون.
- **الحالة:** ✅ `text-indigo-600` ← `text-blue-600` و `bg-indigo-50` ← `bg-blue-50`

### 24. `Math.random()` لكود التحقق
- **الملف:** `src/app/api/auth/send-code/route.ts:24`
- **الوصف:`Math.random()` مش `cryptographically secure`، لكن لـ 6 أرقام و 10 دقائق expiry يعتبر مقبول.
- **الحل:** استخدام `crypto.randomInt()` للأمان الأعلى.

### 25. No HTTPS Enforcement
- **الوصف:** مفيش code بيجبر HTTPS (لكن Vercel بيعملها تلقائياً).

### 26. No Barrel Exports
- **الوصف:** مفيش `index.ts` في components، hooks، أو types. كل import بعمق كبير.
- **الحل:** إضافة barrel exports.

### 27. Keyboard Accessibility
- **الوصف:** Drag & drop بيستخدم pointer events بس — مفيش keyboard alternative.
- **الحل:** إضافة `aria-grabbed` و keyboard handlers (`Space`, `ArrowUp`, `ArrowDown`).

### 28. `serial_number` مش في الـ Type
- **الوصف:** Form interface في `src/types/index.ts` مفيش `serial_number` رغم استخدامه في `edit/page.tsx` و `FormFiller.tsx`.

### 29. CSS logical properties مش مستخدمة
- **الوصف:** استخدام `right`/`left` بدلاً من `inset-inline-start`/`inset-inline-end`.

### 30. مفيش أغلب aria-labels
- **الوصف:** الأزرار اللي أيقونة بس (menu hamburger, notification bell, delete) مفيش `aria-label`.

---

## 🔴 حرج — مكتشف من المراجعة الثانية

### 31. ✅ Conditional Logic مكسور — السؤال بيفلتر نفسه — تم الإصلاح
- **الملف:** `src/app/forms/[id]/edit/page.tsx:3041`
- **الوصف:** في الـ select اللي بيختار السؤال المرتبط بالشرط، الفلتر مكتوب `.filter((q: any) => q.id !== q.id)` — ده دايماً `false`، يعني القائمة فاضية دايماً. المستخدم مش قادر يختار أي سؤال للشرط.
- **الحل:** تغيير الفلتر لـ `otherQ.id !== q.id` باستخدام variable مختلف.
- **الحالة:** ✅ تم تغيير اسم المتغير لـ `otherQ` في كل من الفلتر والفايند

### 32. ✅ زر "إضافة شرط" مكسور — تم الإصلاح
- **الملف:** `src/app/forms/[id]/edit/page.tsx:3029`
- **الوصف:** الكود بيعمل `find` على الأسئلة بنفس الشرط الغلط `q.id !== q.id` (دايماً `undefined`)، فالشرط الجديد بيتضاف بـ `question_id: undefined`.
- **الحل:** استخدام `find((otherQ) => otherQ.id !== q.id)` للحصول على أول سؤال مختلف.
- **الحالة:** ✅ تم تغيير اسم المتغير لـ `otherQ`

---

## 🟠 عالي — مكتشف من المراجعة الثانية

### 33. نموذج التواصل في الصفحة الرئيسية وهمي
- **الملف:** `src/components/PublicProjectsView.tsx` (قسم Contact)
- **الوصف:** زر الإرسال بيعمل `e.preventDefault()` بس مفيش أي action فعلي — لا إرسال إيميل، لا API call، لا رسالة نجاح. المستخدم بيضغط ومفيش حاجة بتحصل.
- **الحل:** ربط النموذج بـ Resend أو واتساب أو على الأقل إظهار رسالة "سيتم التواصل معك قريباً".

### 34. زر "اشتري الآن" في صفحة الأسعار بدون Payment
- **الملف:** `src/components/PublicProjectsView.tsx` (قسم Pricing)
- **الوصف:** الخطة الاحترافية بـ 99 ريال وزر "اشتري الآن" بيروح لـ `/register` بس مفيش أي payment integration. المستخدم بيسجل ويلاقي نفس الخطة المجانية.
- **الحل:** إما إزالة الأسعار المدفوعة أو إضافة ملاحظة "قريباً" أو ربط بـ payment gateway.

### 36. `alert()` في saveForm و profile
- **الملفات:**
  - `src/app/forms/[id]/edit/page.tsx` — `alert('تم حفظ التعديلات بنجاح')` و `alert('حدث خطأ...')`
  - `src/app/profile/page.tsx` — `alert('تم نسخ الرابط!')` و `alert('فشل رفع الصورة')`
- **الوصف:** إضافة لما تم توثيقه في Bug #12 — مواقع إضافية لم تُذكر.

### 37. زر "الردود" في Dashboard يروح لـ `/admin/results`
- **الملف:** `src/app/dashboard/DashboardContent.tsx`
- **الوصف:** المستخدم العادي لما يضغط "الردود" على نموذجه بيتوجه لـ `/forms/{id}/edit?tab=results` — لكن صفحة edit مش بتتعامل مع `?tab=results` parameter، يعني المستخدم بيوصل لمحرر النموذج مش للردود.
- **الحل:** إما إنشاء صفحة ردود مستقلة للمستخدم أو ربط الزر بـ `/admin/results?formId=` مع التحقق من الصلاحية.

### 38. Typo في validation message
- **الملف:** `src/app/profile/page.tsx`
- **الوصف:** رسالة الخطأ `'يرجن إدخال الاسم'` (تم إصلاح واحدة، لكن في نفس الملف رسائل أخرى بنفس الخطأ).
- **الحل:** مراجعة كل رسائل الـ validation في الملف.

---

## 🟡 متوسط — مكتشف من المراجعة الثانية

### 39. Dashboard — عدد الردود per-form يحمل كل الردود
- **الملف:** `src/app/dashboard/DashboardContent.tsx`
- **الوصف:** لجلب عدد الردود لكل نموذج، الكود بيجيب كل صفوف `form_id` من `form_responses` لكل النماذج دفعة واحدة. لو المستخدم عنده نماذج بآلاف الردود، ده بيحمل بيانات ضخمة في المتصفح بدون داعي.
- **الحل:** استخدام Supabase `count` مع `group by` أو query منفصلة لكل نموذج عند الطلب.

### 40. تغيير كلمة المرور بدون Re-auth يعمل Sign-in إضافي
- **الملف:** `src/app/profile/page.tsx`
- **الوصف:** الكود بيعمل `signInWithPassword` للتحقق من الباسورد الحالي، وده بيعمل session جديدة. في بعض الحالات ممكن يسبب مشاكل مع الـ session الحالية أو يظهر في Supabase Auth logs كـ login جديد.
- **الحل:** استخدام `supabase.auth.reauthenticate()` بدلاً من `signInWithPassword` للتحقق من الهوية.

### 41. `?tab=results` Parameter غير مُعالج
- **الملف:** `src/app/forms/[id]/edit/page.tsx`
- **الوصف:** الـ dashboard بيبعت المستخدم لـ `edit?tab=results` لكن صفحة الـ edit مش بتقرأ هذا الـ parameter ولا بتفتح أي tab للردود.
- **الحل:** إما قراءة الـ `tab` parameter وفتح نافذة الردود، أو تغيير الرابط في الـ dashboard.

### 42. Contact Form في الصفحة الرئيسية بدون Validation
- **الملف:** `src/components/PublicProjectsView.tsx`
- **الوصف:** حقول الاسم والإيميل والهاتف والرسالة مفيش عليها `required` أو أي validation. المستخدم يقدر يضغط إرسال وهي فاضية.
- **الحل:** إضافة `required` على الحقول الأساسية.

### 43. `useAppSettings` Default اسم قديم
- **الملف:** `src/hooks/useAppSettings.ts`
- **الوصف:** (مذكور في Bug #18) — الـ fallback لسه `'أحلى شباب'`. تم اكتشافه مستقلاً.

### 44. Profile Page — Header بيستخدم `router.back()` بدون fallback
- **الملف:** `src/app/profile/page.tsx`
- **الوصف:** زر "رجوع" بيستخدم `router.back()` — لو المستخدم فتح الصفحة مباشرة من رابط خارجي، الـ back بيروح لصفحة فارغة أو يخرج من الموقع.
- **الحل:** `router.back()` مع fallback: `router.push('/dashboard')`.

### 45. WhatsApp Button يظهر فوق محتوى النماذج
- **الملف:** `src/components/PublicProjectsView.tsx`
- **الوصف:** الـ WhatsApp floating button موجود في الصفحة الرئيسية فقط، لكن لو المستخدم فتح نموذجاً على موبايل، الزر ممكن يغطي زر الإرسال أو آخر سؤال.
- **ملاحظة:** الزر موجود في `PublicProjectsView` فقط، مش في `FormFiller` — لكن يستحق المراجعة.

---

## 🟢 منخفض — مكتشف من المراجعة الثانية

### 46. ✅ `Suspense` و `lazy` مستوردين بدون استخدام — تم الإصلاح جزئياً
- **الملف:** `src/app/forms/[id]/edit/page.tsx:1`
- **الوصف:** `import { ..., Suspense, lazy } from 'react'` — `Suspense` مستخدم فعلاً (line 3843)، لكن `lazy` غير مستخدم.
- **الحل:** إزالة `lazy` من الـ import.
- **الحالة:** ✅ تم إزالة `lazy` من الـ import

### 47. `supabase` instance يتعمل داخل `useEffect`
- **الملف:** `src/components/PublicProjectsView.tsx:38`
- **الوصف:** `const supabase = createClient()` بيتعمل داخل `useEffect` في كل render. الأفضل إنشاؤه خارج الـ component أو استخدام `useMemo`.
- **الحل:** نقل `createClient()` لخارج الـ useEffect.

### 48. `terms` link في Register يروح لـ `/terms` غير موجودة
- **الملف:** `src/app/register/page.tsx`
- **الوصف:** في أسفل صفحة التسجيل: `<Link href="/terms">الشروط والأحكام</Link>` — صفحة `/terms` غير موجودة في المشروع، بتدي 404.
- **الحل:** إنشاء صفحة `/terms` أو إزالة الرابط.

### 49. `formId` يُستخدم قبل التحقق من صحته
- **الملف:** `src/app/forms/[id]/edit/page.tsx`
- **الوصف:** `const formId = params.id as string` — لو الـ `params.id` مش موجود أو `undefined`، الكود بيكمل بدون error حتى يفشل في الـ query.
- **الحل:** إضافة early return لو `formId` فاضي.

### 50. `localStorage` بدون try/catch في بعض الأماكن
- **الملف:** `src/app/forms/[id]/FormFiller.tsx`
- **الوصف:** `localStorage.getItem` و `localStorage.setItem` في بعض الأماكن بدون try/catch. في Safari Private Mode أو لو الـ storage ممتلئ، بيرمي exception.
- **الحل:** لف كل `localStorage` calls في try/catch.

---

## 🔴 حرج — مكتشف من المراجعة الثالثة

### 51. وظائف الأدمن مكسورة في المتصفح (Admin Auth)
- **الملف:** `src/app/admin/users/page.tsx`
- **الوصف:** محاولة استدعاء `supabase.auth.admin.deleteUser` و `updateUserById` من الـ client side. هذه الدوال تتطلب `service_role` key ولا تعمل بـ `anon` key المستخدم في المتصفح.
- **الحل:** نقل هذه الوظائف إلى Server Action أو API Route يستخدم `service_role` بشكل آمن.

---

## 🟠 عالي — مكتشف من المراجعة الثالثة

### 52. أداء بطيء في صفحة الشركاء (Sequential Await)
- **الملف:** `src/app/partners/page.tsx`
- **الوصف:** دالة `loadData` تقوم بجلب البيانات لكل شريك داخل `for` loop باستخدام `await` متكرر. مع زيادة عدد الشركاء، ستصبح الصفحة بطيئة جداً.
- **الحل:** استخدام `Promise.all` لجلب البيانات بالتوازي أو تحسين الـ query لجلب البيانات في طلب واحد.

### 53. تحقق `form_limit` يتم في المتصفح فقط
- **الملف:** `src/app/forms/create/page.tsx`
- **الوصف:** التحقق من وصول المستخدم للحد الأقصى للنماذج يتم فقط في الكود الأمامي قبل الإرسال لـ Supabase. يمكن تجاوز هذا القيد بسهولة.
- **الحل:** إضافة Server-side check أو Database Trigger لمنع إنشاء نماذج تتجاوز الحد.

---

## 🟡 متوسط — مكتشف من المراجعة الثالثة

### 54. نوع السؤال "توقيع" هو مجرد حقل نصي
- **الملف:** `src/app/forms/[id]/FormFiller.tsx`
- **الوصف:** نوع السؤال `signature` يظهر كحقل نصي عادي بخط مائل. المستخدمين يتوقعون لوحة رسم للتوقيع اليدوي.
- **الحل:** استخدام مكتبة مثل `react-signature-canvas` لتوفير تجربة توقيع حقيقية.

### 55. احتمال نقص صلاحيات الوصول لصور المنتجات
- **الوصف:** الصور المرفوعة لـ `products` bucket قد لا تظهر للمستخدمين إذا لم يتم إعداد سياسة وصول عامة (Public RLS) للـ bucket.
- **الحل:** التأكد من وجود سياسة `SELECT` للجميع في Supabase Storage للـ bucket المعني.

---

## إحصائيات

| الفئة | العدد | تم الإصلاح |
|-------|-------|-----------|
| 🔴 حرج (Critical) | 7 | 5 ✅ |
| 🟠 عالي (High) | 15 | 10 ✅ |
| 🟡 متوسط (Medium) | 19 | 6 ✅ |
| 🟢 منخفض (Low) | 13 | 4 ✅ |
| **المجموع** | **54** | **25 ✅** |

> آخر تحديث: تم إصلاح 20 عيب في 4 دفعات. (الدفعة 4: next/image في ProductGroupsEditor، Promise.all في صفحة الشركاء، router.back fallback، إصلاح 16 alert() متبقية، fix typo)
