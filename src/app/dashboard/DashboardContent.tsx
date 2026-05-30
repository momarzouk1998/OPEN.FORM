'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from '@/lib/toast'
import { useAppSettings } from '@/hooks/useAppSettings'
import type { User } from '@/types'
import Header from '@/components/Header'

interface DashboardContentProps {
  profile: User
  stats?: {
    total_users: number
    total_projects: number
    pending_approvals: number
  }
}

type SortOption = 'newest' | 'oldest' | 'az' | 'za' | 'most_responses'
type ViewMode = 'grid' | 'list'

export default function DashboardContent({ profile, stats }: DashboardContentProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [formCount, setFormCount] = useState(0)
  const [responseCount, setResponseCount] = useState(0)
  const [forms, setForms] = useState<any[]>([])
  const [responseCountsMap, setResponseCountsMap] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try { return (localStorage.getItem('dashboard_view_mode') as ViewMode) || 'grid' } catch { return 'grid' }
  })

  const router = useRouter()
  const supabase = createClient()
  const { settings } = useAppSettings()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [unreadResult, formsResult] = await Promise.all([
          supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', profile.id).eq('is_read', false),
          supabase.from('forms').select('*').eq('created_by', profile.id).order('created_at', { ascending: false }),
        ])
        setUnreadCount(unreadResult.count || 0)
        const fetchedForms = formsResult.data || []
        setForms(fetchedForms)
        setFormCount(fetchedForms.length || 0)

        if (fetchedForms.length > 0) {
          const formIds = fetchedForms.map((f: { id: string }) => f.id)
          // Total response count
          const { count } = await supabase
            .from('form_responses')
            .select('*', { count: 'exact', head: true })
            .in('form_id', formIds)
          setResponseCount(count || 0)

          // Per-form response counts
          const { data: responseCounts } = await supabase
            .from('form_responses')
            .select('form_id')
            .in('form_id', formIds)
          const countsMap: Record<string, number> = {}
          for (const r of (responseCounts || [])) {
            countsMap[r.form_id] = (countsMap[r.form_id] || 0) + 1
          }
          setResponseCountsMap(countsMap)
        }
      } catch (e) {
        console.error('Error fetching dashboard data:', e)
        toast('حدث خطأ أثناء تحميل البيانات')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [profile.id])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const toggleViewMode = (mode: ViewMode) => {
    setViewMode(mode)
    try { localStorage.setItem('dashboard_view_mode', mode) } catch {}
  }

  const filteredAndSortedForms = useMemo(() => {
    let result = [...forms]
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(f =>
        f.name?.toLowerCase().includes(q) || f.description?.toLowerCase().includes(q)
      )
    }
    // Sort
    switch (sortBy) {
      case 'newest': result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break
      case 'oldest': result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); break
      case 'az': result.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar')); break
      case 'za': result.sort((a, b) => (b.name || '').localeCompare(a.name || '', 'ar')); break
      case 'most_responses': result.sort((a, b) => (responseCountsMap[b.id] || 0) - (responseCountsMap[a.id] || 0)); break
    }
    return result
  }, [forms, searchQuery, sortBy, responseCountsMap])

  const FormCardGrid = ({ form }: { form: any }) => {
    const count = responseCountsMap[form.id] || 0
    return (
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all group flex flex-col">
        <Link href={`/forms/${form.serial_number || form.id}/edit`} className="block p-5 flex-1">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{form.name}</h3>
              <p className="text-gray-500 text-sm truncate">{form.description || 'لا يوجد وصف'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${form.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${form.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
              {form.is_active ? 'نشط' : 'موقوف'}
            </span>
            <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              {count} رد
            </span>
          </div>
        </Link>
        <div className="flex items-center justify-between text-xs text-gray-400 px-5 py-3 border-t border-gray-50 bg-gray-50/50">
          <span>{new Date(form.created_at).toLocaleDateString('ar-SA')}</span>
          <div className="flex gap-1">
            <Link href={`/forms/${form.serial_number || form.id}`} onClick={(e) => e.stopPropagation()} className="text-blue-600 hover:text-blue-700 font-medium transition-colors px-2 py-1 hover:bg-blue-50 rounded-lg">معاينة</Link>
            <Link href={`/admin/results?formId=${form.id}`} onClick={(e) => e.stopPropagation()} className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors px-2 py-1 hover:bg-emerald-50 rounded-lg">الردود</Link>
          </div>
        </div>
      </div>
    )
  }

  const FormRowList = ({ form }: { form: any }) => {
    const count = responseCountsMap[form.id] || 0
    return (
      <div className="bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all group flex items-center gap-4 px-4 py-3">
        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{form.name}</p>
          <p className="text-xs text-gray-400 truncate">{form.description || 'لا يوجد وصف'}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={`hidden sm:inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${form.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${form.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
            {form.is_active ? 'نشط' : 'موقوف'}
          </span>
          <span className="hidden md:inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
            {count} رد
          </span>
          <span className="hidden lg:block text-xs text-gray-400">{new Date(form.created_at).toLocaleDateString('ar-SA')}</span>
          <div className="flex gap-1 items-center">
            <Link href={`/forms/${form.serial_number || form.id}/edit`} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="تعديل">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </Link>
            <Link href={`/forms/${form.serial_number || form.id}`} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="معاينة">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            </Link>
            <Link href={`/admin/results?formId=${form.id}`} className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="الردود">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50/30">
      <Header user={profile} settings={settings} onMenuClick={() => setSidebarOpen(true)} />

      {unreadCount > 0 && (
        <Link href="/notifications" className="block bg-blue-600 text-white text-center py-2 px-4 text-sm font-medium hover:bg-blue-700 transition-colors">
          لديك {unreadCount} إشعار{unreadCount !== 1 ? 'ات' : ''} غير مقروء
        </Link>
      )}

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (<div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />)}

      <aside className={`fixed inset-y-0 start-0 z-50 w-2/3 max-w-sm bg-white shadow-2xl transform transition-transform duration-300 lg:hidden ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="px-6 pt-8 pb-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200/50">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <span className="font-bold text-lg text-gray-800">Forms<span className="text-blue-600">.OpenappO</span></span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" aria-label="إغلاق القائمة">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
          <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-1">
            <Link href="/dashboard" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-4 py-3 text-blue-600 bg-blue-50 rounded-xl font-medium">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              الرئيسية
            </Link>
            <Link href="/templates" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors font-medium">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>
              القوالب
            </Link>
            <Link href="/profile" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors font-medium">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              الملف الشخصي
            </Link>
            {profile.role === 'admin' && (
              <>
                <div className="h-px bg-gray-200 my-4" />
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 px-4">الإدارة</p>
                <Link href="/admin" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors font-medium">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  لوحة التحكم
                </Link>
              </>
            )}
          </nav>
          <div className="p-4 border-t border-gray-100">
            <button onClick={handleLogout} className="flex items-center justify-center gap-3 w-full px-4 py-3.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl transition-all font-medium">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              تسجيل الخروج
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome + Quick Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">مرحباً، {profile.name}</h1>
            <p className="text-gray-500 mt-1">أهلاً بك في منصة إنشاء النماذج والاستبيانات</p>
          </div>
          <div className="flex gap-3">
            <Link href="/templates" className="px-5 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-medium flex items-center gap-2 shadow-sm">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>
              استخدم قالباً
            </Link>
            <Link href="/forms/create" className="px-5 py-3 bg-gradient-to-l from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-medium flex items-center gap-2 shadow-lg shadow-blue-500/25">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              إنشاء نموذج جديد
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <p className="text-gray-500 text-sm">نماذجي</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{formCount}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
              <p className="text-gray-500 text-sm">الردود</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{responseCount}</p>
          </div>
          {stats && profile.role === 'admin' && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <p className="text-gray-500 text-sm">المستخدمين</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.total_users}</p>
            </div>
          )}
        </div>

        {/* Forms List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mx-auto" />
          </div>
        ) : forms.length > 0 ? (
          <div>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
              <h2 className="text-lg font-bold text-gray-900 shrink-0">نماذجي</h2>

              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                  id="dashboard-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن نموذج..."
                  className="w-full pr-9 pl-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Sort */}
              <select
                id="dashboard-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">الأحدث أولاً</option>
                <option value="oldest">الأقدم أولاً</option>
                <option value="az">أ - ي</option>
                <option value="za">ي - أ</option>
                <option value="most_responses">الأكثر ردوداً</option>
              </select>

              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
                <button
                  id="view-grid"
                  onClick={() => toggleViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                  title="عرض شبكي"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                </button>
                <button
                  id="view-list"
                  onClick={() => toggleViewMode('list')}
                  className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                  title="عرض قائمة"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                </button>
              </div>
            </div>

            {/* Results count */}
            {searchQuery.trim() && (
              <p className="text-sm text-gray-500 mb-3">
                {filteredAndSortedForms.length === 0 ? 'لا توجد نتائج' : `${filteredAndSortedForms.length} نتيجة`}
              </p>
            )}

            {/* Forms */}
            {filteredAndSortedForms.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <p className="text-gray-500">لا توجد نماذج تطابق البحث</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAndSortedForms.map((form) => <FormCardGrid key={form.id} form={form} />)}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAndSortedForms.map((form) => <FormRowList key={form.id} form={form} />)}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">ليس لديك نماذج بعد</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">ابدأ في إنشاء نموذجك الأول بسرعة باستخدام القوالب الجاهزة أو من الصفر.</p>
            <div className="flex gap-3 justify-center">
              <Link href="/forms/create" className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-l from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-medium shadow-lg shadow-blue-500/25">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                إنشاء نموذج جديد
              </Link>
              <Link href="/templates" className="inline-flex items-center gap-2 px-6 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium shadow-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>
                تصفح القوالب
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
