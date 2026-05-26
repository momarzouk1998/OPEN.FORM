'use client'

import { formatTime } from '@/lib/formFillerUtils'

interface FormFillerHeaderProps {
  form: any
  isPreview?: boolean
  timeLeft: number | null
  visibleQuestions: any[]
  totalPages: number
  pageIndex: number
  answersCount: number
  onBack: () => void
}

export default function FormFillerHeader({ form, isPreview, timeLeft, visibleQuestions, totalPages, pageIndex, answersCount, onBack }: FormFillerHeaderProps) {
  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-gray-100/80 sticky top-0 z-10">
      {isPreview && (
        <div className="bg-orange-500 text-white text-xs py-1.5 text-center font-bold tracking-wide">
          وضع المعاينة: يمكنك تجربة تعبئة النموذج، لن يتم حفظ الإجابات
        </div>
      )}
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors text-sm disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          رجوع
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <h1 className="text-sm font-bold text-gray-800">{form.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          {timeLeft !== null && (
            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
              timeLeft < 60 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'
            }`}>
              {formatTime(timeLeft)}
            </span>
          )}
          <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">
            {visibleQuestions.length} سؤال
          </span>
        </div>
      </div>

      <div className="px-4 py-1.5 bg-white/50 border-b border-gray-100/80">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          {totalPages > 1 && (
            <span className="text-xs text-gray-500">
              صفحة {pageIndex + 1} من {totalPages}
            </span>
          )}
          <span className={`text-xs ${totalPages > 1 ? '' : 'mr-auto'} text-gray-400`}>
            {answersCount} / {visibleQuestions.length} إجابة
          </span>
        </div>
      </div>
      <div className="h-1 bg-gray-50">
        <div
          className="h-full bg-gradient-to-l from-blue-500 to-indigo-500 transition-all duration-500 rounded-full"
          style={{ width: `${(answersCount / (visibleQuestions.length || 1)) * 100}%` }}
        />
      </div>
    </header>
  )
}
