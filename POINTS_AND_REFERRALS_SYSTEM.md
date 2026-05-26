# نظام النقاط والوكلاء والعمولات — Forms.OpenappO

> وثيقة تصميم شاملة للنظام المالي والتحفيزي للمنصة
> مُعدَّة لتسليمها لنموذج ذكاء اصطناعي لتنفيذها بالكامل

---

## 1. نظرة عامة

المنصة تحتوي على نظامين ماليين مستقلين لكل مستخدم:

| النظام | المصدر | الحد الأدنى للسحب |
|--------|--------|-------------------|
| محفظة نقاط القوالب | نسخ العملاء المدفوعين للقوالب | 100 نقطة = 100 جنيه |
| محفظة عمولات الوكلاء | اشتراكات العملاء المُحالين | 500 جنيه |

كل مستخدم عنده **محفظتين منفصلتين** ورصيد معلق لكل منهما.

---

## 2. نظام نقاط القوالب

### 2.1 آلية الاكتساب

- كل مرة **عميل مشترك بباقة مدفوعة** يعمل نسخة من قالب معين → صاحب القالب يحصل على **10 نقاط**
- الشرط الأساسي: الناسخ لازم يكون مشترك بباقة مدفوعة فعلية وقت النسخ
- لو الناسخ على الباقة المجانية: لا تُحتسب نقاط
- كل حساب يُحتسب مرة واحدة فقط لكل قالب (UNIQUE constraint)
- القالب لازم يكون معتمد من الأدمن قبل ما يبدأ يكسب نقاط

### 2.2 قيمة النقطة والسحب

| البند | القيمة |
|-------|--------|
| قيمة النقطة الواحدة | 1 جنيه مصري |
| الحد الأدنى للسحب | 100 نقطة = 100 جنيه |
| ضريبة القيمة المضافة | 14% تُخصم عند السحب |
| صافي السحب عند 100 نقطة | 86 جنيه (بعد 14% ضريبة) |

### 2.3 الرصيد المعلق (Pending Balance)

- النقاط تدخل أولاً في **رصيد معلق** لمدة **35 يوماً** من تاريخ نسخ القالب
- بعد مرور 35 يوم بدون استرجاع من العميل الناسخ → تنتقل للرصيد المتاح للسحب
- لو العميل الناسخ ألغى اشتراكه قبل 35 يوم → النقاط المعلقة تُلغى

### 2.4 منع التلاعب

- الناسخ لازم يكون مشترك بباقة مدفوعة فعلية
- UNIQUE(template_id, copied_by_id) في قاعدة البيانات
- القالب لازم معتمد من الأدمن
- الأدمن يقدر يلغي نقاط يدوياً مع تسجيل السبب في الـ log

### 2.5 طلب السحب

1. المستخدم يضغط "طلب سحب" من صفحة أرباحي
2. يدخل بيانات الدفع (انستاباي أو محفظة)
3. الطلب يروح للأدمن مع اسم الأدمن اللي هيعالجه
4. الأدمن يراجع ويحول المبلغ يدوياً
5. الأدمن يضغط "تم التحويل" → status = paid + تُخصم النقاط تلقائياً
6. كل خطوة تُسجَّل في admin_action_log مع timestamp واسم الأدمن


---

## 3. نظام الوكلاء (Agent Commission)

### 3.1 آلية الوكالة

- كل مستخدم عنده **رابط وكيل خاص**: `forms.openappo.com/register?ref=XXXX`
- أي شخص يسجل من خلال الرابط ده يُحسب **عميل تابع** لهذا الوكيل
- العميل التابع يظهر في إحصائيات الوكيل فور التسجيل
- لكن العمولة لا تُحتسب إلا بعد **دفع الاشتراك الفعلي**

### 3.2 هيكل العمولة

الباقة الأساسية: **500 جنيه شاملة الضريبة**

حساب العمولة:
```
السعر الإجمالي = 500 جنيه
الضريبة 14% = 500 ÷ 1.14 × 0.14 = 61.4 جنيه
السعر قبل الضريبة = 500 - 61.4 = 438.6 جنيه

عمولة الشهر الأول (20%) = 438.6 × 0.20 = 87.72 جنيه
عمولة الشهر الثاني+ (10%) = 438.6 × 0.10 = 43.86 جنيه
```

