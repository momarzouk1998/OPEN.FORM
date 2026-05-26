'use client'

import { useState, useRef, useEffect } from 'react'
import NextImage from 'next/image'
import {
  parseOptions,
  parseMatrixData,
  formatCountdown,
  formatArabicTime,
  normalizeProductGroups,
  normalizePaymentMethods,
  copyPaymentValue,
  getAppointmentConfig,
  getAppointmentSlots,
  getAutoAppointment,
  getTimeSlotsForDate,
  getAvailableTimeSlots,
  isDateFullyBooked,
  isSameDay,
  getDaysInMonth,
  getFirstDayOfMonth,
  ARABIC_MONTHS,
  ARABIC_DAYS,
  type Question,
  type ProductGroup,
  type PaymentMethod
} from '@/lib/formFillerUtils'

type Answers = Record<string, string | number | boolean | string[] | Record<string, string> | null | undefined>
type BookedSlots = Record<string, Record<string, string[]>>
type FormData = {
  page_titles?: Record<string, any>
  image_url?: string
}
type QuestionOption = { id?: string; text: string; points?: number; validation_type?: string; validation_category?: string; validation_value?: string; validation_min?: string; validation_max?: string; sub_options?: any[]; multi?: boolean; available?: boolean; image_url?: string; name?: string; description?: string; price?: number; counter_target?: number | null }

interface QuestionRendererProps {
  question: Question
  index: number
  answers: Answers
  setAnswers: (answers: Answers | ((prev: Answers) => Answers)) => void
  setCurrentQuestionIndex: (fn: (prev: number) => number) => void
  dropdownSearch: Record<string, string>
  setDropdownSearch: (search: Record<string, string>) => void
  dropdownOpen: Record<string, boolean>
  setDropdownOpen: (open: Record<string, boolean>) => void
  countdownNow: number
  cart: Record<string, number>
  setCart: React.Dispatch<React.SetStateAction<Record<string, number>>>
  cartTotal: number
  cartCount: number
  form: FormData
  legacyProductGroups: ProductGroup[]
  legacyPaymentMethods: PaymentMethod[]
  bookedSlots: BookedSlots
  apptMonth: { year: number; month: number }
  setApptMonth: (d: { year: number; month: number }) => void
  allProducts: import('@/lib/formFillerUtils').ProductItem[]
  errors: Record<string, boolean>
  submitting: boolean
  submitted: boolean
  isPreview: boolean
  showPaymentOnSubmit?: boolean
}

