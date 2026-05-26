'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from '@/lib/toast'
import { SUBSCRIPTION_STATUS } from '@/types'

export default function AdminSubscriptionsPage() {
  const [user, setUser] = useState<any>(null)
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showRenewModal, setShowRenewModal] = useState<any>(null)
  const [showRefundModal, setShowRefundModal] = useState<any>(null)
  const [refundReason, setRefundReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (!profile || profile.role !== 'admin') { router.push('/dashboard'); return }
      setUser(user)
      loadSubscriptions()
    }
    init()
  }, [router])

  const loadSubscriptions = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('subscriptions')
      .select('*, profiles!inner(id, name, email)')
      .order('created_at', { ascending: false })
    setSubscriptions(data || [])
    setLoading(false)
  }

  const handleRenew = async (sub: any) => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/subscriptions/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription_id: sub.id, admin_id: user.id }),
      })
      const data = await res.json()
      if (!res.ok) { toast(data.error, 'error'); return }
      toast('تم تجديد الاشتراك بنجاح', 'success')
      setShowRenewModal(null)
      loadSubscriptions()
    } catch (err: any) {
      toast(err.message || 'حدث خطأ', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRefund = async (sub: any) => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/subscriptions/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription_id: sub.id, admin_id: user.id, reason: refundReason }),
      })
      const data = await res.json()
      if (!res.ok) { toast(data.error, 'error'); return }
      toast('تم إلغاء الاشتراك واسترجاع المبلغ', 'success')
      setShowRefundModal(null)
      setRefundReason('')
      loadSubscriptions()
    } catch (err: any) {
      toast(err.message || 'حدث خطأ', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const filtered = subscriptions
    .filter(s => filter === 'all' || s.status === filter)
    .filter(s => !search || s.profiles?.name?.includes(search) || s.profiles?.email?.includes(search))

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
            <h1 className="text-xl font-bold text-gray-900">إدارة الاشتراكات</h1>
          </div>
          <span className="text-sm text-gray-500">{subscriptions.length} اشتراك</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <select value={filter} onChange={e => setFilter(e.target.value)} className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm">
            <option value="all">كل الحالات</option>
            <option value="active">نشط</option>
            <option value="cancelled">ملغي</option>
            <option value="expired">منتهي</option>
          </select>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو البريد..." className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm" />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500">
                  <th className="text-right py-3 px-4 font-medium">المستخدم</th>
                  <th className="text-right py-3 px-4 font-medium">الباقة</th>
                  <th className="text-right py-3 px-4 font-medium">تاريخ البدء</th>
                  <th className="text-right py-3 px-4 font-medium">تاريخ الانتهاء</th>
                  <th className="text-right py-3 px-4 font-medium">التجديدات</th>
                  <th className="text-right py-3 px-4 font-medium">الحالة</th>
                  <th className="text-center py-3 px-4 font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(sub => (
                  <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{sub.profiles?.name || '—'}</div>
                      <div className="text-xs text-gray-400">{sub.profiles?.email || ''}</div>
                    </td>
                    <td className="py-3 px-4">{sub.plan_id === 'pro' ? 'احترافية' : sub.plan_id}</td>
                    <td className="py-3 px-4 text-gray-500">{new Date(sub.created_at).toLocaleDateString('ar-EG')}</td>
                    <td className="py-3 px-4 text-gray-500">{new Date(sub.expires_at).toLocaleDateString('ar-EG')}</td>
                    <td className="py-3 px-4">{sub.renewal_count}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sub.status === 'active' ? 'bg-green-50 text-green-600' : sub.status === 'expired' ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600'}`}>
                        {SUBSCRIPTION_STATUS[sub.status] || sub.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {sub.status === 'active' && (
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => setShowRenewModal(sub)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer border-0">تجديد</button>
                          <button onClick={() => setShowRefundModal(sub)} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors cursor-pointer border-0">استرجاع</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <div className="text-center py-12 text-gray-500">لا توجد اشتراكات</div>}
        </div>
      </div>

      {/* Renew Modal */}
      {showRenewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowRenewModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 mb-2">تأكيد تجديد الاشتراك</h2>
            <p className="text-gray-500 text-sm mb-4">هل أنت متأكد من تجديد اشتراك {showRenewModal.profiles?.name}؟</p>
            <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2 mb-6">
              <div className="flex justify-between"><span className="text-gray-500">المستخدم:</span><span className="font-medium">{showRenewModal.profiles?.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">تاريخ الانتهاء الحالي:</span><span>{new Date(showRenewModal.expires_at).toLocaleDateString('ar-EG')}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">التجديد رقم:</span><span>{showRenewModal.renewal_count + 1}</span></div>
              {showRenewModal.referred_by && <div className="flex justify-between"><span className="text-gray-500">عمولة الوكيل:</span><span className="text-emerald-600 font-bold">{showRenewModal.renewal_count === 0 ? '87.72' : '43.86'} جنيه (معلق)</span></div>}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowRenewModal(null)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 cursor-pointer border-0">إلغاء</button>
              <button onClick={() => handleRenew(showRenewModal)} disabled={actionLoading} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 cursor-pointer border-0">
                {actionLoading ? 'جاري...' : 'تأكيد التجديد'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowRefundModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 mb-2">تأكيد استرجاع الاشتراك</h2>
            <p className="text-red-600 text-sm font-medium mb-4">⚠️ سيتم إلغاء الاشتراك وإلغاء العمولات المعلقة إن وجدت</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">سبب الاسترجاع</label>
              <textarea value={refundReason} onChange={e => setRefundReason(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" rows={3} placeholder="اذكر سبب الاسترجاع..." />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowRefundModal(null); setRefundReason('') }} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 cursor-pointer border-0">إلغاء</button>
              <button onClick={() => handleRefund(showRefundModal)} disabled={actionLoading || !refundReason} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 cursor-pointer border-0">
                {actionLoading ? 'جاري...' : 'تأكيد الاسترجاع'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