| الشهر | النسبة | العمولة الصافية (من 500 جنيه) |
|-------|--------|-------------------------------|
| الشهر الأول (أول دفعة) | 20% من صافي السعر | ~87.72 جنيه |
| الشهر الثاني فصاعداً | 10% من صافي السعر | ~43.86 جنيه |

> الضريبة 14% تُخصم من السعر الإجمالي أولاً، ثم تُحسب نسبة الوكيل من الصافي

### 3.3 الرصيد المعلق للوكلاء

- عند دفع العميل → العمولة تدخل **رصيد معلق** لمدة **35 يوماً**
- بعد 35 يوم بدون استرجاع → تنتقل للرصيد المتاح للسحب
- لو العميل طلب استرجاع قبل 35 يوم → العمولة المعلقة تُلغى بالكامل
- لو العميل طلب استرجاع بعد 35 يوم → **لا يوجد استرجاع للعمولة** (الشهر اكتمل)

### 3.4 سياسة الاسترجاع (Refund Policy) — محددة بوضوح

| الحالة | القرار |
|--------|--------|
| استرجاع خلال 35 يوم من الدفع | العمولة المعلقة تُلغى كاملاً |
| استرجاع بعد 35 يوم | لا خصم — العمولة مكتسبة نهائياً |
| العميل ألغى التجديد (لم يدفع الشهر الجديد) | لا خصم — فقط لا تُضاف عمولة جديدة |

> **القاعدة الأساسية:** بعد مرور 35 يوم على أي دفعة، العمولة المقابلة لها مكتسبة نهائياً ولا تُسترجع

### 3.5 الحد الأدنى للسحب

- **500 جنيه** من محفظة الوكلاء
- السحب بنفس آلية نقاط القوالب (طلب → أدمن → تحويل)

### 3.6 إشعارات الوكيل

الوكيل يتلقى إشعاراً في كل الحالات التالية:
- ✅ عميل جديد سجّل من رابطه
- ✅ عميل دفع الاشتراك (عمولة دخلت المعلق)
- ✅ عمولة انتقلت من المعلق للمتاح (بعد 35 يوم)
- ❌ عميل طلب استرجاع (عمولة معلقة أُلغيت)
- ❌ عميل لم يجدد اشتراكه (مع ذكر اسم العميل بشكل مجهول جزئياً)


---

## 4. لوحة إحصائيات الوكيل (Agent Dashboard)

### 4.1 المحفظتان

```
┌─────────────────────────────────────────────────────────┐
│  محفظة نقاط القوالب                                     │
├─────────────────────────────────────────────────────────┤
│  رصيد متاح للسحب          85 نقطة = 85 جنيه            │
│  رصيد معلق (< 35 يوم)     30 نقطة = 30 جنيه            │
│  إجمالي مكتسب             200 نقطة                      │
│  إجمالي مسحوب             85 نقطة                       │
│  [زر: طلب سحب — يظهر فقط لو الرصيد ≥ 100]             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  محفظة عمولات الوكلاء                                   │
├─────────────────────────────────────────────────────────┤
│  رصيد متاح للسحب          430.72 جنيه                   │
│  رصيد معلق (< 35 يوم)     87.72 جنيه                    │
│  إجمالي عملاء             8 عملاء                       │
│  عملاء نشطين              6 عملاء                       │
│  [زر: طلب سحب — يظهر فقط لو الرصيد ≥ 500]             │
└─────────────────────────────────────────────────────────┘
```

### 4.2 جدول عملاء الوكيل

```
┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│ العميل   │ تاريخ    │ الباقة   │ آخر دفعة │ الحالة   │ عمولتك  │
│ (مجهول) │ الانضمام │          │          │          │ المتاحة  │
├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ م.أ.    │ يناير 26 │ احترافية │ مارس 26  │ ✅ نشط   │ 43.86 ج │
│ س.م.    │ فبراير 26│ احترافية │ فبراير 26│ ⏳ معلق  │ 87.72 ج │
│ ع.ك.    │ ديسمبر 25│ احترافية │ يناير 26 │ ❌ منتهي │ 0 ج     │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```