export default function QuestionRenderer({
  question, index,
  answers, setAnswers,
  setCurrentQuestionIndex,
  dropdownSearch, setDropdownSearch,
  dropdownOpen, setDropdownOpen,
  countdownNow,
  cart, setCart,
  cartTotal, cartCount,
  form,
  legacyProductGroups, legacyPaymentMethods,
  bookedSlots,
  apptMonth, setApptMonth,
  allProducts,
  errors, submitting, submitted, isPreview,
  showPaymentOnSubmit
}: QuestionRendererProps) {
  const currentAnswer = answers[question.id]
  const currentAnswerStr = typeof currentAnswer === 'string' || typeof currentAnswer === 'number' ? String(currentAnswer) : ''
  const currentAnswerObj = currentAnswer && typeof currentAnswer === 'object' && !Array.isArray(currentAnswer) ? currentAnswer as Record<string, string> : {} as Record<string, string>
  const options = parseOptions(question.options)

  const renderAppointmentCalendar = (question: Question, ca: string | number | boolean | string[] | Record<string, string> | null | undefined, apptObj: Record<string, string> | null) => {
    const currentAnswer = ca && typeof ca === 'object' && !Array.isArray(ca) ? ca as Record<string, string> : {} as Record<string, string>
    const today = new Date()
    const { year, month } = apptMonth
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)
    const monthName = ARABIC_MONTHS[month]
    const questionId = question.id
    const appointmentConfig = getAppointmentConfig(question)

    if (appointmentConfig.mode === 'auto') {
      const auto = getAutoAppointment(question, bookedSlots)
      if (!auto) return <div className="text-sm text-gray-500">لم يتم تحديد موعد البداية</div>
      return (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-bold text-green-700">الموعد التلقائي التالي</p>
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-lg px-4 py-2 text-center">
              <p className="text-lg font-bold text-green-800">{auto.date}</p>
              <p className="text-xs text-green-600">التاريخ</p>
            </div>
            <div className="bg-white rounded-lg px-4 py-2 text-center">
              <p className="text-lg font-bold text-green-800">{auto.time}</p>
              <p className="text-xs text-green-600">الوقت</p>
            </div>
          </div>
          <button
            onClick={() => setAnswers({ ...answers, [questionId]: { date: auto.date, time: auto.time } })}
            className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors ${currentAnswer?.date === auto.date && currentAnswer?.time === auto.time ? 'bg-green-600 text-white' : 'bg-white text-green-700 border border-green-300 hover:bg-green-50'}`}
          >
            {currentAnswer?.date === auto.date && currentAnswer?.time === auto.time ? '✓ تم الحجز' : 'احجز هذا الموعد'}
          </button>
        </div>
      )
    }

    const prevMonth = () => {
      if (month === 0) setApptMonth({ year: year - 1, month: 11 })
      else setApptMonth({ year, month: month - 1 })
    }
    const nextMonth = () => {
      if (month === 11) setApptMonth({ year: year + 1, month: 0 })
      else setApptMonth({ year, month: month + 1 })
    }

    const currentAnswerDate = currentAnswer?.date || ''
    const currentAnswerTime = currentAnswer?.time || ''
    const timeSlotsForCurrent = currentAnswerDate ? getTimeSlotsForDate(question, currentAnswerDate) : []
    const fullyBooked = currentAnswerDate ? isDateFullyBooked(currentAnswerDate, questionId, timeSlotsForCurrent, bookedSlots, appointmentConfig.single) : false

    return (
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-l from-gray-50 to-white border-b border-gray-100">
          <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" type="button" aria-label="الشهر السابق">
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
          <span className="text-sm font-bold text-gray-800">{monthName} {year}</span>
          <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" type="button" aria-label="الشهر التالي">
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
        </div>
        <div className="grid grid-cols-7 gap-px bg-gray-100">
          {ARABIC_DAYS.map(day => (
            <div key={day} className="bg-gray-50 px-1.5 py-2 text-center text-xs font-bold text-gray-500">{day}</div>
          ))}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-white" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const cellDate = new Date(year, month, day)
            const isPast = cellDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())
            const isToday = isSameDay(cellDate, today)
            const timeSlots = getTimeSlotsForDate(question, dateStr)
            const fullyBooked = isDateFullyBooked(dateStr, questionId, timeSlots, bookedSlots, appointmentConfig.single)
            const isSelected = currentAnswerDate === dateStr
            return (
              <button
                key={day}
                disabled={isPast}
                onClick={() => {
                  if (appointmentConfig.single && fullyBooked) return
                  setAnswers({ ...answers, [questionId]: { date: dateStr, time: '' } })
                }}
                className={`bg-white px-1.5 py-2 text-center text-sm transition-all relative ${isPast ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-blue-50 cursor-pointer'} ${isToday ? 'font-bold text-blue-600' : 'text-gray-700'} ${isSelected ? 'bg-blue-100 ring-2 ring-blue-500 rounded-lg' : ''} ${fullyBooked && !isPast ? 'text-red-400 line-through' : ''}`}
              >
                {day}
              </button>
            )
          })}
        </div>
        {currentAnswerDate && !fullyBooked && (() => {
          const timeSlots = getTimeSlotsForDate(question, currentAnswerDate)
          const availableSlots = getAvailableTimeSlots(currentAnswerDate, questionId, timeSlots, bookedSlots, appointmentConfig.single)
          return (
            <div className="p-3 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-600 mb-2">اختر الوقت:</p>
              {availableSlots.length === 0 ? (
                <p className="text-xs text-red-500">لا توجد مواعيد متاحة في هذا اليوم</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {availableSlots.map((slot: string) => (
                    <button
                      key={slot}
                      onClick={() => setAnswers({ ...answers, [questionId]: { date: currentAnswerDate, time: slot } })}
                      className={`px-2 py-2 text-xs font-bold rounded-xl border transition-colors ${currentAnswerTime === slot ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'}`}
                    >
                      {formatArabicTime(slot)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })()}
        {fullyBooked && currentAnswerDate && (
          <div className="p-3 border-t border-gray-100">
            <p className="text-xs text-red-500 text-center">هذا اليوم محجوز بالكامل</p>
          </div>
        )}
        {currentAnswerDate && currentAnswerTime && (
          <div className="px-3 pb-3">
            <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              <p className="text-xs text-green-800">
                الموعد: {currentAnswerDate} الساعة {formatArabicTime(currentAnswerTime)}
              </p>
            </div>
          </div>
        )}
      </div>
    )
  }

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
        : vcat === 'national_id'
        ? 'الرقم القومي (14 رقمًا)'
        : vcat === 'phone'
        ? 'رقم الهاتف'
        : vcat === 'age'
        ? 'العمر'
        : vcat === 'salary'
        ? 'الراتب'
        : question.text || ''

      return (
        <input
          type={vt === 'number' || vcat === 'age' || vcat === 'salary' ? 'number' : 'text'}
          placeholder={placeholderText}
          value={currentAnswerStr}
          onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
          onBlur={() => {
            if (vcat === 'name') {
              const wordCount = (currentAnswerStr || '').trim().split(/\s+/).filter(Boolean).length
              const required = Number(vval) || 0
              if (required > 0 && wordCount !== required) return
            }
            if (vt === 'number' && vmin !== '' && Number(currentAnswerStr) < Number(vmin)) return
            if (vt === 'number' && vmax !== '' && Number(currentAnswerStr) > Number(vmax)) return
            if (currentAnswerStr && vcat === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentAnswerStr)) return
            setCurrentQuestionIndex((prev) => prev + 1)
          }}
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
          disabled={submitting}
        />
      )
    }

    case 'textarea': {
      return (
        <textarea
          placeholder={question.text}
          value={currentAnswerStr}
          onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
          onBlur={() => setCurrentQuestionIndex((prev) => prev + 1)}
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right resize-none"
          rows={4}
          disabled={submitting}
        />
      )
    }

    case 'single_choice': {
      return (
        <div className="space-y-2">
          {options.map((opt: QuestionOption, optIdx: number) => (
            <button
              key={opt.id || optIdx}
              onClick={() => {
                setAnswers({ ...answers, [question.id]: opt.text })
                setCurrentQuestionIndex((prev) => prev + 1)
              }}
              className={`w-full text-right px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${currentAnswer === opt.text ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50/50'}`}
              disabled={submitting}
            >
              {opt.text}
            </button>
          ))}
        </div>
      )
    }

    case 'multiple_choice': {
      const selected = Array.isArray(currentAnswer) ? currentAnswer : []
      return (
        <div className="space-y-2">
          {options.map((opt: QuestionOption, optIdx: number) => {
            const isSelected = selected.includes(opt.text)
            return (
              <button
                key={opt.id || optIdx}
                onClick={() => {
                  const updated = isSelected ? selected.filter((s: string) => s !== opt.text) : [...selected, opt.text]
                  setAnswers({ ...answers, [question.id]: updated })
                  if (updated.length > selected.length) setCurrentQuestionIndex((prev) => prev + 1)
                }}
                className={`w-full text-right px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${isSelected ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50/50'}`}
                disabled={submitting}
              >
                {opt.text}
              </button>
            )
          })}
        </div>
      )
    }

    case 'scale': {
      const scaleOpts = (Array.isArray(options) && options.length > 0) ? options[0] || {} : options || {}
      const min = scaleOpts.validation_value ? Number(scaleOpts.validation_value) : 0
      const max = scaleOpts.validation_min ? Number(scaleOpts.validation_min) : 10
      const step = scaleOpts.validation_type ? Number(scaleOpts.validation_type) : 1
      const showNumbers = scaleOpts.validation_category !== 'emoji'
      const items: { value: number; label: string; emoji: string }[] = []
      for (let v = min; v <= max; v += step) {
        const emojis = ['😡', '😞', '😐', '🙂', '😊']
        const eIdx = Math.min(Math.floor(((v - min) / (max - min)) * (emojis.length - 1)), emojis.length - 1)
        items.push({ value: v, label: String(v), emoji: emojis[eIdx] })
      }
      return (
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          {items.map((item) => (
            <button
              key={item.value}
              onClick={() => {
                setAnswers({ ...answers, [question.id]: item.value })
                setCurrentQuestionIndex((prev) => prev + 1)
              }}
              className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl border-2 transition-all text-sm ${currentAnswer === item.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'}`}
              disabled={submitting}
            >
              {!showNumbers && <span className="text-xl">{item.emoji}</span>}
              {showNumbers && <span className="text-sm font-bold text-gray-700">{item.label}</span>}
            </button>
          ))}
        </div>
      )
    }

    case 'ranking': {
      const rankedItems = Array.isArray(currentAnswer) ? currentAnswer : []
      const unranked = options.filter((opt: QuestionOption) => !rankedItems.includes(opt.id || opt.text))
      return (
        <div className="space-y-3">
          {rankedItems.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-gray-500">الترتيب الحالي:</p>
              {rankedItems.map((itemId: string, ri: number) => (
                <div key={itemId} className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
                  <span className="w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center shrink-0">{ri + 1}</span>
                  <span className="text-sm text-gray-700 flex-1">{options.find((o: QuestionOption) => o.id === itemId || o.text === itemId)?.text || itemId}</span>
                  <button
                    onClick={() => setAnswers({ ...answers, [question.id]: rankedItems.filter((_, i) => i !== ri) })}
                    className="text-red-400 hover:text-red-600"
                    aria-label="إزالة العنصر من الترتيب"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          {unranked.length > 0 && (
            <div className="space-y-1.5">
              {unranked.map((opt: QuestionOption) => (
                <button
                  key={opt.id}
                  onClick={() => setAnswers({ ...answers, [question.id]: [...rankedItems, opt.id || opt.text] })}
                  className="w-full text-right px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-blue-300 hover:bg-blue-50/50 transition-all"
                  disabled={submitting}
                >
                  {opt.text}
                </button>
              ))}
            </div>
          )}
        </div>
      )
    }

    case 'matrix': {
      const matrixData = parseMatrixData(question)
      if (!matrixData) return <div className="text-sm text-gray-500">بيانات المصفوفة غير صحيحة</div>
      const rows = matrixData.matrix_rows || []
      const columns = matrixData.matrix_columns || []
      const isMulti = columns.some((col: { id: string; text: string; multi?: boolean; points?: number }) => col.multi)
      const matrixAnswers: Record<string, string | string[]> = currentAnswer && typeof currentAnswer === 'object' && !Array.isArray(currentAnswer) ? currentAnswer as Record<string, string | string[]> : {}
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="px-2 py-2 text-right text-xs font-bold text-gray-500"></th>
                {columns.map((col: { id: string; text: string; multi?: boolean; points?: number }) => (
                  <th key={col.id} className="px-2 py-2 text-center text-xs font-bold text-gray-500 border-b border-gray-100">{col.text}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row: { id: string; text: string; required?: boolean }, ri: number) => {
                const currentRowAnswer = matrixAnswers[row.id]
                return (
                  <tr key={row.id} className={ri % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'}>
                    <td className="px-2 py-2 text-right text-xs text-gray-700 font-medium whitespace-nowrap">{row.text}</td>
                    {columns.map((col: { id: string; text: string; multi?: boolean; points?: number }) => {
                      const isSelected = isMulti ? Array.isArray(currentRowAnswer) && currentRowAnswer.includes(col.id) : currentRowAnswer === col.id
                      return (
                        <td key={col.id} className="px-2 py-2 text-center">
                          <button
                            onClick={() => {
                              if (isMulti) {
                                const prev = Array.isArray(currentRowAnswer) ? currentRowAnswer : []
                                const updated = isSelected ? prev.filter((id: string) => id !== col.id) : [...prev, col.id]
                                setAnswers({ ...answers, [question.id]: { ...matrixAnswers, [row.id]: updated } as Answers[string] })
                              } else {
                                setAnswers({ ...answers, [question.id]: { ...matrixAnswers, [row.id]: col.id } as Answers[string] })
                              }
                            }}
                            className={`w-6 h-6 rounded-md border-2 transition-all ${isSelected ? 'border-blue-500 bg-blue-100' : 'border-gray-200 hover:border-blue-300'}`}
                            disabled={submitting}
                          />
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )
    }

    case 'dropdown': {
      const [searchTerm, setSearchTerm] = useState(dropdownSearch[question.id] || '')
      const isOpen = dropdownOpen[question.id] || false
      const filteredOptions = options.filter((opt: QuestionOption) => opt.text.toLowerCase().includes(searchTerm.toLowerCase()))
      const selectedOption = options.find((opt: QuestionOption) => opt.text === currentAnswer)
      return (
        <div className="relative">
          <div
            onClick={() => setDropdownOpen({ ...dropdownOpen, [question.id]: !isOpen })}
            className={`w-full px-4 py-3 bg-white border rounded-xl text-right cursor-pointer flex items-center justify-between gap-2 ${isOpen ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'}`}
          >
            <span className={`text-sm ${selectedOption ? 'text-gray-900' : 'text-gray-400'}`}>
              {selectedOption ? selectedOption.text : 'اختر...'}
            </span>
            <svg className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          {isOpen && (
            <div className="absolute top-full end-0 start-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
              <div className="sticky top-0 bg-white p-2 border-b border-gray-100">
                <input
                  type="text"
                  placeholder="بحث..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setDropdownSearch({ ...dropdownSearch, [question.id]: e.target.value }) }}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 text-right"
                />
              </div>
              {filteredOptions.map((opt: QuestionOption) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setAnswers({ ...answers, [question.id]: opt.text })
                    setDropdownOpen({ ...dropdownOpen, [question.id]: false })
                    setDropdownSearch({ ...dropdownSearch, [question.id]: '' })
                  }}
                  className={`w-full text-right px-4 py-2.5 text-sm transition-colors hover:bg-blue-50 ${currentAnswer === opt.text ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700'}`}
                >
                  {opt.text}
                </button>
              ))}
              {filteredOptions.length === 0 && <p className="px-4 py-3 text-sm text-gray-400 text-center">لا توجد نتائج</p>}
            </div>
          )}
        </div>
      )
    }

    case 'date': {
      return (
        <input
          type="date"
          value={currentAnswerStr}
          onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={submitting}
        />
      )
    }

    case 'time': {
      return (
        <input
          type="time"
          value={currentAnswerStr}
          onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={submitting}
        />
      )
    }

    case 'appointment': {
      const apptObj = null
      return renderAppointmentCalendar(question, currentAnswer, apptObj)
    }

    case 'file_upload': {
      return (
        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer bg-gray-50/50">
          <svg className="w-10 h-10 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-sm text-gray-600">{question.text}</p>
        </div>
      )
    }

    case 'static_text':
      return (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-6 text-gray-700 text-right leading-relaxed prose prose-sm max-w-none [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pr-5 [&_ol]:list-decimal [&_ol]:pr-5">
          <div dangerouslySetInnerHTML={{ __html: question.text || 'نص توضيحي' }} />
        </div>
      )

    case 'countdown_timer': {
      const ctOpts = Array.isArray(options) ? options : []
      const endTime = ctOpts[0]?.text || (form.page_titles as any)?._offer_countdown
      if (!endTime) return null
      const diff = Math.floor((new Date(endTime).getTime() - countdownNow) / 1000)
      if (diff <= 0) return null
      const title = ctOpts[0]?.validation_value || 'العرض ينتهي خلال'
      const description = ctOpts[0]?.validation_min || ''
      return (
        <div className="bg-gradient-to-l from-red-500 to-orange-500 rounded-2xl p-4 shadow-lg text-center">
          <p className="text-white/80 text-xs mb-1">{title}</p>
          <p className="text-white text-3xl font-mono font-bold tracking-widest" dir="ltr">
            {formatCountdown(diff)}
          </p>
          {description && <p className="text-white/80 text-xs mt-2">{description}</p>}
        </div>
      )
    }

    case 'products_block': {
      const visibleGroups = normalizeProductGroups(question.options)
      const groupsToShow = visibleGroups.length > 0 ? visibleGroups : legacyProductGroups
      if (groupsToShow.length === 0) return null
      return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 form-themed-card">
          <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            {question.text || 'المنتجات المتاحة'}
          </h3>
          {groupsToShow.map(group => (
            <div key={group.id} className="mb-6 last:mb-0">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-0.5 flex-1 bg-gradient-to-l from-blue-100 to-transparent rounded-full" />
                <h4 className="text-sm font-bold text-gray-700 px-2">{group.name || 'المنتجات'}</h4>
                <div className="h-0.5 flex-1 bg-gradient-to-r from-blue-100 to-transparent rounded-full" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(group.items || []).filter(prod => prod.available !== false).map((prod) => {
                  const qty = cart[prod.id] || 0
                  return (
                    <div key={prod.id} className="border border-gray-200 rounded-xl overflow-hidden hover:border-blue-300 hover:shadow-md transition-all">
                      {prod.image_url && (
                        <div className="h-36 bg-gray-50 overflow-hidden relative">
                          <NextImage src={prod.image_url} alt={prod.name} fill className="object-cover" loading="lazy" />
                        </div>
                      )}
                      <div className="p-3">
                        <h4 className="font-bold text-gray-900 text-sm">{prod.name}</h4>
                        {prod.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{prod.description}</p>}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-lg font-bold text-blue-700">{prod.price.toLocaleString()} <span className="text-xs font-normal">EGP</span></span>
                          {qty > 0 ? (
                            <div className="flex items-center gap-2">
                              <button onClick={() => setCart(prev => ({ ...prev, [prod.id]: Math.max(0, qty - 1) }))} className="w-7 h-7 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-bold hover:bg-red-200">−</button>
                              <span className="text-sm font-bold w-5 text-center">{qty}</span>
                              <button onClick={() => setCart(prev => ({ ...prev, [prod.id]: qty + 1 }))} className="w-7 h-7 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold hover:bg-blue-200">+</button>
                            </div>
                          ) : (
                            <button onClick={() => setCart(prev => ({ ...prev, [prod.id]: 1 }))} className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors">إضافة</button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          {cartCount > 0 && (
            <div className="mt-4 p-3 bg-gradient-to-l from-blue-50 to-indigo-50 rounded-xl border border-blue-100 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي الطلب</p>
                <p className="text-xl font-bold text-blue-700">{cartTotal.toLocaleString()} <span className="text-sm font-normal">EGP</span></p>
              </div>
              <p className="text-xs text-gray-500">{cartCount} منتج{cartCount > 1 ? 'ات' : ''}</p>
            </div>
          )}
        </div>
      )
    }

    case 'payment_info_block': {
      const inlinePayments = normalizePaymentMethods(question.options)
      const paymentMethods = inlinePayments.length > 0 ? inlinePayments : legacyPaymentMethods
      if (paymentMethods.length === 0) return null
      const icons: Record<string, string> = { bank: '🏦', instapay: '📱', vodafone: '📞', wallet: '💳', payment_link: '🔗', custom: '💰' }
      const methodNames: Record<string, string> = { bank: 'حساب بنكي', instapay: 'إنستاباي', vodafone: 'فودافون كاش', wallet: 'محفظة إلكترونية', payment_link: 'رابط دفع', custom: 'طريقة دفع' }
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <h4 className="text-base font-bold text-amber-900 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            {question.text || 'بيانات الدفع'}
          </h4>
          <div className="space-y-2">
            {paymentMethods.map((pm, pi) => (
              <div key={pm.id || pi} className="bg-white rounded-xl px-4 py-3 border border-amber-100">
                <div className="flex items-start gap-3">
                  <span className="text-xl">{icons[pm.method] || '💳'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800">{methodNames[pm.method] || pm.method}</p>
                    {pm.label && <p className="text-xs text-gray-500">{pm.label}</p>}
                    {pm.value && <p className="text-sm font-mono font-bold text-amber-700 mt-1 break-all" dir="ltr">{pm.value}</p>}
                    {pm.details && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{pm.details}</p>}
                  </div>
                  {pm.value && (
                    <button
                      onClick={() => copyPaymentValue(pm.value)}
                      className="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold hover:bg-amber-200 transition-colors shrink-0"
                    >
                      نسخ
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    case 'static_image': {
      const imgOpts = (Array.isArray(options) && options.length > 0) ? options[0] || {} : options || {}
      const src = imgOpts.text || form?.image_url || ''
      const alt = imgOpts.validation_value || question.text || 'صورة'
      return src ? (
        <div className="rounded-2xl overflow-hidden">
          <NextImage src={src} alt={alt} width={800} height={400} className="w-full object-cover" loading="lazy" />
        </div>
      ) : (
        <div className="bg-gray-100 rounded-2xl h-48 flex items-center justify-center text-gray-400 text-sm">لا توجد صورة</div>
      )
    }

    case 'divider':
      return <div className="border-t border-gray-200 my-2" />

    case 'signature': {
      const signatureKey = `sig_${question.id}`
      const savedSignature = (answers as any)[question.id] || ''
      const [sigData, setSigData] = useState(savedSignature)
      const canvasRef = useRef<HTMLCanvasElement>(null)
      const [isDrawing, setIsDrawing] = useState(false)

      useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        if (sigData) {
          const img = new Image()
          img.onload = () => {
            const ctx = canvas.getContext('2d')
            if (ctx) ctx.drawImage(img, 0, 0)
          }
          img.src = sigData
        }
      }, [sigData])

      const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true)
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        const rect = canvas.getBoundingClientRect()
        const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
        const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top
        ctx.beginPath()
        ctx.moveTo(x, y)
      }

      const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        const rect = canvas.getBoundingClientRect()
        const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
        const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.strokeStyle = '#1f2937'
        ctx.lineTo(x, y)
        ctx.stroke()
      }

      const endDrawing = () => {
        setIsDrawing(false)
        const canvas = canvasRef.current
        if (!canvas) return
        const dataUrl = canvas.toDataURL()
        setSigData(dataUrl)
        setAnswers({ ...answers, [question.id]: dataUrl })
      }

      const clearSig = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        setSigData('')
        setAnswers({ ...answers, [question.id]: '' })
      }

      return (
        <div>
          <div
            className="border-2 border-dashed border-gray-300 rounded-2xl overflow-hidden touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={endDrawing}
            onMouseLeave={endDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={endDrawing}
          >
            <canvas
              ref={canvasRef}
              width={600}
              height={200}
              className="w-full h-48 bg-white cursor-crosshair"
            />
          </div>
          {sigData && (
            <button
              type="button"
              onClick={clearSig}
              className="mt-2 text-sm text-red-500 hover:text-red-700"
            >
              مسح التوقيع
            </button>
          )}
        </div>
      )
    }

    case 'star_rating': {
      const maxStars = (Array.isArray(options) && options.length > 0) ? Number(options[0]?.validation_value) || 5 : 5
      return (
        <div className="flex items-center gap-1 justify-center" dir="ltr">
          {Array.from({ length: maxStars }).map((_, i) => {
            const starVal = i + 1
            return (
              <button
                key={starVal}
                onClick={() => setAnswers({ ...answers, [question.id]: starVal })}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-2xl transition-all ${(Number(currentAnswer) || 0) >= starVal ? 'text-yellow-400 scale-110' : 'text-gray-300 hover:text-yellow-300'}`}
                disabled={submitting}
              >
                ★
              </button>
            )
          })}
        </div>
      )
    }

    case 'terms': {
      return (
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={currentAnswer === true}
            onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.checked })}
            className="mt-0.5 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            disabled={submitting}
          />
          <span className="text-sm text-gray-700 leading-relaxed">{question.text}</span>
        </label>
      )
    }

    case 'date_range': {
      const dateRangeOpts = (Array.isArray(options) && options.length > 0) ? options[0] || {} : options || {}
      const mode = dateRangeOpts.validation_type || 'single'
      const currentDR: Record<string, string> = currentAnswer && typeof currentAnswer === 'object' && !Array.isArray(currentAnswer) ? currentAnswer as Record<string, string> : {}
      const fromDate = currentDR.from || ''
      const toDate = currentDR.to || ''
      const todayStr = new Date().toISOString().split('T')[0]

      const handleDateClick = (dateStr: string) => {
        if (mode === 'from_to') {
          if (!fromDate || (fromDate && toDate)) {
            setAnswers({ ...answers, [question.id]: { from: dateStr, to: '' } })
          } else {
            const start = new Date(fromDate)
            const clicked = new Date(dateStr)
            if (clicked >= start) {
              setAnswers({ ...answers, [question.id]: { from: fromDate, to: dateStr } })
            } else {
              setAnswers({ ...answers, [question.id]: { from: dateStr, to: '' } })
            }
          }
        } else {
          setAnswers({ ...answers, [question.id]: { from: dateStr } })
        }
      }

      const renderDays = () => {
        const now = new Date()
        const year = now.getFullYear()
        const month = now.getMonth()
        const daysInMonth = getDaysInMonth(year, month)
        const firstDay = getFirstDayOfMonth(year, month)
        const days = []
        for (let i = 0; i < firstDay; i++) days.push(<div key={`e-${i}`} />)
        for (let d = 1; d <= daysInMonth; d++) {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
          const isPast = dateStr < todayStr
          const isFrom = dateStr === fromDate
          const isTo = dateStr === toDate
          const inRange = fromDate && toDate && dateStr > fromDate && dateStr < toDate
          days.push(
            <button
              key={d}
              disabled={isPast}
              onClick={() => handleDateClick(dateStr)}
              className={`px-1.5 py-2 text-sm rounded-lg transition-all ${isPast ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-blue-100 cursor-pointer'} ${isFrom || isTo ? 'bg-blue-600 text-white font-bold' : ''} ${inRange ? 'bg-blue-100' : ''} ${d === now.getDate() && month === now.getMonth() && year === now.getFullYear() ? 'ring-2 ring-blue-300' : ''}`}
            >
              {d}
            </button>
          )
        }
        return days
      }

      const dayCount = fromDate && toDate ? Math.floor((new Date(toDate).getTime() - new Date(fromDate).getTime()) / 86400000) + 1 : 0

      return (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-l from-gray-50 to-white border-b border-gray-100 text-center">
            <span className="text-sm font-bold text-gray-800">{ARABIC_MONTHS[new Date().getMonth()]} {new Date().getFullYear()}</span>
          </div>
          <div className="grid grid-cols-7 gap-px bg-gray-100">
            {ARABIC_DAYS.map(day => (
              <div key={day} className="bg-gray-50 px-1.5 py-2 text-center text-xs font-bold text-gray-500">{day}</div>
            ))}
            {renderDays()}
          </div>
          {mode === 'from_to' && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs">
                <span className="text-gray-500">من: <strong className="text-gray-800">{fromDate || '—'}</strong></span>
                <span className="text-gray-500">إلى: <strong className="text-gray-800">{toDate || '—'}</strong></span>
                {dayCount > 0 && <span className="text-blue-600 font-bold">{dayCount} يوم</span>}
              </div>
              {fromDate && toDate && (
                <button
                  onClick={() => setAnswers({ ...answers, [question.id]: {} })}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  مسح
                </button>
              )}
            </div>
          )}
        </div>
      )
    }

    case 'slider': {
      const sliderOpts = (Array.isArray(options) && options.length > 0) ? options[0] || {} : options || {}
      const min = Number(sliderOpts.validation_value) || 0
      const max = Number(sliderOpts.validation_min) || 100
      const step = Number(sliderOpts.validation_type) || 1
      const unit = sliderOpts.validation_category || ''
      return (
        <div className="space-y-3">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={Number(currentAnswer ?? min)}
            onChange={(e) => setAnswers({ ...answers, [question.id]: Number(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{min}{unit}</span>
            <span className="text-lg font-bold text-blue-700">{Number(currentAnswer ?? min)}{unit}</span>
            <span>{max}{unit}</span>
          </div>
        </div>
      )
    }

    case 'button_choice': {
      return (
        <div className="grid grid-cols-2 gap-3">
          {options.map((opt: QuestionOption, optIdx: number) => (
            <button
              key={opt.id || optIdx}
              onClick={() => setAnswers({ ...answers, [question.id]: opt.text })}
              className={`px-6 py-4 rounded-2xl font-bold text-sm border-2 transition-all ${currentAnswer === opt.text ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md' : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:shadow-sm'}`}
              disabled={submitting}
            >
              {opt.text}
            </button>
          ))}
        </div>
      )
    }

    case 'email_confirm': {
      return (
        <div>
          <input
            type="email"
            placeholder="example@email.com"
            value={currentAnswerStr}
            onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
            disabled={submitting}
          />
        </div>
      )
    }

    case 'youtube': {
      const vidOpts = (Array.isArray(options) && options.length > 0) ? options[0] || {} : options || {}
      const videoUrl = vidOpts.text || ''
      const videoTitle = vidOpts.validation_value || question.text || 'فيديو'
      const videoId = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)?.[1] || ''
      return videoId ? (
        <div className="rounded-2xl overflow-hidden">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title={videoTitle}
            className="w-full aspect-video"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="bg-gray-100 rounded-2xl h-48 flex items-center justify-center text-gray-400 text-sm">لا يوجد فيديو</div>
      )
    }

    case 'match_items': {
      const parsedOpts = parseOptions(question.options) || {}
      const leftItems = parsedOpts.left_items || []
      const rightItems = parsedOpts.right_items || []
      const matchAnswers = typeof currentAnswer === 'object' ? currentAnswer as Record<string, string> : {}
      return (
        <div className="space-y-3">
          {leftItems.map((leftItem: { id: string; text: string }) => (
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
                {rightItems.map((right: { id: string; text: string }) => (
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
          value={currentAnswerStr}
          onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      )
  }
}
