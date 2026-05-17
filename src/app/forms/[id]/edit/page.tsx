'use client'



import { useState, useEffect, Suspense } from 'react'

import { createClient } from '@/utils/supabase/client'

import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import ImageUpload from '@/components/ImageUpload'

import type { QuestionType, QuestionOption } from '@/types'
import { generateShortCode } from '@/lib/shortCode'



// Question type definitions with detailed explanations
const QUESTION_TYPES = {
  text: { label: 'نص', icon: 'T', description: 'إجابة نصية قصيرة', explanation: 'مثال: "ما اسمك؟"' },
  textarea: { label: 'نص طويل', icon: '¶', description: 'إجابة مفصلة', explanation: 'مثال: "صف تجربتك"' },
  single_choice: { label: 'اختيار واحد', icon: '○', description: 'اختيار إجابة واحدة', explanation: 'مثال: "نعم أو لا"' },
  multiple_choice: { label: 'اختيار متعدد', icon: '☑', description: 'اختيار عدة إجابات', explanation: 'مثال: "الهوايات"' },
  dropdown: { label: 'قائمة منسدلة', icon: '▼', description: 'اختيار من قائمة', explanation: 'قائمة مضغوطة لتوفير المساحة' },
  scale: { label: 'تقييم', icon: '⭐', description: 'تقييم من 1 إلى 10', explanation: 'مثال: تقييم الأداء' },
  ranking: { label: 'ترتيب', icon: '#', description: 'ترتيب العناصر', explanation: 'ترتيب العناصر حسب الأولوية' },
  matrix: { label: 'مصفوفة', icon: '⊞', description: 'خيارات مشتركة', explanation: 'عدة أسئلة مع نفس الخيارات' },
  date: { label: 'تاريخ', icon: '📅', description: 'إدخال تاريخ', explanation: 'مثال: "تاريخ الميلاد"' },
  time: { label: 'وقت', icon: '⏰', description: 'إدخال وقت', explanation: 'مثال: "وقت الحضور"' },
  file_upload: { label: 'رفع ملف', icon: '📎', description: 'إرفاق ملف أو صورة', explanation: 'مثال: رفع السيرة الذاتية أو صورة' }
} as const;



interface MatrixRow {
  id: string
  text: string
  required: boolean
}

interface MatrixColumn {
  id: string
  text: string
  points: number
}

interface Question {

  id: string

  text: string

  type: QuestionType

  required: boolean

  points: number

  has_counter?: boolean

  options: QuestionOption[]

  order_index?: number

  matrix_rows?: MatrixRow[]
  matrix_columns?: MatrixColumn[]
  bulk_text?: string
  correct_option_id?: string
  dropdown_type?: 'single' | 'multiple'
  correct_option_ids?: string[]
  row_group?: number | null

}



interface FormData {

  id: string

  name: string

  description: string

  allow_multiple: boolean

  time_limit?: number | null

  expires_at?: string | null

  allow_delete_responses?: boolean

  randomize_questions?: boolean

  questions: Question[]

  is_active: boolean
  image_url: string
  short_code?: string

}



function EditFormContent() {

  const [formData, setFormData] = useState<FormData | null>(null)

  const [profile, setProfile] = useState<any>(null)

  const [loading, setLoading] = useState(true)

  const [saving, setSaving] = useState(false)
  const [questionMenuOpen, setQuestionMenuOpen] = useState(false)
  const [showQuestionPicker, setShowQuestionPicker] = useState(false)
  const [existingForms, setExistingForms] = useState<any[]>([])
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null)
  const [showLeftPanel, setShowLeftPanel] = useState(true)
  const [showRightPanel, setShowRightPanel] = useState(true)

  const [responseCount, setResponseCount] = useState(0)
  

  const router = useRouter()

  

  const parseOptions = (options: any): any[] => {
    if (!options) return []
    if (typeof options === 'string') {
      try {
        return JSON.parse(options)
      } catch {
        return []
      }
    }
    return Array.isArray(options) ? options : []
  }