**حالات العميل:**
- ✅ نشط: مشترك وباقته سارية
- ⏳ معلق: دفع حديثاً والـ 35 يوم لم تنتهِ
- ❌ منتهي: لم يجدد الاشتراك

### 4.3 تاريخ العمولات

جدول بكل العمولات المكتسبة والمعلقة والملغاة مع التواريخ.

---

## 5. صفحة الشرح العامة (Landing Section)

### 5.1 قسم في الصفحة الرئيسية — "اكسب معنا"

يُضاف قسم في الصفحة الرئيسية `/` يشرح النظامين بشكل جذاب:

```
┌─────────────────────────────────────────────────────────┐
│              💰 اكسب معنا بطريقتين                      │
├──────────────────────┬──────────────────────────────────┤
│  📦 نقاط القوالب     │  🤝 نظام الوكلاء                │
│                      │                                  │
│  انشئ قالباً جميلاً  │  شارك رابطك الخاص               │
│  وانشره للعموم       │  مع أصحابك وعملاءك              │
│                      │                                  │
│  كل مشترك ينسخه     │  كل مشترك يدفع من رابطك         │
│  = 10 نقاط لك        │  = 20% أول شهر                  │
│                      │  = 10% كل شهر بعد كده           │
│  100 نقطة = سحب      │  500 جنيه = سحب                 │
│  100 جنيه            │                                  │
└──────────────────────┴──────────────────────────────────┘
```

**تفاصيل القسم:**
- عنوان: "اكسب معنا بطريقتين"
- بطاقتان جنب بعض (نقاط القوالب / نظام الوكلاء)
- كل بطاقة فيها: الفكرة + كيف تكسب + الحد الأدنى للسحب
- زر CTA: "ابدأ الآن مجاناً" → `/register`
- قسم FAQ صغير بأسئلة شائعة

### 5.2 أسئلة شائعة (FAQ)

**س: هل أحتاج اشتراك مدفوع عشان أكسب؟**
ج: لا — أي مستخدم يقدر يكون وكيلاً أو ينشر قوالب. لكن النقاط تُحتسب فقط لما الناسخ يكون مشترك مدفوع.

**س: متى أقدر أسحب أرباحي؟**
ج: بعد مرور 35 يوماً على الاكتساب وبلوغ الحد الأدنى (100 نقطة أو 500 جنيه).

**س: هل العمولة تستمر للأبد؟**
ج: نعم، طالما العميل مجدد اشتراكه كل شهر تستمر عمولتك 10% شهرياً.

**س: ماذا لو طلب العميل استرجاع؟**
ج: لو الاسترجاع خلال 35 يوم من الدفع، العمولة المعلقة تُلغى. بعد 35 يوم لا يوجد خصم.


---

## 6. قاعدة البيانات — الجداول المطلوبة

### 6.1 جدول `subscriptions` (الاشتراكات)
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL DEFAULT 'pro',
  plan_price_gross NUMERIC NOT NULL DEFAULT 500,  -- السعر شامل الضريبة
  plan_price_net NUMERIC NOT NULL DEFAULT 438.60, -- السعر بعد خصم الضريبة
  tax_amount NUMERIC NOT NULL DEFAULT 61.40,      -- قيمة الضريبة
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'cancelled', 'expired')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,                -- تاريخ انتهاء الباقة
  renewed_at TIMESTAMPTZ,                         -- آخر تجديد
  referred_by UUID REFERENCES profiles(id),       -- الوكيل المُحيل
  renewal_count INT DEFAULT 0,                    -- عدد مرات التجديد
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index للبحث السريع
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_referred ON subscriptions(referred_by);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

