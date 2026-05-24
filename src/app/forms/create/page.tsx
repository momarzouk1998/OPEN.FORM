'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ImageUpload from '@/components/ImageUpload'
import RichTextEditor from '@/components/RichTextEditor'
import ProductGroupsEditor, { type ProductGroup } from '@/components/ProductGroupsEditor'
import PaymentMethodsEditor, { type PaymentMethod } from '@/components/PaymentMethodsEditor'
import type { QuestionType, QuestionOption, FormTemplate } from '@/types'
import { TEMPLATE_CATEGORIES } from '@/types'
import { generateShortCode } from '@/lib/shortCode'

// Question type definitions with detailed explanations
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
  ,static_text: { label: 'فقرة (نص ثابت)', icon: '📝', description: 'نص للقراءة فقط', explanation: 'لعرض تعليمات أو معلومات' },
  static_image: { label: 'صورة ثابتة', icon: '🖼️', description: 'عرض صورة', explanation: 'لعرض شعار أو توضيح' },
  divider: { label: 'فاصل', icon: '➖', description: 'خط فاصل', explanation: 'للفصل بين الأقسام' },
  signature: { label: 'التوقيع', icon: '✍️', description: 'حقل توقيع', explanation: 'للحصول على توقيع رقمي' },
  star_rating: { label: 'تقييم بالنجوم', icon: '⭐', description: 'تقييم باستخدام النجوم', explanation: 'بديل مرئي للتقييم الرقمي' },
  terms: { label: 'الشروط والأحكام', icon: '📋', description: 'موافقة على الشروط', explanation: 'المستخدم يقرأ ويوافق على نص' },
  date_range: { label: 'نطاق تاريخ', icon: '📆', description: 'من تاريخ إلى تاريخ', explanation: 'مثال: فترة الإجازة' },
  slider: { label: 'شريط رقمي', icon: '🎚️', description: 'اختيار قيمة بالسحب', explanation: 'مثال: تحديد ميزانية أو عمر' },
  button_choice: { label: 'اختيار بأزرار', icon: '🔘', description: 'خيارات كأزرار مرئية', explanation: 'بديل جميل للاختيار الواحد' },
  email_confirm: { label: 'تأكيد البريد', icon: '✉️', description: 'إدخال الإيميل مرتين', explanation: 'للتأكد من صحة البريد الإلكتروني' },
  youtube: { label: 'فيديو يوتيوب', icon: '▶️', description: 'تضمين فيديو يوتيوب', explanation: 'لعرض فيديو توضيحي داخل النموذج' },
  match_items: { label: 'توصيل العناصر', icon: '🔗', description: 'مطابقة عمودين', explanation: 'مثال: وصّل الكلمة بمعناها' },
  appointment: { label: 'حجز موعد', icon: '📅', description: 'اختيار تاريخ ووقت للحجز', explanation: 'مثال: حجز موعد استشارة' },
  // إضافات
  countdown_timer: { label: 'العد التنازلي', icon: '⏳', description: 'عرض العد التنازلي', explanation: 'مؤقت لانتهاء العرض' },
  products_block: { label: 'المنتجات', icon: '📦', description: 'قائمة منتجات', explanation: 'عرض منتجات للاختيار والطلب' },
  payment_info_block: { label: 'بيانات الدفع', icon: '💳', description: 'عرض طرق الدفع', explanation: 'عرض معلومات الدفع' }
} as const

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
  // Matrix-specific
  matrix_rows?: MatrixRow[]
  matrix_columns?: MatrixColumn[]
  // Dropdown bulk
  bulk_text?: string
  correct_option_id?: string
  dropdown_type?: 'single' | 'multiple'
  correct_option_ids?: string[]
  row_group?: number | null
  page?: number
}

interface FormData {
  name: string
  description: string
  allow_multiple: boolean
  image_url: string
  questions: Question[]
  time_limit?: number | null
  expires_at?: string | null
  allow_delete_responses?: boolean
  randomize_questions?: boolean
}

interface ExistingForm {
  id: string
  name: string
  questions: any[]
}

