'use client'

import Link from 'next/link'
import { type Question } from '@/lib/formFillerUtils'
import { calculateScore } from '@/lib/scoringUtils'

interface FormFillerScreensProps {
  form: any
  visibleQuestions: Question[]
  answers: Record<string, any>
  isPreview?: boolean
  isExpired: boolean
  submitted: boolean
  showRetryConfirm: boolean
  closedReason: string
  totalResponses: number
  allUserResponses: any[]
  redirectMessage: string | null
  project: { id: string; name: string; color: string } | null
  deletingResponse: boolean
  onDismissRetry: () => void
  onConfirmRetry: () => void
  onNewSubmission: () => void
}

function renderThemeStyles(theme: any) {
  if (!theme) return null
  return (
    <style dangerouslySetInnerHTML={{ __html: `
      @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700&family=Tajawal:wght@300;400;500;700;800&display=swap');
      
      .form-themed-container {
        ${theme.pageColor ? `background: ${theme.pageColor} !important;` : ''}
        ${theme.fontFamily ? `font-family: '${theme.fontFamily}', sans-serif !important;` : ''}
      }
      .form-themed-card {
        ${theme.formBgColor ? `background-color: ${theme.formBgColor} !important;` : ''}
        ${theme.borderRadius ? `border-radius: ${theme.borderRadius} !important;` : ''}
        ${theme.textColor ? `color: ${theme.textColor} !important;` : ''}
        ${theme.flatLayout ? `box-shadow: none !important;` : ''}
        ${theme.borderStyle && theme.borderStyle !== 'none' ? `border: ${theme.borderWidth || 1}px ${theme.borderStyle} ${theme.textColor || '#d1d5db'} !important;` : ''}
      }
      .form-themed-text {
        ${theme.textColor ? `color: ${theme.textColor} !important;` : ''}
      }
      .form-themed-description {
        ${theme.textColor ? `color: ${theme.textColor}cc !important;` : ''}
      }
      .form-themed-primary-bg {
        ${theme.primaryColor ? `background: ${theme.primaryColor} !important; background-color: ${theme.primaryColor} !important;` : ''}
        color: #ffffff !important;
      }
      .form-themed-primary-text {
        ${theme.primaryColor ? `color: ${theme.primaryColor} !important;` : ''}
      }
      .form-themed-primary-border {
        ${theme.primaryColor ? `border-color: ${theme.primaryColor} !important;` : ''}
      }
      .form-themed-spacing {
        ${theme.spacing === 'compact' ? 'margin-bottom: 0.5rem !important;' : theme.spacing === 'cozy' ? 'margin-bottom: 2rem !important;' : 'margin-bottom: 1.5rem !important;'}
      }
      .form-themed-width {
        ${theme.formWidth ? `max-width: ${theme.formWidth}px !important; width: 100% !important;` : ''}
      }
      .form-themed-container input[type="text"],
      .form-themed-container input[type="email"],
      .form-themed-container input[type="tel"],
      .form-themed-container input[type="number"],
      .form-themed-container input[type="date"],
      .form-themed-container input[type="time"],
      .form-themed-container textarea,
      .form-themed-container select {
        ${theme.borderRadius ? `border-radius: calc(${theme.borderRadius} * 0.75) !important;` : ''}
      }
      .form-themed-container input[type="text"]:focus,
      .form-themed-container input[type="email"]:focus,
      .form-themed-container input[type="tel"]:focus,
      .form-themed-container input[type="number"]:focus,
      .form-themed-container input[type="date"]:focus,
      .form-themed-container input[type="time"]:focus,
      .form-themed-container textarea:focus,
      .form-themed-container select:focus {
        ${theme.primaryColor ? `border-color: ${theme.primaryColor} !important; --tw-ring-color: ${theme.primaryColor} !important; box-shadow: 0 0 0 2px ${theme.primaryColor}33 !important;` : ''}
      }
      .form-themed-container input[type="checkbox"],
      .form-themed-container input[type="radio"] {
        ${theme.primaryColor ? `color: ${theme.primaryColor} !important; --tw-ring-color: ${theme.primaryColor} !important;` : ''}
      }
    `}} />
  )
}

function getThemeSettings(form: any) {
  const ts = form?.page_titles?.theme_settings
  if (!ts) return null
  if (typeof ts === 'string') {
    try { return JSON.parse(ts) } catch { return null }
  }
  return ts
}

export function FormClosedScreen({ form, isPreview, closedReason }: { form: any; isPreview?: boolean; closedReason: string }) {
  const theme = getThemeSettings(form)
  return (
    <div dir="rtl" className={`${isPreview ? 'min-h-full' : 'min-h-screen'} bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4 form-themed-container`}>
      {renderThemeStyles(theme)}
      <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 p-8 max-w-md w-full text-center form-themed-card">
        <div className="w-16 h-16 mx-auto mb-5 bg-red-50 rounded-2xl flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2 form-themed-text">النموذج غير متاح الآن</h2>
        <p className="text-gray-500 text-sm form-themed-description">{closedReason}</p>
      </div>
    </div>
  )
}