### 6.2 جدول `agent_commissions` (عمولات الوكلاء)
```sql
CREATE TABLE agent_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,   -- الوكيل
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,  -- العميل
  subscription_id UUID REFERENCES subscriptions(id),
  renewal_number INT NOT NULL,          -- 1 = أول دفعة، 2+ = تجديد
  gross_commission NUMERIC NOT NULL,    -- العمولة قبل الضريبة
  tax_deducted NUMERIC NOT NULL,        -- الضريبة المخصومة
  net_commission NUMERIC NOT NULL,      -- الصافي للوكيل
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'available', 'paid', 'cancelled')),
  -- pending = خلال 35 يوم
  -- available = بعد 35 يوم، قابل للسحب
  -- paid = تم السحب
  -- cancelled = تم الاسترجاع خلال 35 يوم
  available_at TIMESTAMPTZ,             -- تاريخ انتهاء الـ 35 يوم
  type TEXT NOT NULL DEFAULT 'commission'
    CHECK (type IN ('commission', 'refund_deduction')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_commissions_agent ON agent_commissions(agent_id);
CREATE INDEX idx_commissions_status ON agent_commissions(status);
CREATE INDEX idx_commissions_available ON agent_commissions(available_at);
```

### 6.3 جدول `template_points` (نقاط القوالب)
```sql
CREATE TABLE template_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES user_templates(id) ON DELETE CASCADE,
  copied_by_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id), -- اشتراك الناسخ
  points INT NOT NULL DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'available', 'paid', 'cancelled')),
  available_at TIMESTAMPTZ,             -- تاريخ انتهاء الـ 35 يوم
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, copied_by_id)     -- منع التكرار
);

CREATE INDEX idx_template_points_owner ON template_points(template_owner_id);
CREATE INDEX idx_template_points_status ON template_points(status);
```

### 6.4 جدول `withdrawal_requests` (طلبات السحب)
```sql
CREATE TABLE withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('points', 'commission')),
  amount_requested NUMERIC NOT NULL,    -- المبلغ المطلوب
  amount_after_tax NUMERIC NOT NULL,    -- بعد خصم 14% ضريبة
  tax_deducted NUMERIC NOT NULL,
  points_used INT,                      -- النقاط المستخدمة (لو type = points)
  payment_method TEXT NOT NULL CHECK (payment_method IN ('instapay', 'vodafone_cash', 'orange_cash', 'etisalat_cash')),
  payment_account TEXT NOT NULL,        -- رقم الهاتف أو الحساب
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  admin_id UUID REFERENCES profiles(id), -- الأدمن اللي عالج الطلب
  admin_note TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_withdrawals_user ON withdrawal_requests(user_id);
CREATE INDEX idx_withdrawals_status ON withdrawal_requests(status);
```

### 6.5 جدول `admin_action_log` (سجل أعمال الأدمن)
```sql
-- حل مشكلة: مفيش آلية تحقق من الدفع الفعلي
CREATE TABLE admin_action_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES profiles(id),
  action_type TEXT NOT NULL,
  -- 'subscription_renew', 'subscription_cancel', 'withdrawal_approve',
  -- 'withdrawal_reject', 'points_cancel', 'commission_cancel'
  target_id UUID NOT NULL,              -- ID الـ record المتأثر
  target_type TEXT NOT NULL,            -- 'subscription', 'withdrawal', 'template_points'
  old_value JSONB,                      -- القيمة قبل التغيير
  new_value JSONB,                      -- القيمة بعد التغيير
  note TEXT,                            -- ملاحظة الأدمن
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_log_admin ON admin_action_log(admin_id);
CREATE INDEX idx_admin_log_target ON admin_action_log(target_id);
```

### 6.6 تعديل جدول `profiles`
```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS points_balance INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS points_pending INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_balance NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_pending NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_referrals INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS active_referrals INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_points_earned INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_commission_earned NUMERIC DEFAULT 0;
```


---

## 7. منطق الحسابات (Business Logic)

### 7.1 عند نسخ قالب
```
FUNCTION on_template_copy(template_id, copied_by_id):

  1. تحقق: هل copied_by_id مشترك بباقة مدفوعة نشطة؟
     → IF NOT: return (لا نقاط)

  2. تحقق: هل القالب معتمد من الأدمن؟
     → IF NOT: return

  3. تحقق: هل copied_by_id نسخ هذا القالب من قبل؟
     → IF YES: return (UNIQUE constraint)

  4. أنشئ سجل في template_points:
     - points = 10
     - status = 'pending'
     - available_at = NOW() + 35 days

  5. أضف 10 لـ points_pending في profiles للمالك
```