function CreateFormContent() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [existingForms, setExistingForms] = useState<ExistingForm[]>([])
  const [showQuestionPicker, setShowQuestionPicker] = useState(false)
  const [questionMenuOpen, setQuestionMenuOpen] = useState(false)
  const [templates, setTemplates] = useState<FormTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    allow_multiple: false,
    time_limit: null,
    expires_at: '',
    allow_delete_responses: false,
    randomize_questions: false,
    image_url: '',
    questions: []
  })

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
    if (Array.isArray(options)) {
      if (options.length > 0 && options[options.length - 1]?._visibility_rules !== undefined) {
        const arr = [...options]
        arr.pop()
        return arr
      }
      return options
    }
    return []
  }

  const normalizeProductGroups = (value: any): ProductGroup[] => {
    if (!Array.isArray(value)) return []
    if (value.length > 0 && value[value.length - 1]?._visibility_rules !== undefined) {
      value = value.slice(0, -1)
    }
    if (value.length === 0) return []
    if ('items' in value[0]) {
      return value.map((group: any) => ({
        id: group.id || `g_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: group.name || '',
        items: Array.isArray(group.items) ? group.items : []
      }))
    }
    return [{
      id: 'g_default',
      name: 'المنتجات',
      items: value.map((item: any) => ({
        id: item.id || `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: item.name || item.text || '',
        description: item.description || '',
        price: Number(item.price ?? item.points ?? 0),
        image_url: item.image_url || item.validation_value || '',
        available: item.available !== false
      }))
    }]
  }

  const normalizePaymentMethods = (value: any): PaymentMethod[] => {
    if (!Array.isArray(value)) return []
    if (value.length > 0 && value[value.length - 1]?._visibility_rules !== undefined) {
      value = value.slice(0, -1)
    }
    return value.map((method: any) => ({
      id: method.id || `pm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      method: method.method || method.validation_type || 'bank',
      label: method.label || method.text || '',
      value: method.value || method.validation_value || '',
      details: method.details || method.validation_min || ''
    }))
  }

const supabase = createClient()

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
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

      // Check if user is banned
      if (profileData.banned) {
        router.push('/dashboard?error=banned')
        return
      }

      // Check form limit
      if (profileData.form_limit !== -1 && profileData.form_limit !== null && profileData.form_limit !== undefined) {
        const { data: userForms, count } = await supabase
          .from('forms')
          .select('id', { count: 'exact', head: true })
          .eq('created_by', user.id)
        if (count !== null && count >= profileData.form_limit) {
          router.push('/dashboard?error=form_limit')
          return
        }
      }

      // Get user's existing forms for question reuse
      const { data: forms } = await supabase
        .from('forms')
        .select('*, questions(*)')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })

      setExistingForms(forms || [])

      // Fetch templates
      const { data: templateData } = await supabase
        .from('form_templates')
        .select('*')
        .order('sort_order')
      setTemplates(templateData || [])
      setTemplatesLoading(false)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addQuestion = (type: QuestionType) => {
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
    } else if (type === 'matrix') {
      newQuestion.matrix_rows = [
        { id: `row_${Date.now()}_1`, text: '', required: true },
        { id: `row_${Date.now()}_2`, text: '', required: false }
      ]
      newQuestion.matrix_columns = [
        { id: `col_${Date.now()}_1`, text: '', points: 0 },
        { id: `col_${Date.now()}_2`, text: '', points: 0 }
      ]
    } else if (type === 'dropdown') {
      newQuestion.dropdown_type = 'single'
      newQuestion.correct_option_ids = []
    } else if (type === 'button_choice') {
      newQuestion.options = [
        { id: `opt_${Date.now()}_1`, text: '', points: 0 },
        { id: `opt_${Date.now()}_2`, text: '', points: 0 }
      ]
    } else if (type === 'slider') {
      newQuestion.options = [{ id: `opt_${Date.now()}_1`, text: '0|100|1', points: 0 }] as any
    } else if (type === 'star_rating') {
      newQuestion.options = Array.from({ length: 5 }).map((_, i) => ({ id: `opt_${Date.now()}_${i}`, text: String(i+1), points: i+1 }))
    } else if (type === 'countdown_timer') {
      newQuestion.text = 'العد التنازلي للعرض'
      newQuestion.options = [{
        id: `timer_${Date.now()}`,
        text: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
        validation_value: 'العرض ينتهي خلال',
        validation_min: ''
      }] as any
    } else if (type === 'products_block') {
      newQuestion.text = 'المنتجات'
      newQuestion.options = [{ id: `g_${Date.now()}`, name: '', items: [] }] as any
    } else if (type === 'payment_info_block') {
      newQuestion.text = 'بيانات الدفع'
      newQuestion.options = [{ id: `pm_${Date.now()}`, method: 'bank', label: '', value: '', details: '' }] as any
    } else if (type === 'match_items') {
      newQuestion.matrix_rows = [
        { id: `left_${Date.now()}_1`, text: 'عنصر 1', required: true },
        { id: `left_${Date.now()}_2`, text: 'عنصر 2', required: true }
      ]
      newQuestion.matrix_columns = [
        { id: `right_${Date.now()}_1`, text: 'إجابة 1', points: 0 },
        { id: `right_${Date.now()}_2`, text: 'إجابة 2', points: 0 }
      ]
    }

    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }))
  }

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q: any, i: number) => 
        i === index ? { ...q, ...updates } : q
      )
    }))
  }

  const removeQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_: any, i: number) => i !== index)
    }))
  }

  const addOption = (questionIndex: number) => {
    const newOption: QuestionOption = {
      id: `opt_${Date.now()}`,
      text: '',
      points: 0
    }

    updateQuestion(questionIndex, {
      options: [...(formData.questions[questionIndex].options || []), newOption]
    })
  }

  const removeOption = (questionIndex: number, optionIndex: number) => {
    updateQuestion(questionIndex, {
      options: parseOptions(formData.questions[questionIndex].options).filter((_: any, i: number) => i !== optionIndex)
    })
  }

  const updateOption = (questionIndex: number, optionIndex: number, updates: Partial<QuestionOption>) => {
    updateQuestion(questionIndex, {
      options: parseOptions(formData.questions[questionIndex].options).map((opt: any, i: number) =>
        i === optionIndex ? { ...opt, ...updates } : opt
      )
    })
  }

  const addMatrixRow = (questionIndex: number) => {
    const question = formData.questions[questionIndex]
    const newRow = { id: `row_${Date.now()}`, text: '', required: false }
    updateQuestion(questionIndex, {
      matrix_rows: [...(question.matrix_rows || []), newRow]
    })
  }

  const removeMatrixRow = (questionIndex: number, rowIndex: number) => {
    const question = formData.questions[questionIndex]
    updateQuestion(questionIndex, {
      matrix_rows: (question.matrix_rows || []).filter((_: any, i: number) => i !== rowIndex)
    })
  }

  const updateMatrixRow = (questionIndex: number, rowIndex: number, updates: Partial<MatrixRow>) => {
    const question = formData.questions[questionIndex]
    updateQuestion(questionIndex, {
      matrix_rows: (question.matrix_rows || []).map((row: any, i: number) =>
        i === rowIndex ? { ...row, ...updates } : row
      )
    })
  }

  const addMatrixColumn = (questionIndex: number) => {
    const question = formData.questions[questionIndex]
    const newCol = { id: `col_${Date.now()}`, text: '', points: 0 }
    updateQuestion(questionIndex, {
      matrix_columns: [...(question.matrix_columns || []), newCol]
    })
  }

  const removeMatrixColumn = (questionIndex: number, colIndex: number) => {
    const question = formData.questions[questionIndex]
    updateQuestion(questionIndex, {
      matrix_columns: (question.matrix_columns || []).filter((_: any, i: number) => i !== colIndex)
    })
  }

  const updateMatrixColumn = (questionIndex: number, colIndex: number, updates: Partial<MatrixColumn>) => {
    const question = formData.questions[questionIndex]
    updateQuestion(questionIndex, {
      matrix_columns: (question.matrix_columns || []).map((col: any, i: number) =>
        i === colIndex ? { ...col, ...updates } : col
      )
    })
  }

  const parseBulkText = (questionIndex: number) => {
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

  const importQuestion = (question: any) => {
    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      text: question.text,
      type: question.type,
      required: question.required || false,
      points: question.points || 0,
      options: parseOptions(question.options)
    }

    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }))
    setShowQuestionPicker(false)
  }

  const useTemplate = (template: FormTemplate) => {
    const importedQuestions: Question[] = (template.questions_data || []).map((q: any, index: number) => {
      let options: QuestionOption[] = []
      let matrix_rows: any = undefined
      let matrix_columns: any = undefined
      let dropdown_type: 'single' | 'multiple' | undefined = undefined
      let correct_option_ids: string[] | undefined = undefined

      if (q.type === 'matrix' && q.options?.matrix_rows) {
        matrix_rows = q.options.matrix_rows
        matrix_columns = q.options.matrix_columns || []
      } else if (q.type === 'dropdown' && q.options?.dropdown_type) {
        dropdown_type = q.options.dropdown_type
        correct_option_ids = q.options.correct_option_ids || []
        options = q.options.options || []
      } else if (q.type === 'single_choice' || q.type === 'multiple_choice') {
        options = q.options || []
      } else if (q.type === 'scale') {
        options = q.options || []
      } else if (q.type === 'ranking') {
        options = q.options || []
      } else {
        options = q.options || []
      }

      return {
        id: `q_${Date.now()}_${index}`,
        text: q.text || '',
        type: q.type || 'text',
        required: q.required ?? true,
        points: q.points || 0,
        has_counter: q.has_counter || false,
        options,
        matrix_rows,
        matrix_columns,
        dropdown_type,
        correct_option_ids,
        correct_option_id: correct_option_ids?.[0],
        row_group: q.row_group || null
      }
    })

    setFormData(prev => ({
      ...prev,
      name: template.name,
      description: template.description || '',
      questions: importedQuestions,
      ...(template.form_settings || {})
    }))
  }

  const saveForm = async () => {
    if (!formData.name.trim()) {
      alert('يرجن إدخال اسم الفورم')
      return
    }

    if ((formData.questions || []).length === 0) {
      alert('يرجن إضافة سؤال واحد على الأقل')
      return
    }

    setSaving(true)
    try {
      // Create form
      const { data: form, error: formError } = await supabase
        .from('forms')
        .insert({
          name: formData.name,
          description: formData.description,
          allow_multiple: formData.allow_multiple,
          time_limit: formData.time_limit,
          expires_at: formData.expires_at || null,
          allow_delete_responses: formData.allow_delete_responses,
          randomize_questions: formData.randomize_questions,
          image_url: formData.image_url,
          created_by: profile.id,
          is_active: true,
          short_code: generateShortCode(),
          page_titles: { _is_test: !!((formData as any)._is_test) }
        })
        .select()
        .single()

      if (formError) throw formError

      // Create questions
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
        } else if (q.type === 'match_items') {
          optionsData = {
            left_items: (q.matrix_rows || []).map((row: any) => ({ id: row.id, text: row.text })),
            right_items: (q.matrix_columns || []).map((col: any) => ({ id: col.id, text: col.text }))
          }
        } else {
          optionsData = parseOptions(q.options)
        }

        const storedOpts = Array.isArray(optionsData)
          ? [...optionsData, { _visibility_rules: q.visibility_rules || [] }]
          : { ...optionsData, _visibility_rules: q.visibility_rules || [] }
        return {
          form_id: form.id,
          text: q.text,
          type: q.type,
          required: q.required,
          points: q.points,
          has_counter: q.has_counter || false,
          order_index: index,
          row_group: q.row_group || null,
          page: q.page || 1,
          options: JSON.stringify(storedOpts)
        }
      })

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert)

      if (questionsError) throw questionsError

      router.push(`/forms/${form.serial_number}/edit`)
    } catch (error) {
      console.error('Error saving form:', error)
      alert('حدث خطأ أثناء حفظ الفورم')
    } finally {
      setSaving(false)
    }
  }

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...formData.questions]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    if (targetIndex < 0 || targetIndex >= newQuestions.length) return
    
    ;[newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]]
    
    setFormData(prev => ({ ...prev, questions: newQuestions }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              رجوع
            </button>
            <Link
              href="/templates"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              قوالب جاهزة
            </Link>
          </div>
          <h1 className="text-lg font-bold text-blue-700">إنشاء فورم جديد</h1>
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
                حفظ
              </>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Form Basic Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">معلومات الفورم</h2>

          {(() => {
            const questions = formData.questions || []
            let totalPoints = 0
            questions.forEach((q: any) => {
              if (q.type === 'file_upload') return
              if (q.type === 'single_choice') {
                totalPoints += Math.max(0, ...parseOptions(q.options).map((o:any) => o.points || 0))
              } else if (q.type === 'multiple_choice') {
                totalPoints += parseOptions(q.options).reduce((s:number, o:any) => s + (o.points || 0), 0)
              } else if (q.type === 'dropdown') {
                const opts = parseOptions(q.options)
                if (q.dropdown_type === 'multiple') {
                  totalPoints += (q.correct_option_ids || []).reduce((s:number, id:string) => {
                    const opt = opts.find((o:any) => o.id === id)
                    return s + (opt?.points || 0)
                  }, 0)
                } else {
                  const opt = opts.find((o:any) => o.id === q.correct_option_id)
                  totalPoints += opt?.points || 0
                }
              } else if (q.type === 'ranking') {
                totalPoints += parseOptions(q.options).reduce((s:number, o:any) => s + (o.points || 0), 0)
              } else if (q.type === 'matrix') {
                const colSum = (q.matrix_columns || []).reduce((s:number, c:any) => s + (c.points || 0), 0)
                totalPoints += colSum * (q.matrix_rows || []).length
              } else if (q.type === 'scale') {
                totalPoints += Math.max(10, ...parseOptions(q.options).map((o:any) => o.points || 0))
              } else {
                totalPoints += q.points || 0
              }
            })
            return (
              <div className="flex items-center gap-4 mb-6 p-3 bg-gradient-to-l from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-sm text-gray-600">عدد الأسئلة:</span>
                  <span className="font-bold text-gray-900">{questions.length}</span>
                </div>
                {!!((formData as any)._is_test) && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">إجمالي النقاط:</span>
                  <span className="font-bold text-blue-700">{totalPoints}</span>
                </div>
                )}
              </div>
            )
          })()}
          
          <div className="space-y-4">
            {/* Image Upload */}
            <ImageUpload
              onImageUploaded={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
              currentImage={formData.image_url}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">اسم الفورم *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="مثال: تقييم أداء الصلاة"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="وصف مختصر للنموذج..."
              />
            </div>

            {/* Is Test */}
            <div className="bg-cyan-50 rounded-xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!(formData as any)._is_test}
                  onChange={(e) => setFormData(prev => ({ ...prev, _is_test: e.target.checked } as FormData))}
                  className="w-5 h-5 mt-1 text-cyan-600 rounded focus:ring-cyan-500"
                />
                <div>
                  <span className="font-medium text-gray-800 block">اختبار</span>
                  <span className="text-sm text-gray-600">إظهار حقول النقاط والدرجات للتقييم والتصحيح</span>
                </div>
              </label>
            </div>

            {/* Allow Multiple */}
            <div className="bg-amber-50 rounded-xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.allow_multiple}
                  onChange={(e) => setFormData(prev => ({ ...prev, allow_multiple: e.target.checked }))}
                  className="w-5 h-5 mt-1 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium text-gray-800 block">السماح بالتسجيل المتعدد</span>
                  <span className="text-sm text-gray-600">تفعيل هذا الخيار يسمح للمستخدم بإعادة ملء النموذج عدة مرات يومياً</span>
                </div>
              </label>
            </div>

            {/* Timer Limit */}
            <div className="bg-green-50 rounded-xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.time_limit !== null && formData.time_limit !== undefined}
                  onChange={(e) => setFormData(prev => ({ ...prev, time_limit: e.target.checked ? 10 : null }))}
                  className="w-5 h-5 mt-1 text-green-600 rounded focus:ring-green-500"
                />
                <div className="flex-1">
                  <span className="font-medium text-gray-800 block">تحديد وقت للإجابة</span>
                  <span className="text-sm text-gray-600">تفعيل عداد تنازلي للمستخدمين لإكمال النموذج خلال مدة محددة</span>
                  {formData.time_limit !== null && formData.time_limit !== undefined && (
                    <div className="mt-2">
                      <label className="text-sm text-gray-600 ml-2">الوقت (بالدقائق):</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.time_limit}
                        onChange={(e) => setFormData(prev => ({ ...prev, time_limit: parseInt(e.target.value) || 1 }))}
                        className="w-24 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-center"
                      />
                    </div>
                  )}
                </div>
              </label>
            </div>

            {/* Expiration Date */}
            <div className="bg-red-50 rounded-xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!formData.expires_at}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    expires_at: e.target.checked ? new Date(Date.now() + 86400000).toISOString().slice(0, 16) : ''
                  }))}
                  className="w-5 h-5 mt-1 text-red-600 rounded focus:ring-red-500"
                />
                <div className="flex-1">
                  <span className="font-medium text-gray-800 block">تاريخ ووقت الإغلاق</span>
                  <span className="text-sm text-gray-600">إغلاق النموذج تلقائياً في تاريخ ووقت محدد</span>
                  {formData.expires_at && (
                    <div className="mt-2">
                      <input
                        type="datetime-local"
                        value={formData.expires_at}
                        onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </label>
            </div>

            {/* Allow Delete Responses */}
            <div className="bg-orange-50 rounded-xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.allow_delete_responses || false}
                  onChange={(e) => setFormData(prev => ({ ...prev, allow_delete_responses: e.target.checked }))}
                  className="w-5 h-5 mt-1 text-orange-600 rounded focus:ring-orange-500"
                />
                <div>
                  <span className="font-medium text-gray-800 block">السماح بحذف الردود</span>
                  <span className="text-sm text-gray-600">إظهار زر حذف بجانب كل تسجيل ليتمكن المستخدم من حذف ردوده بنفسه</span>
                </div>
              </label>
            </div>

            {/* Randomize Questions */}
            <div className="bg-purple-50 rounded-xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.randomize_questions || false}
                  onChange={(e) => setFormData(prev => ({ ...prev, randomize_questions: e.target.checked }))}
                  className="w-5 h-5 mt-1 text-purple-600 rounded focus:ring-purple-500"
                />
                <div>
                  <span className="font-medium text-gray-800 block">ترتيب عشوائي للأسئلة</span>
                  <span className="text-sm text-gray-600">عرض الأسئلة بترتيب مختلف لكل مستخدم لمنع الغش</span>
                </div>
              </label>
            </div>


          </div>
        </div>

        {/* Templates Section */}
        {!templatesLoading && templates.length > 0 && (
          <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 ${(formData.questions || []).length > 0 ? 'hidden' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">ابدأ من قالب جاهز</h2>
              <Link
                href="/templates"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                تصفح الكل
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {templates.slice(0, 6).map((template) => (
                <button
                  key={template.id}
                  onClick={() => useTemplate(template)}
                  className="text-right p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start gap-3">
                    {template.image_url ? (
                      <img src={template.image_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center shrink-0">
                        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                        </svg>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm group-hover:text-blue-700 transition-colors">{template.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{template.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                          {TEMPLATE_CATEGORIES[template.category] || template.category}
                        </span>
                        <span className="text-xs text-gray-400">{(template.questions_data || []).length} سؤال</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Questions Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              الأسئلة ({(formData.questions || []).length})
            </h2>
          </div>


          {/* Questions List */}
          <div className="space-y-4">
            {(formData.questions || []).map((question: any, qIndex: number) => (
              <div key={question.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-start gap-3 mb-4">
                  <span className="w-8 h-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold text-sm">
                    {qIndex + 1}
                  </span>
                  <div className="flex-1">
                    {question.type === 'static_text' ? (
                      <RichTextEditor
                        value={question.text}
                        onChange={(html) => updateQuestion(qIndex, { text: html })}
                        placeholder="اكتب النص هنا..."
                      />
                    ) : ['terms'].includes(question.type) ? (
                      <textarea
                        value={question.text}
                        onChange={(e) => updateQuestion(qIndex, { text: e.target.value })}
                        placeholder="اكتب النص هنا..."
                        rows={4}
                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <input
                        type="text"
                        value={question.text}
                        onChange={(e) => updateQuestion(qIndex, { text: e.target.value })}
                        placeholder="اكتب السؤال هنا..."
                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveQuestion(qIndex, 'up')}
                      disabled={qIndex === 0}
                      className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg disabled:opacity-30"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveQuestion(qIndex, 'down')}
                      disabled={qIndex === (formData.questions || []).length - 1}
                      className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg disabled:opacity-30"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => removeQuestion(qIndex)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Question Settings */}
                <div className="flex flex-wrap gap-4 mb-4 ms-2 sm:ms-11">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={question.required}
                      onChange={(e) => updateQuestion(qIndex, { required: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">مطلوب</span>
                  </label>
                  
                  {!!((formData as any)._is_test) && !['single_choice', 'multiple_choice', 'dropdown', 'ranking', 'matrix', 'button_choice', 'match_items', 'static_text', 'static_image', 'divider', 'terms', 'youtube'].includes(question.type) && (
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-700">النقاط:</label>
                    <input
                      type="number"
                      min="0"
                      value={question.points}
                      onChange={(e) => updateQuestion(qIndex, { points: Number(e.target.value) })}
                      className="w-20 px-2 py-1 bg-white border border-gray-200 rounded-lg text-center"
                    />
                  </div>
                  )}

                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                    {QUESTION_TYPES[question.type as QuestionType]?.label}
                  </span>
                  {!!((formData as any)._is_test) && (() => {
                    if (question.type === 'file_upload') return null
                    let total = 0
                    if (question.type === 'single_choice') {
                      total = Math.max(0, ...parseOptions(question.options).map((o:any) => o.points || 0))
                    } else if (question.type === 'multiple_choice') {
                      total = parseOptions(question.options).reduce((s:number, o:any) => s + (o.points || 0), 0)
                    } else if (question.type === 'dropdown') {
                      const opts = parseOptions(question.options)
                      if (question.dropdown_type === 'multiple') {
                        total = (question.correct_option_ids || []).reduce((s:number, id:string) => {
                          const opt = opts.find((o:any) => o.id === id)
                          return s + (opt?.points || 0)
                        }, 0)
                      } else {
                        const opt = opts.find((o:any) => o.id === question.correct_option_id)
                        total = opt?.points || 0
                      }
                    } else if (question.type === 'ranking') {
                      total = parseOptions(question.options).reduce((s:number, o:any) => s + (o.points || 0), 0)
                    } else if (question.type === 'matrix') {
                      const colSum = (question.matrix_columns || []).reduce((s:number, c:any) => s + (c.points || 0), 0)
                      total = colSum * (question.matrix_rows || []).length
                    } else if (question.type === 'scale') {
                      total = Math.max(10, ...parseOptions(question.options).map((o:any) => o.points || 0))
                    } else {
                      total = question.points || 0
                    }
                    return <span className="text-xs text-blue-600 font-medium me-2">({total} نقطة)</span>
                  })()}
                </div>

                {/* Text validation options (short text only) */}
                {question.type === 'text' && (() => {
                  const opts: any[] = parseOptions(question.options)
                  const meta = opts[0] || {}
                  const vt = meta.validation_type || ''
                  const vcat = meta.validation_category || ''
                  const firstOptions = [
                    { value: 'name', label: 'اسم' },
                    { value: 'email', label: 'ايميل' },
                    { value: 'phone', label: 'رقم هاتف' },
                    { value: 'number', label: 'رقم' },
                    { value: 'plain', label: 'نص بدون تحقق' },
                    { value: 'text_check', label: 'نص بتحقق' },
                  ]
                  const currentFirst = firstOptions.find(o => {
                    if (vcat) return o.value === vcat
                    if (!vt || vt === '') return o.value === 'plain'
                    if (vt === 'name' || vt === 'email' || vt === 'phone' || vt === 'plain') return o.value === vt
                    return o.value === 'plain'
                  }) || firstOptions[0]

                  const secondOptions = (() => {
                    if (currentFirst.value === 'name') return [
                      { value: 'name_2', label: 'ثنائي' },
                      { value: 'name_3', label: 'ثلاثي' },
                      { value: 'name_4', label: 'رباعي' },
                    ]
                    if (currentFirst.value === 'number') return [
                      { value: 'equal_to', label: 'يساوي' },
                      { value: 'not_equal_to', label: 'لا يساوي' },
                      { value: 'less_than', label: 'أقل من' },
                      { value: 'less_than_or_equal', label: 'أقل من أو يساوي' },
                      { value: 'greater_than', label: 'أكبر من' },
                      { value: 'greater_than_or_equal', label: 'أكبر من أو يساوي' },
                      { value: 'between', label: 'بين' },
                      { value: 'not_between', label: 'ليس بين' },
                      { value: 'whole_number', label: 'عدد صحيح' },
                      { value: 'is_number', label: 'اعداد عشرية' },
                    ]
                    if (currentFirst.value === 'text_check') return [
                      { value: 'equal_to', label: 'يساوي' },
                      { value: 'not_equal_to', label: 'لا يساوي' },
                      { value: 'contains_word', label: 'يحتوى على' },
                      { value: 'does_not_contain', label: 'لا يحتوى على' },
                    ]
                    return []
                  })()

                  const setValidation = (firstVal: string, secondVal?: string) => {
                    if (firstVal === '' || firstVal === 'email' || firstVal === 'phone' || firstVal === 'plain') {
                      updateQuestion(qIndex, { options: [{ validation_type: firstVal, validation_category: '', validation_value: '', validation_min: '', validation_max: '' }] as any })
                    } else if (firstVal === 'name') {
                      const wordCount = secondVal ? parseInt(secondVal.split('_')[1]) : 2
                      updateQuestion(qIndex, { options: [{ validation_type: 'name', validation_category: 'name', validation_value: String(wordCount), validation_min: '', validation_max: '' }] as any })
                    } else if (firstVal === 'number') {
                      const sv = secondVal || 'equal_to'
                      updateQuestion(qIndex, { options: [{ validation_type: sv, validation_category: 'number', validation_value: '', validation_min: '', validation_max: '' }] as any })
                    } else if (firstVal === 'text_check') {
                      const sv = secondVal || 'contains_word'
                      updateQuestion(qIndex, { options: [{ validation_type: sv, validation_category: 'text_check', validation_value: sv === 'contains_word' || sv === 'does_not_contain' ? '' : '', validation_min: '', validation_max: '' }] as any })
                    }
                  }

                  const currentSecondVal = (() => {
                    if (currentFirst.value === 'name') {
                      const wc = meta.validation_value || '2'
                      return `name_${wc}`
                    }
                    if (currentFirst.value === 'number' || currentFirst.value === 'text_check') {
                      if (['contains_word','does_not_contain','equal_to','not_equal_to','less_than','less_than_or_equal','greater_than','greater_than_or_equal','between','not_between','whole_number','is_number'].includes(vt)) return vt
                    }
                    return ''
                  })()

                  return (
                    <div className="ms-2 sm:ms-11 mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-sm font-medium text-purple-700 mb-2">نوع التحقق من الإجابة:</p>
                      <div className="flex flex-wrap gap-2">
                        <select
                          value={currentFirst.value}
                          onChange={(e) => {
                            setValidation(e.target.value)
                          }}
                          className="px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-sm focus:ring-1 focus:ring-purple-500"
                        >
                          {firstOptions.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                        {secondOptions.length > 0 && (
                          <select
                            value={currentSecondVal}
                            onChange={(e) => {
                              setValidation(currentFirst.value, e.target.value)
                            }}
                            className="px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-sm focus:ring-1 focus:ring-purple-500"
                          >
                            <option value="">اختر...</option>
                            {secondOptions.map(o => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        )}
                        {(currentFirst.value === 'text_check' && vt) && (
                          <input
                            type="text"
                            value={meta.validation_value || ''}
                            onChange={(e) => updateQuestion(qIndex, { options: [{ validation_type: vt, validation_value: e.target.value, validation_min: '', validation_max: '' }] as any })}
                            placeholder="أدخل النص..."
                            className="px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-sm focus:ring-1 focus:ring-purple-500 w-40"
                          />
                        )}
                        {(currentFirst.value === 'number' && (vt === 'equal_to' || vt === 'not_equal_to' || vt === 'less_than' || vt === 'less_than_or_equal' || vt === 'greater_than' || vt === 'greater_than_or_equal')) && (
                          <input
                            type="number"
                            step="any"
                            value={meta.validation_value ?? ''}
                            onChange={(e) => updateQuestion(qIndex, { options: [{ validation_type: vt, validation_value: e.target.value, validation_min: '', validation_max: '' }] as any })}
                            placeholder="القيمة..."
                            className="px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-sm focus:ring-1 focus:ring-purple-500 w-32"
                          />
                        )}
                        {(currentFirst.value === 'number' && (vt === 'between' || vt === 'not_between')) && (
                          <>
                            <input
                              type="number"
                              step="any"
                              value={meta.validation_min ?? ''}
                              onChange={(e) => updateQuestion(qIndex, { options: [{ validation_type: vt, validation_min: e.target.value, validation_max: meta.validation_max || '', validation_value: '' }] as any })}
                              placeholder="الصغرى..."
                              className="px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-sm focus:ring-1 focus:ring-purple-500 w-28"
                            />
                            <input
                              type="number"
                              step="any"
                              value={meta.validation_max ?? ''}
                              onChange={(e) => updateQuestion(qIndex, { options: [{ validation_type: vt, validation_min: meta.validation_min || '', validation_max: e.target.value, validation_value: '' }] as any })}
                              placeholder="العظمى..."
                              className="px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-sm focus:ring-1 focus:ring-purple-500 w-28"
                            />
                          </>
                        )}
                      </div>
                    </div>
                  )
                })()}

                {/* Matrix specific UI */}
                {question.type === 'matrix' && (
                  <div className="ms-2 sm:ms-11 space-y-6">
                    {/* Rows */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">الصفوف:</p>
                      <div className="space-y-2">
                        {(question.matrix_rows || []).map((row: any, rIndex: number) => (
                          <div key={row.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white rounded-lg p-3 border border-gray-200">
                            <span className="text-gray-400">⊞</span>
                            <input
                              type="text"
                              value={row.text}
                              onChange={(e) => updateMatrixRow(qIndex, rIndex, { text: e.target.value })}
                              placeholder="نص السؤال..."
                              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                            />
                            <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={row.required}
                                onChange={(e) => updateMatrixRow(qIndex, rIndex, { required: e.target.checked })}
                                className="w-4 h-4 text-blue-600 rounded"
                              />
                              إجباري
                            </label>
                            <button
                              onClick={() => removeMatrixRow(qIndex, rIndex)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => addMatrixRow(qIndex)}
                          className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          إضافة صف
                        </button>
                      </div>
                    </div>
                    {/* Columns */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">رؤوس الأعمدة:</p>
                      <div className="space-y-2">
                        {(question.matrix_columns || []).map((col: any, cIndex: number) => (
                          <div key={col.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-amber-50 rounded-lg p-3 border border-amber-200">
                            <span className="text-gray-400">☐</span>
                            <input
                              type="text"
                              value={col.text}
                              onChange={(e) => updateMatrixColumn(qIndex, cIndex, { text: e.target.value })}
                              placeholder="عنوان العمود..."
                              className="flex-1 px-3 py-2 border border-amber-200 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white"
                            />
                            <div className={`flex items-center gap-1 ${!!((formData as any)._is_test) ? '' : 'hidden'}`}>
                              <span className="text-xs text-gray-500">الدرجة:</span>
                              <input
                                type="number"
                                min="0"
                                value={col.points}
                                onChange={(e) => updateMatrixColumn(qIndex, cIndex, { points: Number(e.target.value) })}
                                className="w-16 px-2 py-2 border border-amber-200 rounded-lg text-center bg-white"
                              />
                            </div>
                            <button
                              onClick={() => removeMatrixColumn(qIndex, cIndex)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => addMatrixColumn(qIndex)}
                          className="w-full py-2 border-2 border-dashed border-amber-300 text-amber-600 rounded-lg hover:border-amber-400 hover:text-amber-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          إضافة عمود
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bulk text import for dropdown */}
                {question.type === 'dropdown' && (
                  <div className="ms-2 sm:ms-11 space-y-3">
                    {/* Single / Multi toggle */}
                    <div className="flex gap-3 bg-gray-50 rounded-lg p-2 border border-gray-200">
                      <button
                        type="button"
                        onClick={() => updateQuestion(qIndex, { dropdown_type: 'single', correct_option_ids: [], correct_option_id: undefined })}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${question.dropdown_type === 'single' ? 'bg-white text-blue-700 shadow-sm border border-blue-200' : 'text-gray-600 hover:text-gray-800'}`}
                      >
                        اختيار واحد
                      </button>
                      <button
                        type="button"
                        onClick={() => updateQuestion(qIndex, { dropdown_type: 'multiple', correct_option_id: undefined })}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${question.dropdown_type === 'multiple' ? 'bg-white text-blue-700 shadow-sm border border-blue-200' : 'text-gray-600 hover:text-gray-800'}`}
                      >
                        اختيار متعدد
                      </button>
                    </div>

                    <p className="text-sm font-medium text-gray-700">الخيارات:</p>
                    {/* Bulk import */}
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <p className="text-xs text-blue-700 mb-2">إضافة خيارات دفعة واحدة (كل سطر خيار):</p>
                      <textarea
                        value={question.bulk_text || ''}
                        onChange={(e) => updateQuestion(qIndex, { bulk_text: e.target.value })}
                        placeholder="الخيار الأول
الخيار الثاني
الخيار الثالث"
                        rows={3}
                        className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => parseBulkText(qIndex)}
                        disabled={!question.bulk_text?.trim()}
                        className="mt-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        إضافة الخيارات
                      </button>
                    </div>
                    {/* Options list */}
                    {parseOptions(question.options).map((option: any, oIndex: number) => {
                      const isMulti = question.dropdown_type === 'multiple'
                      const correctIds = question.correct_option_ids || []
                      const isCorrect = isMulti ? correctIds.includes(option.id) : question.correct_option_id === option.id
                      return (
                      <div key={option.id} className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3">
                          <span className="text-gray-400">▼</span>
                          <input
                            type="text"
                            value={option.text}
                            onChange={(e) => updateOption(qIndex, oIndex, { text: e.target.value })}
                            placeholder="نص الخيار..."
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                          />
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                              <input
                                type={isMulti ? 'checkbox' : 'radio'}
                                name={`correct_${question.id}`}
                                checked={isCorrect}
                                onChange={() => {
                                  if (isMulti) {
                                    const newIds = isCorrect
                                      ? correctIds.filter((id: string) => id !== option.id)
                                      : [...correctIds, option.id]
                                    updateQuestion(qIndex, { correct_option_ids: newIds })
                                  } else {
                                    updateQuestion(qIndex, { correct_option_id: question.correct_option_id === option.id ? undefined : option.id })
                                  }
                                }}
                                className="w-4 h-4 text-green-600"
                              />
                              <span className="text-green-700 text-xs">صحيح</span>
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={option.points}
                              onChange={(e) => updateOption(qIndex, oIndex, { points: Number(e.target.value) })}
                              placeholder="الدرجة"
                              className={`w-16 px-2 py-2 border border-gray-200 rounded-lg text-center ${!!((formData as any)._is_test) ? '' : 'hidden'}`}
                            />
                          </div>
                          <button
                            onClick={() => removeOption(qIndex, oIndex)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )})}
                    <button
                      onClick={() => addOption(qIndex)}
                      className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      إضافة خيار
                    </button>
                  </div>
                )}

                {/* Options for other choice questions */}
                {(question.type === 'single_choice' || question.type === 'multiple_choice' || question.type === 'ranking' || question.type === 'button_choice') && (
                  <div className="ms-2 sm:ms-11 space-y-3">
                    {question.type === 'single_choice' && (
                      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!question.has_counter}
                          onChange={(e) => updateQuestion(qIndex, { has_counter: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        تفعيل العداد (سبحة التسبيح)
                      </label>
                    )}
                    <p className="text-sm font-medium text-gray-700">الخيارات:</p>
                    {parseOptions(question.options).map((option: any, oIndex: number) => (
                      <div key={option.id} className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3">
                          <span className="text-gray-400">
                            {question.type === 'single_choice' ? '○' : question.type === 'ranking' ? '#' : '☑'}
                          </span>
                          <input
                            type="text"
                            value={option.text}
                            onChange={(e) => updateOption(qIndex, oIndex, { text: e.target.value })}
                            placeholder="نص الخيار..."
                            className="w-full sm:flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                          />
                          <input
                            type="number"
                            min="0"
                            value={option.points}
                            onChange={(e) => updateOption(qIndex, oIndex, { points: Number(e.target.value) })}
                            placeholder="النقاط"
                            className={`w-20 px-2 py-2 border border-gray-200 rounded-lg text-center ${!!((formData as any)._is_test) ? '' : 'hidden'}`}
                            title="النقاط"
                          />
                          {question.has_counter && (
                            <input
                              type="number"
                              min="1"
                              value={option.counter_target || ''}
                              onChange={(e) => updateOption(qIndex, oIndex, { counter_target: parseInt(e.target.value) || null })}
                              placeholder="الهدف"
                              className="w-20 px-2 py-2 border border-emerald-200 rounded-lg text-center text-sm"
                              title="العدد المستهدف للتسبيح"
                            />
                          )}
                          <button
                            onClick={() => removeOption(qIndex, oIndex)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    <button
                      onClick={() => addOption(qIndex)}
                      className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      إضافة خيار
                    </button>
                  </div>
                )}

                {question.type === 'match_items' && (
                  <div className="ms-2 sm:ms-11 space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">العمود الأيمن (الخيارات):</p>
                      <div className="space-y-2">
                        {(question.matrix_rows || []).map((row: any, ri: number) => (
                          <div key={ri} className="flex items-center gap-2">
                            <input type="text" value={row.text} onChange={(e) => updateMatrixRow(qIndex, ri, { text: e.target.value })} placeholder={`عنصر ${ri + 1}`} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg" />
                            <button onClick={() => removeMatrixRow(qIndex, ri)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => addMatrixRow(qIndex)} className="mt-2 text-sm text-blue-600 hover:text-blue-700">+ إضافة عنصر</button>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">العمود الأيسر (الإجابات):</p>
                      <div className="space-y-2">
                        {(question.matrix_columns || []).map((col: any, ci: number) => (
                          <div key={ci} className="flex items-center gap-2">
                            <input type="text" value={col.text} onChange={(e) => updateMatrixColumn(qIndex, ci, { text: e.target.value })} placeholder={`إجابة ${ci + 1}`} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg" />
                            <input type="number" min="0" value={col.points} onChange={(e) => updateMatrixColumn(qIndex, ci, { points: Number(e.target.value) })} className={`w-16 px-2 py-2 border border-gray-200 rounded-lg text-center ${!!((formData as any)._is_test) ? '' : 'hidden'}`} placeholder="نقاط" />
                            <button onClick={() => removeMatrixColumn(qIndex, ci)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => addMatrixColumn(qIndex)} className="mt-2 text-sm text-blue-600 hover:text-blue-700">+ إضافة إجابة</button>
                    </div>
                  </div>
                )}

                {question.type === 'slider' && (
                  <div className="ms-2 sm:ms-11">
                    <p className="text-sm font-medium text-gray-700 mb-3">إعدادات الشريط الرقمي (Min|Max|Step):</p>
                    <input type="text" value={(parseOptions(question.options)[0] || {}).text || '0|100|1'} onChange={(e) => { if(parseOptions(question.options).length===0) addOption(qIndex); updateOption(qIndex, 0, { text: e.target.value }) }} className="w-full px-3 py-2 border border-gray-200 rounded-lg" dir="ltr" placeholder="0|100|1" />
                    <p className="text-xs text-gray-500 mt-1">أدخل الحد الأدنى | الحد الأقصى | مقدار الزيادة</p>
                  </div>
                )}

                {question.type === 'youtube' && (
                  <div className="ms-2 sm:ms-11">
                    <p className="text-sm font-medium text-gray-700 mb-3">رابط يوتيوب:</p>
                    <input type="text" value={(parseOptions(question.options)[0] || {}).text || ''} onChange={(e) => { if(parseOptions(question.options).length===0) addOption(qIndex); updateOption(qIndex, 0, { text: e.target.value }) }} className="w-full px-3 py-2 border border-gray-200 rounded-lg" dir="ltr" placeholder="https://youtube.com/watch?v=..." />
                  </div>
                )}

                {question.type === 'countdown_timer' && (
                  <div className="ms-2 sm:ms-11 space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">العد التنازلي للعرض</p>
                      <p className="text-xs text-gray-500">حدد وقت انتهاء العرض والنص الذي سيظهر للمستخدم.</p>
                    </div>
                    <input
                      type="text"
                      value={parseOptions(question.options)[0]?.validation_value || 'العرض ينتهي خلال'}
                      onChange={(e) => {
                        if (parseOptions(question.options).length === 0) addOption(qIndex)
                        updateOption(qIndex, 0, { validation_value: e.target.value })
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                      placeholder="العرض ينتهي خلال"
                    />
                    <input
                      type="datetime-local"
                      value={parseOptions(question.options)[0]?.text || ''}
                      onChange={(e) => {
                        if (parseOptions(question.options).length === 0) addOption(qIndex)
                        updateOption(qIndex, 0, { text: e.target.value })
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    />
                    <textarea
                      value={parseOptions(question.options)[0]?.validation_min || ''}
                      onChange={(e) => {
                        if (parseOptions(question.options).length === 0) addOption(qIndex)
                        updateOption(qIndex, 0, { validation_min: e.target.value })
                      }}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                      placeholder="وصف اختياري يظهر أسفل العد"
                    />
                  </div>
                )}

                {question.type === 'products_block' && (
                  <div className="ms-2 sm:ms-11 space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">المنتجات</p>
                      <p className="text-xs text-gray-500">أضف مجموعات، وداخل كل مجموعة الأصناف والسعر والتفاصيل والصورة.</p>
                    </div>
                    <ProductGroupsEditor
                      groups={normalizeProductGroups(parseOptions(question.options))}
                      onChange={(groups) => updateQuestion(qIndex, { options: groups as any })}
                    />
                  </div>
                )}

                {question.type === 'payment_info_block' && (
                  <div className="ms-2 sm:ms-11 space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">بيانات الدفع</p>
                      <p className="text-xs text-gray-500">اكتب بياناتك التي ستظهر للمستخدم مع زر نسخ لكل رقم أو رابط.</p>
                    </div>
                    <PaymentMethodsEditor
                      methods={normalizePaymentMethods(parseOptions(question.options))}
                      onChange={(methods) => updateQuestion(qIndex, { options: methods as any })}
                    />
                  </div>
                )}

                {question.type === 'star_rating' && (
                  <div className="ms-2 sm:ms-11">
                    <p className="text-sm font-medium text-gray-700 mb-3">عدد النجوم:</p>
                    <input type="number" min="1" max="10" value={parseOptions(question.options).length} onChange={(e) => {
                      const count = parseInt(e.target.value) || 5;
                      updateQuestion(qIndex, { options: Array.from({ length: count }).map((_, i) => ({ id: `opt_${Date.now()}_${i}`, text: String(i+1), points: i+1 })) });
                    }} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                  </div>
                )}

                {question.type === 'static_image' && (
                  <div className="ms-2 sm:ms-11">
                    <p className="text-sm font-medium text-gray-700 mb-3">رابط الصورة (URL):</p>
                    <input type="text" value={(parseOptions(question.options)[0] || {}).validation_value || ''} onChange={(e) => { if(parseOptions(question.options).length===0) addOption(qIndex); updateOption(qIndex, 0, { validation_value: e.target.value }) }} className="w-full px-3 py-2 border border-gray-200 rounded-lg" dir="ltr" placeholder="https://..." />
                    <p className="text-xs text-gray-500 mt-1">انسخ رابط الصورة وضعه هنا</p>
                  </div>
                )}


                {question.type === 'scale' && (
                  <div className="ms-2 sm:ms-11 bg-blue-50 rounded-lg p-4 overflow-x-auto">
                    <p className="text-sm font-medium text-blue-700 mb-3">مقياس التقييم (1-10)</p>
                    <div className="flex justify-between items-center min-w-[200px]">
                      {parseOptions(question.options).map((opt: any) => (
                        <div key={opt.id} className="text-center">
                          <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mb-1">
                            {opt.text}
                          </div>
                          <input
                            type="number"
                            value={opt.points}
                            onChange={(e) => {
                              const idx = (question.options || []).findIndex((o: any) => o.id === opt.id)
                              updateOption(qIndex, idx, { points: Number(e.target.value) })
                            }}
                            className={`w-12 px-1 py-1 border border-blue-200 rounded text-center text-sm ${!!((formData as any)._is_test) ? '' : 'hidden'}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {(formData.questions || []).length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 mb-4">لم تضف أي أسئلة بعد</p>
              </div>
            )}
            
            {/* Add Question Button and Import Button */}
            <div className="flex gap-3 mt-8">
              <div className="relative flex-1">
                <button
                  onClick={() => setQuestionMenuOpen(!questionMenuOpen)}
                  className="w-full py-4 border-2 border-dashed border-blue-300 text-blue-600 rounded-xl hover:bg-blue-50 hover:border-blue-400 font-bold transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  إضافة سؤال جديد
                </button>
                
                {questionMenuOpen && (
                  <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 shadow-xl rounded-xl z-20 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-4">
                    {(Object.entries(QUESTION_TYPES) as [QuestionType, typeof QUESTION_TYPES['text']][]).map(([type, info]) => (
                      <button
                        key={type}
                        onClick={() => {
                          if (type === 'file_upload') return
                          addQuestion(type)
                          setQuestionMenuOpen(false)
                        }}
                        className={`flex flex-col items-center justify-center text-center p-3 rounded-lg transition-colors border ${type === 'file_upload' ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200' : 'hover:bg-blue-50 border-transparent hover:border-blue-200'}`}
                        title={type === 'file_upload' ? 'قيد التطوير' : ''}
                      >
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 font-bold ${type === 'file_upload' ? 'bg-gray-200 text-gray-400' : 'bg-blue-100 text-blue-600'}`}>
                          {info.icon}
                        </span>
                        <span className="font-medium text-gray-800 text-sm mb-1">{info.label}</span>
                        <span className="text-xs text-gray-500">{type === 'file_upload' ? 'قيد التطوير' : info.description}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowQuestionPicker(true)}
                className="py-4 px-6 border-2 border-dashed border-emerald-300 text-emerald-600 rounded-xl hover:bg-emerald-50 hover:border-emerald-400 font-bold transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                </svg>
                استيراد سؤال
              </button>
            </div>
          </div>
        </div>

        {/* Examples Section */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
          <h3 className="text-lg font-bold text-amber-800 mb-4">💡 أمثلة عملية لأنواع الأسئلة</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Text Example */}
            <div className="bg-white rounded-xl p-4 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center text-sm font-bold">T</span>
                <span className="font-medium text-gray-800">نص قصير</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">ما اسم المسجد الذي تصلي فيه؟</p>
              <div className="bg-gray-50 rounded p-2 text-xs text-gray-500">
                إجابة: مسجد النور
              </div>
            </div>

            {/* Textarea Example */}
            <div className="bg-white rounded-xl p-4 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center text-sm font-bold">¶</span>
                <span className="font-medium text-gray-800">نص طويل</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">اكتب عن شعورك أثناء قراءة القرآن</p>
              <div className="bg-gray-50 rounded p-2 text-xs text-gray-500">
                إجابة: أشعر بالسكينة والطمأنينة...
              </div>
            </div>

            {/* Single Choice Example */}
            <div className="bg-white rounded-xl p-4 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center text-sm font-bold">○</span>
                <span className="font-medium text-gray-800">اختيار واحد</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">في أي وقت تصلي الفجر؟</p>
              <div className="space-y-1 text-xs text-gray-500">
                <div>○ قبل الأذان (5 نقاط)</div>
                <div>○ مع الأذان (4 نقاط)</div>
                <div>○ بعد الأذان بـ15 دقيقة (3 نقاط)</div>
              </div>
            </div>

            {/* Multiple Choice Example */}
            <div className="bg-white rounded-xl p-4 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center text-sm font-bold">☑</span>
                <span className="font-medium text-gray-800">اختيار متعدد</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">ما الأعمال الصالحة التي تقوم بها؟</p>
              <div className="space-y-1 text-xs text-gray-500">
                <div>☑ الصلاة في وقتها (2 نقاط)</div>
                <div>☑ قراءة القرآن (2 نقاط)</div>
                <div>☐ الصدقة (2 نقاط)</div>
                <div>☑ الذكر (1 نقطة)</div>
              </div>
            </div>

            {/* Scale Example */}
            <div className="bg-white rounded-xl p-4 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center text-sm font-bold">⭐</span>
                <span className="font-medium text-gray-800">تقييم</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">قيم مستوى خشوعك في الصلاة</p>
              <div className="flex justify-between text-xs text-gray-500">
                <span>⭐☆☆☆☆ ضعيف</span>
                <span>⭐⭐⭐⭐⭐ ممتاز</span>
              </div>
            </div>

            {/* Ranking Example */}
            <div className="bg-white rounded-xl p-4 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center text-sm font-bold">#</span>
                <span className="font-medium text-gray-800">ترتيب</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">رتب العبادات حسب أولويتك</p>
              <div className="space-y-1 text-xs text-gray-500">
                <div>1. الصلاة (5 نقاط)</div>
                <div>2. قراءة القرآن (4 نقاط)</div>
                <div>3. الذكر (3 نقاط)</div>
                <div>4. الصدقة (2 نقاط)</div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-amber-100 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>نصيحة:</strong> استخدم أنواع الأسئلة المختلفة لجعل النموذج أكثر تفاعلاً وشمولية.
              يمكنك دمج عدة أنواع في نموذج واحد لتغطية جوانب مختلفة من الموضوع.
            </p>
          </div>
        </div>
      </main>

      {/* Question Picker Modal */}
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
                existingForms.map(form => (
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

export default function CreateFormPage() {
  return <CreateFormContent />
}