const params = useParams()

  const formId = params.id as string

  const supabase = createClient()



  useEffect(() => {

    fetchData()

  }, [formId])



  const fetchData = async () => {

    try {

      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {

        router.push('/login')

        return

      }

      const { data: profileData } = await supabase

        .from('profiles')

        .select('*')

        .eq('id', user.id)

        .single()

      if (!profileData) {

        router.push('/login')

        return

      }

      setProfile(profileData)

      // Fetch form data (including created_by)

      const { data: form, error: formError } = await supabase

        .from('forms')

        .select('*')

        .eq('id', formId)

        .single()

      if (formError || !form) {

        router.push('/dashboard')

        return

      }

      // Allow form owner or admin to edit

      if (form.created_by !== user.id && profileData.role !== 'admin') {

        router.push('/dashboard')

        return

      }




      // Fetch response count
      const { count } = await supabase
        .from('form_responses')
        .select('*', { count: 'exact', head: true })
        .eq('form_id', formId)
      setResponseCount(count || 0)



      // Fetch questions

      const { data: questions } = await supabase

        .from('questions')

        .select('*')

        .eq('form_id', formId)

        .order('order_index')



      const formattedQuestions: Question[] = (questions || []).map(q => {
        const parsedOpts = q.options ? JSON.parse(q.options) : []
        let matrix_rows: MatrixRow[] | undefined
        let matrix_columns: MatrixColumn[] | undefined
        let dropdown_type: 'single' | 'multiple' | undefined
        let correct_option_ids: string[] | undefined

        if (q.type === 'matrix' && parsedOpts.matrix_rows) {
          matrix_rows = parsedOpts.matrix_rows
          matrix_columns = parsedOpts.matrix_columns || []
        }

        if (q.type === 'dropdown' && parsedOpts.dropdown_type) {
          dropdown_type = parsedOpts.dropdown_type
          correct_option_ids = parsedOpts.correct_option_ids || []
        }

        return {
          id: q.id,
          text: q.text,
          type: q.type,
          required: q.required || false,
          points: q.points || 0,
          has_counter: q.has_counter || false,
          options: parsedOpts.matrix_rows ? [] : (parsedOpts.options || parsedOpts),
          order_index: q.order_index,
          row_group: q.row_group || null,
          matrix_rows,
          matrix_columns,
          dropdown_type,
          correct_option_ids,
          correct_option_id: correct_option_ids?.[0]
        }
      })



      setFormData({

        id: form.id,

        name: form.name,

        description: form.description || '',



        allow_multiple: form.allow_multiple || false,

        time_limit: form.time_limit || null,

        expires_at: form.expires_at || '',

        allow_delete_responses: form.allow_delete_responses || false,

        randomize_questions: form.randomize_questions || false,

        questions: formattedQuestions,

        is_active: form.is_active,
        image_url: form.image_url || '',
        short_code: form.short_code || ''

      })

      // Get existing forms for question import
      const { data: allForms } = await supabase
        .from('forms')
        .select('*, questions(*)')

      setExistingForms(allForms || [])

    } catch (error) {

      console.error('Error fetching data:', error)

      router.push('/dashboard')

    } finally {

      setLoading(false)

    }

  }



  const addQuestion = (type: QuestionType) => {

    if (!formData) return



    const newQuestion: Question = {

      id: `q_${Date.now()}`,

      text: '',

      type,

      required: false,

      points: 0,

      options: []

    }



    // Add default options based on type

    if (type === 'single_choice' || type === 'multiple_choice') {
      newQuestion.options = [
        { id: `opt_${Date.now()}_1`, text: '', points: 0 },
        { id: `opt_${Date.now()}_2`, text: '', points: 0 }
      ]
    } else if (type === 'scale') {
      newQuestion.options = Array.from({ length: 10 }, (_, i) => ({
        id: `opt_${Date.now()}_${i + 1}`,
        text: String(i + 1),
        points: i + 1
      }))

    } else if (type === 'dropdown') {
      newQuestion.dropdown_type = 'single'
      newQuestion.correct_option_ids = []
    }



    setFormData(prev => prev ? ({

      ...prev,

      questions: [...prev.questions, newQuestion]

    }) : null)

  }



  const updateQuestion = (index: number, updates: Partial<Question>) => {

    if (!formData) return



    setFormData(prev => prev ? ({

      ...prev,

      questions: prev.questions.map((q: any, i: number) => 

        i === index ? { ...q, ...updates } : q

      )

    }) : null)

  }



  const removeQuestion = (index: number) => {

    if (!formData) return



    setFormData(prev => prev ? ({

      ...prev,

      questions: prev.questions.filter((_: any, i: number) => i !== index)

    }) : null)

  }



  const addMatrixRow = (questionIndex: number) => {
    if (!formData) return
    const question = formData.questions[questionIndex]
    const newRow = { id: `row_${Date.now()}`, text: '', required: false }
    updateQuestion(questionIndex, {
      matrix_rows: [...(question.matrix_rows || []), newRow]
    })
  }

  const removeMatrixRow = (questionIndex: number, rowIndex: number) => {
    if (!formData) return
    const question = formData.questions[questionIndex]
    updateQuestion(questionIndex, {
      matrix_rows: (question.matrix_rows || []).filter((_: any, i: number) => i !== rowIndex)
    })
  }

  const updateMatrixRow = (questionIndex: number, rowIndex: number, updates: Partial<MatrixRow>) => {
    if (!formData) return
    const question = formData.questions[questionIndex]
    updateQuestion(questionIndex, {
      matrix_rows: (question.matrix_rows || []).map((row: any, i: number) =>
        i === rowIndex ? { ...row, ...updates } : row
      )
    })
  }

  const addMatrixColumn = (questionIndex: number) => {
    if (!formData) return
    const question = formData.questions[questionIndex]
    const newCol = { id: `col_${Date.now()}`, text: '', points: 0 }
    updateQuestion(questionIndex, {
      matrix_columns: [...(question.matrix_columns || []), newCol]
    })
  }

  const removeMatrixColumn = (questionIndex: number, colIndex: number) => {
    if (!formData) return
    const question = formData.questions[questionIndex]
    updateQuestion(questionIndex, {
      matrix_columns: (question.matrix_columns || []).filter((_: any, i: number) => i !== colIndex)
    })
  }

  const updateMatrixColumn = (questionIndex: number, colIndex: number, updates: Partial<MatrixColumn>) => {
    if (!formData) return
    const question = formData.questions[questionIndex]
    updateQuestion(questionIndex, {
      matrix_columns: (question.matrix_columns || []).map((col: any, i: number) =>
        i === colIndex ? { ...col, ...updates } : col
      )
    })
  }

  const parseBulkText = (questionIndex: number) => {
    if (!formData) return
    const question = formData.questions[questionIndex]
    if (!question.bulk_text) return

    const lines = question.bulk_text.split('\n').filter((l: string) => l.trim())
    const newOptions = lines.map((line: string) => ({
      id: `opt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      text: line.trim(),
      points: 0
    }))

    updateQuestion(questionIndex, {
      options: newOptions,
      bulk_text: ''
    })
  }

  const addOption = (questionIndex: number) => {

    if (!formData) return



    const newOption: QuestionOption = {

      id: `opt_${Date.now()}`,

      text: '',

      points: 0

    }



    updateQuestion(questionIndex, {

      options: [...formData.questions[questionIndex].options, newOption]

    })

  }



  const removeOption = (questionIndex: number, optionIndex: number) => {

    if (!formData) return



    updateQuestion(questionIndex, {

      options: parseOptions(formData.questions[questionIndex].options).filter((_: any, i: number) => i !== optionIndex)

    })

  }



  const updateOption = (questionIndex: number, optionIndex: number, updates: Partial<QuestionOption>) => {

    if (!formData) return



    updateQuestion(questionIndex, {

      options: parseOptions(formData.questions[questionIndex].options).map((opt: any, i: number) =>

        i === optionIndex ? { ...opt, ...updates } : opt

      )

    })
  }

  const saveForm = async () => {

    if (!formData || !formData.name.trim()) {

      alert('يرجى إدخال اسم الفورم')

      return

    }



    if ((formData.questions || []).length === 0) {

      alert('يرجى إضافة سؤال واحد على الأقل')

      return

    }



    setSaving(true)

    try {

      // Update form

      const { error: formError } = await supabase

        .from('forms')

        .update({

          name: formData.name,

          description: formData.description,



          allow_multiple: formData.allow_multiple,

          is_active: formData.is_active,

          time_limit: formData.time_limit || null,

          expires_at: formData.expires_at || null,

          allow_delete_responses: formData.allow_delete_responses || false,
          randomize_questions: formData.randomize_questions || false,
          image_url: formData.image_url || null,
          short_code: formData.short_code || generateShortCode()

        })

        .eq('id', formData.id)



      if (formError) throw formError



      // Delete existing questions

      const { error: deleteError } = await supabase

        .from('questions')

        .delete()

        .eq('form_id', formData.id)



      if (deleteError) throw deleteError



      // Insert updated questions

      const questionsToInsert = (formData.questions || []).map((q: any, index: number) => {
        let optionsData: any

        if (q.type === 'matrix') {
          optionsData = {
            matrix_rows: (q.matrix_rows || []).map((row: any) => ({
              id: row.id,
              text: row.text,
              required: row.required
            })),
            matrix_columns: (q.matrix_columns || []).map((col: any) => ({
              id: col.id,
              text: col.text,
              points: col.points || 0
            }))
          }
        } else if (q.type === 'dropdown') {
          const items = parseOptions(q.options).map((opt: any) => ({
            id: opt.id,
            text: opt.text,
            points: opt.points || 0
          }))
          optionsData = {
            dropdown_type: q.dropdown_type || 'single',
            correct_option_ids: q.dropdown_type === 'multiple' ? (q.correct_option_ids || []) : (q.correct_option_id ? [q.correct_option_id] : []),
            options: items
          }
        } else {
          optionsData = parseOptions(q.options)
        }

        return {
          form_id: formData.id,
          text: q.text,
          type: q.type,
          required: q.required,
          points: q.points,
          has_counter: q.has_counter || false,
          order_index: index,
          row_group: q.row_group || null,
          options: JSON.stringify(optionsData)
        }
      })



      const { error: questionsError } = await supabase

        .from('questions')

        .insert(questionsToInsert)



      if (questionsError) throw questionsError



      alert('تم حفظ التعديلات بنجاح')

      router.push('/dashboard')

    } catch (error) {

      console.error('Error saving form:', error)

      alert('حدث خطأ أثناء حفظ التعديلات')

    } finally {

      setSaving(false)

    }

  }



  const moveQuestion = (index: number, direction: 'up' | 'down') => {

    if (!formData) return

    const newQuestions = [...formData.questions]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newQuestions.length) return
    ;[newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]]
    setFormData(prev => prev ? ({ ...prev, questions: newQuestions }) : null)
  }

  const importQuestion = (question: any) => {
    if (!formData) return
    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      text: question.text,
      type: question.type,
      required: question.required || false,
      points: question.points || 0,
      options: parseOptions(question.options)
    }
    setFormData(prev => prev ? ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }) : null)
    setShowQuestionPicker(false)
  }

  const renderQuestionPreview = (question: any, qIndex: number) => (
    <div
      onClick={() => setSelectedQuestionIndex(selectedQuestionIndex === qIndex ? null : qIndex)}
      className={`rounded-xl p-4 border-2 cursor-pointer transition-all ${
        selectedQuestionIndex === qIndex
          ? 'border-blue-500 bg-blue-50/50 shadow-sm'
          : 'border-gray-100 bg-gray-50 hover:border-blue-200 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
          selectedQuestionIndex === qIndex ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
        }`}>
          {qIndex + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className={`font-medium ${question.text ? 'text-gray-900' : 'text-gray-400'}`}>
            {question.text || 'اكتب السؤال هنا...'}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
              {QUESTION_TYPES[question.type as QuestionType]?.label}
            </span>
            {question.required && <span className="text-xs text-red-500">* مطلوب</span>}
            {question.points > 0 && <span className="text-xs text-amber-600">{question.points} نقطة</span>}
          </div>
          {question.options && question.options.length > 0 && !['scale'].includes(question.type) && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(parseOptions(question.options) as any[]).slice(0, 4).map((opt: any, oi: number) => (
                <span key={oi} className="text-xs bg-white border border-gray-200 text-gray-500 px-2 py-0.5 rounded-lg">
                  {opt.text || 'خيار'}
                </span>
              ))}
              {parseOptions(question.options).length > 4 && (
                <span className="text-xs text-gray-400">+{parseOptions(question.options).length - 4}</span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => moveQuestion(qIndex, 'up')} disabled={qIndex === 0} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg disabled:opacity-30">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
          </button>
          <button onClick={() => moveQuestion(qIndex, 'down')} disabled={qIndex === ((formData?.questions || []).length - 1)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg disabled:opacity-30">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          <button onClick={() => removeQuestion(qIndex)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>
    </div>
  )

  if (loading) {

    return (

      <div className="min-h-screen bg-gray-50 flex items-center justify-center">

        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>

      </div>

    )

  }



  if (!formData) {

    return (

      <div className="min-h-screen bg-gray-50 flex items-center justify-center">

        <div className="text-center">

          <p className="text-gray-500">لم يتم العثور على النموذج</p>

          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-700 mt-2 inline-block"
          >
            العودة للوحة التحكم
          </Link>
        </div>

      </div>

    )

  }



  return (

    <div dir="rtl" className="min-h-screen bg-gray-50">

      {/* Header */}

      <header className="bg-white shadow-sm sticky top-0 z-10">

        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">

          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            رجوع
          </button>

          {responseCount > 0 && (profile?.role === 'admin' || profile?.role === 'supervisor') && (
            <>
              <a
                href={'/admin/results?formId=' + formId}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                عرض التسجيلات
              </a>

            </>
          )}

          <h1 className="text-lg font-bold text-blue-700">تعديل النموذج</h1>

          <div className="flex gap-2">

              <button
              onClick={() => {
                const code = formData?.short_code
                const link = code ? `${window.location.origin}/f/${code}` : `${window.location.origin}/forms/${formId}`
                navigator.clipboard.writeText(link)
                alert('تم نسخ رابط المشاركة: ' + link)
              }}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium flex items-center gap-1.5"
              title="نسخ رابط المشاركة"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              نسخ الرابط
            </button>

            <button

              onClick={() => setFormData(prev => prev ? ({ ...prev, is_active: !prev.is_active }) : null)}

              className={`px-4 py-2 rounded-lg transition-colors ${

                formData.is_active 

                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 

                  : 'bg-red-100 text-red-700 hover:bg-red-200'

              }`}

            >

              {formData.is_active ? 'مفعل' : 'معطل'}

            </button>

            <button

              onClick={saveForm}

              disabled={saving}

              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"

            >

              {saving ? (

                <>

                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>

                  جاري الحفظ...

                </>

              ) : (

                <>

                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />

                  </svg>

                  حفظ التعديلات

                </>

              )}

            </button>

          

          </div>

        </div>

      </header>



      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">

          {/* ======================== LEFT PANEL - Question Types ======================== */}
          <aside className="hidden xl:block w-60 shrink-0">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 sticky top-24">
              <h3 className="text-sm font-bold text-gray-900 mb-3">عناصر النموذج</h3>
              <div className="space-y-1">
                {(Object.entries(QUESTION_TYPES) as [QuestionType, typeof QUESTION_TYPES['text']][]).map(([type, info]) => (
                  <button
                    key={type}
                    onClick={() => { addQuestion(type); setQuestionMenuOpen(false) }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50 transition-colors text-right group"
                  >
                    <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">
                      {info.icon}
                    </span>
                    <div className="min-w-0">
                      <span className="block text-sm font-medium text-gray-800">{info.label}</span>
                      <span className="block text-xs text-gray-500 truncate">{info.description}</span>
                    </div>
                  </button>
                ))}
              </div>
              <hr className="my-3 border-gray-100" />
              <button
                onClick={() => setShowQuestionPicker(true)}
                className="w-full py-2.5 px-3 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                </svg>
                استيراد سؤال
              </button>
            </div>
          </aside>

          {/* Mobile left panel toggle */}
          {showLeftPanel && (
            <div className="fixed inset-0 z-50 xl:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setShowLeftPanel(false)} />
              <aside className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl p-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">عناصر النموذج</h3>
                  <button onClick={() => setShowLeftPanel(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-1">
                  {(Object.entries(QUESTION_TYPES) as [QuestionType, typeof QUESTION_TYPES['text']][]).map(([type, info]) => (
                    <button
                      key={type}
                      onClick={() => { addQuestion(type); setShowLeftPanel(false) }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50 transition-colors text-right"
                    >
                      <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">{info.icon}</span>
                      <div>
                        <span className="block text-sm font-medium text-gray-800">{info.label}</span>
                        <span className="block text-xs text-gray-500">{info.description}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </aside>
            </div>
          )}

          {/* ======================== CENTER PANEL - Form Preview ======================== */}
          <div className="flex-1 min-w-0 max-w-2xl mx-auto">

            {/* Form Basic Info - Collapsible */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">معلومات النموذج</h2>
              </div>

              {(() => {
                const qs = formData.questions || []
                let totalPts = 0
                qs.forEach((q: any) => {
                  if (q.type === 'file_upload') return
                  if (q.type === 'single_choice') {
                    totalPts += Math.max(0, ...parseOptions(q.options).map((o:any) => o.points || 0))
                  } else if (q.type === 'multiple_choice') {
                    totalPts += parseOptions(q.options).reduce((s:number, o:any) => s + (o.points || 0), 0)
                  } else if (q.type === 'dropdown') {
                    const opts = parseOptions(q.options)
                    if (q.dropdown_type === 'multiple') {
                      totalPts += (q.correct_option_ids || []).reduce((s:number, id:string) => {
                        const opt = opts.find((o:any) => o.id === id); return s + (opt?.points || 0)
                      }, 0)
                    } else {
                      const opt = opts.find((o:any) => o.id === q.correct_option_id)
                      totalPts += opt?.points || 0
                    }
                  } else if (q.type === 'ranking') {
                    totalPts += parseOptions(q.options).reduce((s:number, o:any) => s + (o.points || 0), 0)
                  } else if (q.type === 'matrix') {
                    const colSum = (q.matrix_columns || []).reduce((s:number, c:any) => s + (c.points || 0), 0)
                    totalPts += colSum * (q.matrix_rows || []).length
                  } else if (q.type === 'scale') {
                    totalPts += Math.max(10, ...parseOptions(q.options).map((o:any) => o.points || 0))
                  } else {
                    totalPts += q.points || 0
                  }
                })
                return (
                  <div className="flex items-center gap-3 mb-4 p-2.5 bg-gradient-to-l from-blue-50 to-purple-50 rounded-xl border border-blue-100 text-sm">
                    <span className="text-gray-600">الأسئلة: <strong className="text-gray-900">{qs.length}</strong></span>
                    <span className="text-gray-600">النقاط: <strong className="text-blue-700">{totalPts}</strong></span>
                  </div>
                )
              })()}

              <div className="space-y-3">
                <ImageUpload onImageUploaded={(url) => setFormData(prev => prev ? ({ ...prev, image_url: url }) : null)} currentImage={formData.image_url} />
                <input type="text" value={formData.name} onChange={(e) => setFormData(prev => prev ? ({ ...prev, name: e.target.value }) : null)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="اسم النموذج *" />
                <textarea value={formData.description} onChange={(e) => setFormData(prev => prev ? ({ ...prev, description: e.target.value }) : null)} rows={2} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="وصف مختصر..." />
              </div>

              {/* Settings Toggles - Compact */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg cursor-pointer text-sm">
                  <input type="checkbox" checked={formData.allow_multiple} onChange={(e) => setFormData(prev => prev ? ({ ...prev, allow_multiple: e.target.checked }) : null)} className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-gray-700">تسجيل متعدد</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-green-50 rounded-lg cursor-pointer text-sm">
                  <input type="checkbox" checked={formData.time_limit !== null && formData.time_limit !== undefined} onChange={(e) => setFormData(prev => prev ? ({ ...prev, time_limit: e.target.checked ? 10 : null }) : null)} className="w-4 h-4 text-green-600 rounded" />
                  <span className="text-gray-700">مؤقت</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-red-50 rounded-lg cursor-pointer text-sm">
                  <input type="checkbox" checked={!!formData.expires_at} onChange={(e) => setFormData(prev => prev ? ({ ...prev, expires_at: e.target.checked ? new Date(Date.now() + 86400000).toISOString().slice(0, 16) : '' }) : null)} className="w-4 h-4 text-red-600 rounded" />
                  <span className="text-gray-700">تاريخ إغلاق</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg cursor-pointer text-sm">
                  <input type="checkbox" checked={formData.allow_delete_responses || false} onChange={(e) => setFormData(prev => prev ? ({ ...prev, allow_delete_responses: e.target.checked }) : null)} className="w-4 h-4 text-orange-600 rounded" />
                  <span className="text-gray-700">حذف الردود</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg cursor-pointer text-sm col-span-2">
                  <input type="checkbox" checked={formData.randomize_questions || false} onChange={(e) => setFormData(prev => prev ? ({ ...prev, randomize_questions: e.target.checked }) : null)} className="w-4 h-4 text-purple-600 rounded" />
                  <span className="text-gray-700">ترتيب عشوائي للأسئلة</span>
                </label>
              </div>

              {formData.time_limit !== null && formData.time_limit !== undefined && (
                <div className="mt-2 flex items-center gap-2">
                  <label className="text-sm text-gray-600">الوقت (دقيقة):</label>
                  <input type="number" min="1" value={formData.time_limit} onChange={(e) => setFormData(prev => prev ? ({ ...prev, time_limit: parseInt(e.target.value) || 1 }) : null)} className="w-20 px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-center text-sm" />
                </div>
              )}
              {formData.expires_at && (
                <div className="mt-2">
                  <input type="datetime-local" value={formData.expires_at} onChange={(e) => setFormData(prev => prev ? ({ ...prev, expires_at: e.target.value }) : null)} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm" />
                </div>
              )}
            </div>

            {/* Questions Preview */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  الأسئلة ({(formData.questions || []).length})
                </h2>
                <button
                  onClick={() => setShowLeftPanel(true)}
                  className="xl:hidden px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  إضافة
                </button>
              </div>

              {(() => {
                const qs = formData.questions || []
                // Group questions by row_group
                const groups: { group: number | null; questions: any[]; indices: number[] }[] = []
                let currentGroup: number | null = null
                let currentItems: any[] = []
                let currentIndices: number[] = []

                qs.forEach((q: any, idx: number) => {
                  const g = q.row_group || null
                  if (g !== currentGroup && currentItems.length > 0) {
                    groups.push({ group: currentGroup, questions: [...currentItems], indices: [...currentIndices] })
                    currentItems = []
                    currentIndices = []
                  }
                  currentGroup = g
                  currentItems.push(q)
                  currentIndices.push(idx)
                })
                if (currentItems.length > 0) {
                  groups.push({ group: currentGroup, questions: currentItems, indices: currentIndices })
                }

                return groups.map((grp) => {
                  if (grp.group !== null && grp.questions.length > 1) {
                    // Render as a row
                    return (
                      <div key={`row_${grp.group}`} className="flex gap-3">
                        {grp.questions.map((question: any, gi: number) => {
                          const qIndex = grp.indices[gi]
                          return (
                            <div key={question.id} className="flex-1 min-w-0">
                              {renderQuestionPreview(question, qIndex)}
                            </div>
                          )
                        })}
                      </div>
                    )
                  }
                  // Render single question (no group or group of 1)
                  return grp.questions.map((question: any, gi: number) => {
                    const qIndex = grp.indices[gi]
                    return <div key={question.id}>{renderQuestionPreview(question, qIndex)}</div>
                  })
                })
              })()}
                {(formData.questions || []).length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                    <div className="w-14 h-14 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">لم تضف أي أسئلة بعد</p>
                    <p className="text-gray-400 text-xs mt-1">اختر من القائمة الجانبية أو اضغط إضافة</p>
                  </div>
                )}
              </div>
            </div>

          {/* ======================== RIGHT PANEL - Question Properties ======================== */}
          {selectedQuestionIndex !== null && formData.questions[selectedQuestionIndex] && (() => {
            const qIndex = selectedQuestionIndex
            const question = formData.questions[qIndex]

            return (
              <aside className="hidden lg:block w-80 shrink-0">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 sticky top-24">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">خصائص السؤال</h3>
                    <button onClick={() => setSelectedQuestionIndex(null)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>

                  {/* Question Text */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">نص السؤال</label>
                    <input type="text" value={question.text} onChange={(e) => updateQuestion(qIndex, { text: e.target.value })} placeholder="اكتب السؤال هنا..." className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                  </div>

                  {/* Question Type Badge */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">النوع</label>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">{QUESTION_TYPES[question.type as QuestionType]?.label}</span>
                      {question.points > 0 && <span className="px-2 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm">{question.points} نقطة</span>}
                    </div>
                  </div>

                  {/* Required */}
                  <label className="flex items-center gap-2 mb-4 p-2.5 bg-gray-50 rounded-lg cursor-pointer">
                    <input type="checkbox" checked={question.required} onChange={(e) => updateQuestion(qIndex, { required: e.target.checked })} className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm text-gray-700 font-medium">مطلوب</span>
                  </label>

                  {/* Points (for non-choice types) */}
                  {!['single_choice', 'multiple_choice', 'dropdown', 'ranking', 'matrix'].includes(question.type) && (
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">النقاط</label>
                      <input type="number" min="0" value={question.points} onChange={(e) => updateQuestion(qIndex, { points: Number(e.target.value) })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                    </div>
                  )}

                  {/* Options for choice types */}
                  {['single_choice', 'multiple_choice'].includes(question.type) && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-gray-600">الخيارات</label>
                        {question.type === 'single_choice' && (
                          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                            <input type="checkbox" checked={question.has_counter || false} onChange={(e) => updateQuestion(qIndex, { has_counter: e.target.checked })} className="w-3.5 h-3.5 text-emerald-600 rounded" />
                            <span className="text-gray-600">عداد</span>
                          </label>
                        )}
                      </div>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {(parseOptions(question.options) as any[]).map((opt: any, oi: number) => (
                          <div key={oi} className="flex items-center gap-1.5">
                            <input type="text" value={opt.text} onChange={(e) => updateOption(qIndex, oi, { text: e.target.value })} placeholder={`خيار ${oi + 1}`} className="flex-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-sm" />
                            <input type="number" min="0" value={opt.points} onChange={(e) => updateOption(qIndex, oi, { points: Number(e.target.value) })} className="w-14 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center" placeholder="نقاط" title="النقاط" />
                            {question.has_counter && (
                              <input type="number" min="1" value={opt.counter_target || ''} onChange={(e) => updateOption(qIndex, oi, { counter_target: parseInt(e.target.value) || null })} className="w-14 px-2 py-1.5 border border-emerald-200 rounded-lg text-sm text-center" placeholder="هدف" title="العدد المستهدف للتسبيح" />
                            )}
                            <button onClick={() => removeOption(qIndex, oi)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => addOption(qIndex)} className="w-full mt-2 py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors text-sm flex items-center justify-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        إضافة خيار
                      </button>
                    </div>
                  )}

                  {/* Dropdown options */}
                  {question.type === 'dropdown' && (
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">نوع القائمة</label>
                      <select value={question.dropdown_type || 'single'} onChange={(e) => updateQuestion(qIndex, { dropdown_type: e.target.value as 'single' | 'multiple' })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm mb-3">
                        <option value="single">اختيار واحد</option>
                        <option value="multiple">اختيار متعدد</option>
                      </select>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">الخيارات (سطر لكل خيار)</label>
                      <textarea value={question.bulk_text || ''} onChange={(e) => updateQuestion(qIndex, { bulk_text: e.target.value })} rows={4} placeholder="اكتب كل خيار في سطر منفصل&#10;خيار 1&#10;خيار 2&#10;خيار 3" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
                      <button onClick={() => parseBulkText(qIndex)} className="mt-1.5 w-full py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors">
                        تطبيق
                      </button>
                    </div>
                  )}

                  {/* Scale options */}
                  {question.type === 'scale' && (
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">نقاط المقياس</label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {(parseOptions(question.options) as any[]).map((opt: any, oi: number) => (
                          <div key={oi} className="text-center">
                            <div className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold text-sm mb-1">{opt.text}</div>
                            <input type="number" value={opt.points} onChange={(e) => { const idx = (question.options || []).findIndex((o: any) => o.id === opt.id); if (idx >= 0) updateOption(qIndex, idx, { points: Number(e.target.value) }) }} className="w-full px-1 py-1 border border-blue-200 rounded text-center text-sm" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matrix options */}
                  {question.type === 'matrix' && (
                    <div className="mb-4 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">الصفوف</label>
                        <div className="space-y-1">
                          {(question.matrix_rows || []).map((row: any, ri: number) => (
                            <div key={ri} className="flex items-center gap-1">
                              <input type="text" value={row.text} onChange={(e) => updateMatrixRow(qIndex, ri, { text: e.target.value })} placeholder={`صف ${ri + 1}`} className="flex-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-sm" />
                              <label className="flex items-center gap-1 text-xs shrink-0">
                                <input type="checkbox" checked={row.required} onChange={(e) => updateMatrixRow(qIndex, ri, { required: e.target.checked })} className="w-3.5 h-3.5" />
                                مطلوب
                              </label>
                              <button onClick={() => removeMatrixRow(qIndex, ri)} className="p-1 text-red-400 hover:text-red-600"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                            </div>
                          ))}
                        </div>
                        <button onClick={() => addMatrixRow(qIndex)} className="mt-1 text-xs text-blue-600 hover:text-blue-700 font-medium">+ إضافة صف</button>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">الأعمدة</label>
                        <div className="space-y-1">
                          {(question.matrix_columns || []).map((col: any, ci: number) => (
                            <div key={ci} className="flex items-center gap-1">
                              <input type="text" value={col.text} onChange={(e) => updateMatrixColumn(qIndex, ci, { text: e.target.value })} placeholder={`عمود ${ci + 1}`} className="flex-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-sm" />
                              <input type="number" min="0" value={col.points} onChange={(e) => updateMatrixColumn(qIndex, ci, { points: Number(e.target.value) })} className="w-14 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center" placeholder="نقاط" />
                              <button onClick={() => removeMatrixColumn(qIndex, ci)} className="p-1 text-red-400 hover:text-red-600"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                            </div>
                          ))}
                        </div>
                        <button onClick={() => addMatrixColumn(qIndex)} className="mt-1 text-xs text-blue-600 hover:text-blue-700 font-medium">+ إضافة عمود</button>
                      </div>
                    </div>
                  )}

                  {/* Row Group */}
                  <div className="mb-4 p-2.5 bg-gray-50 rounded-lg">
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">عرض في صف</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={question.row_group || ''}
                        onChange={(e) => updateQuestion(qIndex, { row_group: e.target.value ? parseInt(e.target.value) : null })}
                        placeholder="رقم المجموعة"
                        className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                      />
                      <span className="text-xs text-gray-500">نفس الرقم = نفس الصف</span>
                    </div>
                  </div>

                  {/* Delete button */}
                  <button onClick={() => { removeQuestion(qIndex); setSelectedQuestionIndex(null) }} className="w-full py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors text-sm font-medium flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    حذف السؤال
                  </button>
                </div>
              </aside>
            )
          })()}

          {/* Mobile right panel as overlay */}
          {selectedQuestionIndex !== null && formData.questions[selectedQuestionIndex] && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedQuestionIndex(null)} />
              <aside className="absolute left-0 top-0 bottom-0 w-80 bg-white shadow-2xl p-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">خصائص السؤال</h3>
                  <button onClick={() => setSelectedQuestionIndex(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                {/* Mobile question properties - reuse the same editing UI */}
                <div className="text-sm text-gray-500 mb-4">
                  سيتم عرض خصائص السؤال هنا بنفس محتوى اللوحة اليمنى
                </div>
              </aside>
            </div>
          )}

        </div>

      </main>

      {showQuestionPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowQuestionPicker(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-xl">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">استيراد سؤال من فورم سابقة</h3>
              <button onClick={() => setShowQuestionPicker(false)} className="p-2 hover:bg-gray-100 rounded-lg">
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
                existingForms.map((form: any) => (
                  <div key={form.id} className="mb-4">
                    <div className="mb-2">
                      <h4 className="font-medium text-gray-800">{form.name}</h4>
                    </div>
                    <div className="space-y-2">
                      {form.questions?.map((q: any) => (
                        <button
                          key={q.id}
                          onClick={() => importQuestion(q)}
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
      )}
    </div>

  )

}



export default function EditFormPage() {

  return (

    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div></div>}>

      <EditFormContent />

    </Suspense>

  )

}
