'use client'

import { useRouter } from 'next/navigation'

interface FormNavigationProps {
  isFirstPage: boolean
  isLastPage: boolean
  submitting: boolean
  pages: number[]
  currentPage: number
  isPreview?: boolean
  form: any
  answersCount: number
  project: { id: string; name: string; color: string } | null
  autoSave: { saveDraft: (answers: Record<string, any>) => void }
  onPrev: () => void
  onNext: () => void
  onSubmit: () => void
  onPageClick: (page: number) => void
}

export default function FormNavigation({ isFirstPage, isLastPage, submitting, pages, currentPage, isPreview, form, answersCount, project, autoSave, onPrev, onNext, onSubmit, onPageClick }: FormNavigationProps) {
  const router = useRouter()

  if (pages.length === 0) return null

  return (
    <div className="mt-8 space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {!isFirstPage && (
          <button
            onClick={onPrev}
            className="flex-1 order-2 sm:order-1 py-3.5 px-6 bg-white text-gray-700 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 active:bg-gray-100 transition-all text-sm sm:text-base flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            السابق
          </button>
        )}
        {!isLastPage && (
          <button
            onClick={onNext}
            className="flex-1 order-1 sm:order-2 py-3.5 px-6 bg-gradient-to-l from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20 text-sm sm:text-base flex items-center justify-center gap-2 form-themed-primary-bg"
          >
            التالي
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
        {isLastPage && (
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="flex-[2] order-1 sm:order-2 py-4 px-8 font-bold rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-emerald-500/20 text-base sm:text-lg flex items-center justify-center gap-2 form-themed-primary-bg"
            style={{
              background: (form.page_titles as any)?._submit_button?.color
                ? (form.page_titles as any)._submit_button.color
                : 'linear-gradient(to left, #059669, #16a34a)',
              color: (form.page_titles as any)?._submit_button?.textColor || '#ffffff',
            }}
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                جاري الحفظ...
              </>
            ) : (
              <>
                {(form.page_titles as any)?._submit_button?.text || 'حفظ الإجابات'}
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </>
            )}
          </button>
        )}
      </div>

      {!isPreview && form.enable_auto_save !== false && answersCount > 0 && (
        <div className="pt-2">
          <button
            onClick={() => {
              autoSave.saveDraft({})
              router.push(project ? `/projects/${project.id}` : '/dashboard')
            }}
            className="w-full py-3 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl font-medium hover:bg-slate-100 transition-colors text-xs sm:text-sm flex items-center justify-center gap-2 group"
          >
            <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            أكمل تعبئة البيانات لاحقاً
          </button>
        </div>
      )}
      
      {pages.length > 1 && (
        <div className="flex items-center justify-center gap-2.5 pt-4">
          {pages.map(p => (
            <button
              key={p}
              onClick={() => onPageClick(p)}
              className={`transition-all duration-300 ${
                p === currentPage
                  ? 'w-8 h-2.5 rounded-full bg-blue-600 form-themed-primary-bg shadow-sm shadow-blue-500/30'
                  : 'w-2.5 h-2.5 rounded-full bg-gray-300 hover:bg-gray-400'
              }`}
              title={`صفحة ${p}`}
              aria-label={`صفحة ${p}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
