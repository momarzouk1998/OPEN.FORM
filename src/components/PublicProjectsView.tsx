'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

interface PublicProjectsViewProps {
  stats: {
    projects: number
    forms: number
    responses: number
  }
}

const NAV_LINKS = [
  { id: 'hero', label: 'الرئيسية' },
  { id: 'about', label: 'عن المنصة' },
  { id: 'stats', label: 'إحصائياتنا' },
  { id: 'features', label: 'المميزات' },
  { id: 'contact', label: 'تواصل معنا' },
]

export default function PublicProjectsView({ stats }: PublicProjectsViewProps) {
  const [settings, setSettings] = useState({
    app_logo: '/logo.png', app_name: 'مشاريع أحلى شباب', app_description: 'منصة متكاملة لإدارة المتطوعين والمشاريع'
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const supabase = createClient()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => { 
    fetchSettings() 
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const fetchSettings = async () => {
    try {
      const { data } = await supabase.from('app_settings').select('key, value')
      if (data) {
        const obj: any = { ...settings }
        data.forEach(s => { if (s.value) obj[s.key] = s.value })
        setSettings(obj)
      }
    } catch (e) { console.error(e) }
  }

  const scrollTo = (id: string) => {
    setMobileOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#f8fafc] font-sans overflow-x-hidden">
      {/* ===== HEADER ===== */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-lg shadow-md py-2' : 'bg-transparent py-4'}`}>
        <div className="max-w-7xl mx-auto px-4 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-lg border-2 border-white/50 group-hover:scale-105 transition-transform">
              <img
                src={settings.app_logo}
                alt="شعار"
                className="w-full h-full object-cover"
              />
            </div>
            <span className={`font-bold text-xl transition-colors ${scrolled ? 'text-[#023f8e]' : 'text-[#023f8e] drop-shadow-sm'}`}>{settings.app_name}</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-2 bg-white/40 backdrop-blur-md rounded-full px-4 py-1.5 border border-[#023f8e]/10">
            {NAV_LINKS.map(l => (
              <button key={l.id} onClick={() => scrollTo(l.id)}
                className={`px-4 py-2 text-sm rounded-full transition-all font-semibold ${scrolled ? 'text-gray-600 hover:bg-[#023f8e]/10 hover:text-[#023f8e]' : 'text-[#023f8e]/80 hover:bg-[#023f8e]/10 hover:text-[#023f8e]'}`}
              >{l.label}</button>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link href="/login"
              className={`hidden sm:inline-flex px-5 py-2.5 text-sm font-bold transition-all rounded-xl ${scrolled ? 'text-[#023f8e] hover:bg-[#023f8e]/5' : 'text-[#023f8e] hover:bg-[#023f8e]/10'}`}
            >دخول للمنصة</Link>
            <Link href="/register"
              className="px-6 py-2.5 bg-gradient-to-r from-[#023f8e] to-[#00398a] text-white text-sm rounded-xl hover:shadow-lg hover:shadow-[#023f8e]/30 hover:-translate-y-0.5 transition-all font-bold border border-[#023f8e]/10"
            >حساب جديد</Link>
            <button onClick={() => setMobileOpen(!mobileOpen)} className={`lg:hidden p-2 rounded-lg text-[#023f8e]`}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-white shadow-xl border-t border-gray-100 flex flex-col p-4 gap-2 animate-in slide-in-from-top-4">
            {NAV_LINKS.map(l => (
              <button key={l.id} onClick={() => scrollTo(l.id)}
                className="text-right px-4 py-3 text-gray-800 hover:bg-[#023f8e]/5 hover:text-[#023f8e] rounded-xl text-base font-bold transition-colors"
              >{l.label}</button>
            ))}
            <Link href="/login" className="text-right px-4 py-3 text-gray-800 hover:bg-[#023f8e]/5 hover:text-[#023f8e] rounded-xl text-base font-bold transition-colors">تسجيل الدخول</Link>
          </div>
        )}
      </header>

      {/* ===== HERO ===== */}
      <section id="hero" className="relative min-h-[90vh] flex items-center bg-gradient-to-b from-[#e8f0fa] via-white to-white pt-20 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#98b0d0]/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#98b0d0]/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 lg:px-8 w-full">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            {/* Text side */}
            <div className="flex-1 text-center lg:text-right">
              <div className="inline-block px-4 py-1.5 bg-[#023f8e]/10 text-[#023f8e] rounded-full text-sm font-bold mb-6">
                منصة شبابية متكاملة
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-gray-900 leading-tight mb-6 tracking-tight">
                منصة <span className="text-[#023f8e]">أحلى شباب</span>
                <br />
                لتنظيم المبادرات والتطوع
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed font-medium">
                منصة متكاملة لإدارة المشاريع الشبابية، ننظم جهود المتطوعين، 
                ونقدم المحتوى التعليمي والاستمارات بأحدث التقنيات وبكل سهولة.
              </p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <Link href="/register"
                  className="px-8 py-4 bg-gradient-to-l from-[#023f8e] to-[#00398a] text-white rounded-2xl hover:from-[#00398a] hover:to-[#023f8e] transition-all font-bold shadow-xl shadow-[#023f8e]/30 flex items-center gap-2 text-lg"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                  انضم إلينا الآن
                </Link>
                <button onClick={() => scrollTo('stats')}
                  className="px-8 py-4 bg-white text-[#023f8e] rounded-2xl hover:bg-[#023f8e]/5 transition-colors font-bold border-2 border-[#023f8e]/20 flex items-center gap-2 text-lg"
                >
                  استعرض الإحصائيات
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                </button>
              </div>
            </div>

            {/* Illustration side */}
            <div className="flex-1 flex justify-center lg:justify-end">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#023f8e]/20 to-[#98b0d0]/20 rounded-full blur-3xl transform group-hover:scale-110 transition-transform duration-700"></div>
                <img
                  src="/boy-blue.png"
                  alt="أحلى شباب"
                  className="relative w-[22rem] h-[22rem] sm:w-[28rem] sm:h-[28rem] object-contain drop-shadow-2xl z-10"
                />
                {/* Floating badge */}
                <div className="absolute bottom-4 -left-4 sm:bottom-10 sm:-left-10 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl px-5 py-3 border border-gray-100 z-20 animate-bounce" style={{ animationDuration: '3s' }}>
                  <p className="text-sm font-black text-[#023f8e]">{stats.projects}+ مشروع</p>
                  <p className="text-xs font-bold text-gray-500">متاحة للتطوع</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0 transform translate-y-1">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto drop-shadow-sm">
            <path d="M0 60V30C240 0 480 0 720 30C960 60 1200 60 1440 30V60H0Z" fill="#f8fafc" />
          </svg>
        </div>
      </section>

      {/* ===== STATS SECTION ===== */}
      <section id="stats" className="py-24 px-4 bg-[#f8fafc] relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-[#023f8e] mb-4">أرقام نفخر بها</h2>
            <div className="w-24 h-1.5 bg-gradient-to-r from-[#00398a] to-[#98b0d0] rounded-full mx-auto" />
            <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto font-medium">
              أثرنا يمتد وينمو بفضل مشاركتكم الفعالة في مشاريعنا
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Background blur for stats */}
            <div className="absolute inset-0 bg-[#98b0d0]/10 blur-3xl -z-10 rounded-[3rem]"></div>
            
            <div className="bg-white rounded-3xl p-8 shadow-xl shadow-[#023f8e]/5 border border-gray-100 hover:-translate-y-2 transition-transform duration-300 group">
              <div className="w-20 h-20 bg-gradient-to-br from-[#023f8e] to-[#00398a] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-[#023f8e]/20 group-hover:scale-110 transition-transform">
                <span className="text-4xl">🚀</span>
              </div>
              <h3 className="text-5xl font-black text-gray-900 mb-2">{stats.projects}</h3>
              <p className="text-lg font-bold text-gray-500">مشروع متاح</p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-xl shadow-[#023f8e]/5 border border-gray-100 hover:-translate-y-2 transition-transform duration-300 group">
              <div className="w-20 h-20 bg-gradient-to-br from-[#00398a] to-[#98b0d0] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-[#00398a]/20 group-hover:scale-110 transition-transform">
                <span className="text-4xl">📋</span>
              </div>
              <h3 className="text-5xl font-black text-gray-900 mb-2">{stats.forms}</h3>
              <p className="text-lg font-bold text-gray-500">استمارة نشطة</p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-xl shadow-[#023f8e]/5 border border-gray-100 hover:-translate-y-2 transition-transform duration-300 group">
              <div className="w-20 h-20 bg-gradient-to-br from-[#98b0d0] to-[#023f8e] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-[#98b0d0]/20 group-hover:scale-110 transition-transform">
                <span className="text-4xl">👥</span>
              </div>
              <h3 className="text-5xl font-black text-gray-900 mb-2">{stats.responses}</h3>
              <p className="text-lg font-bold text-gray-500">تسجيل ومشاركة</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ABOUT / MISSION ===== */}
      <section id="about" className="py-24 px-4 bg-white relative overflow-hidden">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-bl from-[#f0f4f8] to-transparent rounded-full -z-10 blur-3xl"></div>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#023f8e] to-[#98b0d0] rounded-[2.5rem] transform rotate-3 scale-105 opacity-20 group-hover:rotate-6 transition-transform duration-500"></div>
                <img
                  src="https://jeel.academy/wp-content/uploads/2024/03/أهدافنا.png"
                  alt="أهداف المنصة"
                  className="relative w-full max-w-lg mx-auto object-contain drop-shadow-2xl hover:-translate-y-2 transition-transform duration-500"
                />
              </div>
            </div>

            <div className="flex-1 lg:text-right">
              <h2 className="text-4xl sm:text-5xl font-extrabold text-[#023f8e] mb-6">عن المنصة</h2>
              <div className="w-24 h-1.5 bg-[#00398a] rounded-full mb-8" />
              <p className="text-gray-600 text-xl leading-relaxed mb-10 font-medium">
                {settings.app_description}
              </p>
              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  'إدارة مشاريع احترافية',
                  'متابعة دقيقة للمتطوعين',
                  'استمارات متطورة',
                  'تقارير وإحصائيات',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 bg-[#f8fafc] p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0 text-[#023f8e]">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-gray-800 font-bold text-lg">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="py-24 px-4 bg-gradient-to-b from-[#f8fafc] to-white relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-[#023f8e] mb-4">مميزات المنصة</h2>
            <div className="w-24 h-1.5 bg-gradient-to-r from-[#00398a] to-[#98b0d0] rounded-full mx-auto" />
            <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto font-medium">
              صممنا كل أداة بعناية لتلبية احتياجات إدارة المشاريع الدعوية والتطوعية
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            {[
              { icon: '🚀', title: 'إدارة متكاملة', desc: 'تنظيم المشاريع وتوزيع المهام بكفاءة عالية' },
              { icon: '📋', title: 'نماذج ذكية', desc: 'بناء استمارات مخصصة لجمع بيانات دقيقة ومفيدة' },
              { icon: '📊', title: 'لوحات تحكم', desc: 'شاشات تحليلية تمنحك نظرة شاملة على أداء المشاريع' },
              { icon: '🔒', title: 'أمان عالي', desc: 'حماية كاملة للبيانات ونظام صلاحيات متقدم' },
              { icon: '📱', title: 'متوافق بالكامل', desc: 'تصميم يتجاوب مع جميع الأجهزة والهواتف الذكية' },
              { icon: '⚡', title: 'سرعة وأداء', desc: 'تجربة استخدام سلسة وسريعة لزيادة الإنتاجية' },
            ].map((f, i) => (
              <div key={i}
                className="bg-white rounded-[2rem] p-8 border border-gray-100 hover:border-[#98b0d0]/50 hover:shadow-2xl hover:shadow-[#023f8e]/10 transition-all duration-300 group"
              >
                <div className="w-16 h-16 rounded-2xl bg-[#f0f4f8] group-hover:bg-[#023f8e] group-hover:text-white flex items-center justify-center text-3xl mb-6 transition-colors duration-300">
                  <span>{f.icon}</span>
                </div>
                <h3 className="text-2xl font-extrabold text-gray-900 mb-3">{f.title}</h3>
                <p className="text-gray-600 text-lg leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA BANNER ===== */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#023f8e]"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#98b0d0]/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center bg-white/5 backdrop-blur-sm p-12 md:p-20 rounded-[3rem] border border-white/10 shadow-2xl">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6 tracking-tight">جاهز للبدء؟</h2>
          <p className="text-xl md:text-2xl text-[#98b0d0] mb-12 font-medium max-w-2xl mx-auto">
            انضم الآن إلى أكبر مجتمع تطوعي وكن جزءاً من صناعة الأثر الإيجابي.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/register"
              className="w-full sm:w-auto px-12 py-5 bg-white text-[#023f8e] rounded-2xl hover:bg-gray-50 transition-all font-black text-xl shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_50px_rgba(255,255,255,0.4)] hover:-translate-y-1"
            >
              إنشاء حساب مجاني
            </Link>
          </div>
        </div>
      </section>

      {/* ===== CONTACT ===== */}
      <section id="contact" className="py-24 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-[#023f8e] mb-4">تواصل معنا</h2>
            <div className="w-24 h-1.5 bg-gradient-to-r from-[#00398a] to-[#98b0d0] rounded-full mx-auto" />
            <p className="mt-6 text-xl text-gray-600 font-medium">نحن هنا للإجابة على جميع استفساراتك</p>
          </div>

          <form className="space-y-6 bg-[#f8fafc] p-8 md:p-12 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40" onSubmit={e => e.preventDefault()}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <input type="text" placeholder="الاسم الكريم" className="w-full px-6 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#023f8e]/10 focus:border-[#023f8e] outline-none transition-all text-lg font-medium shadow-sm" />
              <input type="email" placeholder="البريد الإلكتروني" className="w-full px-6 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#023f8e]/10 focus:border-[#023f8e] outline-none transition-all text-lg font-medium shadow-sm" />
            </div>
            <textarea rows={5} placeholder="كيف يمكننا مساعدتك؟" className="w-full px-6 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#023f8e]/10 focus:border-[#023f8e] outline-none transition-all text-lg font-medium shadow-sm resize-none" />
            <button type="submit"
              className="w-full py-5 bg-[#023f8e] text-white rounded-2xl hover:bg-[#00398a] transition-all font-black shadow-xl shadow-[#023f8e]/30 text-xl hover:-translate-y-1"
            >
              إرسال الرسالة
            </button>
          </form>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-gradient-to-b from-white to-[#f0f4f8] text-[#023f8e] pt-24 pb-12 px-4 relative overflow-hidden border-t border-gray-100">
        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-[#00398a] via-[#98b0d0] to-[#00398a]"></div>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-16">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-white rounded-xl p-1 shadow-md">
                  <img src={settings.app_logo} alt="شعار" className="w-full h-full object-cover rounded-lg" />
                </div>
                <h3 className="font-black text-2xl text-[#023f8e]">{settings.app_name}</h3>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed font-medium">{settings.app_description}</p>
            </div>

            <div>
              <h4 className="font-bold text-xl text-[#023f8e] mb-6 border-b border-[#023f8e]/10 pb-4 inline-block">روابط سريعة</h4>
              <ul className="space-y-4">
                {NAV_LINKS.map(l => (
                  <li key={l.id}>
                    <button onClick={() => scrollTo(l.id)} className="text-gray-600 hover:text-[#023f8e] hover:translate-x-[-8px] transition-all text-lg font-bold">{l.label}</button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-xl text-[#023f8e] mb-6 border-b border-[#023f8e]/10 pb-4 inline-block">المنصة</h4>
              <ul className="space-y-4">
                <li><Link href="/login" className="text-gray-600 hover:text-[#023f8e] hover:translate-x-[-8px] transition-all text-lg font-bold">تسجيل الدخول</Link></li>
                <li><Link href="/register" className="text-gray-600 hover:text-[#023f8e] hover:translate-x-[-8px] transition-all text-lg font-bold">إنشاء حساب</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-xl text-[#023f8e] mb-6 border-b border-[#023f8e]/10 pb-4 inline-block">تواصل معنا</h4>
              <div className="flex gap-4">
                <a href="https://www.facebook.com/27lashabab/" target="_blank" rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full bg-white shadow-md hover:bg-[#023f8e] flex items-center justify-center transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-[#023f8e]/40 group"
                  title="فيسبوك"
                >
                  <svg className="w-5 h-5 text-[#023f8e] group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
                  </svg>
                </a>
                <a href="https://www.youtube.com/@27lashabab" target="_blank" rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full bg-white shadow-md hover:bg-[#ff0000] flex items-center justify-center transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-[#ff0000]/40 group"
                  title="يوتيوب"
                >
                  <svg className="w-5 h-5 text-[#023f8e] group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
                <a href="https://t.me/s/a7lashabab" target="_blank" rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full bg-white shadow-md hover:bg-[#0088cc] flex items-center justify-center transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-[#0088cc]/40 group"
                  title="تليجرام"
                >
                  <svg className="w-5 h-5 text-[#023f8e] group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.53-1.39.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.46-.42-1.4-.88.03-.24.37-.49 1.03-.75 4.04-1.76 6.74-2.92 8.09-3.48 3.85-1.6 4.64-1.88 5.17-1.89.11 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.13-.03.19z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-[#023f8e]/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-600 font-bold">© {new Date().getFullYear()} {settings.app_name}. جميع الحقوق محفوظة</p>
            <p className="text-gray-600 font-bold">تم التصميم بكل ❤️ لخدمة المجتمع</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
