'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from '@/lib/toast'
import { WITHDRAWAL_STATUS, WITHDRAWAL_TYPE_LABELS, PAYMENT_METHODS } from '@/types'

export default function AdminWithdrawalsPage() {
  const [user, setUser] = useState<any>(null)
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [typeFilter, setTypeFilter] = useState('all')
  const [actionLoading, setActionLoading] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState<any>(null)
  const [rejectReason, setRejectReason] = useState('')
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (!profile || profile.role !== 'admin') { router.push('/dashboard'); return }
      setUser(user)
      loadWithdrawals()
    }
    init()
  }, [router])

  const loadWithdrawals = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('withdrawal_requests')
      .select('*, profiles!inner(id, name, email)')
      .order('requested_at', { ascending: false })
    setWithdrawals(data || [])
    setLoading(false)
  }

  const handleApprove = async (wr: any) => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/withdrawals/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawal_id: wr.id, admin_id: user.id }),
      })
      const data = await res.json()
      if (!res.ok) { toast(data.error, 'error'); return }
      toast('تمت الموافقة على السحب', 'success')
      loadWithdrawals()
    } catch (err: any) {
      toast(err.message || 'حدث خطأ', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!showRejectModal) return
    setActionLoading(true)
    try {
      const res = await fetch('/api/withdrawals/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawal_id: showRejectModal.id, admin_id: user.id, reason: rejectReason }),
      })
      const data = await res.json()
      if (!res.ok) { toast(data.error, 'error'); return }
      toast('تم رفض طلب السحب', 'success')
      setShowRejectModal(null)
      setRejectReason('')
      loadWithdrawals()
    } catch (err: any) {
      toast(err.message || 'حدث خطأ', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const filtered = withdrawals
    .filter(w => statusFilter === 'all' || w.status === statusFilter)
    .filter(w => typeFilter === 'all' || w.type === typeFilter)

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
    </div>
  )

  const pendingTotal = filtered.filter(w => w.status === 'pending').reduce((sum, w) => sum + Number(w.amount_requested), 0)

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-gray-500 hover:text-blue-600 transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">طلبات السحب</h1>
          </div>
          <span className="text-sm text-gray-500">{filtered.filter(w => w.status === 'pending').length} معلقة — {pendingTotal.toFixed(2)} ج</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-4 mb-6">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm">
            <option value="pending">قيد الانتظار</option>
            <option value="approved">تمت الموافقة</option>
            <option value="paid">تم الدفع</option>
            <option value="rejected">مرفوض</option>
            <option value="all">الكل</option>
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm">
            <option value="all">كل الأنواع</option>
            <option value="points">نقاط</option>
            <option value="commission">عمولات</option>
          </select>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500">
                  <th className="text-right py-3 px-4 font-medium">المستخدم</th>
                  <th className="text-right py-3 px-4 font-medium">النوع</th>
                  <th className="text-right py-3 px-4 font-medium">المبلغ</th>
                  <th className="text-right py-3 px-4 font-medium">الصافي</th>
                  <th className="text-right py-3 px-4 font-medium">طريقة الدفع</th>
                  <th className="text-right py-3 px-4 font-medium">رقم الحساب</th>
                  <th className="text-right py-3 px-4 font-medium">التاريخ</th>
                  <th className="text-right py-3 px-4 font-medium">الحالة</th>
                  <th className="text-center py-3 px-4 font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(w => (
                  <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{w.profiles?.name || '—'}</div>
                      <div className="text-xs text-gray-400">{w.profiles?.email || ''}</div>
                    </td>
                    <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${w.type === 'points' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>{WITHDRAWAL_TYPE_LABELS[w.type]}</span></td>
                    <td className="py-3 px-4 font-bold">{Number(w.amount_requested).toFixed(2)} ج</td>
                    <td className="py-3 px-4 text-gray-500">{Number(w.amount_after_tax).toFixed(2)} ج</td>
                    <td className="py-3 px-4">{PAYMENT_METHODS[w.payment_method]}</td>
                    <td className="py-3 px-4 text-gray-500" dir="ltr">{w.payment_account}</td>
                    <td className="py-3 px-4 text-gray-500">{new Date(w.requested_at).toLocaleDateString('ar-EG')}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${w.status === 'paid' ? 'bg-green-50 text-green-600' : w.status === 'pending' ? 'bg-yellow-50 text-yellow-600' : w.status === 'approved' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>{WITHDRAWAL_STATUS[w.status]}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {w.status === 'pending' && (
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => handleApprove(w)} disabled={actionLoading} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 cursor-pointer border-0">تم الدفع</button>
                          <button onClick={() => setShowRejectModal(w)} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 cursor-pointer border-0">رفض</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <div className="text-center py-12 text-gray-500">لا توجد طلبات سحب</div>}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => { setShowRejectModal(null); setRejectReason('') }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 mb-2">رفض طلب السحب</h2>
            <p className="text-sm text-gray-500 mb-4">المستخدم: {showRejectModal.profiles?.name}</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">سبب الرفض</label>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" rows={3} placeholder="اذكر سبب الرفض..." required />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowRejectModal(null); setRejectReason('') }} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 cursor-pointer border-0">إلغاء</button>
              <button onClick={handleReject} disabled={actionLoading || !rejectReason} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 cursor-pointer border-0">
                {actionLoading ? 'جاري...' : 'تأكيد الرفض'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
