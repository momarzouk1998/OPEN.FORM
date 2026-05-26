'use client'

import { DISPLAY_ONLY_QUESTION_TYPES } from '@/constants/questionTypes'
import QuestionRenderer from '@/components/QuestionRenderer'
import { getQuestionMaxScore } from '@/lib/scoringUtils'
import type { Question } from '@/lib/formFillerUtils'

interface Props {
  pageQuestions: Question[]
  answers: Record<string, any>
  setAnswers: (v: any) => void
  setCurrentQuestionIndex: (fn: (prev: number) => number) => void
  dropdownSearch: Record<string, string>
  setDropdownSearch: (v: any) => void
  dropdownOpen: Record<string, boolean>
  setDropdownOpen: (v: any) => void
  countdownNow: number
  cart: Record<string, number>
  setCart: (v: any) => void
  cartTotal: number
  cartCount: number
  form: any
  legacyProductGroups: any[]
  legacyPaymentMethods: any[]
  bookedSlots: Record<string, Record<string, string[]>>
  apptMonth: { year: number; month: number }
  setApptMonth: (v: any) => void
  allProducts: any[]
  submitting: boolean
  submitted: boolean
  isPreview: boolean
}

export default function FormFillerQuestionGroup({
  pageQuestions, answers, setAnswers, setCurrentQuestionIndex,
  dropdownSearch, setDropdownSearch, dropdownOpen, setDropdownOpen,
  countdownNow, cart, setCart, cartTotal, cartCount,
  form, legacyProductGroups, legacyPaymentMethods,
  bookedSlots, apptMonth, setApptMonth, allProducts,
  submitting, submitted, isPreview,
}: Props) {
  if (pageQuestions.length === 0) return null

  const groups: { group: number | null; questions: Question[]; startIndex: number }[] = []
  let currentGroup: number | null = null
  let currentItems: Question[] = []

  pageQuestions.forEach((q) => {
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
          {question.required && !DISPLAY_ONLY_QUESTION_TYPES.includes(question.type) && <span className="text-red-500 mr-1">*</span>}
        </h3>
        {question.type !== 'file_upload' && (
          <p className="text-blue-500 text-xs mt-1 font-medium form-themed-primary-text">
            {getQuestionMaxScore(question)} نقطة
          </p>
        )}
      </div>
    </div>
  )

  const renderQuestionWithCard = (question: Question, idx: number) => (
    <>
      {renderCard(question, idx)}
      <QuestionRenderer
        question={question}
        index={idx}
        answers={answers}
        setAnswers={setAnswers}
        setCurrentQuestionIndex={setCurrentQuestionIndex}
        dropdownSearch={dropdownSearch}
        setDropdownSearch={setDropdownSearch}
        dropdownOpen={dropdownOpen}
        setDropdownOpen={setDropdownOpen}
        countdownNow={countdownNow}
        cart={cart}
        setCart={setCart}
        cartTotal={cartTotal}
        cartCount={cartCount}
        form={form}
        legacyProductGroups={legacyProductGroups}
        legacyPaymentMethods={legacyPaymentMethods}
        bookedSlots={bookedSlots}
        apptMonth={apptMonth}
        setApptMonth={setApptMonth}
        allProducts={allProducts}
        errors={{}}
        submitting={submitting}
        submitted={submitted}
        isPreview={isPreview}
      />
    </>
  )

  return (
    <div className="space-y-4">
      {groups.map((grp) => {
        if (grp.group !== null && grp.questions.length > 1) {
          return (
            <div key={`row_${grp.group}`} className="flex gap-4">
              {grp.questions.map((question, gi) => {
                const idx = grp.startIndex + gi
                return (
                  <div key={question.id} className="flex-1 min-w-0 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 form-themed-card form-themed-spacing">
                    {renderQuestionWithCard(question, idx)}
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
              {renderQuestionWithCard(question, idx)}
            </div>
          )
        })
      })}
    </div>
  )
}
