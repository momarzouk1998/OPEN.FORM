'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const ACTION_LABELS: Record<string, string> = {
  subscription_create: 'إنشاء اشتراك',
  subscription_renew: 'تجديد اشتراك',
  subscription_cancel: 'إلغاء اشتراك',
  withdrawal_approve: 'موافقة سحب',
  withdrawal_reject: 'رفض سحب',
  points_cancel: 'إلغاء نقاط',
  commission_cancel: 'إلغاء عمولة',
}

export default function AdminActionLogPage() {
  const [user, setUser] = useState<any>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (!profile || profile.role !== 'admin') { router.push('/dashboard'); return }
      setUser(user)

      const { data } = await supabase.from('admin_action_log')
        .select('*, profiles!admin_action_log_admin_id_fkey(name)')
        .order('created_at', { ascending: false })
        .limit(200)
      setLogs(data || [])
      setLoading(false)
    }
    init()
  }, [router])

  const filtered = logs
    .filter(l => filter === 'all' || l.action_type === filter)
    .filter(l => !search || l.target_type?.includes(search) || l.note?.includes(search))

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
    </div>
  )

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-gray-500 hover:text-blue-600 transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">سجل العمليات</h1>
          </div>
          <span className="text-sm text-gray-500">{logs.length} عملية</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-4 mb-6">
          <select value={filter} onChange={e => setFilter(e.target.value)} className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm">
            <option value="all">كل الأنواع</option>
            {Object.entries(ACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..." className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500">
                  <th className="text-right py-3 px-4 font-medium">الأدمن</th>
                  <th className="text-right py-3 px-4 font-medium">الإجراء</th>
                  <th className="text-right py-3 px-4 font-medium">النوع</th>
                  <th className="text-right py-3 px-4 font-medium">ملاحظة</th>
                  <th className="text-right py-3 px-4 font-medium">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium">{log.profiles?.name || '—'}</td>
                    <td className="py-3 px-4"><span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">{ACTION_LABELS[log.action_type] || log.action_type}</span></td>
                    <td className="py-3 px-4 text-gray-500">{log.target_type}</td>
                    <td className="py-3 px-4 text-gray-500 max-w-[200px] truncate">{log.note || '—'}</td>
                    <td className="py-3 px-4 text-gray-500">{new Date(log.created_at).toLocaleString('ar-EG')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <div className="text-center py-12 text-gray-500">لا توجد عمليات</div>}
        </div>
      </div>
    </div>
  )
}
