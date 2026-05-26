'use client'

export interface PaymentMethod {
  id: string
  method: string
  label: string
  value: string
  details?: string
}

interface PaymentMethodsEditorProps {
  methods: PaymentMethod[]
  onChange: (methods: PaymentMethod[]) => void
}

const PAYMENT_TYPES = [
  { value: 'bank', label: 'حساب بنكي' },
  { value: 'instapay', label: 'إنستاباي' },
  { value: 'vodafone', label: 'فودافون كاش' },
  { value: 'wallet', label: 'محفظة إلكترونية' },
  { value: 'payment_link', label: 'رابط دفع' },
  { value: 'custom', label: 'طريقة أخرى' }
]

export default function PaymentMethodsEditor({ methods, onChange }: PaymentMethodsEditorProps) {
  const safeMethods = Array.isArray(methods) ? methods : []

  const updateMethod = (index: number, updates: Partial<PaymentMethod>) => {
    onChange(safeMethods.map((method, innerIndex) => innerIndex === index ? { ...method, ...updates } : method))
  }

  return (
    <div className="space-y-3">
      {safeMethods.map((method, index) => (
        <div key={method.id || index} className="bg-white rounded-xl border border-gray-200 p-3 space-y-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={method.method || 'bank'}
              onChange={(event) => updateMethod(index, { method: event.target.value })}
              className="w-full sm:w-40 px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
            >
              {PAYMENT_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            <input
              type="text"
              value={method.label || ''}
              onChange={(event) => updateMethod(index, { label: event.target.value })}
              placeholder="العنوان الظاهر للمستخدم"
              className="flex-1 px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
            />
            <button
              onClick={() => onChange(safeMethods.filter((_, innerIndex) => innerIndex !== index))}
              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
              title="حذف طريقة الدفع"
              aria-label="حذف طريقة الدفع"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <input
            type="text"
            value={method.value || ''}
            onChange={(event) => updateMethod(index, { value: event.target.value })}
            placeholder={method.method === 'payment_link' ? 'رابط الدفع' : 'الرقم / الحساب / المعرف الذي سيتم نسخه'}
            dir="ltr"
            className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-left"
          />
          <textarea
            value={method.details || ''}
            onChange={(event) => updateMethod(index, { details: event.target.value })}
            placeholder="تفاصيل إضافية اختيارية مثل اسم صاحب الحساب أو تعليمات التحويل"
            rows={2}
            className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
          />
        </div>
      ))}

      <button
        onClick={() => onChange([...safeMethods, { id: `pm_${Date.now()}`, method: 'bank', label: '', value: '', details: '' }])}
        className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-xl hover:border-amber-400 hover:text-amber-600 transition-colors text-sm flex items-center justify-center gap-1"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        إضافة طريقة دفع
      </button>
    </div>
  )
}
