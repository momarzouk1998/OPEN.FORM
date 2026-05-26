'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import type { EarningsSummary, TemplatePoint, AgentCommission, WithdrawalRequest } from '@/types'
import { WITHDRAWAL_STATUS, WITHDRAWAL_TYPE_LABELS, COMMISSION_STATUS, PAYMENT_METHODS } from '@/types'

type TabType = 'points' | 'commissions' | 'withdrawals'

export default function EarningsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<EarningsSummary | null>(null)
  const [history, setHistory] = useState<{ template_points: TemplatePoint[]; commissions: AgentCommission[]; withdrawals: WithdrawalRequest[] }>({ template_points: [], commissions: [], withdrawals: [] })
  const [tab, setTab] = useState<TabType>('points')
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawType, setWithdrawType] = useState<'points' | 'commission'>('points')
  const [withdrawAmount, setWithdrawAmount] = useState(0)
  const [withdrawMethod, setWithdrawMethod] = useState('instapay')
  const [withdrawAccount, setWithdrawAccount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const { data: settingsData } = await supabase.from('app_settings').select('key, value')
      if (settingsData) {
        const map: Record<string, string> = {}
        settingsData.forEach((s: { key: string; value: string }) => { map[s.key] = s.value })
        setSettings(map)
      }

      const [summaryRes, historyRes] = await Promise.all([
        fetch(`/api/earnings/summary?user_id=${user.id}`),
        fetch(`/api/earnings/history?user_id=${user.id}`),
      ])
      if (summaryRes.ok) setSummary(await summaryRes.json())
      if (historyRes.ok) setHistory(await historyRes.json())

      setLoading(false)
    }
    init()
  }, [router])

  const handleWithdraw = async () => {
    setError('')
    if (!withdrawAmount || withdrawAmount <= 0) { setError('أدخل المبلغ المطلوب'); return }
    if (!withdrawAccount) { setError('أدخل رقم الحساب أو المحفظة'); return }

    const minAmount = withdrawType === 'points' ? 100 : 500
    if (withdrawAmount < minAmount) { setError(`الحد الأدنى للسحب ${minAmount} ${withdrawType === 'points' ? 'نقطة' : 'جنيه'}`); return }

    setSubmitting(true)
    try {
      const res = await fetch('/api/withdrawals/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          type: withdrawType,
          amount: withdrawAmount,
          payment_method: withdrawMethod,
          payment_account: withdrawAccount,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setShowWithdrawModal(false)
      setWithdrawAmount(0)
      setWithdrawAccount('')
      // Refresh
      const summaryRes = await fetch(`/api/earnings/summary?user_id=${user.id}`)
      if (summaryRes.ok) setSummary(await summaryRes.json())
    } catch (err: any) {
      setError(err.message || 'حدث خطأ')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <Header user={user} settings={settings} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">أرباحي</h1>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900">محفظة نقاط القوالب</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">رصيد متاح</p>
                  <p className="text-2xl font-bold text-amber-600">{summary.points_balance} نقطة</p>
                  <p className="text-xs text-gray-400">= {summary.points_balance} جنيه</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">رصيد معلق</p>
                  <p className="text-2xl font-bold text-gray-400">{summary.points_pending} نقطة</p>
                </div>
              </div>
              <div className="mt-4 flex justify-between text-xs text-gray-500">
                <span>إجمالي مكتسب: {summary.total_points_earned} نقطة</span>
                <span>إجمالي مسحوب: {summary.total_points_withdrawn} نقطة</span>
              </div>
              {summary.points_balance >= 100 && (
                <button onClick={() => { setWithdrawType('points'); setShowWithdrawModal(true) }} className="mt-4 w-full py-2.5 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-colors cursor-pointer border-0">
                  طلب سحب
                </button>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900">محفظة عمولات الوكلاء</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">رصيد متاح</p>
                  <p className="text-2xl font-bold text-emerald-600">{summary.commission_balance.toFixed(2)} جنيه</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">رصيد معلق</p>
                  <p className="text-2xl font-bold text-gray-400">{summary.commission_pending.toFixed(2)} جنيه</p>
                </div>
              </div>
              <div className="mt-4 flex justify-between text-xs text-gray-500">
                <span>إجمالي مكتسب: {summary.total_commission_earned.toFixed(2)} جنيه</span>
                <span>إجمالي مسحوب: {summary.total_commission_withdrawn.toFixed(2)} جنيه</span>
              </div>
              {summary.commission_balance >= 500 && (
                <button onClick={() => { setWithdrawType('commission'); setShowWithdrawModal(true) }} className="mt-4 w-full py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors cursor-pointer border-0">
                  طلب سحب
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100">
            {[
              { id: 'points' as TabType, label: 'نقاط القوالب' },
              { id: 'commissions' as TabType, label: 'عمولات الوكلاء' },
              { id: 'withdrawals' as TabType, label: 'طلبات السحب' },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 py-3 text-sm font-bold transition-colors cursor-pointer border-0 ${tab === t.id ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700'}`}>{t.label}</button>
            ))}
          </div>

          <div className="p-4">
            {/* Points Tab */}
            {tab === 'points' && (
              <div>
                {history.template_points.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-gray-500 font-medium">لا توجد نقاط بعد</p>
                    <p className="text-gray-400 text-sm mt-1">انشر قوالب واكسب 10 نقاط عن كل نسخة</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-500">
                          <th className="text-right py-2 px-3 font-medium">القالب</th>
                          <th className="text-right py-2 px-3 font-medium">النقاط</th>
                          <th className="text-right py-2 px-3 font-medium">التاريخ</th>
                          <th className="text-right py-2 px-3 font-medium">الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.template_points.map(pt => (
                          <tr key={pt.id} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="py-2 px-3">{pt.template_id?.slice(0, 8)}...</td>
                            <td className="py-2 px-3 font-bold">{pt.points}</td>
                            <td className="py-2 px-3 text-gray-500">{new Date(pt.created_at).toLocaleDateString('ar-EG')}</td>
                            <td className="py-2 px-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${pt.status === 'available' ? 'bg-green-50 text-green-600' : pt.status === 'pending' ? 'bg-yellow-50 text-yellow-600' : pt.status === 'paid' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>{COMMISSION_STATUS[pt.status] || pt.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Commissions Tab */}
            {tab === 'commissions' && (
              <div>
                {history.commissions.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    <p className="text-gray-500 font-medium">لا توجد عمولات بعد</p>
                    <p className="text-gray-400 text-sm mt-1">شارك رابطك مع الآخرين واكسب عمولات</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-500">
                          <th className="text-right py-2 px-3 font-medium">العميل</th>
                          <th className="text-right py-2 px-3 font-medium">رقم التجديد</th>
                          <th className="text-right py-2 px-3 font-medium">الصافي</th>
                          <th className="text-right py-2 px-3 font-medium">التاريخ</th>
                          <th className="text-right py-2 px-3 font-medium">الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.commissions.map(c => (
                          <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="py-2 px-3">{c.client_id.slice(0, 8)}...</td>
                            <td className="py-2 px-3">الشهر {c.renewal_number}</td>
                            <td className="py-2 px-3 font-bold">{c.net_commission.toFixed(2)} ج</td>
                            <td className="py-2 px-3 text-gray-500">{new Date(c.created_at).toLocaleDateString('ar-EG')}</td>
                            <td className="py-2 px-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.status === 'available' ? 'bg-green-50 text-green-600' : c.status === 'pending' ? 'bg-yellow-50 text-yellow-600' : c.status === 'paid' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>{COMMISSION_STATUS[c.status] || c.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Withdrawals Tab */}
            {tab === 'withdrawals' && (
              <div>
                {history.withdrawals.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    <p className="text-gray-500 font-medium">لا توجد طلبات سحب</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-500">
                          <th className="text-right py-2 px-3 font-medium">النوع</th>
                          <th className="text-right py-2 px-3 font-medium">المبلغ</th>
                          <th className="text-right py-2 px-3 font-medium">طريقة الدفع</th>
                          <th className="text-right py-2 px-3 font-medium">التاريخ</th>
                          <th className="text-right py-2 px-3 font-medium">الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.withdrawals.map(w => (
                          <tr key={w.id} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="py-2 px-3">{WITHDRAWAL_TYPE_LABELS[w.type]}</td>
                            <td className="py-2 px-3 font-bold">{w.amount_after_tax.toFixed(2)} ج</td>
                            <td className="py-2 px-3 text-gray-500">{PAYMENT_METHODS[w.payment_method]}</td>
                            <td className="py-2 px-3 text-gray-500">{new Date(w.requested_at).toLocaleDateString('ar-EG')}</td>
                            <td className="py-2 px-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${w.status === 'paid' ? 'bg-green-50 text-green-600' : w.status === 'pending' ? 'bg-yellow-50 text-yellow-600' : w.status === 'approved' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>{WITHDRAWAL_STATUS[w.status] || w.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowWithdrawModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 mb-2">طلب سحب {withdrawType === 'points' ? 'نقاط' : 'عمولات'}</h2>
            <p className="text-sm text-gray-500 mb-6">الحد الأدنى: {withdrawType === 'points' ? '100 نقطة' : '500 جنيه'}</p>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ</label>
                <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(Number(e.target.value))} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder={withdrawType === 'points' ? 'مثلاً: 100' : 'مثلاً: 500'} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">طريقة الدفع</label>
                <select value={withdrawMethod} onChange={e => setWithdrawMethod(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  {Object.entries(PAYMENT_METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الحساب / المحفظة</label>
                <input type="text" value={withdrawAccount} onChange={e => setWithdrawAccount(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="أدخل رقم الحساب" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowWithdrawModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors cursor-pointer border-0">إلغاء</button>
              <button onClick={handleWithdraw} disabled={submitting} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer border-0">
                {submitting ? 'جاري...' : 'تأكيد الطلب'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
