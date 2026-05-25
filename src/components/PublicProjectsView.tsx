'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

const NAV_LINKS = [
  { id: 'hero', label: 'الرئيسية' },
  { id: 'features', label: 'المميزات' },
  { id: 'templates', label: 'القوالب' },
  { id: 'pricing', label: 'الأسعار' },
  { id: 'contact', label: 'تواصل معنا' },
]

export default function PublicProjectsView() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const ctaRef = useRef<HTMLAnchorElement>(null)
  const [ctaShake, setCtaShake] = useState(false)

  useEffect(() => {
    const el = ctaRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCtaShake(true)
          setTimeout(() => setCtaShake(false), 700)
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const scrollTo = (id: string) => {
    setMobileOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div dir="rtl" className="min-h-screen bg-white font-sans">
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
          20%, 40%, 60%, 80% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.6s ease-in-out;
        }
      `}</style>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/201558282760"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 hover:scale-110 transition-all duration-300"
        aria-label="واتساب"
      >
        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

      {/* ===== HEADER ===== */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100/80 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200/50">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <span className="font-bold text-lg text-gray-800">Forms<span className="text-blue-600">.OpenappO</span></span>
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
              className="px-5 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25 font-medium"
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
              <div className="inline-block px-4 py-1.5 bg-white text-pink-600 rounded-full text-sm font-medium mb-6 border border-blue-500">
                منصة نماذج واستبيانات احترافية
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                أنشئ <span className="text-pink-500">نماذج</span> احترافية
                <br />
                في دقائق
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
                منصة متكاملة لإنشاء النماذج والاستبيانات والاختبارات. تصاميم عصرية، دعم عربي كامل، 
                تحليلات ذكية، وروابط مختصرة — كل هذا مجاناً
              </p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <Link href="/register" ref={ctaRef}
                  className={`px-8 py-4 bg-blue-600 text-white rounded-2xl hover:brightness-110 transition-all font-bold shadow-xl shadow-blue-500/20 flex items-center gap-2 text-lg ${ctaShake ? 'animate-shake' : ''}`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  أنشئ نموذجك الأول مجاناً
                </Link>
                <button onClick={() => scrollTo('features')}
                  className="px-8 py-4 bg-white text-blue-600 rounded-2xl hover:bg-blue-50 transition-colors font-semibold border-2 border-blue-200 flex items-center gap-2 text-lg"
                >
                  اكتشف المميزات
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                </button>
              </div>
            </div>

            <div className="flex-1 flex justify-center lg:justify-end">
              <div className="relative">
                <div className="w-72 h-72 sm:w-80 sm:h-80 bg-gradient-to-br from-blue-500 to-pink-500 rounded-3xl shadow-2xl shadow-blue-500/20 flex items-center justify-center">
                  <svg className="w-40 h-40 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-lg px-5 py-3 border border-gray-100">
                  <p className="text-sm font-bold text-pink-500">بدون علامة مائية</p>
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
            <div className="w-20 h-1 bg-pink-500 rounded-full mx-auto mt-3 mb-6" />
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
                className="bg-gradient-to-b from-white to-pink-50/20 rounded-2xl p-6 border border-gray-100 hover:shadow-lg hover:border-pink-200 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center text-2xl mb-4 shadow-sm border border-gray-100">
                  <span>{f.icon}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TEMPLATES ===== */}
      <section id="templates" className="py-20 px-4 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">قوالب احترافية لمجالك</h2>
            <div className="w-20 h-1 bg-blue-600 rounded-full mx-auto mt-3 mb-6" />
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              ابدأ بقالب جاهز مصمم خصيصاً لنشاطك التجاري — ووفّر ساعات من العمل
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 mt-10">
            {[
              { icon: '🎓', label: 'مراكز تعليم', cat: 'education_centers', color: 'from-purple-500 to-violet-600' },
              { icon: '🏥', label: 'عيادات', cat: 'clinics', color: 'from-teal-500 to-emerald-600' },
              { icon: '🍽️', label: 'مطاعم', cat: 'restaurants', color: 'from-orange-500 to-red-600' },
              { icon: '📦', label: 'شحن', cat: 'shipping', color: 'from-blue-500 to-cyan-600' },
              { icon: '🏠', label: 'عقارات', cat: 'real_estate', color: 'from-amber-500 to-yellow-600' },
              { icon: '📚', label: 'مدارس', cat: 'schools', color: 'from-green-500 to-emerald-600' },
              { icon: '💼', label: 'شركات صغيرة', cat: 'small_business', color: 'from-rose-500 to-pink-600' },
            ].map((item) => (
              <Link
                key={item.cat}
                href={`/templates`}
                className="group relative overflow-hidden rounded-2xl p-5 bg-white border border-gray-100 hover:shadow-xl hover:border-gray-200 transition-all duration-300 text-center"
              >
                <div className={`w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-2xl shadow-lg transition-transform group-hover:scale-110 group-hover:-rotate-3`}>
                  <span>{item.icon}</span>
                </div>
                <h3 className="text-sm font-bold text-gray-900">{item.label}</h3>
                <p className="text-[10px] text-gray-400 mt-1">قوالب جاهزة</p>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/templates"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-blue-600 text-white font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-blue-500/25"
            >
              تصفح جميع القوالب
              <span>←</span>
            </Link>
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
              <Link href="/register" className="block w-full py-3 text-center bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-500/25">اشتري الآن</Link>
            </div>

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
              className="px-8 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-500/25 flex items-center gap-2"
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
              className="w-full py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-500/25 text-lg"
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
                <span className="font-bold text-lg">Forms.OpenappO</span>
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
            <p className="text-gray-500 text-sm">© 2026 Forms.OpenappO. جميع الحقوق محفوظة</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
