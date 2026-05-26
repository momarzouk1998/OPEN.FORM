'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from '@/lib/toast'

export default function AdminFormsPage() {
  const [forms, setForms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()

      if (!profile || profile.role !== 'admin') { router.push('/dashboard'); return }

      const { data } = await supabase
        .from('forms')
        .select('*')
        .order('created_at', { ascending: false })

      setForms(data || [])
    } catch (e) {
      console.error(e)
      toast('حدث خطأ أثناء تحميل النماذج')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الفورم؟ ستحذف جميع الأسئلة والردود المرتبطة به.')) return;
    try {
      const { error } = await supabase.from('forms').delete().eq('id', id);
      if (error) throw error;
      setForms(forms.filter(f => f.id !== id));
    } catch (e) {
      console.error(e);
      toast('حدث خطأ أثناء الحذف')
    }
  }

  const [searchTerm, setSearchTerm] = useState('')

  const filteredForms = forms.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-blue-100 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  )

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-30 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
            <span className="hidden sm:inline">رجوع</span>
          </button>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">إدارة النماذج</h1>
          <div className="w-10 sm:w-20" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <input
              type="text"
              placeholder="ابحث عن نموذج..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-medium"
            />
            <svg className="w-6 h-6 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="text-sm font-bold text-slate-500 bg-slate-200/50 px-4 py-2 rounded-full">
            إجمالي النماذج: {forms.length}
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-gray-100 overflow-hidden">
          <table className="w-full text-right">
            <thead className="bg-slate-50/50 border-b border-gray-100">
              <tr>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">الاسم</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">تاريخ الإنشاء</th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredForms.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <p className="text-slate-400 font-bold">لم يتم العثور على نماذج</p>
                    </div>
                  </td>
                </tr>
              ) : filteredForms.map(form => (
                <tr key={form.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{form.name}</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-slate-400 font-medium text-sm">
                      {new Date(form.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-2">
                      <ActionButtons form={form} onDelete={handleDelete} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Grid View */}
        <div className="md:hidden space-y-4">
          {filteredForms.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
              <p className="text-slate-400 font-bold">لا توجد نماذج</p>
            </div>
          ) : filteredForms.map(form => (
            <div key={form.id} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm shadow-slate-200/50 active:scale-[0.98] transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-800 mb-1 truncate">{form.name}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {new Date(form.created_at).toLocaleDateString('ar-EG')}
                  </p>
                </div>
                <div className="bg-blue-50 text-blue-600 p-2 rounded-xl">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-4 border-t border-gray-50 overflow-x-auto no-scrollbar">
                <ActionButtons form={form} onDelete={handleDelete} />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

function ActionButtons({ form, onDelete }: { form: any, onDelete: (id: string) => void }) {
  const code = (form as any).short_code
  const serial = (form as any).serial_number || form.id
  const link = code ? `${window.location.origin}/f/${code}` : `${window.location.origin}/forms/${serial}`

  return (
    <>
      <button
        onClick={() => {
          navigator.clipboard.writeText(link)
          toast('تم نسخ الرابط', 'success')
        }}
        className="flex-1 sm:flex-none p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-2xl transition-all flex items-center justify-center gap-2 font-bold text-sm"
        title="نسخ الرابط"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
        <span className="md:hidden">نسخ</span>
      </button>
      <Link
        href={`/forms/${serial}`}
        className="flex-1 sm:flex-none p-3 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-2xl transition-all flex items-center justify-center gap-2 font-bold text-sm"
        title="عرض"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
        <span className="md:hidden">عرض</span>
      </Link>
      <Link
        href={`/forms/${serial}/edit`}
        className="flex-1 sm:flex-none p-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-2xl transition-all flex items-center justify-center gap-2 font-bold text-sm"
        title="تعديل"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        <span className="md:hidden">تعديل</span>
      </Link>
      <button
        onClick={() => onDelete(form.id)}
        className="flex-1 sm:flex-none p-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-2xl transition-all flex items-center justify-center gap-2 font-bold text-sm"
        title="حذف"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        <span className="md:hidden">حذف</span>
      </button>
    </>
  )
}


