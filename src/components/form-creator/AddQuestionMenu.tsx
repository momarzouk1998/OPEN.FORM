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
        className="w-full py-4 bg-white border-2 border-dashed border-blue-300 text-blue-600 rounded-2xl hover:bg-blue-50 hover:border-blue-400 active:scale-[0.99] font-bold transition-all flex items-center justify-center gap-2 group"
      >
        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        إضافة عنصر جديد
      </button>
      
      {open && (
        <>
          <div className="fixed inset-0 z-40 md:hidden bg-black/20 backdrop-blur-sm" onClick={onToggle} />
          <div className="absolute md:top-full mt-4 md:mt-2 w-full fixed inset-x-4 bottom-4 md:relative md:inset-auto bg-white border border-gray-100 shadow-2xl md:shadow-xl rounded-3xl z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="p-2 border-b border-gray-50 flex items-center justify-between md:hidden">
               <h3 className="px-4 py-2 text-sm font-black text-gray-400 uppercase tracking-widest">إضافة عنصر</h3>
               <button onClick={onToggle} className="p-3 text-gray-400">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>

            <div className="flex overflow-x-auto no-scrollbar border-b border-gray-50 p-2 gap-1.5 scroll-smooth">
              {(Object.entries(ITEM_CATEGORIES) as [string, { label: string; icon: string }][]).map(([cat, info]) => (
                <button
                  key={cat}
                  onClick={() => onCategoryChange(cat)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 scale-105'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-sm">{info.icon}</span>
                  {info.label}
                </button>
              ))}
            </div>

            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] md:max-h-[400px] overflow-y-auto custom-scrollbar">
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
                    className={`flex flex-col items-center justify-center text-center p-4 rounded-2xl transition-all border-2 group/item ${
                      type === 'file_upload'
                        ? 'opacity-40 cursor-not-allowed bg-gray-50 border-gray-100'
                        : 'bg-white border-gray-50 hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-md active:scale-95'
                    }`}
                    title={type === 'file_upload' ? 'قيد التطوير' : ''}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-3 transition-transform group-hover/item:scale-110 ${type === 'file_upload' ? 'bg-gray-100' : 'bg-blue-50 text-blue-600'}`}>
                      {info.icon}
                    </div>
                    <span className="font-bold text-gray-800 text-xs mb-1">{info.label}</span>
                    <span className="text-[10px] text-gray-400 font-medium line-clamp-2">{type === 'file_upload' ? 'قيد التطوير' : info.description}</span>
                  </button>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
