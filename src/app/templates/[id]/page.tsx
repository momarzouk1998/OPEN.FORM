'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { TEMPLATE_CATEGORIES } from '@/types'
import type { FormTemplate } from '@/types'
import type { QuestionType } from '@/types'

const QUESTION_TYPE_LABELS: Record<string, string> = {
  text: 'نص',
  textarea: 'نص طويل',
  single_choice: 'اختيار واحد',
  multiple_choice: 'اختيار متعدد',
  dropdown: 'قائمة منسدلة',
  scale: 'تقييم',
  ranking: 'ترتيب',
  matrix: 'مصفوفة',
  date: 'تاريخ',
  time: 'وقت',
  file_upload: 'رفع ملف',
}

export default function TemplateDetailPage() {
  const [template, setTemplate] = useState<FormTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [cloning, setCloning] = useState(false)
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  useEffect(() => {
    const id = params.id as string
    fetchTemplate(id)
  }, [params.id])

  const fetchTemplate = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('form_templates')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      setTemplate(data)
    } catch (e) {
      console.error('Error fetching template:', e)
      router.push('/templates')
    } finally {
      setLoading(false)
    }
  }

  const cloneTemplate = async () => {
    if (!template) return
    setCloning(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: form, error: formError } = await supabase
        .from('forms')
        .insert({
          name: template.name,
          description: template.description || '',
          created_by: user.id,
          is_active: true,
          ...template.form_settings,
        })
        .select()
        .single()
      if (formError) throw formError

      // Create questions
      const questions = (template.questions_data || []).map((q: any, idx: number) => ({
        form_id: form.id,
        text: q.text,
        type: q.type,
        required: q.required || false,
        points: q.points || 0,
        has_counter: q.has_counter || false,
        order_index: idx,
        options: JSON.stringify(q.options || []),
      }))

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questions)
      if (questionsError) throw questionsError

      router.push(`/forms/${form.id}/edit`)
    } catch (e) {
      console.error('Error cloning template:', e)
      alert('حدث خطأ أثناء إنشاء النموذج')
    } finally {
      setCloning(false)
    }
  }

  if (loading || !template) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            رجوع
          </button>
          <h1 className="text-lg font-bold text-blue-700">{template.name}</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Template Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center shrink-0">
              <svg className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">{template.name}</h2>
                <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-lg">
                  {TEMPLATE_CATEGORIES[template.category] || template.category}
                </span>
              </div>
              <p className="text-gray-500 mb-4">{template.description}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{template.questions_data?.length || 0} أسئلة</span>
              </div>
            </div>
          </div>

          <button
            onClick={cloneTemplate}
            disabled={cloning}
            className="mt-6 w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {cloning ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                جاري الإنشاء...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                إنشاء نموذج من هذا القالب
              </>
            )}
          </button>
        </div>

        {/* Questions Preview */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">معاينة الأسئلة</h3>
          <div className="space-y-4">
            {(template.questions_data || []).map((q: any, idx: number) => (
              <div key={q.id || idx} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                <span className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-gray-900">{q.text || '(بدون نص)'}</p>
                    {q.required && <span className="text-red-500 text-sm shrink-0">*</span>}
                  </div>
                  <span className="text-xs text-gray-500 mt-1 inline-block">
                    {QUESTION_TYPE_LABELS[q.type] || q.type}
                  </span>
                  {q.options && q.options.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(q.options as any[]).map((opt: any, oi: number) => (
                        <span key={oi} className="text-xs bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-lg">
                          {opt.text || '(خيار)'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
