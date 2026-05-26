'use client'

import { copyPaymentValue, type PaymentMethod } from '@/lib/formFillerUtils'

export function FormPaymentInfo({ isLastPage, questions, paymentMethods }: {
  isLastPage: boolean; questions: any[]; paymentMethods: PaymentMethod[]
}) {
  if (!isLastPage || questions?.some((q: any) => q.type === 'payment_info_block') || paymentMethods.length === 0) return null

  const icons: Record<string, string> = { bank: '🏦', instapay: '📱', vodafone: '📞', wallet: '💳', payment_link: '🔗', custom: '💰' }
  const methodNames: Record<string, string> = { bank: 'حساب بنكي', instapay: 'إنستاباي', vodafone: 'فودافون كاش', wallet: 'محفظة إلكترونية', payment_link: 'رابط دفع', custom: 'طريقة دفع' }

  return (
    <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-4">
      <h4 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        طرق الدفع المتاحة
      </h4>
      <div className="space-y-2">
        {paymentMethods.map((pm, pi) => (
          <div key={pi} className="bg-white rounded-xl px-4 py-3 border border-amber-100">
            <div className="flex items-start gap-3">
              <span className="text-xl">{icons[pm.method] || '💳'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800">{methodNames[pm.method] || pm.method}</p>
                {pm.label && <p className="text-xs text-gray-500">{pm.label}</p>}
                {pm.value && <p className="text-sm font-mono font-bold text-amber-700 mt-0.5 break-all" dir="ltr">{pm.value}</p>}
                {pm.details && <p className="text-xs text-gray-500 mt-1">{pm.details}</p>}
              </div>
              {pm.value && (
                <button
                  onClick={() => copyPaymentValue(pm.value)}
                  className="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold hover:bg-amber-200 transition-colors shrink-0"
                >
                  نسخ
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-amber-600 mt-2">يرجى تحويل المبلغ على أحد الطرق أعلاه بعد تقديم النموذج</p>
    </div>
  )
}
