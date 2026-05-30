'use client'

import { useState } from 'react'
import RichTextEditor from '@/components/RichTextEditor'
import ProductGroupsEditor from '@/components/ProductGroupsEditor'
import PaymentMethodsEditor from '@/components/PaymentMethodsEditor'
import { QUESTION_TYPES, DISPLAY_ONLY_QUESTION_TYPES, DATE_RANGE_MODE_OPTIONS, WEEKDAY_OPTIONS } from '@/constants/questionTypes'
import type { QuestionType } from '@/types'
import { parseOptions, normalizeProductGroups, normalizePaymentMethods, getAppointmentConfig, getAppointmentSlots, setAppointmentOptions, addAppointmentSlot, updateAppointmentSlot, removeAppointmentSlot } from '@/app/forms/create/utils'
import type { Question, FormData } from '@/app/forms/create/types'

interface QuestionListProps {
  questions: Question[]
  onUpdateQuestion: (index: number, updates: Partial<Question>) => void
  onRemoveQuestion: (index: number) => void
  onMoveQuestion: (index: number, direction: 'up' | 'down') => void
  onDuplicateQuestion: (index: number) => void
  onAddOption: (qIndex: number) => void
  onRemoveOption: (qIndex: number, optIndex: number) => void
  onUpdateOption: (qIndex: number, optIndex: number, updates: any) => void
  onAddMatrixRow: (qIndex: number) => void
  onRemoveMatrixRow: (qIndex: number, rowIndex: number) => void
  onUpdateMatrixRow: (qIndex: number, rowIndex: number, updates: any) => void
  onAddMatrixColumn: (qIndex: number) => void
  onRemoveMatrixColumn: (qIndex: number, colIndex: number) => void
  onUpdateMatrixColumn: (qIndex: number, colIndex: number, updates: any) => void
  onParseBulkText: (qIndex: number) => void
  formData: FormData
}

