'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useFormAutoSave, useConditionalRedirect, type RedirectRule } from '@/hooks/useFormFeatures'

interface QuestionOption {
  id: string
  text: string
  points: number
  counter_target?: number | null
  validation_type?: string
  validation_category?: string
  validation_value?: string
  validation_min?: string
  validation_max?: string
}

interface VisibilityRule {
  question_id: string
  operator: string
  value: string
}

interface Question {
  id: string
  text: string
  type: string
  required: boolean
  points: number
  has_counter?: boolean
  options: any
  order_index: number
  row_group?: number | null
  page?: number
  visibility_rules?: VisibilityRule[]
}

interface Form {
  id: string
  name: string
  description: string
  project_id: string
  allow_multiple: boolean
  time_limit?: number | null
  expires_at?: string | null
  allow_delete_responses?: boolean
  randomize_questions?: boolean
  redirect_rules?: RedirectRule[]
  default_redirect_url?: string
  enable_auto_save?: boolean
  page_titles?: Record<string, string>
}

interface Project {
  id: string
  name: string
  color: string
}

interface FormFillerProps {
  form: Form
  questions: Question[]
  existingResponse: any
  allUserResponses: any[]
  project: Project | null
  userId: string | null
  isPreview?: boolean
}

function getRespondentId(): string {
  // Get or generate a unique ID for anonymous users (stored in localStorage)
  const key = 'jotform_respondent_id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}

const getThemeSettings = (form: any) => {
  const ts = form?.page_titles?.theme_settings
  if (!ts) return null
  if (typeof ts === 'string') {
    try { return JSON.parse(ts) } catch { return null }
  }
  return ts
}

export default function FormFiller({ form, questions, existingResponse: propExistingResponse, allUserResponses: propAllUserResponses, project, userId, isPreview = false }: FormFillerProps) {
  const theme = getThemeSettings(form)
  const [answers, setAnswers] = useState<Record<string, any>>({})

  const renderThemeStyles = () => {
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
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [showRetryConfirm, setShowRetryConfirm] = useState(false)
  const [deletingResponse, setDeletingResponse] = useState(false)
  const [dropdownSearch, setDropdownSearch] = useState<Record<string, string>>({})
  const [dropdownOpen, setDropdownOpen] = useState<Record<string, boolean>>({})
  const [existingResponse, setExistingResponse] = useState(propExistingResponse)
  const [allUserResponses, setAllUserResponses] = useState(propAllUserResponses)
  const [loadingExisting, setLoadingExisting] = useState(false)
  const [draftRestored, setDraftRestored] = useState(false)
  const [draftDismissed, setDraftDismissed] = useState(false)
  const [redirectMessage, setRedirectMessage] = useState<string | null>(null)

  // Appointment calendar state
  const [apptMonth, setApptMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const [bookedSlots, setBookedSlots] = useState<Record<string, Record<string, string[]>>>({})

  // Date range calendar state
  const [dateRangeMonth, setDateRangeMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  const router = useRouter()
  const supabase = createClient()

  const scrollToTop = () => {
    if (isPreview) {
      const container = document.getElementById('preview-device-content')
      if (container) {
        container.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Auto-Save & Conditional Redirect hooks
  const autoSave = useFormAutoSave(form.id)
  const { evaluate: evaluateRedirect } = useConditionalRedirect()

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [displayQuestions, setDisplayQuestions] = useState<Question[]>([]);
  const [isExpired, setIsExpired] = useState(false);

  // Extract visibility_rules from question (may be in q.visibility_rules or inside options._visibility_rules)
  const getVisibilityRules = (q: any): VisibilityRule[] | undefined => {
    if (q.visibility_rules && q.visibility_rules.length > 0) return q.visibility_rules
    if (typeof q.options === 'string') {
      try {
        const opts = JSON.parse(q.options)
        if (opts && opts._visibility_rules && opts._visibility_rules.length > 0) return opts._visibility_rules
      } catch { return undefined }
    } else if (q.options && q.options._visibility_rules && q.options._visibility_rules.length > 0) {
      return q.options._visibility_rules
    }
    return undefined
  }

  // Conditional logic: compute visible questions based on visibility rules
  const visibleQuestions = useMemo(() => {
    return displayQuestions.filter(q => {
      const rules = getVisibilityRules(q)
      if (!rules || rules.length === 0) return true
      return rules.every(rule => {
        const triggerAnswer = answers[rule.question_id]
        if (triggerAnswer === undefined || triggerAnswer === null || triggerAnswer === '') return false
        const ansStr = String(
          typeof triggerAnswer === 'object' && triggerAnswer !== null
            ? (triggerAnswer as any).option_id || ''
            : triggerAnswer
        )
        switch (rule.operator) {
          case 'equals': return ansStr === rule.value
          case 'not_equals': return ansStr !== rule.value
          case 'contains': return ansStr.includes(rule.value)
          case 'greater_than': return Number(ansStr) > Number(rule.value)
          case 'less_than': return Number(ansStr) < Number(rule.value)
          default: return false
        }
      })
    })
  }, [displayQuestions, answers])

  // Multi-page computation (based on visible questions only)
  const pages = Array.from(new Set(visibleQuestions.map(q => q.page || 1))).sort((a, b) => a - b)
  const totalPages = pages.length
  const pageQuestions = visibleQuestions.filter(q => (q.page || 1) === currentPage)
  const pageIndex = pages.indexOf(currentPage)
  const isFirstPage = pageIndex <= 0
  const isLastPage = pageIndex >= totalPages - 1

  useEffect(() => {
    // Check expiration
    if (form.expires_at) {
      if (new Date() > new Date(form.expires_at)) {
        setIsExpired(true);
        return;
      }
    }

    // Set Timer
    if (form.time_limit && !submitted) {
      setTimeLeft(form.time_limit * 60);
    }

    // Set Questions (randomized or normal)
    if (form.randomize_questions) {
      const shuffled = [...questions].sort(() => 0.5 - Math.random());
      setDisplayQuestions(shuffled);
    } else {
      setDisplayQuestions(questions);
    }

    // Load draft from localStorage if auto-save is enabled
    if (!isPreview && form.enable_auto_save !== false && autoSave.hasDraft()) {
      const draft = autoSave.loadDraft()
      if (Object.keys(draft).length > 0) {
        setAnswers(draft)
        setDraftRestored(true)
      }
    }
  }, [form, questions]);

  // For anonymous users: load existing responses by respondent_id
  useEffect(() => {
    if (isPreview || userId || existingResponse || form.allow_multiple) return

    const loadAnonymousResponses = async () => {
      setLoadingExisting(true)
      try {
        const rid = getRespondentId()
        const { data } = await supabase
          .from('form_responses')
          .select('*')
          .eq('form_id', form.id)
          .eq('respondent_id', rid)
          .order('submitted_at', { ascending: false })

        if (data && data.length > 0) {
          setExistingResponse(data[0])
          setAllUserResponses(data)
          if (!form.allow_multiple) {
            setSubmitted(true)
          }
        }
      } finally {
        setLoadingExisting(false)
      }
    }

    loadAnonymousResponses()
  }, [userId, form.id, form.allow_multiple])

  // Fetch existing appointment bookings for availability filtering
  useEffect(() => {
    const apptQuestions = displayQuestions.filter(q => q.type === 'appointment')
    if (apptQuestions.length === 0) return

    const fetchBookings = async () => {
      const { data } = await supabase
        .from('form_responses')
        .select('answers')
        .eq('form_id', form.id)

      if (data) {
        const slots: Record<string, Record<string, string[]>> = {}
        for (const row of data) {
          const answersObj = row.answers as Record<string, any> || {}
          for (const q of apptQuestions) {
            const ans = answersObj[q.id]
            if (ans?.date && ans?.time) {
              if (!slots[q.id]) slots[q.id] = {}
              if (!slots[q.id][ans.date]) slots[q.id][ans.date] = []
              if (!slots[q.id][ans.date].includes(ans.time)) {
                slots[q.id][ans.date].push(ans.time)
              }
            }
          }
        }
        setBookedSlots(slots)
      }
    }

    fetchBookings()
  }, [form.id, displayQuestions])

  useEffect(() => {
    if (timeLeft === null || submitted || isExpired) return;
    
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitted, isExpired]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const goToNextPage = () => {
    const currentQs = displayQuestions.filter(q => (q.page || 1) === currentPage)
    for (const q of currentQs) {
      if (q.type === 'matrix') {
        const matrixData = parseMatrixData(q)
        if (matrixData) {
          const rows = matrixData.matrix_rows || []
          const rowAnswers = answers[q.id] || {}
          for (const row of rows) {
            if (row.required) {
              const rowVal = rowAnswers[row.id]
              if (!rowVal || (Array.isArray(rowVal) && rowVal.length === 0)) {
                setError(`يرجى الإجابة على الصف "${row.text}" في السؤال: ${q.text}`)
                return
              }
            }
          }
        }
      } else if (q.required) {
        const answer = answers[q.id]
        if (answer === undefined || answer === null || answer === '' || 
            (Array.isArray(answer) && answer.length === 0)) {
          setError(`يرجى الإجابة على السؤال: ${q.text}`)
          return
        }
      }
    }
    setError('')
    const pgs = Array.from(new Set(displayQuestions.map(q => q.page || 1))).sort((a, b) => a - b)
    const idx = pgs.indexOf(currentPage)
    if (idx < pgs.length - 1) {
      setCurrentPage(pgs[idx + 1])
      scrollToTop()
    }
  }

  const goToPrevPage = () => {
    setError('')
    const pgs = Array.from(new Set(displayQuestions.map(q => q.page || 1))).sort((a, b) => a - b)
    const idx = pgs.indexOf(currentPage)
    if (idx > 0) {
      setCurrentPage(pgs[idx - 1])
      scrollToTop()
    }
  }

  // Parse options if they're stringified JSON
  const parseOptions = (options: any) => {
    if (!options) return []
    if (typeof options === 'string') {
      try {
        return JSON.parse(options)
      } catch {
        return options
      }
    }
    return options
  }

  // Delete old response to allow re-submission
  const deleteOldResponse = async () => {
    if (!existingResponse?.id) return false
    
    setDeletingResponse(true)
    try {
      const { error } = await supabase
        .from('form_responses')
        .delete()
        .eq('id', existingResponse.id)
      
      if (error) throw error
      return true
    } catch (err) {
      console.error('Error deleting response:', err)
      return false
    } finally {
      setDeletingResponse(false)
    }
  }

  // Handle retry with confirmation
  const handleRetry = async () => {
    if (existingResponse?.id) {
      // Delete old response first
      const deleted = await deleteOldResponse()
      if (!deleted) {
        setError('فشل في حذف الإجابة السابقة')
        return
      }
    }
    setSubmitted(false)
    setAnswers({})
    setShowRetryConfirm(false)
  }

  const getQuestionMaxScore = (q: Question): number => {
    const opts = parseOptions(q.options)

    switch (q.type) {
      case 'text':
      case 'textarea':
        return q.points || 0
      case 'single_choice':
        return Math.max(0, ...(Array.isArray(opts) ? opts : []).map((o: any) => o.points || 0))
      case 'multiple_choice':
        return (Array.isArray(opts) ? opts : []).reduce((sum: number, o: any) => sum + (o.points || 0), 0)
      case 'dropdown':
        if (opts.dropdown_type === 'multiple') {
          return ((opts.correct_option_ids || []) as string[]).reduce((sum: number, id: string) => {
            const opt = (opts.options || []).find((o: any) => o.id === id)
            return sum + (opt?.points || 0)
          }, 0)
        }
        if (opts.correct_option_ids?.length) {
          const opt = (opts.options || []).find((o: any) => o.id === opts.correct_option_ids[0])
          return opt?.points || 0
        }
        return Math.max(0, ...(Array.isArray(opts) ? opts : []).map((o: any) => o.points || 0))
      case 'scale':
        return Math.max(10, ...(Array.isArray(opts) ? opts : []).map((o: any) => o.points || 0))
      case 'ranking':
        return (Array.isArray(opts) ? opts : []).reduce((sum: number, o: any) => sum + (o.points || 0), 0)
      case 'matrix': {
        const md = parseMatrixData(q)
        if (md) {
          const colSum = (md.matrix_columns || []).reduce((s: number, c: any) => s + (c.points || 0), 0)
          return colSum * (md.matrix_rows || []).length
        }
        return 0
      }
      default:
        return 0
    }
  }

  const parseMatrixData = (q: any) => {
    const options = parseOptions(q.options)
    if (options.matrix_rows && options.matrix_columns) return options
    if (options.length > 0 && options[0].sub_options) {
      return {
        matrix_rows: options.map((r: any) => ({ id: r.id, text: r.text, required: false })),
        matrix_columns: options[0].sub_options
      }
    }
    return null
  }

  const calculateScore = () => {
    let score = 0
    let maxScore = 0

    visibleQuestions.forEach((q) => {
      const answer = answers[q.id]
      const options = parseOptions(q.options)

      if (q.type === 'matrix') {
        const matrixData = parseMatrixData(q)
        if (matrixData) {
          maxScore += (matrixData.matrix_columns || []).reduce((sum: number, col: any) => sum + (col.points || 0), 0) * (matrixData.matrix_rows || []).length
          const rowAnswers = answer || {}
          Object.values(rowAnswers).forEach((val: any) => {
            if (Array.isArray(val)) {
              val.forEach((colId: string) => {
                const col = (matrixData.matrix_columns || []).find((c: any) => c.id === colId)
                if (col) score += col.points || 0
              })
            } else if (val) {
              const col = (matrixData.matrix_columns || []).find((c: any) => c.id === val)
              if (col) score += col.points || 0
            }
          })
        }
        return
      }

      // Compute maxScore (always, regardless of answer)
      if (q.type === 'text' || q.type === 'textarea') {
        maxScore += q.points || 0
      } else if (q.type === 'single_choice') {
        maxScore += Math.max(0, ...(Array.isArray(options) ? options : []).map((o: any) => o.points || 0))
      } else if (q.type === 'multiple_choice') {
        maxScore += (Array.isArray(options) ? options : []).reduce((sum: number, o: any) => sum + (o.points || 0), 0)
      } else if (q.type === 'ranking') {
        maxScore += (Array.isArray(options) ? options : []).reduce((sum: number, o: any) => sum + (o.points || 0), 0)
      } else if (q.type === 'scale') {
        maxScore += Math.max(10, ...(Array.isArray(options) ? options : []).map((o: any) => o.points || 0))
      } else if (q.type === 'dropdown') {
        const dropOpts = options.options || options
        if (Array.isArray(dropOpts)) {
          if (options.dropdown_type === 'multiple') {
            maxScore += ((options.correct_option_ids || []) as string[]).reduce((sum: number, id: string) => {
              const opt = dropOpts.find((o: any) => o.id === id)
              return sum + (opt?.points || 0)
            }, 0)
          } else if (options.correct_option_ids?.length) {
            const opt = dropOpts.find((o: any) => o.id === options.correct_option_ids[0])
            maxScore += opt?.points || 0
          } else {
            maxScore += Math.max(0, ...dropOpts.map((o: any) => o.points || 0))
          }
        }
      }

      if (answer === undefined || answer === null || answer === '') return

      if (q.type === 'single_choice' && options.length > 0) {
          const optId = typeof answer === 'object' ? (answer as any).option_id : answer
          const mainOption = options.find((opt: any) => opt.id === optId)
          if (mainOption) {
            if (q.has_counter && mainOption.counter_target) {
              const count = typeof answer === 'object' ? ((answer as any).count || 0) : 0
              if (count >= mainOption.counter_target) {
                score += mainOption.points || 0
              }
            } else {
              score += mainOption.points || 0
            }
          }
        } else if (q.type === 'multiple_choice' && options.length > 0 && Array.isArray(answer)) {
          answer.forEach((selectedId: string) => {
            const mainOption = options.find((opt: any) => opt.id === selectedId)
            if (mainOption) {
              score += mainOption.points || 0
            }
          })
        
        } else if (q.type === 'dropdown' && options.dropdown_type === 'multiple' && Array.isArray(answer)) {
          const dropOpts = options.options || []
          answer.forEach((id: string) => {
            const opt = dropOpts.find((o: any) => o.id === id)
            if (opt && (options.correct_option_ids || []).includes(id)) {
              score += opt.points || 0
            }
          })
        } else if (q.type === 'ranking' && Array.isArray(answer) && Array.isArray(options)) {
          answer.forEach((optId: string, pos: number) => {
            const correctOptAtPos = options[pos]
            if (correctOptAtPos && optId === correctOptAtPos.id) {
              score += correctOptAtPos.points || 0
            }
          })
        } else if (q.type === 'scale') {
          score += parseFloat(String(answer)) || 0
        } else if (q.type === 'text' || q.type === 'textarea') {
          score += String(answer).trim() ? (q.points || 0) : 0
        }
      })

    return { score, maxScore }
  }

  // Auto-save answers with debounce
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (isPreview) return
    if (form.enable_auto_save === false) return
    if (Object.keys(answers).length === 0) return

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      autoSave.saveDraft(answers)
    }, 1000) // 1-second debounce

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [answers])

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')

    // Validate required questions (visible only)
    for (const q of visibleQuestions) {
      if (q.type === 'matrix') {
        const matrixData = parseMatrixData(q)
        if (matrixData) {
          const rows = matrixData.matrix_rows || []
          const rowAnswers = answers[q.id] || {}
          for (const row of rows) {
            if (row.required) {
              const rowVal = rowAnswers[row.id]
              if (!rowVal || (Array.isArray(rowVal) && rowVal.length === 0)) {
                setError(`يرجى الإجابة على الصف "${row.text}" في السؤال: ${q.text}`)
                setSubmitting(false)
                return
              }
            }
          }
        }
      } else {
        const answer = answers[q.id]
        if (q.required && (answer === undefined || answer === null || answer === '' || 
            (Array.isArray(answer) && answer.length === 0))) {
          setError(`يرجى الإجابة على السؤال: ${q.text}`)
          setSubmitting(false)
          return
        }

        // Appointment: validate both date and time
        if (q.type === 'appointment') {
          const appt = typeof answer === 'object' ? answer as any : {}
          if (!appt.date || !appt.time) {
            setError(`يرجى اختيار التاريخ والوقت في السؤال: ${q.text}`)
            setSubmitting(false); return
          }
        }

        // Text Validation
        if (q.type === 'text' && answer !== undefined && answer !== null && answer !== '') {
          const opts: any[] = parseOptions(q.options)
          const meta = opts[0] || {}
          const vcat = meta.validation_category || ''
          const vt = meta.validation_type || ''
          const val = String(answer).trim()
          const vValue = meta.validation_value || ''
          const vMin = meta.validation_min || ''
          const vMax = meta.validation_max || ''

          if (vcat === 'name' || vt === 'name') {
             const requiredWords = parseInt(vValue) || 2;
             const words = val.split(/\s+/).filter(w => w.length > 0);
             if (words.length < requiredWords) {
               setError(`⚠️ "${q.text}" يجب أن يتكون من ${requiredWords} كلمات على الأقل (اسم ${vValue === '2' ? 'ثنائي' : vValue === '3' ? 'ثلاثي' : 'رباعي'}). مثال: "محمد أحمد"`);
               setSubmitting(false); return;
             }
          } else if (vt === 'email') {
             if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
               setError(`📧 "${q.text}" يرجى إدخال بريد إلكتروني صحيح. مثال: user@example.com`);
               setSubmitting(false); return;
             }
          } else if (vt === 'phone') {
             if (!/^[0-9\+\-\(\)\s]{8,20}$/.test(val)) {
               setError(`📞 "${q.text}" يرجى إدخال رقم هاتف صحيح. مثال: 0512345678`);
               setSubmitting(false); return;
             }
          } else if (vcat === 'number' || vt === 'is_number' || vt === 'whole_number' || vt === 'equal_to' || vt === 'not_equal_to' || vt === 'less_than' || vt === 'less_than_or_equal' || vt === 'greater_than' || vt === 'greater_than_or_equal' || vt === 'between' || vt === 'not_between') {
             if (vcat === 'number' || ['whole_number','is_number','equal_to','not_equal_to','less_than','less_than_or_equal','greater_than','greater_than_or_equal','between','not_between'].includes(vt)) {
               const num = Number(val);
               if (isNaN(num)) {
                 setError(`🔢 "${q.text}" يرجى إدخال أرقام فقط (مثال: 25)`);
                 setSubmitting(false); return;
               }
               if (vt === 'whole_number' && !Number.isInteger(num)) {
                 setError(`🔢 "${q.text}" يرجى إدخال رقم صحيح بدون كسور عشرية. مثال: 25`);
                 setSubmitting(false); return;
               }
               const numTarget = Number(vValue);
               if (vt === 'equal_to' && num !== numTarget) { setError(`🔢 "${q.text}" يجب أن يساوي ${numTarget}`); setSubmitting(false); return; }
               if (vt === 'not_equal_to' && num === numTarget) { setError(`🔢 "${q.text}" يجب ألا يساوي ${numTarget}`); setSubmitting(false); return; }
               if (vt === 'less_than' && num >= numTarget) { setError(`🔢 "${q.text}" يجب أن يكون أقل من ${numTarget}`); setSubmitting(false); return; }
               if (vt === 'less_than_or_equal' && num > numTarget) { setError(`🔢 "${q.text}" يجب أن يكون أقل من أو يساوي ${numTarget}`); setSubmitting(false); return; }
               if (vt === 'greater_than' && num <= numTarget) { setError(`🔢 "${q.text}" يجب أن يكون أكبر من ${numTarget}`); setSubmitting(false); return; }
               if (vt === 'greater_than_or_equal' && num < numTarget) { setError(`🔢 "${q.text}" يجب أن يكون أكبر من أو يساوي ${numTarget}`); setSubmitting(false); return; }
               if (vt === 'between' && (num < Number(vMin) || num > Number(vMax))) { setError(`🔢 "${q.text}" يجب أن يكون بين ${vMin} و ${vMax}`); setSubmitting(false); return; }
               if (vt === 'not_between' && (num >= Number(vMin) && num <= Number(vMax))) { setError(`🔢 "${q.text}" يجب ألا يكون بين ${vMin} و ${vMax}`); setSubmitting(false); return; }
             }
          }
          if (vcat === 'text_check') {
             if (vt === 'contains_word' && !val.includes(vValue)) { setError(`📝 "${q.text}" يجب أن يحتوي على "${vValue}"`); setSubmitting(false); return; }
             if (vt === 'does_not_contain' && val.includes(vValue)) { setError(`📝 "${q.text}" يجب ألا يحتوي على "${vValue}"`); setSubmitting(false); return; }
             if (vt === 'equal_to' && val !== vValue) { setError(`📝 "${q.text}" يجب أن يطابق "${vValue}" بالكامل`); setSubmitting(false); return; }
             if (vt === 'not_equal_to' && val === vValue) { setError(`📝 "${q.text}" يجب ألا يطابق "${vValue}"`); setSubmitting(false); return; }
          }
        }
      }
    }

    const { score, maxScore } = calculateScore()

    if (isPreview) {
      setTimeout(() => {
        setSubmitted(true)
        setSubmitting(false)
      }, 1000)
      return
    }

    try {
      // If allow_multiple is false and there's existing response, update it
      // Otherwise always insert a new response
      if (!form.allow_multiple && existingResponse) {
        const { error: updateError } = await supabase
          .from('form_responses')
          .update({
            score,
            max_score: maxScore,
            answers: answers,
            submitted_at: new Date().toISOString()
          })
          .eq('id', existingResponse.id)

        if (updateError) throw updateError
      } else {
        // Insert new response (for allow_multiple=true or no existing response)
        const insertData: any = {
          form_id: form.id,
          score,
          max_score: maxScore,
          answers
        }

        if (userId) {
          insertData.user_id = userId
        } else {
          insertData.respondent_id = getRespondentId()
        }

        const { error: insertError } = await supabase
          .from('form_responses')
          .insert(insertData)

        if (insertError) throw insertError
      }

      // Clear draft after successful submit
      autoSave.clearDraft()

      // Evaluate conditional redirect rules
      if (form.redirect_rules && form.redirect_rules.length > 0) {
        const { url, message } = evaluateRedirect(
          answers,
          form.redirect_rules,
          form.default_redirect_url
        )
        if (message) setRedirectMessage(message)
        if (url) {
          // Delay redirect briefly to let confetti / thank-you show
          setTimeout(() => { window.location.href = url }, 2500)
        }
      } else if (form.default_redirect_url) {
        setTimeout(() => { window.location.href = form.default_redirect_url! }, 2500)
      }

      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ الإجابات')
    } finally {
      setSubmitting(false)
    }
  }

  // Appointment calendar utility functions
  const ARABIC_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
  const ARABIC_DAYS = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س']

  function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate()
  }

  function getFirstDayOfMonth(year: number, month: number) {
    return new Date(year, month, 1).getDay()
  }

  function formatArabicTime(time24: string) {
    const parts = time24.split(':')
    const h = parseInt(parts[0]) || 0
    const m = parts[1] || '00'
    if (h === 0) return `12:${m} صباحاً`
    if (h < 12) return `${h}:${m} صباحاً`
    if (h === 12) return `12:${m} مساءاً`
    return `${h - 12}:${m} مساءاً`
  }

  function isDateFullyBooked(dateStr: string, questionId: string, timeSlots: string[]) {
    const qSlots = bookedSlots[questionId]
    if (!qSlots || !qSlots[dateStr]) return false
    return timeSlots.every(slot => qSlots[dateStr].includes(slot))
  }

  function getAvailableTimeSlots(dateStr: string, questionId: string, timeSlots: string[]) {
    const qSlots = bookedSlots[questionId]
    if (!qSlots || !qSlots[dateStr]) return timeSlots
    return timeSlots.filter(slot => !qSlots[dateStr].includes(slot))
  }

  function isSameDay(d1: Date, d2: Date) {
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()
  }

  const renderAppointmentCalendar = (question: Question, currentAnswer: any, apptObj: any, timeSlots: string[]) => {
    const today = new Date()
    const { year, month } = apptMonth
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)
    const monthName = ARABIC_MONTHS[month]
    const questionId = question.id

    const prevMonth = () => {
      if (month === 0) setApptMonth({ year: year - 1, month: 11 })
      else setApptMonth({ year, month: month - 1 })
    }

    const nextMonth = () => {
      if (month === 11) setApptMonth({ year: year + 1, month: 0 })
      else setApptMonth({ year, month: month + 1 })
    }

    const handleDateSelect = (date: Date) => {
      const y = date.getFullYear()
      const m = date.getMonth()
      const d = date.getDate()
      const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const dateOnly = new Date(y, m, d)
      dateOnly.setHours(0, 0, 0, 0)
      if (dateOnly < new Date(today.getFullYear(), today.getMonth(), today.getDate())) return
      // Sync calendar view to the selected date's month
      setApptMonth({ year: y, month: m })
      setAnswers({ ...answers, [question.id]: { date: dateStr, time: '' } })
    }

    const goNextDay = () => {
      const currentDate = apptObj.date ? new Date(apptObj.date + 'T00:00:00') : new Date()
      currentDate.setDate(currentDate.getDate() + 1)
      const y = currentDate.getFullYear()
      const m = currentDate.getMonth()
      const d = currentDate.getDate()
      const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      // Auto-navigate calendar month to match
      setApptMonth({ year: y, month: m })
      setAnswers({ ...answers, [question.id]: { date: dateStr, time: '' } })
    }

    const goPrevDay = () => {
      const currentDate = apptObj.date ? new Date(apptObj.date + 'T00:00:00') : new Date()
      currentDate.setDate(currentDate.getDate() - 1)
      const y = currentDate.getFullYear()
      const m = currentDate.getMonth()
      const d = currentDate.getDate()
      const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const dateOnly = new Date(y, m, d)
      dateOnly.setHours(0, 0, 0, 0)
      if (dateOnly < new Date(today.getFullYear(), today.getMonth(), today.getDate())) return
      setApptMonth({ year: y, month: m })
      setAnswers({ ...answers, [question.id]: { date: dateStr, time: '' } })
    }

    // Calendar grid
    const prevMonthDays: number[] = []
    for (let i = 0; i < firstDay; i++) {
      prevMonthDays.push(i)
    }

    const calendarDays: ({ day: number; isCurrentMonth: boolean; date: Date })[] = []
    // Days from previous month
    const prevMonthDaysCount = getDaysInMonth(month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1)
    for (const i of prevMonthDays) {
      const d = prevMonthDaysCount - firstDay + i + 1
      const prevM = month === 0 ? 11 : month - 1
      const prevY = month === 0 ? year - 1 : year
      calendarDays.push({ day: d, isCurrentMonth: false, date: new Date(prevY, prevM, d) })
    }
    // Days of current month
    for (let d = 1; d <= daysInMonth; d++) {
      calendarDays.push({ day: d, isCurrentMonth: true, date: new Date(year, month, d) })
    }
    // Days from next month
    const remaining = 42 - calendarDays.length
    for (let d = 1; d <= remaining; d++) {
      const nextM = month === 11 ? 0 : month + 1
      const nextY = month === 11 ? year + 1 : year
      calendarDays.push({ day: d, isCurrentMonth: false, date: new Date(nextY, nextM, d) })
    }

    const selectedDate = apptObj.date || ''
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())

    const availableSlots = apptObj.date ? getAvailableTimeSlots(apptObj.date, questionId, timeSlots) : []
    const allBooked = apptObj.date ? isDateFullyBooked(apptObj.date, questionId, timeSlots) : false

    return (
      <div className="space-y-4">
        {/* Day navigation */}
        {apptObj.date && (
          <div className="flex items-center justify-between bg-blue-50 rounded-xl px-4 py-2">
            <button type="button" onClick={goPrevDay} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-sm font-medium text-blue-700">
              {apptObj.date}
            </span>
            <button type="button" onClick={goNextDay} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        )}

        {/* Calendar header */}
        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
          <button type="button" onClick={prevMonth} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="text-sm font-bold text-gray-700">{monthName} {year}</span>
          <button type="button" onClick={nextMonth} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 gap-1">
          {ARABIC_DAYS.map((name, i) => (
            <div key={i} className="text-center text-xs font-bold text-gray-500 py-1">{name}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((cell, i) => {
            const y = cell.date.getFullYear()
            const m = cell.date.getMonth() + 1
            const d = cell.date.getDate()
            const cellDateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
            const dateOnly = new Date(y, m - 1, d)
            const isPast = dateOnly < todayStart
            const isToday = isSameDay(cell.date, today)
            const isSelected = selectedDate === cellDateStr
            const fullyBooked = cell.isCurrentMonth && !isPast && isDateFullyBooked(cellDateStr, questionId, timeSlots)
            const isDisabled = isPast || !cell.isCurrentMonth

            return (
              <button
                key={i}
                type="button"
                disabled={isDisabled}
                onClick={() => handleDateSelect(cell.date)}
                className={`
                  relative p-2 text-sm rounded-lg transition-all font-medium
                  ${!cell.isCurrentMonth ? 'text-gray-300' : ''}
                  ${isPast && cell.isCurrentMonth ? 'text-gray-300 cursor-not-allowed' : ''}
                  ${isToday && !isSelected && cell.isCurrentMonth ? 'bg-blue-100 text-blue-700' : ''}
                  ${isSelected && cell.isCurrentMonth ? 'bg-blue-600 text-white shadow-md' : ''}
                  ${fullyBooked && !isSelected ? 'bg-red-50 text-red-400 line-through' : ''}
                  ${!isDisabled && !isSelected && !fullyBooked ? 'hover:bg-blue-50 hover:text-blue-600 text-gray-700 cursor-pointer' : ''}
                `}
              >
                {d}
                {isToday && cell.isCurrentMonth && (
                  <span className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`} />
                )}
              </button>
            )
          })}
        </div>

        {/* Time slots */}
        {apptObj.date && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600">اختر الوقت</label>
              {allBooked && (
                <span className="text-xs text-red-500 font-medium">جميع المواعيد محجوزة لهذا اليوم</span>
              )}
            </div>
            {availableSlots.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {availableSlots.map((slot: string) => {
                  const isSelected = apptObj.time === slot
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setAnswers({ ...answers, [question.id]: { ...apptObj, time: slot } })}
                      className={`px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      {formatArabicTime(slot)}
                    </button>
                  )
                })}
              </div>
            ) : (
              !allBooked && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center text-sm text-gray-500">
                  لا توجد مواعيد متاحة
                </div>
              )
            )}
          </div>
        )}

        {/* Booking confirmation */}
        {apptObj.date && apptObj.time && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 text-sm text-green-700">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            تم اختيار الموعد: {apptObj.date} الساعة {formatArabicTime(apptObj.time)}
          </div>
        )}
      </div>
    )
  }

  const renderQuestion = (question: Question, index: number) => {
    const currentAnswer = answers[question.id]
    const options = parseOptions(question.options)

    switch (question.type) {
      case 'text': {
        const textOpts = (Array.isArray(options) && options.length === 0) ? {} : (Array.isArray(options) ? options[0] || {} : options || {});
        const vt = textOpts.validation_type || ''
        const vcat = textOpts.validation_category || ''
        const vval = textOpts.validation_value || ''
        const vmin = textOpts.validation_min || ''
        const vmax = textOpts.validation_max || ''

        const placeholderText = vcat === 'name'
          ? `الاسم ${vval === '2' ? 'ثنائي' : vval === '3' ? 'ثلاثي' : 'رباعي'} (${vval} كلمات)`
          : vt === 'email' ? 'example@domain.com'
          : vt === 'phone' ? '05X XXX XXXX'
          : vcat === 'number' ? 'أدخل رقماً'
          : vcat === 'text_check' ? `يجب ${vt === 'contains_word' ? 'أن يحتوي على' : vt === 'does_not_contain' ? 'ألا يحتوي على' : vt === 'equal_to' ? 'أن يساوي' : 'ألا يساوي'} "${vval}"`
          : 'اكتب إجابتك هنا...'

        const hintText = vcat === 'name'
          ? `يجب إدخال ${vval} كلمات على الأقل (اسم ${vval === '2' ? 'ثنائي' : vval === '3' ? 'ثلاثي' : 'رباعي'})`
          : vt === 'email' ? 'أدخل بريداً إلكترونياً صحيحاً'
          : vt === 'phone' ? 'أدخل رقم هاتف صحيح (مثال: 0512345678)'
          : vcat === 'number' && vt === 'whole_number' ? 'أرقام صحيحة فقط (بدون كسور)'
          : vcat === 'number' && vt === 'is_number' ? 'أرقام عشرية أو صحيحة'
          : vcat === 'number' && (vt === 'equal_to' || vt === 'not_equal_to' || vt === 'less_than' || vt === 'less_than_or_equal' || vt === 'greater_than' || vt === 'greater_than_or_equal') ? `يجب أن يكون ${vt === 'equal_to' ? 'مساوياً لـ' : vt === 'not_equal_to' ? 'غير مساوٍ لـ' : vt === 'less_than' ? 'أقل من' : vt === 'less_than_or_equal' ? 'أقل من أو يساوي' : vt === 'greater_than' ? 'أكبر من' : 'أكبر من أو يساوي'} ${vval}`
          : vcat === 'number' && (vt === 'between' || vt === 'not_between') ? `يجب أن ${vt === 'between' ? 'يكون بين' : 'لا يكون بين'} ${vmin} و ${vmax}`
          : vcat === 'text_check' ? `النص يجب ${vt === 'contains_word' ? 'أن يحتوي على' : vt === 'does_not_contain' ? 'ألا يحتوي على' : vt === 'equal_to' ? 'أن يساوي' : 'ألا يساوي'} "${vval}"`
          : ''

        return (
          <div>
            <input
              type={vt === 'email' ? 'email' : (vt === 'phone' ? 'tel' : (vcat === 'number' || vt === 'number' ? 'number' : 'text'))}
              maxLength={textOpts.validation_max ? parseInt(textOpts.validation_max) : undefined}
              value={currentAnswer || ''}
              onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={placeholderText}
              onFocus={() => setCurrentQuestionIndex(index)}
            />
            {hintText && (
              <p className="text-xs text-gray-500 mt-1.5 mr-1">{hintText}</p>
            )}
          </div>
        )
      }

      case 'textarea': {
        const textOpts = (Array.isArray(options) && options.length === 0) ? {} : (Array.isArray(options) ? options[0] || {} : options || {});
        return (
          <textarea
            maxLength={textOpts.maxLength || undefined}
            value={currentAnswer || ''}
            onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px]"
            placeholder="اكتب إجابتك هنا..."
            onFocus={() => setCurrentQuestionIndex(index)}
          />
        )
      }

      case 'single_choice':
        const answerObj = typeof currentAnswer === 'object' && currentAnswer !== null ? currentAnswer as any : null
        const selectedId = answerObj?.option_id || currentAnswer || ''
        const countVal = answerObj?.count || 0
        return (
          <div className="space-y-3">
            {(Array.isArray(options) ? options : []).map((option: any, idx: number) => {
              const optionId = option.id || `opt_${idx}`
              const isSelected = selectedId === optionId
              return (
                <div key={optionId}>
                  <label
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all form-themed-option ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 form-themed-option-selected'
                        : 'border-gray-200 hover:border-blue-300 form-themed-option-unselected'
                    }`}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={optionId}
                      checked={isSelected}
                      onChange={() => {
                        const val = question.has_counter ? { option_id: optionId, count: 0 } : optionId
                        setAnswers({ ...answers, [question.id]: val })
                        setCurrentQuestionIndex(index)
                      }}
                      className="w-5 h-5 text-blue-600"
                    />
                    <span className="flex-1 font-medium">{option.text}</span>
                    {option.counter_target && (
                      <span className="text-xs text-gray-400">الهدف: {option.counter_target}</span>
                    )}
                  </label>
                  {question.has_counter && isSelected && option.counter_target && (
                    <div className="mt-3 mr-12 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                      <p className="text-xs text-emerald-600 mb-3 text-center font-medium">{option.text}</p>
                      <div className="flex items-center justify-center gap-6">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            const count = (answerObj?.count || 0) + 1
                            setAnswers({ ...answers, [question.id]: { option_id: selectedId, count } })
                          }}
                          className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-2xl font-bold hover:bg-emerald-200 transition-colors shadow-sm"
                        >
                          +
                        </button>
                        <div className="text-center">
                          <div className="text-4xl font-bold text-emerald-700 min-w-[80px]">{countVal}</div>
                          <div className="text-xs text-emerald-500 mt-1">
                            / {option.counter_target}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            const count = Math.max(0, (answerObj?.count || 0) - 1)
                            setAnswers({ ...answers, [question.id]: { option_id: selectedId, count } })
                          }}
                          className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl font-bold hover:bg-red-200 transition-colors shadow-sm"
                        >
                          −
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )

      case 'multiple_choice':
        return (
          <div className="space-y-3">
            {(Array.isArray(options) ? options : []).map((option: any, idx: number) => {
              const optionId = option.id || `opt_${idx}`
              const selected = Array.isArray(currentAnswer) ? currentAnswer : []
              const isSelected = selected.includes(optionId)
              return (
                <div key={optionId}>
                  <label
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all form-themed-option ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 form-themed-option-selected'
                        : 'border-gray-200 hover:border-blue-300 form-themed-option-unselected'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const newAnswers = Array.isArray(currentAnswer) ? [...currentAnswer] : []
                        if (e.target.checked) {
                          newAnswers.push(optionId)
                        } else {
                          const idx = newAnswers.indexOf(optionId)
                          if (idx > -1) newAnswers.splice(idx, 1)
                        }
                        setAnswers({ ...answers, [question.id]: newAnswers })
                        setCurrentQuestionIndex(index)
                      }}
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                    <span className="flex-1 font-medium">{option.text}</span>
                  </label>
                </div>
              )
            })}
          </div>
        )

      case 'scale':
        const maxScale = options.length > 0 ? options.length : 5
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              {Array.from({ length: maxScale }, (_, i) => i + 1).map((num) => {
                const scaleOption = options.find((o: any) => o.text === String(num))
                const points = scaleOption?.points || num
                
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setAnswers({ ...answers, [question.id]: points })
                      setCurrentQuestionIndex(index)
                    }}
                    className={`w-12 h-12 rounded-xl font-bold transition-all form-themed-option ${
                      currentAnswer === points
                        ? 'bg-blue-600 text-white form-themed-primary-bg'
                        : 'bg-gray-100 text-gray-600 hover:bg-blue-100 form-themed-option-unselected'
                    }`}
                  >
                    {num}
                  </button>
                )
              })}
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>ضعيف</span>
              <span>ممتاز</span>
            </div>
          </div>
        )

      case 'ranking':
        const rankingItems = Array.isArray(currentAnswer) && currentAnswer.length === options.length
          ? currentAnswer
          : (Array.isArray(options) ? options : []).map((o: any) => o.id)
        
        return (
          <div className="space-y-2 text-sm text-gray-500">
            <p>ترتيب العناصر (استخدم الأسهم لإعادة الترتيب)</p>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              {rankingItems.map((optId: string, idx: number) => {
                const option = options.find((o: any) => o.id === optId)
                if (!option) return null
                return (
                  <div key={optId} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                    <span className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </span>
                    <span className="flex-1 font-medium">{option.text}</span>
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (idx > 0) {
                            const newArr = [...rankingItems]
                            const temp = newArr[idx - 1]
                            newArr[idx - 1] = newArr[idx]
                            newArr[idx] = temp
                            setAnswers({ ...answers, [question.id]: newArr })
                          }
                        }}
                        disabled={idx === 0}
                        className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-400"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (idx < rankingItems.length - 1) {
                            const newArr = [...rankingItems]
                            const temp = newArr[idx + 1]
                            newArr[idx + 1] = newArr[idx]
                            newArr[idx] = temp
                            setAnswers({ ...answers, [question.id]: newArr })
                          }
                        }}
                        disabled={idx === rankingItems.length - 1}
                        className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-400"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )

      case 'matrix':
        const matrixData = parseMatrixData(question)
        const matrixRows = matrixData?.matrix_rows || []
        const matrixCols = matrixData?.matrix_columns || []
        
        if (matrixCols.length === 0) {
          return <p className="text-gray-500 text-sm">لم يتم تحديد الأعمدة بعد</p>
        }

        return (
          <div className="space-y-3 overflow-x-auto">
            <div className="bg-gray-50 rounded-xl p-4 min-w-[500px]">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr>
                    <th className="p-2 border-b border-gray-200"></th>
                    {matrixCols.map((col: any) => (
                      <th key={col.id} className="p-2 border-b border-gray-200 text-sm font-medium text-gray-600 text-center">
                        {col.text}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrixRows.map((row: any, rIdx: number) => (
                    <tr key={row.id || rIdx} className="border-b border-gray-100 last:border-0 hover:bg-gray-100/50">
                      <td className="p-3 text-sm font-medium">{row.text}</td>
                      {matrixCols.map((col: any) => (
                        <td key={col.id} className="p-3 text-center">
                          <input
                            type="checkbox"
                            name={`${question.id}_${row.id}`}
                            checked={Array.isArray(currentAnswer?.[row.id]) ? currentAnswer[row.id].includes(col.id) : currentAnswer?.[row.id] === col.id}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              let rowAns = currentAnswer?.[row.id] || [];
                              if (!Array.isArray(rowAns)) rowAns = [rowAns];
                              
                              if (isChecked) {
                                rowAns = [...rowAns, col.id];
                              } else {
                                rowAns = rowAns.filter((id: any) => id !== col.id);
                              }
                              
                              setAnswers({
                                ...answers,
                                [question.id]: {
                                  ...currentAnswer,
                                  [row.id]: rowAns
                                }
                              })
                            }}
                            className="w-4 h-4 text-blue-600"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )

      case 'dropdown': {
        const searchText = dropdownSearch[question.id] || ''
        const opts = options.options || options
        const isMulti = options.dropdown_type === 'multiple'
        const filteredOptions = (Array.isArray(opts) ? opts : []).filter(
          (opt: any) => !searchText || opt.text.toLowerCase().includes(searchText.toLowerCase())
        )

        if (isMulti) {
          const selected = Array.isArray(currentAnswer) ? currentAnswer : []
          return (
            <div className="space-y-3">
              <div className="relative">
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setDropdownSearch(prev => ({ ...prev, [question.id]: e.target.value }))}
                  placeholder="ابحث عن خيار..."
                  className="w-full pr-10 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-2">
                {filteredOptions.map((opt: any) => (
                  <label key={opt.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selected.includes(opt.id) ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}`}>
                    <input
                      type="checkbox"
                      checked={selected.includes(opt.id)}
                      onChange={(e) => {
                        const newVal = e.target.checked
                          ? [...selected, opt.id]
                          : selected.filter((id: string) => id !== opt.id)
                        setAnswers({ ...answers, [question.id]: newVal })
                      }}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="flex-1 text-sm">{opt.text}</span>
                  </label>
                ))}
                {filteredOptions.length === 0 && <p className="text-gray-400 text-sm text-center py-4">لا توجد نتائج</p>}
              </div>
            </div>
          )
        }

        const isOpen = dropdownOpen[question.id] || false

        const selectedOpt = opts.find((o: any) => o.id === currentAnswer)

        return (
          <div className="space-y-2 relative">
            <div className="relative">
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchText || (selectedOpt?.text || '')}
                onFocus={() => setDropdownOpen(prev => ({ ...prev, [question.id]: true }))}
                onBlur={() => setTimeout(() => setDropdownOpen(prev => ({ ...prev, [question.id]: false })), 200)}
                onChange={(e) => {
                  setDropdownSearch(prev => ({ ...prev, [question.id]: e.target.value }))
                  if (!isOpen) setDropdownOpen(prev => ({ ...prev, [question.id]: true }))
                }}
                placeholder="ابحث أو اختر..."
                className="w-full pr-10 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {isOpen && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {filteredOptions.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">لا توجد نتائج</p>
                ) : (
                  filteredOptions.map((opt: any) => (
                    <button
                      key={opt.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        setAnswers({ ...answers, [question.id]: opt.id })
                        setDropdownSearch(prev => ({ ...prev, [question.id]: '' }))
                        setDropdownOpen(prev => ({ ...prev, [question.id]: false }))
                      }}
                      className={`w-full text-right px-4 py-3 text-sm hover:bg-blue-50 transition-colors flex items-center gap-3 ${
                        currentAnswer === opt.id ? 'bg-blue-50 font-medium text-blue-700' : ''
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center border-gray-300">
                        {currentAnswer === opt.id && <span className="w-2 h-2 rounded-full bg-blue-600" />}
                      </span>
                      {opt.text}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )
      }

      case 'date':
        return (
          <input
            type="date"
            value={currentAnswer || ''}
            onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        )

      case 'time':
        return (
          <input
            type="time"
            value={currentAnswer || ''}
            onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        )

      case 'appointment': {
        const apptVal = currentAnswer || {}
        const apptObj = typeof apptVal === 'object' ? apptVal as any : {}
        const timeSlots: string[] = (Array.isArray(options) ? options : []).map((o: any) => o.text).filter(Boolean)
        return renderAppointmentCalendar(question, currentAnswer, apptObj, timeSlots)
      }

      case 'file_upload':
        return (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <svg className="w-12 h-12 mx-auto mb-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-amber-700 font-medium">هذه الميزة قيد التطوير</p>
            <p className="text-amber-600 text-sm mt-1">سيتم تفعيل رفع الملفات قريباً</p>
          </div>
        )
      case 'static_text':
        return (
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-6 text-gray-700 whitespace-pre-wrap">
            {question.text || 'نص توضيحي'}
          </div>
        )

      case 'static_image':
        const imageUrl = parseOptions(question.options)[0]?.validation_value || ''
        return (
          <div className="flex justify-center rounded-xl overflow-hidden bg-gray-50 border border-gray-100 p-2">
            {imageUrl ? (
              <img src={imageUrl} alt={question.text} className="max-w-full h-auto rounded-lg" />
            ) : (
              <div className="w-full py-12 flex flex-col items-center justify-center text-gray-400">
                <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>لم يتم تحديد صورة</p>
              </div>
            )}
          </div>
        )

      case 'divider':
        return (
          <div className="py-2">
            <hr className="border-t-2 border-gray-100" />
          </div>
        )

      case 'signature':
        return (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
            <input
              type="text"
              value={currentAnswer || ''}
              onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
              className="w-full bg-transparent text-center font-['Brush_Script_MT',_cursive] text-2xl outline-none"
              placeholder="اكتب توقيعك هنا..."
            />
            <div className="w-full h-px bg-gray-300 mt-2"></div>
            <p className="text-xs text-gray-400 mt-2">قم بكتابة اسمك للتوقيع</p>
          </div>
        )

      case 'star_rating':
        const stars = Array.isArray(options) && options.length > 0 ? options.length : 5
        return (
          <div className="flex items-center justify-center gap-2" dir="ltr">
            {Array.from({ length: stars }).map((_, i) => {
              const num = i + 1
              const isSelected = currentAnswer && Number(currentAnswer) >= num
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => setAnswers({ ...answers, [question.id]: num })}
                  className={`p-2 transition-transform hover:scale-110 focus:outline-none ${isSelected ? 'text-yellow-400' : 'text-gray-200 hover:text-yellow-200'}`}
                >
                  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              )
            })}
          </div>
        )

      case 'terms':
        return (
          <div className="space-y-3">
            <div className="max-h-40 overflow-y-auto bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {question.text || 'نص الشروط والأحكام'}
            </div>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={!!currentAnswer}
                onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.checked ? 'agreed' : '' })}
                className="w-5 h-5 text-blue-600 rounded cursor-pointer"
              />
              <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors">
                أوافق على الشروط والأحكام المذكورة أعلاه
              </span>
            </label>
          </div>
        )

      case 'date_range': {
        const rangeVal = currentAnswer || {}
        const rangeObj = typeof rangeVal === 'object' ? rangeVal as any : {}
        const today = new Date()
        const { year, month } = dateRangeMonth
        const daysInMonth = getDaysInMonth(year, month)
        const firstDay = getFirstDayOfMonth(year, month)
        const monthName = ARABIC_MONTHS[month]

        const prevMonth = () => {
          if (month === 0) setDateRangeMonth({ year: year - 1, month: 11 })
          else setDateRangeMonth({ year, month: month - 1 })
        }

        const nextMonth = () => {
          if (month === 11) setDateRangeMonth({ year: year + 1, month: 0 })
          else setDateRangeMonth({ year, month: month + 1 })
        }

        const handleRangeDate = (date: Date) => {
          const y = date.getFullYear()
          const m = date.getMonth()
          const d = date.getDate()
          const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
          const dateOnly = new Date(y, m, d)
          dateOnly.setHours(0, 0, 0, 0)
          if (dateOnly < new Date(today.getFullYear(), today.getMonth(), today.getDate())) return

          if (!rangeObj.from || (rangeObj.from && rangeObj.to)) {
            // Start new range
            setAnswers({ ...answers, [question.id]: { from: dateStr, to: '' } })
          } else {
            // Set "to" date, ensure it's after "from"
            if (dateStr < rangeObj.from) {
              // If clicked date is before from, swap
              setAnswers({ ...answers, [question.id]: { from: dateStr, to: rangeObj.from } })
            } else {
              setAnswers({ ...answers, [question.id]: { ...rangeObj, to: dateStr } })
            }
          }
        }

        const clearRange = () => {
          setAnswers({ ...answers, [question.id]: { from: '', to: '' } })
        }

        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())

        // Build calendar days
        const prevMonthDays: number[] = []
        for (let i = 0; i < firstDay; i++) prevMonthDays.push(i)

        const calendarDays: ({ day: number; isCurrentMonth: boolean; date: Date })[] = []
        const prevMonthDaysCount = getDaysInMonth(month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1)
        for (const i of prevMonthDays) {
          const d = prevMonthDaysCount - firstDay + i + 1
          const prevM = month === 0 ? 11 : month - 1
          const prevY = month === 0 ? year - 1 : year
          calendarDays.push({ day: d, isCurrentMonth: false, date: new Date(prevY, prevM, d) })
        }
        for (let d = 1; d <= daysInMonth; d++) {
          calendarDays.push({ day: d, isCurrentMonth: true, date: new Date(year, month, d) })
        }
        const remaining = 42 - calendarDays.length
        for (let d = 1; d <= remaining; d++) {
          const nextM = month === 11 ? 0 : month + 1
          const nextY = month === 11 ? year + 1 : year
          calendarDays.push({ day: d, isCurrentMonth: false, date: new Date(nextY, nextM, d) })
        }

        // Calculate day count
        let dayCount = 0
        if (rangeObj.from && rangeObj.to) {
          const fromD = new Date(rangeObj.from + 'T00:00:00')
          const toD = new Date(rangeObj.to + 'T00:00:00')
          dayCount = Math.round((toD.getTime() - fromD.getTime()) / 86400000)
        }

        const isInRange = (dateStr: string) => {
          if (!rangeObj.from || !rangeObj.to) return false
          return dateStr >= rangeObj.from && dateStr <= rangeObj.to
        }

        return (
          <div className="space-y-4">
            {/* Selected range display */}
            <div className="flex items-center justify-between bg-blue-50 rounded-xl px-4 py-3">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <span className="text-xs text-gray-500">من</span>
                  <p className="text-sm font-bold text-blue-700">{rangeObj.from || '—'}</p>
                </div>
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                <div className="text-center">
                  <span className="text-xs text-gray-500">إلى</span>
                  <p className="text-sm font-bold text-blue-700">{rangeObj.to || '—'}</p>
                </div>
              </div>
              {rangeObj.from && (
                <div className="flex items-center gap-2">
                  {dayCount > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">{dayCount} يوم</span>
                  )}
                  <button type="button" onClick={clearRange} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="مسح">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              )}
            </div>

            {/* Calendar header */}
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
              <button type="button" onClick={prevMonth} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <span className="text-sm font-bold text-gray-700">{monthName} {year}</span>
              <button type="button" onClick={nextMonth} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 gap-1">
              {ARABIC_DAYS.map((name, i) => (
                <div key={i} className="text-center text-xs font-bold text-gray-500 py-1">{name}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((cell, i) => {
                const y = cell.date.getFullYear()
                const m = cell.date.getMonth() + 1
                const d = cell.date.getDate()
                const cellDateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                const dateOnly = new Date(y, m - 1, d)
                const isPast = dateOnly < todayStart
                const isToday = isSameDay(cell.date, today)
                const isFrom = rangeObj.from === cellDateStr
                const isTo = rangeObj.to === cellDateStr
                const inRange = isInRange(cellDateStr)
                const isDisabled = isPast || !cell.isCurrentMonth

                return (
                  <button
                    key={i}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleRangeDate(cell.date)}
                    className={`
                      relative p-2 text-sm rounded-lg transition-all font-medium
                      ${!cell.isCurrentMonth ? 'text-gray-300' : ''}
                      ${isPast && cell.isCurrentMonth ? 'text-gray-300 cursor-not-allowed' : ''}
                      ${isToday && !isFrom && !isTo && cell.isCurrentMonth ? 'bg-blue-100 text-blue-700' : ''}
                      ${isFrom || isTo ? 'bg-blue-600 text-white shadow-md z-10' : ''}
                      ${inRange && !isFrom && !isTo ? 'bg-blue-100 text-blue-700' : ''}
                      ${isFrom && isTo ? 'ring-2 ring-blue-300' : ''}
                      ${!isDisabled && !isFrom && !isTo && !inRange ? 'hover:bg-blue-50 hover:text-blue-600 text-gray-700 cursor-pointer' : ''}
                    `}
                  >
                    {d}
                    {isToday && cell.isCurrentMonth && (
                      <span className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isFrom || isTo ? 'bg-white' : 'bg-blue-500'}`} />
                    )}
                  </button>
                )
              })}
            </div>

            {rangeObj.from && !rangeObj.to && (
              <p className="text-xs text-gray-500 text-center">اختر تاريخ النهاية لتحديد النطاق</p>
            )}
          </div>
        )
      }

      case 'slider': {
        const sliderConfig = (parseOptions(question.options)[0]?.text || '0|100|1').split('|')
        const sliderMin = Number(sliderConfig[0]) || 0
        const sliderMax = Number(sliderConfig[1]) || 100
        const sliderStep = Number(sliderConfig[2]) || 1
        const sliderVal = Number(currentAnswer) || sliderMin
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{sliderMin}</span>
              <span className="text-xl font-bold text-blue-600">{sliderVal}</span>
              <span>{sliderMax}</span>
            </div>
            <input
              type="range"
              min={sliderMin}
              max={sliderMax}
              step={sliderStep}
              value={sliderVal}
              onChange={(e) => setAnswers({ ...answers, [question.id]: Number(e.target.value) })}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>
        )
      }

      case 'button_choice': {
        const btnOptions = parseOptions(question.options)
        return (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {btnOptions.map((opt: any) => {
              const isSelected = currentAnswer === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAnswers({ ...answers, [question.id]: isSelected ? '' : opt.id })}
                  className={`px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm scale-[1.02]'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  {opt.text}
                </button>
              )
            })}
          </div>
        )
      }

      case 'email_confirm': {
        const emailVal = typeof currentAnswer === 'object' ? currentAnswer as any : {}
        const emailMatch = emailVal.email && emailVal.confirm && emailVal.email === emailVal.confirm
        const emailMismatch = emailVal.email && emailVal.confirm && emailVal.email !== emailVal.confirm
        return (
          <div className="space-y-3">
            <input
              type="email"
              value={emailVal.email || ''}
              onChange={(e) => setAnswers({ ...answers, [question.id]: { ...emailVal, email: e.target.value } })}
              placeholder="أدخل بريدك الإلكتروني"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              dir="ltr"
            />
            <input
              type="email"
              value={emailVal.confirm || ''}
              onChange={(e) => setAnswers({ ...answers, [question.id]: { ...emailVal, confirm: e.target.value } })}
              placeholder="أعد إدخال البريد الإلكتروني للتأكيد"
              className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:border-blue-500 text-sm ${emailMismatch ? 'border-red-400 focus:ring-red-300' : emailMatch ? 'border-green-400 focus:ring-green-300' : 'border-gray-200 focus:ring-blue-500'}`}
              dir="ltr"
            />
            {emailMismatch && <p className="text-xs text-red-500">البريد الإلكتروني غير متطابق</p>}
            {emailMatch && <p className="text-xs text-green-600">✓ البريد الإلكتروني متطابق</p>}
          </div>
        )
      }

      case 'youtube': {
        const ytUrl = parseOptions(question.options)[0]?.text || ''
        const getYouTubeId = (url: string) => {
          const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/\s]+)/)
          return match ? match[1] : null
        }
        const ytId = getYouTubeId(ytUrl)
        return (
          <div className="rounded-xl overflow-hidden bg-gray-100 aspect-video">
            {ytId ? (
              <iframe
                src={`https://www.youtube.com/embed/${ytId}`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <svg className="w-16 h-16 mb-2" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                <p className="text-sm">أضف رابط يوتيوب في الإعدادات</p>
              </div>
            )}
          </div>
        )
      }

      case 'match_items': {
        const parsedOpts = parseOptions(question.options) || {}
        const leftItems = parsedOpts.left_items || []
        const rightItems = parsedOpts.right_items || []
        const matchAnswers = typeof currentAnswer === 'object' ? currentAnswer as Record<string, string> : {}
        return (
          <div className="space-y-3">
            {leftItems.map((leftItem: any) => (
              <div key={leftItem.id} className="flex items-center gap-3">
                <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 text-sm font-medium text-blue-800">
                  {leftItem.text}
                </div>
                <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                <select
                  value={matchAnswers[leftItem.id] || ''}
                  onChange={(e) => setAnswers({ ...answers, [question.id]: { ...matchAnswers, [leftItem.id]: e.target.value } })}
                  className="flex-1 px-3 py-2.5 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 focus:ring-2 focus:ring-green-400 cursor-pointer"
                >
                  <option value="">اختر الإجابة...</option>
                  {rightItems.map((right: any) => (
                    <option key={right.id} value={right.id}>{right.text}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )
      }

      default:
        return (
          <input
            type="text"
            value={currentAnswer || ''}
            onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        )
    }
  }

  if (submitted) {
    const { score, maxScore } = calculateScore()
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0

    let resultMessage = ''
    if (percentage >= 90) resultMessage = 'ممتاز! أداء رائع'
    else if (percentage >= 70) resultMessage = 'جيد جداً'
    else if (percentage >= 50) resultMessage = 'جيد'
    else resultMessage = 'يحتاج تحسين'

    return (
      <div dir="rtl" className={`${isPreview ? 'min-h-full' : 'min-h-screen'} bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4 form-themed-container`}>
        {renderThemeStyles()}
        <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 p-8 max-w-md w-full text-center form-themed-card">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 form-themed-text">تم الحفظ بنجاح!</h2>
          <p className="text-gray-500 mb-6 form-themed-description">{redirectMessage || resultMessage}</p>
          {form.default_redirect_url || (form.redirect_rules && form.redirect_rules.length > 0) ? (
            <p className="text-xs text-gray-400 mb-4 animate-pulse">سيتم توجيهك خلال لحظات...</p>
          ) : null}

          <div className={`rounded-2xl p-6 mb-6 border ${
            percentage >= 70 ? 'bg-emerald-50 border-emerald-100' : percentage >= 50 ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'
          }`}>
            <p className="text-gray-500 mb-2">درجتك</p>
            <p className={`text-5xl font-bold ${
              percentage >= 70 ? 'text-emerald-600' : percentage >= 50 ? 'text-amber-600' : 'text-red-600'
            }`}>
              {percentage}%
            </p>
            <p className="text-gray-400 text-sm mt-2">
              {score} من {maxScore} نقطة
            </p>
          </div>

          {form.allow_multiple && allUserResponses && allUserResponses.length > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-6">
              <p className="text-blue-700 text-sm">
                هذا التسجيل رقم {allUserResponses.length} في هذا الفورم
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Link
              href={project ? `/projects/${project.id}` : '/dashboard'}
              className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              العودة
            </Link>
            <button
              onClick={() => {
                if (form.allow_multiple) {
                  setSubmitted(false)
                  setAnswers({})
                  setShowRetryConfirm(false)
                } else {
                  setShowRetryConfirm(true)
                }
              }}
              className="flex-1 py-3.5 bg-gradient-to-l from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-colors shadow-lg shadow-blue-500/25"
            >
              {form.allow_multiple ? 'تسجيل جديد' : 'إعادة المحاولة'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Confirmation Modal for retry
  if (showRetryConfirm) {
    return (
      <div dir="rtl" className={`${isPreview ? 'min-h-full' : 'min-h-screen'} bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4 form-themed-container`}>
        {renderThemeStyles()}
        <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 p-8 max-w-md w-full form-themed-card">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2 form-themed-text">تأكيد إعادة المحاولة</h2>
            <p className="text-gray-500 form-themed-description">
              هل أنت متأكد من حذف إجابتك السابقة وإعادة المحاولة؟
            </p>
            <p className="text-red-500 text-sm mt-2">
              سيتم حذف درجتك السابقة ولا يمكن استرجاعها
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowRetryConfirm(false)}
              className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              disabled={deletingResponse}
            >
              إلغاء
            </button>
            <button
              onClick={handleRetry}
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

  return (
    <div dir="rtl" className={`${isPreview ? 'min-h-full' : 'min-h-screen'} bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50/30 form-themed-container`}>
      {renderThemeStyles()}
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-100/80 sticky top-0 z-10">
        {isPreview && (
          <div className="bg-orange-500 text-white text-xs py-1.5 text-center font-bold tracking-wide">
            وضع المعاينة: يمكنك تجربة تعبئة النموذج، لن يتم حفظ الإجابات
          </div>
        )}
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => {
              if (isPreview) return
              router.back()
            }}
            disabled={isPreview}
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
            {timeLeft !== null && !submitted && !isExpired && (
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
        
        {/* Page Info */}
        <div className="px-4 py-1.5 bg-white/50 border-b border-gray-100/80">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            {totalPages > 1 && (
              <span className="text-xs text-gray-500">
                صفحة {pageIndex + 1} من {totalPages}
              </span>
            )}
            <span className={`text-xs ${totalPages > 1 ? '' : 'mr-auto'} text-gray-400`}>
              {Object.keys(answers).filter(k => visibleQuestions.some(q => q.id === k)).length} / {visibleQuestions.length} إجابة
            </span>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="h-1 bg-gray-50">
          <div 
            className="h-full bg-gradient-to-l from-blue-500 to-indigo-500 transition-all duration-500 rounded-full"
            style={{ 
              width: `${(Object.keys(answers).filter(k => visibleQuestions.some(q => q.id === k)).length / (visibleQuestions.length || 1)) * 100}%` 
            }}
          />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 form-themed-width">
        {/* Draft Restored Banner */}
        {draftRestored && !draftDismissed && (
          <div className="mb-4 flex items-center justify-between bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                تم استعادة مسودتك المحفوظة ({autoSave.getDraftAge()}) — يمكنك المتابعة من حيث توقفت.
              </span>
            </div>
            <button
              onClick={() => { setDraftDismissed(true); setAnswers({}); autoSave.clearDraft() }}
              className="mr-3 text-amber-600 hover:text-amber-900 font-medium whitespace-nowrap"
            >
              بدء من جديد
            </button>
          </div>
        )}

        {/* Form Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 form-themed-card">
          <h2 className="text-xl font-bold text-gray-900 mb-2 form-themed-text">{form.name}</h2>
          <p className="text-gray-500 text-sm form-themed-description">{form.description || 'أجب على الأسئلة التالية'}</p>
          {project && (
            <div className="mt-3 flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: project.color }}
              />
              <span className="text-gray-400 text-xs">{project.name}</span>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Questions */}
        <div className="space-y-4">
          {(() => {
            const qs = pageQuestions
            const groups: { group: number | null; questions: Question[]; startIndex: number }[] = []
            let currentGroup: number | null = null
            let currentItems: Question[] = []

            qs.forEach((q) => {
              const g = q.row_group ?? null
              if (g !== currentGroup && currentItems.length > 0) {
                groups.push({ group: currentGroup, questions: [...currentItems], startIndex: groups.reduce((acc, g) => acc + g.questions.length, 0) })
                currentItems = []
              }
              currentGroup = g
              currentItems.push(q)
            })
            if (currentItems.length > 0) {
              groups.push({ group: currentGroup, questions: currentItems, startIndex: groups.reduce((acc, g) => acc + g.questions.length, 0) })
            }

            const renderCard = (question: Question, idx: number) => (
              <div className="flex items-start gap-3 mb-4">
                <span className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg flex items-center justify-center font-bold text-xs shrink-0 form-themed-primary-bg">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 form-themed-text">
                    {question.text}
                    {question.required && <span className="text-red-500 mr-1">*</span>}
                  </h3>
                  {question.type !== 'file_upload' && (
                    <p className="text-blue-500 text-xs mt-1 font-medium form-themed-primary-text">
                      {getQuestionMaxScore(question)} نقطة
                    </p>
                  )}
                </div>
              </div>
            )

            return groups.map((grp) => {
              if (grp.group !== null && grp.questions.length > 1) {
                return (
                  <div key={`row_${grp.group}`} className="flex gap-4">
                    {grp.questions.map((question, gi) => {
                      const idx = grp.startIndex + gi
                      return (
                        <div key={question.id} className="flex-1 min-w-0 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 form-themed-card form-themed-spacing">
                          {renderCard(question, idx)}
                          {renderQuestion(question, idx)}
                        </div>
                      )
                    })}
                  </div>
                )
              }
              return grp.questions.map((question, gi) => {
                const idx = grp.startIndex + gi
                return (
                  <div key={question.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 transition-all hover:shadow-md form-themed-card form-themed-spacing">
                    {renderCard(question, idx)}
                    {renderQuestion(question, idx)}
                  </div>
                )
              })
            })
          })()}
        </div>

        {/* Payment Info Display */}
        {isLastPage && form.page_titles?._payment && (() => {
          const rawPayment = form.page_titles._payment
          const paymentMethods = typeof rawPayment === 'string' ? JSON.parse(rawPayment) : rawPayment
          if (!paymentMethods || paymentMethods.length === 0) return null
          return (
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <h4 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              طرق الدفع المتاحة
            </h4>
            <div className="space-y-2">
              {paymentMethods.map((pm: any, pi: number) => {
                const icons: Record<string, string> = { bank: '🏦', instapay: '📱', vodafone: '📞' }
                const methodNames: Record<string, string> = { bank: 'حساب بنكي', instapay: 'إنستاباي', vodafone: 'فودافون كاش' }
                return (
                  <div key={pi} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-amber-100">
                    <span className="text-xl">{icons[pm.method] || '💳'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800">{methodNames[pm.method] || pm.method}</p>
                      {pm.label && <p className="text-xs text-gray-500">{pm.label}</p>}
                      <p className="text-sm font-mono font-bold text-amber-700 mt-0.5" dir="ltr">{pm.value}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-amber-600 mt-2">يرجى تحويل المبلغ على أحد الطرق أعلاه بعد تقديم النموذج</p>
          </div>
          )
        })()}

        {/* Navigation & Submit */}
        {pageQuestions.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="flex gap-3">
              {!isFirstPage && (
                <button
                  onClick={goToPrevPage}
                  className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  السابق
                </button>
              )}
              {!isLastPage && (
                <button
                  onClick={goToNextPage}
                  className="flex-1 py-3.5 bg-gradient-to-l from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 form-themed-primary-bg"
                >
                  التالي
                </button>
              )}
              {isLastPage && (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-4 bg-gradient-to-l from-emerald-600 to-green-600 text-white font-semibold rounded-2xl hover:from-emerald-700 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25 form-themed-primary-bg"
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
                    'حفظ الإجابات'
                  )}
                </button>
              )}
            </div>
            {/* "أكمل لاحقاً" button — saves draft and redirects to dashboard */}
            {!isPreview && form.enable_auto_save !== false && Object.keys(answers).length > 0 && (
              <button
                onClick={() => {
                  autoSave.saveDraft(answers)
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
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                {pages.map(p => (
                  <button
                    key={p}
                    onClick={() => {
                      setCurrentPage(p)
                      scrollToTop()
                    }}
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
        )}

        {displayQuestions.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-50 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500">لا توجد أسئلة في هذا النموذج حالياً</p>
          </div>
        )}
      </main>
    </div>
  )
}