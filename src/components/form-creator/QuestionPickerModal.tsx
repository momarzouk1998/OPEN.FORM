'use client'

import type { QuestionType } from '@/types'
import { QUESTION_TYPES } from '@/constants/questionTypes'
import type { ExistingForm } from '@/app/forms/create/types'

interface QuestionPickerModalProps {
  show: boolean
  existingForms: ExistingForm[]
  onClose: () => void
  onImport: (question: any) => void
}

export default function QuestionPickerModal({ show, existingForms, onClose, onImport }: QuestionPickerModalProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-xl">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">استيراد سؤال من فورم سابقة</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="إغلاق نافذة الاستيراد">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-60px)]">
          {existingForms.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">لا توجد فورمز سابقة</p>
            </div>
          ) : (
            existingForms.map(form => (
              <div key={form.id} className="mb-4">
                <div className="mb-2">
                  <h4 className="font-medium text-gray-800">{form.name}</h4>
                </div>
                <div className="space-y-2">
                  {form.questions?.map((q: any) => (
                    <button
                      key={q.id}
                      onClick={() => onImport(q)}
                      className="w-full text-right p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-lg transition-colors"
                    >
                      <p className="font-medium text-gray-800">{q.text}</p>
                      <p className="text-sm text-gray-500">{QUESTION_TYPES[q.type as QuestionType]?.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
