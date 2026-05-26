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
    <header className="bg-white/95 backdrop-blur-md border-b border-gray-100/80 sticky top-0 z-50">
      {isPreview && (
        <div className="bg-orange-500 text-white text-[10px] sm:text-xs py-1 text-center font-bold tracking-wide uppercase">
          وضع المعاينة: لن يتم حفظ الإجابات
        </div>
      )}
      <div className="max-w-3xl mx-auto px-4 py-2 sm:py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-50 active:bg-gray-100"
            aria-label="رجوع"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm shadow-blue-500/20 shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-gray-800 truncate">{form.name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {timeLeft !== null && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border ${
              timeLeft < 60 ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-gray-50 text-gray-600 border-gray-100'
            }`}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-black tabular-nums">{formatTime(timeLeft)}</span>
            </div>
          )}
          <div className="hidden sm:flex items-center gap-1.5 bg-gray-50 text-gray-500 px-2.5 py-1.5 rounded-xl border border-gray-100">
            <span className="text-xs font-bold">{visibleQuestions.length} سؤال</span>
          </div>
        </div>
      </div>

      <div className="h-1.5 bg-gray-50 overflow-hidden">
        <div
          className="h-full bg-gradient-to-l from-blue-500 via-indigo-500 to-blue-600 transition-all duration-700 ease-out"
          style={{ width: `${(answersCount / (visibleQuestions.length || 1)) * 100}%` }}
        />
      </div>

      <div className="px-4 py-1.5 bg-white/50 border-t border-gray-50 flex items-center justify-center">
        <div className="max-w-3xl w-full flex items-center justify-between text-[10px] sm:text-xs font-medium uppercase tracking-wider">
          <div className="flex items-center gap-4 text-gray-500">
            {totalPages > 1 && (
              <span>صفحة {pageIndex + 1} من {totalPages}</span>
            )}
            <span className="hidden sm:inline-block w-1 h-1 bg-gray-300 rounded-full" />
            <span className={totalPages > 1 ? 'hidden sm:inline-block' : ''}>
              {answersCount} / {visibleQuestions.length} إجابة
            </span>
          </div>
          <span className="text-blue-600 font-bold">
            {Math.round((answersCount / (visibleQuestions.length || 1)) * 100)}% مكتمل
          </span>
        </div>
      </div>
    </header>
  )
}
