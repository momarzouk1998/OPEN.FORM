"use client";

import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, Sparkles, Loader2, AlertCircle, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { TEMPLATE_CATEGORIES } from "@/types";

interface TemplateData {
  id: string;
  name: string;
  description: string;
  category: string;
  questions_data: any[];
  form_settings: any;
  source?: string;
  usage_count?: number;
}

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
  date_range: 'نطاق تاريخ',
  slider: 'شريط رقمي',
  button_choice: 'أزرار',
  star_rating: 'نجوم',
  appointment: 'حجز موعد',
  match_items: 'توصيل',
  file_upload: 'رفع ملف',
  email_confirm: 'تأكيد بريد',
  static_text: 'نص ثابت',
  static_image: 'صورة',
  youtube: 'فيديو',
  divider: 'فاصل',
  terms: 'شروط',
  signature: 'توقيع',
  countdown_timer: 'مؤقت',
  products_block: 'منتجات',
  payment_info_block: 'دفع',
}

const TYPE_COLORS: Record<string, string> = {
  text: 'bg-blue-50 text-blue-600',
  textarea: 'bg-indigo-50 text-indigo-600',
  single_choice: 'bg-green-50 text-green-600',
  multiple_choice: 'bg-teal-50 text-teal-600',
  dropdown: 'bg-cyan-50 text-cyan-600',
  scale: 'bg-amber-50 text-amber-600',
  ranking: 'bg-orange-50 text-orange-600',
  matrix: 'bg-rose-50 text-rose-600',
  date: 'bg-violet-50 text-violet-600',
  time: 'bg-purple-50 text-purple-600',
  date_range: 'bg-fuchsia-50 text-fuchsia-600',
  slider: 'bg-pink-50 text-pink-600',
  button_choice: 'bg-sky-50 text-sky-600',
  star_rating: 'bg-yellow-50 text-yellow-600',
  appointment: 'bg-emerald-50 text-emerald-600',
  match_items: 'bg-lime-50 text-lime-600',
  file_upload: 'bg-blue-50 text-blue-600',
  email_confirm: 'bg-indigo-50 text-indigo-600',
  static_text: 'bg-slate-50 text-slate-600',
  static_image: 'bg-gray-50 text-gray-600',
  youtube: 'bg-red-50 text-red-600',
  divider: 'bg-slate-50 text-slate-400',
  terms: 'bg-amber-50 text-amber-600',
  signature: 'bg-teal-50 text-teal-600',
  countdown_timer: 'bg-red-50 text-red-600',
  products_block: 'bg-orange-50 text-orange-600',
  payment_info_block: 'bg-blue-50 text-blue-600',
}