### 7.2 Cron Job يومي — تحويل المعلق للمتاح
```
FUNCTION daily_release_pending():

  -- نقاط القوالب
  FOR EACH template_points WHERE status = 'pending' AND available_at <= NOW():
    UPDATE status = 'available'
    UPDATE profiles: points_balance += points, points_pending -= points

  -- عمولات الوكلاء
  FOR EACH agent_commissions WHERE status = 'pending' AND available_at <= NOW():
    UPDATE status = 'available'
    UPDATE profiles: commission_balance += net_commission, commission_pending -= net_commission
```

### 7.3 عند تجديد اشتراك (الأدمن يضغط "تجديد")
```
FUNCTION renew_subscription(subscription_id, admin_id):

  1. جلب بيانات الاشتراك (user_id, plan_price_net, referred_by, renewal_count)

  2. تحديث الاشتراك:
     - expires_at = expires_at + 30 days
     - renewed_at = NOW()
     - renewal_count += 1
     - status = 'active'

  3. IF referred_by IS NOT NULL:
     renewal_number = renewal_count + 1
     IF renewal_number == 1:
       gross = plan_price_net * 0.20
     ELSE:
       gross = plan_price_net * 0.10

     tax = gross * 0.14
     net = gross - tax

     INSERT INTO agent_commissions:
       - agent_id = referred_by
       - client_id = user_id
       - net_commission = net
       - status = 'pending'
       - available_at = NOW() + 35 days

     UPDATE profiles (agent): commission_pending += net

  4. سجّل في admin_action_log:
     - admin_id = admin_id
     - action_type = 'subscription_renew'
     - target_id = subscription_id
     - old_value = {expires_at_old, renewal_count_old}
     - new_value = {expires_at_new, renewal_count_new}
```

### 7.4 عند استرجاع اشتراك
```
FUNCTION refund_subscription(subscription_id, admin_id):

  1. جلب بيانات الاشتراك

  2. تحقق: هل مر 35 يوم على آخر دفعة؟
     IF YES:
       → لا خصم للعمولة — فقط إلغاء الاشتراك
       UPDATE subscription: status = 'cancelled'
       سجّل في admin_action_log
       return

     IF NO (خلال 35 يوم):
       → ابحث عن آخر commission بـ status = 'pending' لهذا الاشتراك
       IF FOUND:
         UPDATE commission: status = 'cancelled'
         UPDATE profiles (agent): commission_pending -= net_commission
         سجّل في admin_action_log

       → ابحث عن template_points بـ status = 'pending' للناسخ
       IF FOUND:
         UPDATE template_points: status = 'cancelled'
         UPDATE profiles (owner): points_pending -= points
         سجّل في admin_action_log

       UPDATE subscription: status = 'cancelled'
```

### 7.5 عند طلب سحب
```
FUNCTION request_withdrawal(user_id, type, amount, payment_method, payment_account):

  IF type == 'points':
    IF points_balance < 100: return ERROR "الرصيد أقل من الحد الأدنى"
    IF amount > points_balance: return ERROR "الرصيد غير كافٍ"
    tax = amount * 0.14
    net = amount - tax

  IF type == 'commission':
    IF commission_balance < 500: return ERROR "الرصيد أقل من الحد الأدنى"
    IF amount > commission_balance: return ERROR "الرصيد غير كافٍ"
    tax = 0  -- الضريبة خُصمت مسبقاً عند الاكتساب
    net = amount

  INSERT INTO withdrawal_requests:
    - amount_requested = amount
    - amount_after_tax = net
    - tax_deducted = tax
    - status = 'pending'
```

### 7.6 عند موافقة الأدمن على السحب
```
FUNCTION approve_withdrawal(withdrawal_id, admin_id):

  1. جلب بيانات الطلب
  2. تحقق: status == 'pending'

  IF type == 'points':
    UPDATE profiles: points_balance -= points_used
    UPDATE template_points المقابلة: status = 'paid'

  IF type == 'commission':
    UPDATE profiles: commission_balance -= amount_requested
    UPDATE agent_commissions المقابلة: status = 'paid'

  UPDATE withdrawal_requests:
    - status = 'paid'
    - admin_id = admin_id
    - processed_at = NOW()

  سجّل في admin_action_log
  أرسل إشعار للمستخدم
```


---

## 8. API Endpoints المطلوبة

