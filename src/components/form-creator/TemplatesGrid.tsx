'use client'

import Link from 'next/link'
import type { FormTemplate } from '@/types'
import { TEMPLATE_CATEGORIES } from '@/types'

interface TemplatesGridProps {
  templates: FormTemplate[]
  templatesLoading: boolean
  questionsCount: number
  onUseTemplate: (template: FormTemplate) => void
}

export default function TemplatesGrid({ templates, templatesLoading, questionsCount, onUseTemplate }: TemplatesGridProps) {
  if (templatesLoading) return null
  if (templates.length === 0) return null

  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 ${questionsCount > 0 ? 'hidden' : ''}`}>
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
            onClick={() => onUseTemplate(template)}
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
  )
}
