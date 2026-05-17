'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TEMPLATE_CATEGORIES } from '@/types'
import type { FormTemplate } from '@/types'

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<FormTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('form_templates')
        .select('*')
        .order('sort_order')
      if (error) throw error
      setTemplates(data || [])
    } catch (e) {
      console.error('Error fetching templates:', e)
    } finally {
      setLoading(false)
    }
  }

  const categories = Object.entries(TEMPLATE_CATEGORIES) as [string, string][]

  const filteredTemplates = activeCategory
    ? templates.filter(t => t.category === activeCategory)
    : templates

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50/30 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50/30">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-100/80">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            رجوع
          </button>
          <h1 className="text-base font-bold text-gray-800">قوالب النماذج</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">ابدأ من قالب جاهز</h2>
          <p className="text-gray-500">اختر قالباً من القوالب الجاهزة لتبدأ بإنشاء نموذجك بسرعة</p>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 justify-center">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all shrink-0 ${
              !activeCategory
                ? 'bg-gradient-to-l from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
            }`}
          >
            الكل
          </button>
          {categories.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all shrink-0 ${
                activeCategory === key
                  ? 'bg-gradient-to-l from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all group"
            >
              {/* Image */}
              <div className="w-full h-40 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center relative overflow-hidden">
                {template.image_url ? (
                  <img src={template.image_url} alt={template.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-16 h-16 bg-white/80 rounded-2xl flex items-center justify-center shadow-sm">
                    <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                )}
                {template.is_featured && (
                  <span className="absolute top-3 right-3 bg-gradient-to-l from-amber-400 to-orange-400 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">
                    مميز
                  </span>
                )}
                <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-gray-600 text-xs px-2.5 py-1 rounded-lg shadow-sm">
                  {TEMPLATE_CATEGORIES[template.category] || template.category}
                </span>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="font-bold text-gray-900 mb-1.5 group-hover:text-blue-600 transition-colors">{template.name}</h3>
                <p className="text-gray-500 text-sm line-clamp-2 mb-4">{template.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {template.questions_data?.length || 0} أسئلة
                  </span>
                  <Link
                    href={`/templates/${template.id}`}
                    className="px-4 py-2 bg-gradient-to-l from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all text-sm font-medium shadow-lg shadow-blue-500/25"
                  >
                    استخدام القالب
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
              <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-gray-500">لا توجد قوالب في هذا التصنيف</p>
          </div>
        )}
      </main>
    </div>
  )
}
