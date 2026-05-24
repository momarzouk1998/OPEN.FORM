"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Briefcase, ShoppingCart, UserCheck, Stethoscope, Sparkles, ChevronLeft, GraduationCap, LayoutTemplate, Building2, Truck, Home, School, LineChart, Search } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { TEMPLATE_CATEGORIES } from "@/types";

interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  questions_data: any[];
  source?: 'form_templates' | 'user_templates';
  usage_count?: number;
}

// All categories sorted: existing + new professional ones
const CATEGORY_ORDER = [
  'education_centers',
  'clinics',
  'restaurants',
  'shipping',
  'real_estate',
  'schools',
  'small_business',
  'medical',
  'survey',
  'employment',
  'education',
]

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'education_centers': return <GraduationCap className="w-5 h-5" />;
    case 'clinics': return <Stethoscope className="w-5 h-5" />;
    case 'restaurants': return <ShoppingCart className="w-5 h-5" />;
    case 'shipping': return <Truck className="w-5 h-5" />;
    case 'real_estate': return <Home className="w-5 h-5" />;
    case 'schools': return <School className="w-5 h-5" />;
    case 'small_business': return <LineChart className="w-5 h-5" />;
    case 'medical': return <Stethoscope className="w-5 h-5" />;
    case 'survey': return <UserCheck className="w-5 h-5" />;
    case 'employment': return <Briefcase className="w-5 h-5" />;
    case 'education': return <GraduationCap className="w-5 h-5" />;
    default: return <LayoutTemplate className="w-5 h-5" />;
  }
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'education_centers': return { bg: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-600', border: 'border-purple-200', gradient: 'from-purple-500/20 to-violet-500/20' };
    case 'clinics': return { bg: 'bg-teal-50 dark:bg-teal-500/10', text: 'text-teal-600', border: 'border-teal-200', gradient: 'from-teal-500/20 to-emerald-500/20' };
    case 'restaurants': return { bg: 'bg-orange-50 dark:bg-orange-500/10', text: 'text-orange-600', border: 'border-orange-200', gradient: 'from-orange-500/20 to-red-500/20' };
    case 'shipping': return { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-200', gradient: 'from-blue-500/20 to-cyan-500/20' };
    case 'real_estate': return { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-200', gradient: 'from-amber-500/20 to-yellow-500/20' };
    case 'schools': return { bg: 'bg-green-50 dark:bg-green-500/10', text: 'text-green-600', border: 'border-green-200', gradient: 'from-green-500/20 to-emerald-500/20' };
    case 'small_business': return { bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-600', border: 'border-rose-200', gradient: 'from-rose-500/20 to-pink-500/20' };
    case 'medical': return { bg: 'bg-brand-50', text: 'text-brand-600', border: 'border-brand-200', gradient: 'from-brand-500/20 to-teal-500/20' };
    case 'survey': return { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', gradient: 'from-green-500/20 to-emerald-500/20' };
    case 'employment': return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', gradient: 'from-blue-500/20 to-cyan-500/20' };
    case 'education': return { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', gradient: 'from-purple-500/20 to-pink-500/20' };
    default: return { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', gradient: 'from-slate-500/20 to-slate-400/20' };
  }
}

const PROFESSIONAL_CATEGORIES = ['education_centers', 'clinics', 'restaurants', 'shipping', 'real_estate', 'schools', 'small_business']

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchTemplates = async () => {
      const [built] = await Promise.all([
        supabase.from('form_templates').select('*').order('sort_order', { ascending: true }),
        supabase.from('user_templates').select('*').eq('approved', true).order('created_at', { ascending: false })
      ])

      const builtData: any[] = built.data || []
      const { data: userTemplates } = await supabase.from('user_templates').select('*').eq('approved', true).order('created_at', { ascending: false })

      const merged: FormTemplate[] = [
        ...builtData.map((t: any) => ({ ...t, source: 'form_templates' })),
        ...(userTemplates || []).map((t: any) => ({ ...t, source: 'user_templates' }))
      ]

      setTemplates(merged)
      setLoading(false)
    }

    fetchTemplates()
  }, [])

  // Group templates by category
  const grouped = templates.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = []
    acc[t.category].push(t)
    return acc
  }, {} as Record<string, FormTemplate[]>)

  // Get all present categories in order
  const presentCategories = CATEGORY_ORDER.filter(c => grouped[c]?.length > 0)

  // Filtered categories for display
  const displayedCategories = activeCategory
    ? [activeCategory].filter(c => grouped[c]?.length > 0)
    : presentCategories

  return (
    <div className="min-h-screen p-6 md:p-12 max-w-7xl mx-auto">
      {/* Hero */}
      <div className="flex flex-col items-center text-center mb-12 mt-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-brand-600 font-medium mb-6"
        >
          <Sparkles className="w-4 h-4" />
          <span>مكتبة القوالب الاحترافية</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl md:text-5xl font-black mb-6 text-foreground tracking-tight"
        >
          ابدأ بـ <span className="text-brand-500">قالب جاهز</span> لمجالك
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg text-slate-500 max-w-2xl"
        >
          قوالب احترافية مصممة بعناية لتناسب أنشطتك التجارية. اختر قالبك وابدأ في دقائق.
        </motion.p>
      </div>

      {/* Professional Category Pills */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex flex-wrap justify-center gap-3 mb-10"
      >
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all border ${!activeCategory ? 'bg-brand-500 text-white border-brand-500 shadow-lg shadow-brand-500/20' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand-300'}`}
        >
          الكل
        </button>
        {PROFESSIONAL_CATEGORIES.map(cat => {
          const colors = getCategoryColor(cat)
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all border flex items-center gap-2 ${activeCategory === cat ? `${colors.bg} ${colors.text} ${colors.border}` : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
            >
              {getCategoryIcon(cat)}
              <span>{TEMPLATE_CATEGORIES[cat] || cat}</span>
            </button>
          )
        })}
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin"></div>
        </div>
      ) : displayedCategories.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Search className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold mb-2">لا توجد قوالب في هذا التصنيف</h3>
          <p className="text-slate-500">حاول اختيار تصنيف آخر</p>
        </div>
      ) : (
        <div className="space-y-16">
          {displayedCategories.map((category) => {
            const catTemplates = grouped[category]
            const colors = getCategoryColor(category)
            const isProfessional = PROFESSIONAL_CATEGORIES.includes(category)

            return (
              <motion.section
                key={category}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* Category Header */}
                <div className="flex items-center gap-4 mb-8">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors.bg}`}>
                    <div className={colors.text}>
                      {getCategoryIcon(category)}
                    </div>
                  </div>
                  <div>
                    <h2 className={`text-2xl font-black ${colors.text}`}>
                      {TEMPLATE_CATEGORIES[category] || category}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {catTemplates.length} {catTemplates.length === 1 ? 'قالب' : 'قوالب'}
                    </p>
                  </div>
                  {isProfessional && (
                    <div className="mr-auto">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-600 border border-brand-200">
                        احترافي
                      </span>
                    </div>
                  )}
                </div>

                {/* Template Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {catTemplates.map((template, index) => {
                    const questionsCount = template.questions_data?.length || 0

                    return (
                      <motion.div
                        key={template.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        whileHover={{ y: -6, scale: 1.02 }}
                        className="glass-panel p-6 rounded-3xl relative overflow-hidden group cursor-pointer flex flex-col h-full border border-slate-100 dark:border-slate-800/50"
                      >
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colors.gradient} rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150`}></div>

                        <div className="relative z-10 flex flex-col h-full">
                          <h3 className="text-xl font-bold mb-3">{template.name}</h3>
                          <p className="text-slate-500 text-sm mb-6 leading-relaxed flex-grow">{template.description}</p>

                          <div className="flex flex-wrap gap-2 mb-4">
                            {/* Feature tags based on question types */}
                            {(template.questions_data || []).slice(0, 4).map((q: any) => {
                              if (q.type === 'appointment') return <span key={q.id} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-teal-50 text-teal-600">📅 حجز</span>
                              if (q.type === 'products_block') return <span key={q.id} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-50 text-orange-600">📦 منتجات</span>
                              if (q.type === 'payment_info_block') return <span key={q.id} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-600">💳 دفع</span>
                              if (q.type === 'countdown_timer') return <span key={q.id} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-600">⏳ مؤقت</span>
                              if (q.type === 'file_upload') return <span key={q.id} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 text-purple-600">📎 ملفات</span>
                              return null
                            })}
                            {template.questions_data?.some((q: any) => q.visibility_rules?.length > 0 || q.options?.[q.options?.length - 1]?._visibility_rules?.length > 0) && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-600">🔄 ذكي</span>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/50">
                            <span className="text-sm font-medium text-slate-400">{questionsCount} {questionsCount === 1 ? 'سؤال' : 'أسئلة'}</span>
                            <Link href={`/templates/${template.id}`} className="text-brand-500 font-bold flex items-center gap-1 group-hover:gap-2 transition-all text-sm">
                              معاينة واستخدام
                              <ChevronLeft className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.section>
            );
          })}
        </div>
      )}
    </div>
  );
}