```
POST /api/subscriptions/renew
  Body: { subscription_id }
  Auth: admin only
  Action: تجديد اشتراك + حساب عمولة + تسجيل في log

POST /api/subscriptions/refund
  Body: { subscription_id, reason }
  Auth: admin only
  Action: استرجاع + خصم عمولة معلقة إن وجدت + تسجيل في log

POST /api/subscriptions/create
  Body: { user_id, plan_id, referred_by? }
  Auth: admin only
  Action: إنشاء اشتراك جديد

POST /api/templates/copy
  Body: { template_id }
  Auth: authenticated user
  Action: تسجيل نسخ قالب + إضافة نقاط معلقة

POST /api/withdrawals/request
  Body: { type, amount, payment_method, payment_account }
  Auth: authenticated user
  Action: إنشاء طلب سحب

POST /api/withdrawals/approve
  Body: { withdrawal_id }
  Auth: admin only
  Action: موافقة + خصم رصيد + إشعار

POST /api/withdrawals/reject
  Body: { withdrawal_id, reason }
  Auth: admin only
  Action: رفض + إشعار للمستخدم

GET /api/earnings/summary
  Auth: authenticated user
  Returns: { points_balance, points_pending, commission_balance, commission_pending, ... }

GET /api/earnings/history
  Auth: authenticated user
  Returns: تاريخ النقاط والعمولات

GET /api/agent/clients
  Auth: authenticated user
  Returns: قائمة العملاء التابعين مع حالاتهم
```

---

## 9. لوحة الأدمن — الإضافات المطلوبة

### 9.1 صفحة `/admin/subscriptions`
- جدول بكل المشتركين: الاسم، الباقة، تاريخ الانتهاء، الوكيل المُحيل
- فلتر: نشط / منتهي / قريب الانتهاء (خلال 7 أيام)
- زر "تجديد" لكل مشترك → يفتح modal تأكيد مع تفاصيل العمولة المترتبة
- زر "استرجاع" → يفتح modal تأكيد مع تحذير واضح
- **كل عملية تجديد أو استرجاع تُسجَّل تلقائياً في admin_action_log مع اسم الأدمن**

### 9.2 صفحة `/admin/withdrawals`
- جدول بكل طلبات السحب (نقاط + عمولات)
- فلتر بالحالة: pending / approved / paid / rejected
- فلتر بالنوع: points / commission
- زر "تم التحويل" → يغير الحالة لـ paid ويخصم الرصيد
- زر "رفض" → يفتح modal لإدخال سبب الرفض
- عرض: اسم المستخدم، المبلغ، طريقة الدفع، رقم الحساب، تاريخ الطلب

### 9.3 صفحة `/admin/action-log`
- سجل كامل بكل أعمال الأدمن
- فلتر بالأدمن، بالنوع، بالتاريخ
- لا يمكن حذف أي سجل (للمراجعة والمحاسبة)

### 9.4 إحصائيات مالية في `/admin`
- إجمالي العمولات المدفوعة هذا الشهر
- إجمالي النقاط المكتسبة
- طلبات السحب المعلقة وقيمتها الإجمالية
- عدد المشتركين النشطين
- عدد الاشتراكات المنتهية خلال 7 أيام (تنبيه)

---

## 10. صفحات الواجهة المطلوبة

### 10.1 صفحة `/earnings` (أرباحي)
**تبويب 1: نقاط القوالب**
- رصيد متاح + رصيد معلق
- جدول بكل النقاط المكتسبة (القالب، من نسخه، التاريخ، الحالة)
- زر "طلب سحب" (يظهر فقط لو الرصيد ≥ 100)

**تبويب 2: عمولات الوكلاء**
- رصيد متاح + رصيد معلق
- جدول العملاء مع حالاتهم وعمولة كل شهر
- زر "طلب سحب" (يظهر فقط لو الرصيد ≥ 500)

**تبويب 3: طلبات السحب**
- تاريخ كل الطلبات مع حالاتها وملاحظات الأدمن

### 10.2 تحديث صفحة `/profile`
- إضافة بطاقتين صغيرتين: رصيد النقاط + رصيد العمولات
- رابط "عرض التفاصيل" → `/earnings`

