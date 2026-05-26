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
    <div className="mt-6 space-y-3">
      <div className="flex gap-3">
        {!isFirstPage && (
          <button
            onClick={onPrev}
            className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            السابق
          </button>
        )}
        {!isLastPage && (
          <button
            onClick={onNext}
            className="flex-1 py-3.5 bg-gradient-to-l from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 form-themed-primary-bg"
          >
            التالي
          </button>
        )}
        {isLastPage && (
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="flex-1 py-4 font-semibold rounded-2xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg form-themed-primary-bg"
            style={{
              background: (form.page_titles as any)?._submit_button?.color
                ? (form.page_titles as any)._submit_button.color
                : 'linear-gradient(to left, #059669, #16a34a)',
              color: (form.page_titles as any)?._submit_button?.textColor || '#ffffff',
            }}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                جاري الحفظ...
              </span>
            ) : (
              (form.page_titles as any)?._submit_button?.text || 'حفظ الإجابات'
            )}
          </button>
        )}
      </div>
      {!isPreview && form.enable_auto_save !== false && answersCount > 0 && (
        <button
          onClick={() => {
            autoSave.saveDraft({})
            router.push(project ? `/projects/${project.id}` : '/dashboard')
          }}
          className="w-full py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl font-medium hover:bg-amber-100 transition-colors text-sm flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          أكمل لاحقاً
        </button>
      )}
      {pages.length > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          {pages.map(p => (
            <button
              key={p}
              onClick={() => onPageClick(p)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                p === currentPage
                  ? 'bg-blue-600 w-6 form-themed-primary-bg'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              title={`صفحة ${p}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