export function FormSubmittedScreen({ form, visibleQuestions, answers, isPreview, totalResponses, allUserResponses, redirectMessage, project, onNewSubmission }: {
  form: any; visibleQuestions: Question[]; answers: Record<string, any>; isPreview?: boolean;
  totalResponses: number; allUserResponses: any[]; redirectMessage: string | null;
  project: { id: string; name: string; color: string } | null; onNewSubmission: () => void
}) {
  const theme = getThemeSettings(form)
  const { score, maxScore } = calculateScore(visibleQuestions, answers)
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
  const siteUrl = 'https://forms.openappo.com'

  return (
    <div dir="rtl" className={`${isPreview ? 'min-h-full' : 'min-h-screen'} bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4 form-themed-container`}>
      {renderThemeStyles(theme)}
      <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 p-8 max-w-md w-full text-center form-themed-card">
        <div className="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1 form-themed-text">تم إرسال طلبك بنجاح ✅</h2>
        {redirectMessage && <p className="text-gray-500 text-sm mb-4 form-themed-description">{redirectMessage}</p>}
        {form.default_redirect_url || (form.redirect_rules && form.redirect_rules.length > 0) ? (
          <p className="text-xs text-gray-400 mb-5 animate-pulse">سيتم توجيهك خلال لحظات...</p>
        ) : null}

        {!form.default_redirect_url && (!form.redirect_rules || form.redirect_rules.length === 0) && (
          <>
            <div className="bg-gradient-to-l from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 mb-5">
              <p className="text-gray-600 text-sm mb-1">صاحب هذا النموذج استقبل</p>
              <p className="text-3xl font-bold text-blue-700 font-mono" dir="ltr">
                {totalResponses.toLocaleString()}
              </p>
              <p className="text-gray-600 text-sm mt-1">
                طلب حتى الآن باستخدام <span className="font-bold text-blue-600">{form.name}</span>
              </p>
            </div>

            {!!(form.page_titles as any)?._is_test && maxScore > 0 && (
              <div className={`rounded-2xl p-4 mb-5 border ${
                percentage >= 70 ? 'bg-emerald-50 border-emerald-100' : percentage >= 50 ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'
              }`}>
                <p className="text-gray-500 text-sm mb-1">درجتك</p>
                <p className={`text-3xl font-bold ${
                  percentage >= 70 ? 'text-emerald-600' : percentage >= 50 ? 'text-amber-600' : 'text-red-600'
                }`}>{percentage}%</p>
                <p className="text-gray-400 text-xs mt-1">{score} من {maxScore} نقطة</p>
              </div>
            )}

            {form.allow_multiple && allUserResponses && allUserResponses.length > 0 && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-5">
                <p className="text-blue-700 text-sm">هذا التسجيل رقم {allUserResponses.length} في هذا الفورم</p>
              </div>
            )}

            <div className="flex gap-3 mb-4">
              <Link
                href={project ? `/projects/${project.id}` : '/dashboard'}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors text-sm"
              >
                العودة
              </Link>
              <button
                onClick={onNewSubmission}
                className="flex-1 py-3 bg-gradient-to-l from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-colors shadow-lg shadow-blue-500/25 text-sm"
              >
                {form.allow_multiple ? 'تسجيل جديد' : 'إعادة المحاولة'}
              </button>
            </div>

            <a
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3.5 bg-gradient-to-l from-emerald-500 to-green-600 text-white rounded-xl font-bold hover:from-emerald-600 hover:to-green-700 transition-all shadow-lg shadow-emerald-500/30 text-sm"
            >
              أنشئ نموذجك مجانًا 🚀
            </a>
          </>
        )}
      </div>
    </div>
  )
}

export function RetryConfirmModal({ form, isPreview, deletingResponse, onCancel, onConfirm }: {
  form: any; isPreview?: boolean; deletingResponse: boolean; onCancel: () => void; onConfirm: () => void
}) {
  const theme = getThemeSettings(form)
  return (
    <div dir="rtl" className={`${isPreview ? 'min-h-full' : 'min-h-screen'} bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4 form-themed-container`}>
      {renderThemeStyles(theme)}
      <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 p-8 max-w-md w-full form-themed-card">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2 form-themed-text">تأكيد إعادة المحاولة</h2>
          <p className="text-gray-500 form-themed-description">هل أنت متأكد من حذف إجابتك السابقة وإعادة المحاولة؟</p>
          <p className="text-red-500 text-sm mt-2">سيتم حذف درجتك السابقة ولا يمكن استرجاعها</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            disabled={deletingResponse}
          >
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 shadow-lg shadow-red-500/25"
            disabled={deletingResponse}
          >
            {deletingResponse ? 'جاري الحذف...' : 'نعم، احذف وأعد المحاولة'}
          </button>
        </div>
      </div>
    </div>
  )
}
