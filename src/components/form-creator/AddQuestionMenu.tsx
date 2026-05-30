'use client'

import { useState, useMemo } from 'react'
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
  const [searchQuery, setSearchQuery] = useState('')

  // Map category colors to Tailwind classes
  const getCategoryColorClasses = (cat: string, isSelected: boolean) => {
    const colors: Record<string, { active: string; inactive: string; hover: string; border: string; glow: string }> = {
      basic: {
        active: 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-600 ring-offset-2',
        inactive: 'bg-blue-50/50 text-blue-700 border-blue-100',
        hover: 'hover:bg-blue-100/80',
        border: 'border-blue-200',
        glow: 'group-hover/item:bg-blue-600 group-hover/item:text-white bg-blue-50 text-blue-600',
      },
      advanced: {
        active: 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 ring-2 ring-purple-600 ring-offset-2',
        inactive: 'bg-purple-50/50 text-purple-700 border-purple-100',
        hover: 'hover:bg-purple-100/80',
        border: 'border-purple-200',
        glow: 'group-hover/item:bg-purple-600 group-hover/item:text-white bg-purple-50 text-purple-600',
      },
      display: {
        active: 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-600 ring-offset-2',
        inactive: 'bg-emerald-50/50 text-emerald-700 border-emerald-100',
        hover: 'hover:bg-emerald-100/80',
        border: 'border-emerald-200',
        glow: 'group-hover/item:bg-emerald-600 group-hover/item:text-white bg-emerald-50 text-emerald-600',
      },
      widgets: {
        active: 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 ring-2 ring-amber-500 ring-offset-2',
        inactive: 'bg-amber-50/50 text-amber-800 border-amber-100',
        hover: 'hover:bg-amber-100/80',
        border: 'border-amber-200',
        glow: 'group-hover/item:bg-amber-500 group-hover/item:text-white bg-amber-50 text-amber-600',
      },
    }

    const current = colors[cat] || colors.basic
    return isSelected ? current.active : `${current.inactive} ${current.hover} border`
  }

  const getIconContainerStyle = (cat: string) => {
    const styles: Record<string, string> = {
      basic: 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 group-hover/item:from-blue-600 group-hover/item:to-indigo-600 group-hover/item:text-white',
      advanced: 'bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600 group-hover/item:from-purple-600 group-hover/item:to-fuchsia-600 group-hover/item:text-white',
      display: 'bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 group-hover/item:from-emerald-600 group-hover/item:to-teal-600 group-hover/item:text-white',
      widgets: 'bg-gradient-to-br from-amber-50 to-amber-100 text-amber-600 group-hover/item:from-amber-500 group-hover/item:to-orange-500 group-hover/item:text-white',
    }
    return styles[cat] || styles.basic
  }

  const getCardHoverStyle = (cat: string) => {
    const styles: Record<string, string> = {
      basic: 'hover:border-blue-300 hover:shadow-blue-500/5 hover:bg-blue-50/20',
      advanced: 'hover:border-purple-300 hover:shadow-purple-500/5 hover:bg-purple-50/20',
      display: 'hover:border-emerald-300 hover:shadow-emerald-500/5 hover:bg-emerald-50/20',
      widgets: 'hover:border-amber-300 hover:shadow-amber-500/5 hover:bg-amber-50/20',
    }
    return styles[cat] || styles.basic
  }

  // Filter elements by search or category
  const filteredQuestionTypes = useMemo(() => {
    const allTypes = Object.entries(QUESTION_TYPES) as [QuestionType, { label: string; icon: string; description: string; explanation: string; category: string }][]
    
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase()
      return allTypes.filter(([_, info]) => 
        info.label.toLowerCase().includes(query) || 
        info.description.toLowerCase().includes(query) ||
        info.explanation.toLowerCase().includes(query)
      )
    }

    return allTypes.filter(([_, info]) => info.category === selectedCategory)
  }, [selectedCategory, searchQuery])

  return (
    <div className="relative flex-1">
      {/* Premium Add Element Button */}
      <button
        onClick={onToggle}
        className="w-full py-4.5 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-gray-800 dark:to-gray-850 border-2 border-dashed border-blue-300/80 dark:border-blue-800/80 text-blue-700 dark:text-blue-400 rounded-3xl hover:from-blue-100/50 hover:to-indigo-100/50 hover:border-blue-400/90 hover:shadow-lg hover:shadow-blue-500/5 active:scale-[0.99] font-extrabold transition-all flex items-center justify-center gap-3 group"
      >
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 group-hover:rotate-90 transition-all duration-300">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <span className="text-base tracking-wide font-black">إضافة عنصر جديد ذكي</span>
      </button>
      
      {open && (
        <>
          {/* Mobile Overlay */}
          <div className="fixed inset-0 z-40 md:hidden bg-gray-900/60 backdrop-blur-md transition-opacity duration-300" onClick={onToggle} />
          
          {/* Main Dropdown Panel (Responsive) */}
          <div className="absolute md:top-full mt-4 md:mt-3 w-full fixed inset-x-4 bottom-4 md:relative md:inset-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-100 dark:border-gray-800 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] rounded-[2.5rem] md:rounded-[2rem] z-50 animate-in fade-in slide-in-from-bottom-6 duration-300 overflow-hidden flex flex-col">
            
            {/* Header Drawer Control for Mobile / Info for Desktop */}
            <div className="px-5 py-4 border-b border-gray-100/80 dark:border-gray-800/80 flex items-center justify-between bg-gradient-to-r from-gray-50/50 to-white/50 dark:from-gray-950/20 dark:to-gray-900/20">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="inline-flex w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                  لوحة إضافة العناصر والأسئلة
                </h3>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">ابحث أو اختر نوع الحقل المناسب لنموذجك</p>
              </div>
              <button onClick={onToggle} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Smart Search Bar */}
            <div className="p-4 pb-2 border-b border-gray-50 dark:border-gray-800/50">
              <div className="relative">
                <input
                  type="text"
                  placeholder="ابحث عن سؤال... (مثال: تقييم، بريد، اختيار، تاريخ)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl py-3.5 pr-11 pl-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-bold transition-all"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] bg-gray-200 dark:bg-gray-800 text-gray-500 hover:bg-gray-300 px-2 py-1 rounded-md font-bold transition-colors"
                  >
                    مسح
                  </button>
                )}
              </div>
            </div>

            {/* Premium Categories Scrollbar (Hidden if searching) */}
            {!searchQuery && (
              <div className="flex overflow-x-auto no-scrollbar border-b border-gray-50 dark:border-gray-800 p-3 gap-2 scroll-smooth bg-gray-50/30 dark:bg-gray-900/30">
                {(Object.entries(ITEM_CATEGORIES) as [string, { label: string; icon: string; color: string }][]).map(([cat, info]) => (
                  <button
                    key={cat}
                    onClick={() => onCategoryChange(cat)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs whitespace-nowrap transition-all duration-300 active:scale-95 ${getCategoryColorClasses(cat, selectedCategory === cat)}`}
                  >
                    <span className="text-base">{info.icon}</span>
                    <span>{info.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Elements Display Grid */}
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3.5 max-h-[60vh] md:max-h-[380px] overflow-y-auto custom-scrollbar bg-white dark:bg-gray-900">
              {filteredQuestionTypes.length === 0 ? (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-gray-850 rounded-full flex items-center justify-center text-2xl mb-3">🔍</div>
                  <p className="text-sm font-bold text-gray-500 dark:text-gray-400">لم نجد أي حقل يطابق بحثك</p>
                  <button onClick={() => setSearchQuery('')} className="mt-2 text-xs font-bold text-blue-600 hover:underline">عرض جميع العناصر</button>
                </div>
              ) : (
                filteredQuestionTypes.map(([type, info]) => {
                  const isDevelopment = type === 'file_upload'
                  return (
                    <button
                      key={type}
                      onClick={() => {
                        if (isDevelopment) return
                        onAddQuestion(type)
                        onCategoryChange('basic')
                        onToggle()
                      }}
                      disabled={isDevelopment}
                      className={`flex flex-col items-start text-right p-4 rounded-2.5xl transition-all duration-300 border border-gray-100/70 dark:border-gray-800/70 group/item relative overflow-hidden ${
                        isDevelopment
                          ? 'opacity-40 cursor-not-allowed bg-gray-50/50 dark:bg-gray-900/50 border-dashed border-gray-200'
                          : `bg-white dark:bg-gray-850/30 ${getCardHoverStyle(info.category)} hover:border-gray-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-98 hover:shadow-xl`
                      }`}
                    >
                      {/* Mini visual background glow */}
                      <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full bg-blue-500/5 blur-xl group-hover/item:bg-blue-500/10 transition-all duration-300" />
                      
                      <div className="w-full flex items-center justify-between mb-2">
                        {/* Icon Container with category specific gradient */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm transition-all duration-300 group-hover/item:scale-110 group-hover/item:-rotate-3 ${getIconContainerStyle(info.category)}`}>
                          {info.icon}
                        </div>
                        
                        {/* Status/Category Badge */}
                        {isDevelopment ? (
                          <span className="text-[8px] font-black bg-gray-100 dark:bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full border border-gray-200/50 uppercase">قريباً</span>
                        ) : (
                          <span className="text-[8px] font-black bg-gray-50 dark:bg-gray-800 text-gray-450 dark:text-gray-400 px-2 py-0.5 rounded-full capitalize">
                            {ITEM_CATEGORIES[info.category]?.label.split(' ')[1] || 'حقل'}
                          </span>
                        )}
                      </div>
                      
                      {/* Text details */}
                      <span className="font-extrabold text-gray-950 dark:text-white text-xs mb-1 tracking-tight group-hover/item:text-blue-600 transition-colors">{info.label}</span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold line-clamp-2 leading-relaxed">{isDevelopment ? 'تحت التطوير البرمجي' : info.description}</span>
                    </button>
                  )
                })
              )}
            </div>

            {/* Quick Tips Footer */}
            <div className="px-5 py-3.5 bg-gray-50/50 dark:bg-gray-950/20 border-t border-gray-100/50 dark:border-gray-800/50 flex items-center justify-between text-[10px] text-gray-400 font-bold">
              <span>💡 اضغط على العنصر لإدراجه مباشرة في أسفل الصفحة</span>
              <span>OPEN.FORM Pro</span>
            </div>
            
          </div>
        </>
      )}
    </div>
  )
}
