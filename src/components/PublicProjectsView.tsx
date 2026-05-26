'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import { toast } from '@/lib/toast'

const NAV_LINKS = [
  { id: 'hero', label: 'الرئيسية' },
  { id: 'features', label: 'المميزات' },
  { id: 'templates', label: 'القوالب' },
  { id: 'partners', label: 'شركاؤنا' },
  { id: 'pricing', label: 'الأسعار' },
  { id: 'contact', label: 'تواصل معنا' },
]

export default function PublicProjectsView() {
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [partners, setPartners] = useState<any[]>([])
  const [ideasMap, setIdeasMap] = useState<Record<string, any[]>>({})
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactType, setContactType] = useState('inquiry')
  const [contactMessage, setContactMessage] = useState('')
  const [contactSubmitting, setContactSubmitting] = useState(false)

  useEffect(() => {
    ;(async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, company, bio, referral_code, referral_count')
        .eq('is_partner', true)
        .limit(6)
      if (profiles) {
        setPartners(profiles)
        const im: Record<string, any[]> = {}
        for (const p of profiles) {
          const { data: ideas } = await supabase
            .from('partner_ideas')
            .select('text, implemented')
            .eq('partner_id', p.id)
            .order('created_at', { ascending: false })
            .limit(2)
          if (ideas) im[p.id] = ideas
        }
        setIdeasMap(im)
      }
    })()
  }, [])

  const scrollTo = (id: string) => {
    setMobileOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div dir="rtl" className="min-h-screen bg-white font-sans">
      {/* ===== HEADER ===== */}
      <header className="fixed top-0 end-0 start-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100/80 shadow-sm">
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
              className="px-5 py-2 bg-gradient-to-l from-blue-600 to-indigo-600 text-white text-sm rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 font-medium"
            >ابدأ مجاناً</Link>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg" aria-label="القائمة الرئيسية">
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
        <div className="absolute -top-32 -start-32 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -end-32 w-96 h-96 bg-indigo-100/30 rounded-full blur-3xl" />

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
                <div className="absolute -bottom-4 -end-4 bg-white rounded-2xl shadow-lg px-5 py-3 border border-gray-100">
                  <p className="text-sm font-bold text-gray-800">بدون علامة مائية</p>
                  <p className="text-xs text-gray-500">في جميع الخطط</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 end-0 start-0">
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
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-l from-blue-600 to-indigo-600 text-white font-bold text-sm hover:shadow-xl hover:shadow-blue-200/50 transition-all duration-300"
            >
              تصفح جميع القوالب
              <span>←</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== PARTNERS ===== */}
      <section id="partners" className="py-20 px-4 bg-gradient-to-b from-indigo-50/40 via-white to-purple-50/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">🚀 شركاء النجاح</h2>
            <div className="w-20 h-1 bg-indigo-600 rounded-full mx-auto mt-3 mb-6" />
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              نخبة من منشئي النماذج المتميزين الذين يساهمون في إثراء المنصة بأفكارهم
            </p>
          </div>

          {partners.length === 0 ? (
            <div className="text-center py-12 text-gray-400">جاري تحميل الشركاء...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
                {partners.map((p) => (
                  <div key={p.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all duration-300">
                    <div className="bg-gradient-to-l from-indigo-500 to-purple-600 p-5 text-center">
                      <div className="w-16 h-16 mx-auto rounded-full border-4 border-white/50 overflow-hidden bg-white/20 relative">
                        {p.avatar_url ? (
                          <Image 
                            src={p.avatar_url} 
                            alt={p.name} 
                            fill
                            className="object-cover" 
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white text-xl font-bold">{p.name?.charAt(0)}</div>
                        )}
                      </div>
                      <h3 className="text-white font-bold mt-2">{p.name}</h3>
                      {p.company && <p className="text-indigo-200 text-xs">{p.company}</p>}
                    </div>

                    {p.bio && (
                      <div className="px-4 pt-3">
                        <p className="text-gray-600 text-xs leading-relaxed line-clamp-2">{p.bio}</p>
                      </div>
                    )}

                    {ideasMap[p.id] && ideasMap[p.id].length > 0 && (
                      <div className="px-4 pt-3">
                        <h4 className="text-[10px] font-bold text-gray-800 mb-1.5 flex items-center gap-1">
                          <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1z" /></svg>
                          الأفكار
                        </h4>
                        <div className="space-y-1.5">
                          {ideasMap[p.id].map((idea: any, i: number) => (
                            <div key={i} className="flex items-start gap-1.5 p-2 rounded-xl bg-gray-50 border border-gray-100">
                              <span className={`mt-0.5 w-3 h-3 rounded-full border-2 shrink-0 flex items-center justify-center ${idea.implemented ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                                {idea.implemented && <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                              </span>
                              <p className="text-[11px] text-gray-700 leading-relaxed">{idea.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100 mt-3">
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                        {p.referral_count || 0} إحالة
                      </div>
                      <Link href="/partners" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
                        عرض الكل
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center mt-10">
                <Link href="/partners"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-l from-indigo-600 to-purple-600 text-white rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold shadow-lg shadow-indigo-500/25"
                >
                  اكتشف جميع الشركاء
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </Link>
              </div>
            </>
          )}
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
              <div className="absolute -top-3 start-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">الأكثر شهرة</div>
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
              <Link href="/register" className="block w-full py-3 text-center bg-gradient-to-l from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-colors font-medium shadow-lg shadow-blue-500/25 opacity-60 cursor-not-allowed pointer-events-none">قريباً</Link>
              <p className="text-xs text-gray-400 text-center mt-2">الدفع الإلكتروني قيد التفعيل</p>
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

      {/* ===== EARN WITH US ===== */}
      <section id="earn" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">💰 اكسب معنا بطريقتين</h2>
            <div className="w-20 h-1 bg-blue-600 rounded-full mx-auto mt-3 mb-6" />
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              حقّق أرباحاً من قوالبك أو من خلال دعوة الآخرين للانضمام
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-8 border border-amber-200 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">📦 نقاط القوالب</h3>
              <p className="text-gray-600 mb-4">انشئ قالباً جميلاً وانشره للعموم. كل مشترك ينسخ قالبك = 10 نقاط لك</p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm text-gray-700"><svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg> 10 نقاط عن كل نسخة لقالبك</li>
                <li className="flex items-center gap-2 text-sm text-gray-700"><svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg> الحد الأدنى للسحب: 100 نقطة = 100 جنيه</li>
                <li className="flex items-center gap-2 text-sm text-gray-700"><svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg> تحتاج مشتركين بباقة مدفوعة ليُحتسبوا</li>
              </ul>
              <p className="text-amber-700 font-bold text-lg">النقطة = 1 جنيه</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-8 border border-emerald-200 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">🤝 نظام الوكلاء</h3>
              <p className="text-gray-600 mb-4">شارك رابطك الخاص مع أصحابك وعملاءك. كل مشترك يدفع من رابطك = عمولة لك</p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm text-gray-700"><svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg> أول شهر: 20% من صافي السعر</li>
                <li className="flex items-center gap-2 text-sm text-gray-700"><svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg> كل شهر بعد كده: 10% من صافي السعر</li>
                <li className="flex items-center gap-2 text-sm text-gray-700"><svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg> الحد الأدنى للسحب: 500 جنيه</li>
              </ul>
              <p className="text-emerald-700 font-bold text-lg">عمولة مستمرة طول ما العميل مجدد</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-8 mt-8 border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">أسئلة شائعة</h3>
            <div className="space-y-4 max-w-2xl mx-auto">
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer text-gray-800 font-medium py-2">
                  هل أحتاج اشتراك مدفوع عشان أكسب؟
                  <svg className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <p className="text-gray-600 text-sm mt-1 pr-4">لا — أي مستخدم يقدر يكون وكيلاً أو ينشر قوالب. لكن النقاط تُحتسب فقط لما الناسخ يكون مشترك مدفوع.</p>
              </details>
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer text-gray-800 font-medium py-2">
                  متى أقدر أسحب أرباحي؟
                  <svg className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <p className="text-gray-600 text-sm mt-1 pr-4">بعد مرور 35 يوماً على الاكتساب وبلوغ الحد الأدنى (100 نقطة أو 500 جنيه).</p>
              </details>
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer text-gray-800 font-medium py-2">
                  هل العمولة تستمر للأبد؟
                  <svg className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <p className="text-gray-600 text-sm mt-1 pr-4">نعم، طالما العميل مجدد اشتراكه كل شهر تستمر عمولتك 10% شهرياً.</p>
              </details>
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer text-gray-800 font-medium py-2">
                  ماذا لو طلب العميل استرجاع؟
                  <svg className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <p className="text-gray-600 text-sm mt-1 pr-4">لو الاسترجاع خلال 35 يوم من الدفع، العمولة المعلقة تُلغى. بعد 35 يوم لا يوجد خصم.</p>
              </details>
            </div>
          </div>

          <div className="text-center mt-10">
            <Link href="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-l from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all font-bold text-lg shadow-xl shadow-blue-500/25">
              ابدأ الآن مجاناً
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== CTA BANNER ===== */}
      <section className="py-16 px-4 bg-gradient-to-l from-blue-700 via-blue-600 to-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-20 -start-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -end-20 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl" />
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

          <form className="max-w-xl mx-auto mt-8 space-y-5" onSubmit={async (e) => {
            e.preventDefault()
            if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
              toast('يرجى ملء جميع الحقول المطلوبة')
              return
            }
            setContactSubmitting(true)
            try {
              const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: contactName, email: contactEmail, phone: contactPhone, type: contactType, message: contactMessage })
              })
              const data = await res.json()
              if (!res.ok) throw new Error(data.error)
              toast('تم إرسال رسالتك بنجاح، سنتواصل معك قريباً', 'success')
              setContactName('')
              setContactEmail('')
              setContactPhone('')
              setContactType('inquiry')
              setContactMessage('')
            } catch (err: any) {
              toast(err.message || 'حدث خطأ أثناء الإرسال')
            } finally {
              setContactSubmitting(false)
            }
          }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <input type="text" placeholder="الاسم *" required value={contactName} onChange={e => setContactName(e.target.value)}
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
              <input type="email" placeholder="البريد الإلكتروني *" required value={contactEmail} onChange={e => setContactEmail(e.target.value)}
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
            </div>
            <input type="tel" placeholder="رقم الهاتف (اختياري)" value={contactPhone} onChange={e => setContactPhone(e.target.value)}
              className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
            <div className="flex gap-3">
              {[
                { value: 'complaint', label: '📢 شكوى' },
                { value: 'suggestion', label: '💡 اقتراح' },
                { value: 'inquiry', label: '❓ استفسار' },
              ].map(opt => (
                <button key={opt.value} type="button" onClick={() => setContactType(opt.value)}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium border-2 transition-all ${
                    contactType === opt.value ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <textarea rows={4} placeholder="رسالتك *" required value={contactMessage} onChange={e => setContactMessage(e.target.value)}
              className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
            <button type="submit" disabled={contactSubmitting}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-500/25 text-lg disabled:opacity-50"
            >
              {contactSubmitting ? 'جاري الإرسال...' : 'إرسال'}
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