const renderQuestionPreview = (q: any, index: number) => {
  const label = QUESTION_TYPE_LABELS[q.type] || q.type
  const color = TYPE_COLORS[q.type] || 'bg-slate-50 text-slate-600'

  return (
    <motion.div
      key={q.id || index}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="glass-panel p-5 rounded-2xl border border-slate-100 dark:border-slate-800/50"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-sm font-bold mt-0.5">
          {index + 1}
        </div>
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${color}`}>{label}</span>
            {q.required && <span className="text-[10px] text-red-500 font-medium">* إجباري</span>}
            {q.page && q.page > 1 && <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-500 font-medium">صفحة {q.page}</span>}
            {q.row_group && <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-50 text-purple-600 font-medium">صف {q.row_group}</span>}
          </div>
          <p className="text-sm font-semibold mb-1" dangerouslySetInnerHTML={{ __html: q.text || 'بدون نص' }} />
          
          {/* Preview options for choice types */}
          {['single_choice', 'multiple_choice', 'button_choice'].includes(q.type) && q.options && Array.isArray(q.options) && q.options.length > 0 && !q.options[0]?._visibility_rules && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {q.options.slice(0, 4).map((opt: any, i: number) => (
                <span key={opt.id || i} className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-50 dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-700">
                  {opt.text || `خيار ${i + 1}`}
                </span>
              ))}
              {q.options.length > 4 && (
                <span className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-50 text-slate-400">+{q.options.length - 4}</span>
              )}
            </div>
          )}

          {/* Scale preview */}
          {q.type === 'scale' && (
            <div className="flex gap-1 mt-2">
              {[1,2,3,4,5].map(n => (
                <span key={n} className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-xs text-slate-400">{n}</span>
              ))}
              <span className="text-xs text-slate-400 mr-1">...</span>
            </div>
          )}

          {/* Star rating preview */}
          {q.type === 'star_rating' && (
            <div className="flex gap-1 mt-2 text-lg text-yellow-400">
              {'★★★★★'}
            </div>
          )}

          {/* Conditional logic indicator */}
          {(q.options?.[q.options?.length - 1]?._visibility_rules?.length > 0) && (
            <div className="flex items-center gap-1 mt-2 text-[11px] text-indigo-500">
              <Eye className="w-3 h-3" />
              <span>يحتوي على منطق شرطي</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function TemplatePreviewPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [template, setTemplate] = useState<TemplateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const { data: built } = await supabase
          .from('form_templates')
          .select('*')
          .eq('id', params.id)
          .single()

        if (built) {
          setTemplate({ ...built, source: 'form_templates' })
          setLoading(false)
          return
        }

        const { data: userTmpl } = await supabase
          .from('user_templates')
          .select('*, profiles(name, avatar_url)')
          .eq('id', params.id)
          .single()

        if (userTmpl) {
          setTemplate({ ...userTmpl, source: 'user_templates' })
          setLoading(false)
          return
        }

        setError('لم يتم العثور على هذا القالب')
        setLoading(false)
      } catch (err) {
        setError('حدث خطأ أثناء تحميل القالب')
        setLoading(false)
      }
    }

    if (params.id) fetchTemplate()
  }, [params.id])

  const useThisTemplate = () => {
    router.push(`/forms/create?templateId=${template!.id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          <span className="text-slate-500">جاري تحميل القالب...</span>
        </div>
      </div>
    )
  }

  if (error || !template) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold mb-3">عذراً!</h2>
          <p className="text-slate-500 mb-8">{error || 'لم يتم العثور على القالب'}</p>
          <Link href="/templates" className="inline-flex items-center gap-2 text-brand-500 font-bold hover:underline">
            <ArrowRight className="w-4 h-4" />
            العودة لمكتبة القوالب
          </Link>
        </div>
      </div>
    )
  }

  const questions = template.questions_data || []
  const pages = [...new Set(questions.map((q: any) => q.page || 1))].sort()
  const categoryLabel = TEMPLATE_CATEGORIES[template.category] || template.category
  const hasConditional = questions.some((q: any) => q.options?.[q.options?.length - 1]?._visibility_rules?.length > 0)
  const displayQuestions = showAll ? questions : questions.slice(0, 10)

  return (
    <div className="min-h-screen p-6 md:p-12 max-w-4xl mx-auto">
      {/* Back link */}
      <Link href="/templates" className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-500 mb-8 font-medium transition-colors text-sm">
        <ArrowRight className="w-4 h-4" />
        العودة لمكتبة القوالب
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Preview */}
        <div className="lg:col-span-2">
          {/* Template Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-600 border border-brand-200">
                {categoryLabel}
              </span>
              <span className="text-xs text-slate-400">{questions.length} {questions.length === 1 ? 'سؤال' : 'أسئلة'}</span>
              {pages.length > 1 && <span className="text-xs text-slate-400">{pages.length} صفحات</span>}
              {hasConditional && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-600 flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  منطق شرطي
                </span>
              )}
            </div>

            <h1 className="text-3xl font-black mb-3">{template.name}</h1>
            <p className="text-slate-500 leading-relaxed">{template.description}</p>
          </motion.div>

          {/* Questions Preview */}
          <div className="space-y-3 mb-8">
            {displayQuestions.map((q: any, i: number) => renderQuestionPreview(q, i))}
            {questions.length > 10 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full py-3 text-sm text-brand-500 font-bold hover:bg-brand-50 rounded-xl transition-colors"
              >
                {showAll ? 'عرض أقل' : `عرض الكل (${questions.length} أسئلة)`}
              </button>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="lg:col-span-1"
        >
          <div className="glass-panel p-6 rounded-3xl border border-slate-100 dark:border-slate-800/50 sticky top-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-brand-500" />
              </div>
              <div>
                <h3 className="font-bold text-sm">استخدام هذا القالب</h3>
                <p className="text-[11px] text-slate-400">ابدأ بتعديله فوراً</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="glass-panel p-3 rounded-xl text-center">
                <div className="text-2xl font-black text-brand-500">{questions.length}</div>
                <div className="text-[11px] text-slate-400">أسئلة</div>
              </div>
              <div className="glass-panel p-3 rounded-xl text-center">
                <div className="text-2xl font-black text-slate-700">{pages.length}</div>
                <div className="text-[11px] text-slate-400">{pages.length === 1 ? 'صفحة' : 'صفحات'}</div>
              </div>
            </div>

            {/* Type breakdown */}
            <div className="mb-6">
              <h4 className="text-xs font-semibold text-slate-500 mb-3">أنواع الأسئلة</h4>
              <div className="flex flex-wrap gap-1.5">
                {[...new Set(questions.map((q: any) => q.type))].map((type: string) => {
                  const label = QUESTION_TYPE_LABELS[type] || type
                  const color = TYPE_COLORS[type] || 'bg-slate-50 text-slate-600'
                  return (
                    <span key={type} className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${color}`}>
                      {label}
                    </span>
                  )
                })}
              </div>
            </div>

            {/* Use Button */}
            <button
              onClick={useThisTemplate}
              className="w-full py-3.5 rounded-2xl bg-brand-500 text-white font-bold text-sm hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              استخدام هذا القالب
            </button>

            <p className="text-[10px] text-slate-400 text-center mt-3">
              سيتم فتح محرر النماذج مع تطبيق القالب تلقائياً
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}