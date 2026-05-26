'use client'

import type { QuestionType } from '@/types'
import { ITEM_CATEGORIES, QUESTION_TYPES } from '@/constants/questionTypes'

interface AddQuestionMenuProps {
  open: boolean
  selectedCategory: string
  onToggle: () => void
  onCategoryChange: (cat: string) => void
  onAddQuestion: (type: QuestionType) => void
}

export default function AddQuestionMenu({ open, selectedCategory, onToggle, onCategoryChange, onAddQuestion }: AddQuestionMenuProps) {
  return (
    <div className="relative flex-1">
      <button
        onClick={onToggle}
        className="w-full py-4 border-2 border-dashed border-blue-300 text-blue-600 rounded-xl hover:bg-blue-50 hover:border-blue-400 font-bold transition-all flex items-center justify-center gap-2"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        إضافة عنصر
      </button>
      
      {open && (
        <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 shadow-xl rounded-xl z-20">
          <div className="flex flex-wrap border-b border-gray-200 p-2 gap-2">
            {(Object.entries(ITEM_CATEGORIES) as [string, { label: string; icon: string }][]).map(([cat, info]) => (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                  selectedCategory === cat
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>{info.icon}</span>
                {info.label}
              </button>
            ))}
          </div>

          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {(Object.entries(QUESTION_TYPES) as [QuestionType, { label: string; icon: string; description: string; category: string }][])
              .filter(([_, info]) => info.category === selectedCategory)
              .map(([type, info]) => (
                <button
                  key={type}
                  onClick={() => {
                    if (type === 'file_upload') return
                    onAddQuestion(type)
                    onCategoryChange('basic')
                    onToggle()
                  }}
                  className={`flex flex-col items-center justify-center text-center p-3 rounded-lg transition-colors border ${
                    type === 'file_upload'
                      ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200'
                      : 'hover:bg-blue-50 border-transparent hover:border-blue-200'
                  }`}
                  title={type === 'file_upload' ? 'قيد التطوير' : ''}
                >
                  <span className={`text-2xl mb-2 ${type === 'file_upload' ? 'opacity-50' : ''}`}>
                    {info.icon}
                  </span>
                  <span className="font-medium text-gray-800 text-sm mb-1">{info.label}</span>
                  <span className="text-xs text-gray-500">{type === 'file_upload' ? 'قيد التطوير' : info.description}</span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