### 10.3 قسم "اكسب معنا" في الصفحة الرئيسية `/`
- بطاقتان جنب بعض تشرحان النظامين
- أرقام واضحة: 10 نقاط، 100 نقطة للسحب، 20%/10%، 500 جنيه للسحب
- FAQ بـ 4-5 أسئلة شائعة
- زر CTA: "ابدأ الآن مجاناً"

---

## 11. طرق الدفع المدعومة

| الطريقة | القيمة في DB | التفاصيل |
|---------|-------------|---------|
| انستاباي | `instapay` | رقم الهاتف أو الـ IPA address |
| فودافون كاش | `vodafone_cash` | رقم الهاتف |
| أورنج كاش | `orange_cash` | رقم الهاتف |
| اتصالات كاش | `etisalat_cash` | رقم الهاتف |

> الدفع يدوي من الأدمن في المرحلة الأولى — لا يوجد payment gateway تلقائي

---

## 12. خطة التنفيذ (المراحل)

### المرحلة 1 — قاعدة البيانات
- [ ] إنشاء جداول: `subscriptions`, `agent_commissions`, `template_points`, `withdrawal_requests`, `admin_action_log`
- [ ] تعديل جدول `profiles` بالأعمدة الجديدة
- [ ] إضافة RLS policies (المستخدم يرى بياناته فقط، الأدمن يرى الكل)
- [ ] إضافة Indexes للأداء
- [ ] إنشاء Cron Job يومي لتحويل المعلق للمتاح (Supabase pg_cron)

### المرحلة 2 — Backend APIs
- [ ] `POST /api/subscriptions/create`
- [ ] `POST /api/subscriptions/renew`
- [ ] `POST /api/subscriptions/refund`
- [ ] `POST /api/templates/copy` (تعديل الموجود)
- [ ] `POST /api/withdrawals/request`
- [ ] `POST /api/withdrawals/approve`
- [ ] `POST /api/withdrawals/reject`
- [ ] `GET /api/earnings/summary`
- [ ] `GET /api/earnings/history`
- [ ] `GET /api/agent/clients`

### المرحلة 3 — الواجهة
- [ ] صفحة `/earnings` بالتبويبات الثلاثة
- [ ] تحديث صفحة `/profile`
- [ ] قسم "اكسب معنا" في الصفحة الرئيسية
- [ ] صفحة `/admin/subscriptions`
- [ ] صفحة `/admin/withdrawals`
- [ ] صفحة `/admin/action-log`
- [ ] تحديث `/admin` بالإحصائيات المالية

### المرحلة 4 — الاختبار
- [ ] سيناريو: نسخ قالب من مشترك → نقاط معلقة → 35 يوم → نقاط متاحة
- [ ] سيناريو: تجديد اشتراك → عمولة معلقة → 35 يوم → عمولة متاحة
- [ ] سيناريو: استرجاع خلال 35 يوم → إلغاء العمولة المعلقة
- [ ] سيناريو: استرجاع بعد 35 يوم → لا خصم
- [ ] سيناريو: طلب سحب نقاط → موافقة الأدمن → خصم الرصيد
- [ ] سيناريو: طلب سحب عمولات → موافقة الأدمن → خصم الرصيد
- [ ] التحقق من admin_action_log في كل العمليات

---

## 13. ملاحظات مهمة للتنفيذ

- **الباقات:** حالياً باقة واحدة بـ 500 جنيه — يمكن إضافة باقات أخرى لاحقاً بتغيير `plan_id` و `plan_price_gross`
- **الضريبة 14%:** تُخصم من السعر الإجمالي أولاً، ثم تُحسب نسبة الوكيل من الصافي
- **الرصيد المعلق:** 35 يوماً لكلا النظامين — يحمي من الاسترجاعات
- **admin_action_log:** إلزامي لكل عملية تجديد أو استرجاع أو موافقة سحب — يحل مشكلة الأخطاء البشرية
- **الإشعارات:** الوكيل يتلقى إشعاراً عند كل تغيير في حالة عملائه
- **النقاط والعمولات:** رصيدان مستقلان تماماً — لا يمكن تحويل بينهما
- **الأمان:** كل APIs تتحقق من صلاحية المستخدم — الأدمن فقط يقدر يجدد أو يسترجع
