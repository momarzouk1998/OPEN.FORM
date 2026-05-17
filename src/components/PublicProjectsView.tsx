'use client'

import { useState } from 'react'
import Link from 'next/link'

const NAV_LINKS = [
  { id: 'hero', label: 'الرئيسية' },
  { id: 'features', label: 'المميزات' },
  { id: 'pricing', label: 'الأسعار' },
  { id: 'contact', label: 'تواصل معنا' },
]

export default function PublicProjectsView() {
  const [mobileOpen, setMobileOpen] = useState(false)

  const scrollTo = (id: string) => {
    setMobileOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div dir="rtl" className="min-h-screen bg-white font-sans">
      {/* ===== HEADER ===== */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100/80 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200/50">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <span className="font-bold text-lg text-gray-800">Open<span className="text-blue-600">App</span>.Form</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map(l => (
              <button key={l.id} onClick={() => scrollTo(l.id)}
                className="px-3.5 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
              >{l.label}</button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login"
              className="hidden sm:inline-flex px-4 py-2 text-sm text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >تسجيل الدخول</Link>
            <Link href="/register"
              className="px-5 py-2 bg-gradient-to-l from-blue-600 to-indigo-600 text-white text-sm rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 font-medium"
            >ابدأ مجاناً</Link>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-1">
            {NAV_LINKS.map(l => (
              <button key={l.id} onClick={() => scrollTo(l.id)}
                className="text-right px-3 py-2.5 text-gray-700 hover:bg-blue-50 rounded-lg text-sm font-medium"
              >{l.label}</button>
            ))}
            <Link href="/login" className="text-right px-3 py-2.5 text-gray-700 hover:bg-blue-50 rounded-lg text-sm font-medium">تسجيل الدخول</Link>
          </div>
        )}
      </header>

      {/* ===== HERO ===== */}
      <section id="hero" className="relative min-h-[85vh] flex items-center bg-gradient-to-b from-blue-50 via-white to-white pt-20 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-100/30 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 w-full">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            <div className="flex-1 text-center lg:text-right">
              <div className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
                منصة نماذج واستبيانات احترافية
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                أنشئ <span className="text-blue-600">نماذج</span> احترافية
                <br />
                في دقائق
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
                منصة متكاملة لإنشاء النماذج والاستبيانات والاختبارات. تصاميم عصرية، دعم عربي كامل، 
                تحليلات ذكية، وروابط مختصرة — كل هذا مجاناً
              </p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <Link href="/register"
                  className="px-8 py-4 bg-gradient-to-l from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-xl shadow-blue-500/30 flex items-center gap-2 text-lg"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  أنشئ نموذجك الأول مجاناً
                </Link>
                <button onClick={() => scrollTo('features')}
                  className="px-8 py-4 bg-white text-blue-700 rounded-2xl hover:bg-blue-50 transition-colors font-semibold border-2 border-blue-200 flex items-center gap-2 text-lg"
                >
                  اكتشف المميزات
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                </button>
              </div>
            </div>

            <div className="flex-1 flex justify-center lg:justify-end">
              <div className="relative">
                <div className="w-72 h-72 sm:w-80 sm:h-80 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl shadow-2xl shadow-blue-500/30 flex items-center justify-center">
                  <svg className="w-40 h-40 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-lg px-5 py-3 border border-gray-100">
                  <p className="text-sm font-bold text-gray-800">بدون علامة مائية</p>
                  <p className="text-xs text-gray-500">في جميع الخطط</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0 60V30C240 0 480 0 720 30C960 60 1200 60 1440 30V60H0Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">مميزات متقدمة</h2>
            <div className="w-20 h-1 bg-blue-600 rounded-full mx-auto mt-3 mb-6" />
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              كل ما تحتاجه لإنشاء نماذج احترافية وجمع البيانات بذكاء
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {[
              { icon: '📝', title: 'نماذج غير محدودة', desc: 'أنشئ عدد غير محدود من النماذج والاستبيانات بدون أي قيود' },
              { icon: '🎨', title: 'تصاميم عصرية', desc: 'قوالب جاهزة واحترافية مع محرر سحب وإفلات سهل' },
              { icon: '🔗', title: 'روابط مختصرة', desc: 'روابط قصيرة سهلة النشر مثل forms.example.com/F/ABC123' },
              { icon: '📊', title: 'تحليلات ذكية', desc: 'إحصائيات وتقارير دقيقة للردود مع رسوم بيانية تفاعلية' },
              { icon: '🔄', title: 'منطق شرطي', desc: 'إظهار وإخفاء الأسئلة بناءً على إجابات المستخدم' },
              { icon: '🌐', title: 'دعم عربي كامل', desc: 'واجهة عربية أصيلة من اليمين إلى اليسار مع دعم كامل للغة' },
              { icon: '📱', title: 'متجاوب بالكامل', desc: 'يعمل على جميع الأجهزة — جوال، جهاز لوحي، كمبيوتر' },
              { icon: '🔒', title: 'خصوصية وأمان', desc: 'التحكم بصلاحيات النماذج والمستخدمين بشكل كامل' },
              { icon: '🏷️', title: 'بدون علامة مائية', desc: 'جميع الخطط مجانية وخالية من العلامات المائية على النماذج' },
            ].map((f, i) => (
              <div key={i}
                className="bg-gradient-to-b from-blue-50/50 to-white rounded-2xl p-6 border border-blue-100/60 hover:shadow-lg hover:border-blue-200 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-2xl mb-4 shadow-lg shadow-blue-200/50">
                  <span>{f.icon}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">خطط الأسعار</h2>
            <div className="w-20 h-1 bg-blue-600 rounded-full mx-auto mt-3 mb-6" />
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              اختر الخطة التي تناسب احتياجاتك
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 max-w-5xl mx-auto">
            {/* Free */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-gray-900 mb-1">مجاني</h3>
              <p className="text-3xl font-bold text-gray-900 mb-4">0 <span className="text-lg text-gray-500">ريال/شهر</span></p>
              <ul className="space-y-2.5 mb-6">
                {['نماذج غير محدودة', 'ردود غير محدودة', 'بدون علامة مائية', 'قوالب جاهزة', 'دعم عربي'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block w-full py-3 text-center bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200 transition-colors font-medium">ابدأ الآن</Link>
            </div>

            {/* Pro */}
            <div className="bg-white rounded-2xl p-6 border-2 border-blue-500 shadow-xl shadow-blue-500/20 relative scale-105">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">الأكثر شهرة</div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">احترافية</h3>
              <p className="text-3xl font-bold text-gray-900 mb-4">99 <span className="text-lg text-gray-500">ريال/شهر</span></p>
              <ul className="space-y-2.5 mb-6">
                {['كل مزايا المجاني', 'منطق شرطي متقدم', 'تحليلات وتقارير', 'تصدير البيانات (Excel, PDF)', 'روابط مختصرة مخصصة', 'خيارات team:5 أعضاء'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block w-full py-3 text-center bg-gradient-to-l from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-colors font-medium shadow-lg shadow-blue-500/25">اشتري الآن</Link>
            </div>

            {/* Enterprise */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-gray-900 mb-1">مؤسسات</h3>
              <p className="text-3xl font-bold text-gray-900 mb-4">299 <span className="text-lg text-gray-500">ريال/شهر</span></p>
              <ul className="space-y-2.5 mb-6">
                {['كل مزايا الاحترافية', 'دعم فني مخصص', 'SSO/تكامل LDAP', 'استضافة خاصة', 'تدقيق واستخدام غير محدود'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block w-full py-3 text-center bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200 transition-colors font-medium">تواصل معنا</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA BANNER ===== */}
      <section className="py-16 px-4 bg-gradient-to-l from-blue-700 via-blue-600 to-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">ابدأ في إنشاء نماذجك اليوم</h2>
          <p className="text-blue-100 text-lg mb-8">
            مجاني تماماً — بدون بطاقة ائتمان، بدون علامة مائية، بدون حدود
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/register"
              className="px-8 py-4 bg-white text-blue-700 rounded-2xl hover:bg-blue-50 transition-all font-bold shadow-xl flex items-center gap-2"
            >
              أنشئ حسابك مجاناً
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </Link>
            <Link href="/login"
              className="px-8 py-4 bg-blue-800/40 text-white rounded-2xl hover:bg-blue-800/60 transition-all font-semibold border border-white/20"
            >
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </section>

      {/* ===== CONTACT ===== */}
      <section id="contact" className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">تواصل معنا</h2>
            <div className="w-20 h-1 bg-blue-600 rounded-full mx-auto mt-3 mb-6" />
            <p className="text-gray-600 text-lg">لديك استفسار؟ فريقنا يسعد بمساعدتك</p>
          </div>

          <form className="max-w-xl mx-auto mt-8 space-y-5" onSubmit={e => e.preventDefault()}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <input type="text" placeholder="الاسم" className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
              <input type="email" placeholder="البريد الإلكتروني" className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
            </div>
            <input type="tel" placeholder="رقم الهاتف" className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
            <textarea rows={4} placeholder="رسالتك..." className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
            <button type="submit"
              className="w-full py-4 bg-gradient-to-l from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all font-bold shadow-lg shadow-blue-500/25 text-lg"
            >
              إرسال
            </button>
          </form>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-gray-900 text-white pt-16 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div className="text-center sm:text-right">
              <div className="flex items-center justify-center sm:justify-start gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <span className="font-bold text-lg">OpenApp.Form</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">منصة احترافية لإنشاء النماذج والاستبيانات</p>
            </div>

            <div className="text-center sm:text-right">
              <h4 className="font-bold text-white mb-4">روابط سريعة</h4>
              <ul className="space-y-2.5">
                {NAV_LINKS.map(l => (
                  <li key={l.id}>
                    <button onClick={() => scrollTo(l.id)} className="text-gray-400 hover:text-blue-400 text-sm transition-colors">{l.label}</button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-center sm:text-right">
              <h4 className="font-bold text-white mb-4">الحساب</h4>
              <ul className="space-y-2.5">
                <li><Link href="/login" className="text-gray-400 hover:text-blue-400 text-sm transition-colors">تسجيل الدخول</Link></li>
                <li><Link href="/register" className="text-gray-400 hover:text-blue-400 text-sm transition-colors">إنشاء حساب</Link></li>
              </ul>
            </div>

            <div className="text-center sm:text-right">
              <h4 className="font-bold text-white mb-4">تابعنا</h4>
              <div className="flex items-center justify-center sm:justify-start gap-3">
                {['facebook', 'telegram', 'whatsapp'].map(s => (
                  <div key={s}
                    className="w-10 h-10 rounded-xl bg-gray-800 hover:bg-blue-600 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-500 text-sm">© 2026 OpenApp.Form. جميع الحقوق محفوظة</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