export default function QuestionList({
  questions, onUpdateQuestion, onRemoveQuestion, onMoveQuestion,
  onDuplicateQuestion, onAddOption, onRemoveOption, onUpdateOption,
  onAddMatrixRow, onRemoveMatrixRow, onUpdateMatrixRow,
  onAddMatrixColumn, onRemoveMatrixColumn, onUpdateMatrixColumn,
  onParseBulkText, formData
}: QuestionListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(questions.map(q => q.id)))
  const [activeTab, setActiveTab] = useState<Record<string, 'content' | 'logic' | 'settings'>>({})

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-4">
      {questions.map((question: any, qIndex: number) => {
        const isExpanded = expandedIds.has(question.id)
        const tab = activeTab[question.id] || 'content'
        
        return (
        <div key={question.id} className={`bg-white rounded-2xl border transition-all duration-300 ${isExpanded ? 'shadow-lg border-blue-200 ring-1 ring-blue-50' : 'hover:border-gray-300 border-gray-100 shadow-sm'}`}>
          {/* Question Header */}
          <div className={`p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 ${isExpanded ? 'border-b border-gray-50 bg-gray-50/30' : ''}`}>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="w-8 h-8 flex-shrink-0 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-sm shadow-blue-500/20">
                {qIndex + 1}
              </span>
              <div className="flex-1 min-w-0">
                 <div className="flex items-center gap-2">
                   <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg border border-blue-100 uppercase tracking-tighter sm:tracking-wider">
                    {QUESTION_TYPES[question.type as QuestionType]?.label}
                  </span>
                  {question.required && (
                    <span className="text-red-500 font-bold" title="مطلوب">*</span>
                  )}
                 </div>
              </div>
              <button onClick={() => toggleExpand(question.id)} className="sm:hidden p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all">
                <svg className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            <div className="flex-1 w-full min-w-0 px-1 sm:px-0">
              {question.type === 'static_text' ? (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                  <RichTextEditor
                    value={question.text}
                    onChange={(html) => onUpdateQuestion(qIndex, { text: html })}
                    placeholder="اكتب النص هنا..."
                  />
                </div>
              ) : ['terms'].includes(question.type) ? (
                <textarea
                  value={question.text}
                  onChange={(e) => onUpdateQuestion(qIndex, { text: e.target.value })}
                  placeholder="اكتب النص هنا..."
                  rows={1}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm transition-all outline-none"
                />
              ) : (
                <input
                  type="text"
                  value={question.text}
                  onChange={(e) => onUpdateQuestion(qIndex, { text: e.target.value })}
                  placeholder="اكتب السؤال هنا..."
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-bold transition-all outline-none"
                />
              )}
            </div>

            <div className="flex items-center gap-1 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-50">
              <button
                onClick={() => onMoveQuestion(qIndex, 'up')}
                disabled={qIndex === 0}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl disabled:opacity-20 transition-all active:scale-90"
                title="نقل للأعلى"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                onClick={() => onMoveQuestion(qIndex, 'down')}
                disabled={qIndex === questions.length - 1}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl disabled:opacity-20 transition-all active:scale-90"
                title="نقل للأسفل"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button
                onClick={() => onDuplicateQuestion(qIndex)}
                className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all active:scale-90"
                title="نسخ السؤال"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 5.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
              </button>
              <button
                onClick={() => { if(confirm('حذف السؤال؟')) onRemoveQuestion(qIndex) }}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                title="حذف"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button onClick={() => toggleExpand(question.id)} className="hidden sm:block p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                <svg className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Question Body */}
          {isExpanded && (
            <div className="p-4 sm:p-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
              {/* Question Tabs - Scrollable on mobile */}
              <div className="flex border-b border-gray-100 -mx-4 sm:-mx-6 px-4 sm:px-6 mb-6 overflow-x-auto no-scrollbar scroll-smooth">
                <button 
                  onClick={() => setActiveTab(prev => ({...prev, [question.id]: 'content'}))} 
                  className={`px-5 py-3 text-xs sm:text-sm font-black whitespace-nowrap transition-all relative ${tab === 'content' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  المحتوى والخيارات
                  {tab === 'content' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full shadow-[0_-2px_6px_rgba(37,99,235,0.3)]" />}
                </button>
                <button 
                  onClick={() => setActiveTab(prev => ({...prev, [question.id]: 'logic'}))} 
                  className={`px-5 py-3 text-xs sm:text-sm font-black whitespace-nowrap transition-all relative ${tab === 'logic' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  المنطق (Visibility)
                  {tab === 'logic' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full shadow-[0_-2px_6px_rgba(37,99,235,0.3)]" />}
                </button>
                <button 
                  onClick={() => setActiveTab(prev => ({...prev, [question.id]: 'settings'}))} 
                  className={`px-5 py-3 text-xs sm:text-sm font-black whitespace-nowrap transition-all relative ${tab === 'settings' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  إعدادات متقدمة
                  {tab === 'settings' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full shadow-[0_-2px_6px_rgba(37,99,235,0.3)]" />}
                </button>
              </div>

              {tab === 'content' && (
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-3">
                    {!DISPLAY_ONLY_QUESTION_TYPES.includes(question.type) && (
                      <label className="flex items-center gap-2 p-2 px-3 bg-blue-50/50 border border-blue-100 rounded-xl cursor-pointer hover:bg-blue-100/50 transition-colors group">
                        <input
                          type="checkbox"
                          checked={question.required}
                          onChange={(e) => onUpdateQuestion(qIndex, { required: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded border-blue-300 focus:ring-blue-500"
                        />
                        <span className="text-xs font-black text-blue-700 uppercase tracking-wider">سؤال إلزامي</span>
                      </label>
                    )}
                    
                    {!!((formData as any)._is_test) && !['single_choice', 'multiple_choice', 'dropdown', 'ranking', 'matrix', 'button_choice', 'match_items', 'static_text', 'static_image', 'divider', 'terms', 'youtube'].includes(question.type) && (
                    <div className="flex items-center gap-2 p-1.5 px-3 bg-amber-50 border border-amber-100 rounded-xl">
                      <label className="text-xs font-black text-amber-700 uppercase">النقاط:</label>
                      <input
                        type="number"
                        min="0"
                        value={question.points}
                        onChange={(e) => onUpdateQuestion(qIndex, { points: Number(e.target.value) })}
                        className="w-14 px-2 py-1 bg-white border border-amber-200 rounded-lg text-center font-black text-amber-900 text-sm outline-none focus:border-amber-400"
                      />
                    </div>
                    )}
                  </div>
            
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
              return <span className="p-2 px-3 bg-emerald-50 text-emerald-700 text-sm font-bold rounded-xl border border-emerald-100">إجمالي النقاط: {total}</span>
            })()}
          {/* Text validation */}
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
                onUpdateQuestion(qIndex, { options: [{ validation_type: firstVal, validation_category: '', validation_value: '', validation_min: '', validation_max: '' }] as any })
              } else if (firstVal === 'name') {
                const wordCount = secondVal ? parseInt(secondVal.split('_')[1]) : 2
                onUpdateQuestion(qIndex, { options: [{ validation_type: 'name', validation_category: 'name', validation_value: String(wordCount), validation_min: '', validation_max: '' }] as any })
              } else if (firstVal === 'number') {
                const sv = secondVal || 'equal_to'
                onUpdateQuestion(qIndex, { options: [{ validation_type: sv, validation_category: 'number', validation_value: '', validation_min: '', validation_max: '' }] as any })
              } else if (firstVal === 'text_check') {
                const sv = secondVal || 'contains_word'
                onUpdateQuestion(qIndex, { options: [{ validation_type: sv, validation_category: 'text_check', validation_value: sv === 'contains_word' || sv === 'does_not_contain' ? '' : '', validation_min: '', validation_max: '' }] as any })
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
              <div className="space-y-4 mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm font-medium text-purple-700 mb-2">نوع التحقق من الإجابة:</p>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={currentFirst.value}
                    onChange={(e) => setValidation(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-sm focus:ring-1 focus:ring-purple-500"
                  >
                    {firstOptions.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  {secondOptions.length > 0 && (
                    <select
                      value={currentSecondVal}
                      onChange={(e) => setValidation(currentFirst.value, e.target.value)}
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
                      onChange={(e) => onUpdateQuestion(qIndex, { options: [{ validation_type: vt, validation_value: e.target.value, validation_min: '', validation_max: '' }] as any })}
                      placeholder="أدخل النص..."
                      className="px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-sm focus:ring-1 focus:ring-purple-500 w-40"
                    />
                  )}
                  {(currentFirst.value === 'number' && (vt === 'equal_to' || vt === 'not_equal_to' || vt === 'less_than' || vt === 'less_than_or_equal' || vt === 'greater_than' || vt === 'greater_than_or_equal')) && (
                    <input
                      type="number"
                      step="any"
                      value={meta.validation_value ?? ''}
                      onChange={(e) => onUpdateQuestion(qIndex, { options: [{ validation_type: vt, validation_value: e.target.value, validation_min: '', validation_max: '' }] as any })}
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
                        onChange={(e) => onUpdateQuestion(qIndex, { options: [{ validation_type: vt, validation_min: e.target.value, validation_max: meta.validation_max || '', validation_value: '' }] as any })}
                        placeholder="الصغرى..."
                        className="px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-sm focus:ring-1 focus:ring-purple-500 w-28"
                      />
                      <input
                        type="number"
                        step="any"
                        value={meta.validation_max ?? ''}
                        onChange={(e) => onUpdateQuestion(qIndex, { options: [{ validation_type: vt, validation_min: meta.validation_min || '', validation_max: e.target.value, validation_value: '' }] as any })}
                        placeholder="العظمى..."
                        className="px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-sm focus:ring-1 focus:ring-purple-500 w-28"
                      />
                    </>
                  )}
                </div>
              </div>
            )
          })()}

          {/* Matrix */}
          {question.type === 'matrix' && (
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">الصفوف:</p>
                <div className="space-y-2">
                  {(question.matrix_rows || []).map((row: any, rIndex: number) => (
                    <div key={row.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white rounded-lg p-3 border border-gray-200">
                      <span className="text-gray-400">⊞</span>
                      <input
                        type="text"
                        value={row.text}
                        onChange={(e) => onUpdateMatrixRow(qIndex, rIndex, { text: e.target.value })}
                        placeholder="نص السؤال..."
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                      />
                      <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={row.required}
                          onChange={(e) => onUpdateMatrixRow(qIndex, rIndex, { required: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        إجباري
                      </label>
                      <button
                        onClick={() => onRemoveMatrixRow(qIndex, rIndex)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        aria-label="حذف الصف"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => onAddMatrixRow(qIndex)}
                    className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    إضافة صف
                  </button>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">رؤوس الأعمدة:</p>
                <div className="space-y-2">
                  {(question.matrix_columns || []).map((col: any, cIndex: number) => (
                    <div key={col.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-amber-50 rounded-lg p-3 border border-amber-200">
                      <span className="text-gray-400">☐</span>
                      <input
                        type="text"
                        value={col.text}
                        onChange={(e) => onUpdateMatrixColumn(qIndex, cIndex, { text: e.target.value })}
                        placeholder="عنوان العمود..."
                        className="flex-1 px-3 py-2 border border-amber-200 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white"
                      />
                      <div className={`flex items-center gap-1 ${!!((formData as any)._is_test) ? '' : 'hidden'}`}>
                        <span className="text-xs text-gray-500">الدرجة:</span>
                        <input
                          type="number"
                          min="0"
                          value={col.points}
                          onChange={(e) => onUpdateMatrixColumn(qIndex, cIndex, { points: Number(e.target.value) })}
                          className="w-16 px-2 py-2 border border-amber-200 rounded-lg text-center bg-white"
                        />
                      </div>
                      <button
                        onClick={() => onRemoveMatrixColumn(qIndex, cIndex)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        aria-label="حذف العمود"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => onAddMatrixColumn(qIndex)}
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

          {/* Dropdown */}
          {question.type === 'dropdown' && (
            <div className="space-y-3">
              <div className="flex gap-3 bg-gray-50 rounded-lg p-2 border border-gray-200">
                <button
                  type="button"
                  onClick={() => onUpdateQuestion(qIndex, { dropdown_type: 'single', correct_option_ids: [], correct_option_id: undefined })}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${question.dropdown_type === 'single' ? 'bg-white text-blue-700 shadow-sm border border-blue-200' : 'text-gray-600 hover:text-gray-800'}`}
                >
                  اختيار واحد
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateQuestion(qIndex, { dropdown_type: 'multiple', correct_option_id: undefined })}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${question.dropdown_type === 'multiple' ? 'bg-white text-blue-700 shadow-sm border border-blue-200' : 'text-gray-600 hover:text-gray-800'}`}
                >
                  اختيار متعدد
                </button>
              </div>

              <p className="text-sm font-medium text-gray-700">الخيارات:</p>
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <p className="text-xs text-blue-700 mb-2">إضافة خيارات دفعة واحدة (كل سطر خيار):</p>
                <textarea
                  value={question.bulk_text || ''}
                  onChange={(e) => onUpdateQuestion(qIndex, { bulk_text: e.target.value })}
                  placeholder={`الخيار الأول\nالخيار الثاني\nالخيار الثالث`}
                  rows={3}
                  className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={() => onParseBulkText(qIndex)}
                  disabled={!question.bulk_text?.trim()}
                  className="mt-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  إضافة الخيارات
                </button>
              </div>
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
                      onChange={(e) => onUpdateOption(qIndex, oIndex, { text: e.target.value })}
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
                              onUpdateQuestion(qIndex, { correct_option_ids: newIds })
                            } else {
                              onUpdateQuestion(qIndex, { correct_option_id: question.correct_option_id === option.id ? undefined : option.id })
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
                        onChange={(e) => onUpdateOption(qIndex, oIndex, { points: Number(e.target.value) })}
                        placeholder="الدرجة"
                        className={`w-16 px-2 py-2 border border-gray-200 rounded-lg text-center ${!!((formData as any)._is_test) ? '' : 'hidden'}`}
                      />
                    </div>
                    <button
                      onClick={() => onRemoveOption(qIndex, oIndex)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      aria-label="حذف الخيار"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )})}
              <button
                onClick={() => onAddOption(qIndex)}
                className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                إضافة خيار
              </button>
            </div>
          )}

          {/* Single/Multiple Choice, Ranking, Button Choice */}
          {(question.type === 'single_choice' || question.type === 'multiple_choice' || question.type === 'ranking' || question.type === 'button_choice') && (
            <div className="space-y-3">
              {question.type === 'single_choice' && (
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!question.has_counter}
                    onChange={(e) => onUpdateQuestion(qIndex, { has_counter: e.target.checked })}
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
                      onChange={(e) => onUpdateOption(qIndex, oIndex, { text: e.target.value })}
                      placeholder="نص الخيار..."
                      className="w-full sm:flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      min="0"
                      value={option.points}
                      onChange={(e) => onUpdateOption(qIndex, oIndex, { points: Number(e.target.value) })}
                      placeholder="النقاط"
                      className={`w-20 px-2 py-2 border border-gray-200 rounded-lg text-center ${!!((formData as any)._is_test) ? '' : 'hidden'}`}
                      title="النقاط"
                    />
                    {question.has_counter && (
                      <input
                        type="number"
                        min="1"
                        value={option.counter_target || ''}
                        onChange={(e) => onUpdateOption(qIndex, oIndex, { counter_target: parseInt(e.target.value) || null })}
                        placeholder="الهدف"
                        className="w-20 px-2 py-2 border border-emerald-200 rounded-lg text-center text-sm"
                        title="العدد المستهدف للتسبيح"
                      />
                    )}
                    <button
                      onClick={() => onRemoveOption(qIndex, oIndex)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      aria-label="حذف الخيار"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => onAddOption(qIndex)}
                className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                إضافة خيار
              </button>
            </div>
          )}

          {/* Match Items */}
          {question.type === 'match_items' && (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">العمود الأيمن (الخيارات):</p>
                <div className="space-y-2">
                  {(question.matrix_rows || []).map((row: any, ri: number) => (
                    <div key={ri} className="flex items-center gap-2">
                      <input type="text" value={row.text} onChange={(e) => onUpdateMatrixRow(qIndex, ri, { text: e.target.value })} placeholder={`عنصر ${ri + 1}`} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg" />
                      <button onClick={() => onRemoveMatrixRow(qIndex, ri)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" aria-label="حذف العنصر"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                  ))}
                </div>
                <button onClick={() => onAddMatrixRow(qIndex)} className="mt-2 text-sm text-blue-600 hover:text-blue-700">+ إضافة عنصر</button>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">العمود الأيسر (الإجابات):</p>
                <div className="space-y-2">
                  {(question.matrix_columns || []).map((col: any, ci: number) => (
                    <div key={ci} className="flex items-center gap-2">
                      <input type="text" value={col.text} onChange={(e) => onUpdateMatrixColumn(qIndex, ci, { text: e.target.value })} placeholder={`إجابة ${ci + 1}`} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg" />
                      <input type="number" min="0" value={col.points} onChange={(e) => onUpdateMatrixColumn(qIndex, ci, { points: Number(e.target.value) })} className={`w-16 px-2 py-2 border border-gray-200 rounded-lg text-center ${!!((formData as any)._is_test) ? '' : 'hidden'}`} placeholder="نقاط" />
                      <button onClick={() => onRemoveMatrixColumn(qIndex, ci)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" aria-label="حذف الإجابة"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                  ))}
                </div>
                <button onClick={() => onAddMatrixColumn(qIndex)} className="mt-2 text-sm text-blue-600 hover:text-blue-700">+ إضافة إجابة</button>
              </div>
            </div>
          )}

          {/* Slider */}
          {question.type === 'slider' && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-700 mb-3">إعدادات الشريط الرقمي (Min|Max|Step):</p>
              <input type="text" value={(parseOptions(question.options)[0] || {}).text || '0|100|1'} onChange={(e) => { if(parseOptions(question.options).length===0) onAddOption(qIndex); onUpdateOption(qIndex, 0, { text: e.target.value }) }} className="w-full px-3 py-2 border border-gray-200 rounded-lg" dir="ltr" placeholder="0|100|1" />
              <p className="text-xs text-gray-500 mt-1">أدخل الحد الأدنى | الحد الأقصى | مقدار الزيادة</p>
            </div>
          )}

          {/* YouTube */}
          {question.type === 'youtube' && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-700 mb-3">رابط يوتيوب:</p>
              <input type="text" value={(parseOptions(question.options)[0] || {}).text || ''} onChange={(e) => { if(parseOptions(question.options).length===0) onAddOption(qIndex); onUpdateOption(qIndex, 0, { text: e.target.value }) }} className="w-full px-3 py-2 border border-gray-200 rounded-lg" dir="ltr" placeholder="https://youtube.com/watch?v=..." />
            </div>
          )}

          {/* Appointment */}
          {question.type === 'appointment' && (() => {
            const appointmentConfig = getAppointmentConfig(question.options)
            const appointmentSlots = getAppointmentSlots(question.options)
            return (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">نوع المواعيد</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {[
                      { value: 'fixed', label: 'مواعيد ثابتة', hint: 'نفس المواعيد متاحة كل يوم.' },
                      { value: 'custom', label: 'مواعيد مخصصة', hint: 'مواعيد مختلفة حسب اليوم أو التاريخ.' },
                      { value: 'auto', label: 'موعد تلقائي', hint: 'يعرض أقرب موعد تلقائيًا، وكل حجز جديد يزيد بعدد دقائق تحدده.' },
                    ].map((mode) => (
                      <button
                        key={mode.value}
                        type="button"
                        onClick={() => onUpdateQuestion(qIndex, setAppointmentOptions(question, { mode: mode.value }))}
                        className={`text-right p-3 rounded-xl border transition-colors ${appointmentConfig.mode === mode.value ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'}`}
                      >
                        <span className="block text-sm font-semibold">{mode.label}</span>
                        <span className="block text-xs mt-1 opacity-75">{mode.hint}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {appointmentConfig.mode === 'custom' && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">تخصيص المواعيد حسب</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <button type="button" onClick={() => onUpdateQuestion(qIndex, setAppointmentOptions(question, { customBy: 'weekday' }))} className={`px-3 py-2 rounded-lg border text-sm ${appointmentConfig.customBy === 'weekday' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200'}`}>أيام الأسبوع</button>
                      <button type="button" onClick={() => onUpdateQuestion(qIndex, setAppointmentOptions(question, { customBy: 'date' }))} className={`px-3 py-2 rounded-lg border text-sm ${appointmentConfig.customBy === 'date' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200'}`}>تاريخ محدد</button>
                    </div>
                  </div>
                )}

                {appointmentConfig.mode === 'auto' && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="block text-sm font-medium text-gray-700 mb-1.5">بداية أول موعد</span>
                      <input
                        type="datetime-local"
                        value={appointmentSlots[0]?.validation_value || ''}
                        onChange={(e) => {
                          const firstSlot = appointmentSlots[0] || { id: `appt_auto_${Date.now()}`, text: '', points: 0 }
                          onUpdateQuestion(qIndex, setAppointmentOptions(question, {}, [{ ...firstSlot, text: 'auto', validation_category: 'auto', validation_value: e.target.value, validation_min: firstSlot.validation_min || '30' }]))
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                      />
                    </label>
                    <label className="block">
                      <span className="block text-sm font-medium text-gray-700 mb-1.5">فرق الدقائق بين كل حالة</span>
                      <input
                        type="number"
                        min="1"
                        value={appointmentSlots[0]?.validation_min || '30'}
                        onChange={(e) => {
                          const firstSlot = appointmentSlots[0] || { id: `appt_auto_${Date.now()}`, text: 'auto', points: 0, validation_category: 'auto' }
                          onUpdateQuestion(qIndex, setAppointmentOptions(question, {}, [{ ...firstSlot, validation_category: 'auto', validation_value: firstSlot.validation_value || '', validation_min: e.target.value }]))
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                      />
                    </label>
                    <p className="sm:col-span-2 text-xs text-gray-500">مثال: لو أول موعد 10:00 والفرق 15 دقيقة، أول حجز يكون 10:00 والثاني 10:15 والثالث 10:30.</p>
                  </div>
                )}

                {appointmentConfig.mode !== 'auto' && <label className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={appointmentConfig.single}
                    onChange={(e) => onUpdateQuestion(qIndex, setAppointmentOptions(question, { single: e.target.checked }))}
                    className="w-4 h-4 mt-0.5 text-amber-600 rounded"
                  />
                  <span>
                    <span className="block text-sm font-medium text-amber-800">مواعيد منفردة</span>
                    <span className="block text-xs text-amber-700 mt-1">لو مستخدم اختار موعد، يختفي هذا الموعد من الاختيارات المتاحة لباقي المستخدمين.</span>
                  </span>
                </label>}

                {appointmentConfig.mode !== 'auto' && <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">المواعيد المتاحة</p>
                  {appointmentSlots.map((slot: any, slotIndex: number) => (
                    <div key={slot.id || slotIndex} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] items-center bg-white border border-gray-200 rounded-xl p-2">
                      {appointmentConfig.mode === 'custom' && appointmentConfig.customBy === 'weekday' && (
                        <select value={slot.validation_value || '0'} onChange={(e) => onUpdateQuestion(qIndex, updateAppointmentSlot(question, slotIndex, { validation_category: 'weekday', validation_value: e.target.value }))} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                          {WEEKDAY_OPTIONS.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
                        </select>
                      )}
                      {appointmentConfig.mode === 'custom' && appointmentConfig.customBy === 'date' && (
                        <input type="date" value={slot.validation_value || ''} onChange={(e) => onUpdateQuestion(qIndex, updateAppointmentSlot(question, slotIndex, { validation_category: 'date', validation_value: e.target.value }))} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white" />
                      )}
                      <input type="time" value={slot.text || ''} onChange={(e) => onUpdateQuestion(qIndex, updateAppointmentSlot(question, slotIndex, { text: e.target.value, validation_category: appointmentConfig.mode === 'fixed' ? 'fixed' : appointmentConfig.customBy }))} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white" />
                      <button type="button" onClick={() => onUpdateQuestion(qIndex, removeAppointmentSlot(question, slotIndex))} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" aria-label="حذف الموعد">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => onUpdateQuestion(qIndex, addAppointmentSlot(question))} className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors text-sm">
                    + إضافة موعد
                  </button>
                </div>}
              </div>
            )
          })()}

          {/* Date Range */}
          {question.type === 'date_range' && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-700 mb-3">نوع النطاق:</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {DATE_RANGE_MODE_OPTIONS.map((mode) => {
                  const currentMode = parseOptions(question.options)[0]?.validation_type || 'datetime'
                  const isSelected = currentMode === mode.value
                  return (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => {
                        if (parseOptions(question.options).length === 0) onAddOption(qIndex)
                        onUpdateOption(qIndex, 0, { validation_type: mode.value })
                      }}
                      className={`px-3 py-2 rounded-lg border text-sm transition-colors ${isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'}`}
                    >
                      {mode.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Countdown Timer */}
          {question.type === 'countdown_timer' && (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">العد التنازلي للعرض</p>
                <p className="text-xs text-gray-500">حدد وقت انتهاء العرض والنص الذي سيظهر للمستخدم.</p>
              </div>
              <input
                type="text"
                value={parseOptions(question.options)[0]?.validation_value || 'العرض ينتهي خلال'}
                onChange={(e) => {
                  if (parseOptions(question.options).length === 0) onAddOption(qIndex)
                  onUpdateOption(qIndex, 0, { validation_value: e.target.value })
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                placeholder="العرض ينتهي خلال"
              />
              <input
                type="datetime-local"
                value={parseOptions(question.options)[0]?.text || ''}
                onChange={(e) => {
                  if (parseOptions(question.options).length === 0) onAddOption(qIndex)
                  onUpdateOption(qIndex, 0, { text: e.target.value })
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              />
              <textarea
                value={parseOptions(question.options)[0]?.validation_min || ''}
                onChange={(e) => {
                  if (parseOptions(question.options).length === 0) onAddOption(qIndex)
                  onUpdateOption(qIndex, 0, { validation_min: e.target.value })
                }}
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                placeholder="وصف اختياري يظهر أسفل العد"
              />
            </div>
          )}

          {/* Products Block */}
          {question.type === 'products_block' && (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">المنتجات</p>
                <p className="text-xs text-gray-500">أضف مجموعات، وداخل كل مجموعة الأصناف والسعر والتفاصيل والصورة.</p>
              </div>
              <ProductGroupsEditor
                groups={normalizeProductGroups(parseOptions(question.options))}
                onChange={(groups) => onUpdateQuestion(qIndex, { options: groups as any })}
              />
            </div>
          )}

          {/* Payment Info Block */}
          {question.type === 'payment_info_block' && (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">بيانات الدفع</p>
                <p className="text-xs text-gray-500">اكتب بياناتك التي ستظهر للمستخدم مع زر نسخ لكل رقم أو رابط.</p>
              </div>
              <PaymentMethodsEditor
                methods={normalizePaymentMethods(parseOptions(question.options))}
                onChange={(methods) => onUpdateQuestion(qIndex, { options: methods as any })}
              />
            </div>
          )}

          {/* Star Rating */}
          {question.type === 'star_rating' && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-700 mb-3">عدد النجوم:</p>
              <input type="number" min="1" max="10" value={parseOptions(question.options).length} onChange={(e) => {
                const count = parseInt(e.target.value) || 5;
                onUpdateQuestion(qIndex, { options: Array.from({ length: count }).map((_, i) => ({ id: `opt_${Date.now()}_${i}`, text: String(i+1), points: i+1 })) });
              }} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
            </div>
          )}

          {/* Static Image */}
          {question.type === 'static_image' && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-700 mb-3">رابط الصورة (URL):</p>
              <input type="text" value={(parseOptions(question.options)[0] || {}).validation_value || ''} onChange={(e) => { if(parseOptions(question.options).length===0) onAddOption(qIndex); onUpdateOption(qIndex, 0, { validation_value: e.target.value }) }} className="w-full px-3 py-2 border border-gray-200 rounded-lg" dir="ltr" placeholder="https://..." />
              <p className="text-xs text-gray-500 mt-1">انسخ رابط الصورة وضعه هنا</p>
            </div>
          )}

          {/* Scale */}
          {question.type === 'scale' && (
            <div className="space-y-4 bg-blue-50 rounded-lg p-4 overflow-x-auto">
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
                        const idx = parseOptions(question.options).findIndex((o: any) => o.id === opt.id)
                        onUpdateOption(qIndex, idx, { points: Number(e.target.value) })
                      }}
                      className={`w-12 px-1 py-1 border border-blue-200 rounded text-center text-sm ${!!((formData as any)._is_test) ? '' : 'hidden'}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>
              )}

              {tab === 'logic' && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-200 space-y-4">
                  <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                    <h4 className="text-sm font-bold text-purple-800 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      قواعد العرض المشروط
                    </h4>
                    <p className="text-xs text-purple-600 mb-4">يمكنك تحديد متى يظهر هذا السؤال بناءً على إجابات الأسئلة السابقة.</p>
                    
                    <div className="space-y-3">
                      {(question.visibility_rules || []).map((rule: any, rIdx: number) => (
                        <div key={rIdx} className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-xl border border-purple-100 shadow-sm">
                          <select 
                            value={rule.question_id} 
                            onChange={(e) => {
                              const rules = [...(question.visibility_rules || [])]
                              rules[rIdx] = { ...rules[rIdx], question_id: e.target.value }
                              onUpdateQuestion(qIndex, { visibility_rules: rules })
                            }}
                            className="flex-1 min-w-[150px] px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                          >
                            <option value="">اختر السؤال...</option>
                            {questions.slice(0, qIndex).filter(q => !DISPLAY_ONLY_QUESTION_TYPES.includes(q.type)).map(q => (
                              <option key={q.id} value={q.id}>{q.text || `سؤال ${questions.indexOf(q) + 1}`}</option>
                            ))}
                          </select>
                          
                          <select 
                            value={rule.operator}
                            onChange={(e) => {
                              const rules = [...(question.visibility_rules || [])]
                              rules[rIdx] = { ...rules[rIdx], operator: e.target.value }
                              onUpdateQuestion(qIndex, { visibility_rules: rules })
                            }}
                            className="w-32 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                          >
                            <option value="equals">يساوي</option>
                            <option value="not_equals">لا يساوي</option>
                            <option value="contains">يحتوي على</option>
                          </select>

                          <input 
                            type="text" 
                            value={rule.value}
                            onChange={(e) => {
                              const rules = [...(question.visibility_rules || [])]
                              rules[rIdx] = { ...rules[rIdx], value: e.target.value }
                              onUpdateQuestion(qIndex, { visibility_rules: rules })
                            }}
                            placeholder="القيمة..."
                            className="flex-1 min-w-[100px] px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                          />

                          <button 
                            onClick={() => {
                              const rules = (question.visibility_rules || []).filter((_: any, i: number) => i !== rIdx)
                              onUpdateQuestion(qIndex, { visibility_rules: rules })
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}

                      <button 
                        onClick={() => {
                          const rules = [...(question.visibility_rules || []), { question_id: '', operator: 'equals', value: '' }]
                          onUpdateQuestion(qIndex, { visibility_rules: rules })
                        }}
                        className="w-full py-2 border-2 border-dashed border-purple-200 text-purple-600 rounded-xl hover:bg-purple-100/50 transition-colors text-sm font-bold flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        إضافة قاعدة عرض
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'settings' && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-200 space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 block">الصفحة (Page)</label>
                      <p className="text-xs text-gray-500 mb-2">تحديد الصفحة التي يظهر فيها هذا السؤال في النماذج متعددة الصفحات.</p>
                      <input 
                        type="number" 
                        min="1" 
                        value={question.page || 1} 
                        onChange={(e) => onUpdateQuestion(qIndex, { page: parseInt(e.target.value) || 1 })}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 block">معرف المجموعة (Row Group)</label>
                      <p className="text-xs text-gray-500 mb-2">يستخدم لربط الأسئلة ببعضها برمجياً (اختياري).</p>
                      <input 
                        type="number" 
                        value={question.row_group || ''} 
                        onChange={(e) => onUpdateQuestion(qIndex, { row_group: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )})}

      {questions.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-500 mb-4">لم تضف أي أسئلة بعد</p>
        </div>
      )}
    </div>
  )
}
