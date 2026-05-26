'use client'

import ImageUpload from '@/components/ImageUpload'
import { WEEKDAY_OPTIONS } from '@/constants/questionTypes'
import { parseOptions, getAvailabilitySettings, updateAvailabilitySettings, updateWeeklyAvailability, addWeeklyAvailability, removeWeeklyAvailability } from '@/app/forms/create/utils'
import type { FormData } from '@/app/forms/create/types'

interface FormBasicInfoProps {
  formData: FormData
  onChange: (updates: any) => void
}

export default function FormBasicInfo({ formData, onChange }: FormBasicInfoProps) {
  const questions = formData.questions || []
  let totalPoints = 0
  questions.forEach((q: any) => {
    if (q.type === 'file_upload') return
    if (q.type === 'single_choice') {
      totalPoints += Math.max(0, ...parseOptions(q.options).map((o:any) => o.points || 0))
    } else if (q.type === 'multiple_choice') {
      totalPoints += parseOptions(q.options).reduce((s:number, o:any) => s + (o.points || 0), 0)
    } else if (q.type === 'dropdown') {
      const opts = parseOptions(q.options)
      if (q.dropdown_type === 'multiple') {
        totalPoints += (q.correct_option_ids || []).reduce((s:number, id:string) => {
          const opt = opts.find((o:any) => o.id === id)
          return s + (opt?.points || 0)
        }, 0)
      } else {
        const opt = opts.find((o:any) => o.id === q.correct_option_id)
        totalPoints += opt?.points || 0
      }
    } else if (q.type === 'ranking') {
      totalPoints += parseOptions(q.options).reduce((s:number, o:any) => s + (o.points || 0), 0)
    } else if (q.type === 'matrix') {
      const colSum = (q.matrix_columns || []).reduce((s:number, c:any) => s + (c.points || 0), 0)
      totalPoints += colSum * (q.matrix_rows || []).length
    } else if (q.type === 'scale') {
      totalPoints += Math.max(10, ...parseOptions(q.options).map((o:any) => o.points || 0))
    } else {
      totalPoints += q.points || 0
    }
  })

  const availability = getAvailabilitySettings(formData)

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">معلومات الفورم</h2>

      <div className="flex items-center gap-4 mb-6 p-3 bg-gradient-to-l from-blue-50 to-purple-50 rounded-xl border border-blue-100">
        <div className="flex-1 flex items-center gap-2">
          <span className="text-sm text-gray-600">عدد الأسئلة:</span>
          <span className="font-bold text-gray-900">{questions.length}</span>
        </div>
        {!!((formData as any)._is_test) && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">إجمالي النقاط:</span>
          <span className="font-bold text-blue-700">{totalPoints}</span>
        </div>
        )}
      </div>
      
      <div className="space-y-4">
        <ImageUpload
          onImageUploaded={(url) => onChange({ ...formData, image_url: url } as any)}
          currentImage={formData.image_url}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">اسم الفورم *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => onChange({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="مثال: تقييم أداء الصلاة"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
          <textarea
            value={formData.description}
            onChange={(e) => onChange({ ...formData, description: e.target.value })}
            rows={2}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="وصف مختصر للنموذج..."
          />
        </div>

        <div className="bg-cyan-50 rounded-xl p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={!!(formData as any)._is_test}
              onChange={(e) => onChange({ ...formData, _is_test: e.target.checked })}
              className="w-5 h-5 mt-1 text-cyan-600 rounded focus:ring-cyan-500"
            />
            <div>
              <span className="font-medium text-gray-800 block">اختبار</span>
              <span className="text-sm text-gray-600">إظهار حقول النقاط والدرجات للتقييم والتصحيح</span>
            </div>
          </label>
        </div>

        <div className="bg-amber-50 rounded-xl p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.allow_multiple}
              onChange={(e) => onChange({ ...formData, allow_multiple: e.target.checked })}
              className="w-5 h-5 mt-1 text-blue-600 rounded focus:ring-blue-500"
            />
            <div>
              <span className="font-medium text-gray-800 block">السماح بالتسجيل المتعدد</span>
              <span className="text-sm text-gray-600">تفعيل هذا الخيار يسمح للمستخدم بإعادة ملء النموذج عدة مرات يومياً</span>
            </div>
          </label>
        </div>

        <div className="bg-green-50 rounded-xl p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.time_limit !== null && formData.time_limit !== undefined}
              onChange={(e) => onChange({ ...formData, time_limit: e.target.checked ? 10 : null })}
              className="w-5 h-5 mt-1 text-green-600 rounded focus:ring-green-500"
            />
            <div className="flex-1">
              <span className="font-medium text-gray-800 block">تحديد وقت للإجابة</span>
              <span className="text-sm text-gray-600">تفعيل عداد تنازلي للمستخدمين لإكمال النموذج خلال مدة محددة</span>
              {formData.time_limit !== null && formData.time_limit !== undefined && (
                <div className="mt-2">
                  <label className="text-sm text-gray-600 ml-2">الوقت (بالدقائق):</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.time_limit}
                    onChange={(e) => onChange({ ...formData, time_limit: parseInt(e.target.value) || 1 })}
                    className="w-24 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-center"
                  />
                </div>
              )}
            </div>
          </label>
        </div>

        <div className="bg-blue-50 rounded-xl p-4">
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!!availability.enabled}
                onChange={(e) => onChange(updateAvailabilitySettings(formData, { enabled: e.target.checked }))}
                className="w-5 h-5 mt-1 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <span className="font-medium text-gray-800 block">جدول تشغيل النموذج</span>
                <span className="text-sm text-gray-600">افتح وأغلق النموذج تلقائيًا حسب أيام الأسبوع أو حسب تاريخ ووقت محددين.</span>
              </div>
            </label>

            {availability.enabled && (
              <div className="space-y-3 pr-8">
                <div className="grid gap-2 sm:grid-cols-2">
                  <button type="button" onClick={() => onChange(updateAvailabilitySettings(formData, { mode: 'weekly' }))} className={`px-3 py-2 rounded-lg border text-sm ${availability.mode === 'weekly' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200'}`}>حسب أيام الأسبوع</button>
                  <button type="button" onClick={() => onChange(updateAvailabilitySettings(formData, { mode: 'range' }))} className={`px-3 py-2 rounded-lg border text-sm ${availability.mode === 'range' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200'}`}>حسب تاريخ ووقت</button>
                </div>

                {availability.mode === 'weekly' ? (
                  <div className="space-y-2">
                    {(availability.weekly || []).map((slot: any, index: number) => (
                      <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto] bg-white border border-blue-100 rounded-xl p-2">
                        <select value={slot.day || '0'} onChange={(e) => onChange(updateWeeklyAvailability(formData, index, { day: e.target.value }))} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                          {WEEKDAY_OPTIONS.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
                        </select>
                        <input type="time" value={slot.start || ''} onChange={(e) => onChange(updateWeeklyAvailability(formData, index, { start: e.target.value }))} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white" />
                        <input type="time" value={slot.end || ''} onChange={(e) => onChange(updateWeeklyAvailability(formData, index, { end: e.target.value }))} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white" />
                        <button type="button" onClick={() => onChange(removeWeeklyAvailability(formData, index))} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" aria-label="حذف">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => onChange(addWeeklyAvailability(formData))} className="w-full py-2 border-2 border-dashed border-blue-200 text-blue-600 rounded-lg hover:border-blue-400 text-sm">+ إضافة يوم تشغيل</button>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="block text-sm text-gray-600 mb-1">يفتح في</span>
                      <input type="datetime-local" value={availability.starts_at || ''} onChange={(e) => onChange(updateAvailabilitySettings(formData, { starts_at: e.target.value }))} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg" />
                    </label>
                    <label className="block">
                      <span className="block text-sm text-gray-600 mb-1">يقفل في</span>
                      <input type="datetime-local" value={availability.ends_at || ''} onChange={(e) => onChange(updateAvailabilitySettings(formData, { ends_at: e.target.value }))} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg" />
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-orange-50 rounded-xl p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.allow_delete_responses || false}
              onChange={(e) => onChange({ ...formData, allow_delete_responses: e.target.checked })}
              className="w-5 h-5 mt-1 text-orange-600 rounded focus:ring-orange-500"
            />
            <div>
              <span className="font-medium text-gray-800 block">السماح بحذف الردود</span>
              <span className="text-sm text-gray-600">إظهار زر حذف بجانب كل تسجيل ليتمكن المستخدم من حذف ردوده بنفسه</span>
            </div>
          </label>
        </div>

        <div className="bg-purple-50 rounded-xl p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.randomize_questions || false}
              onChange={(e) => onChange({ ...formData, randomize_questions: e.target.checked })}
              className="w-5 h-5 mt-1 text-purple-600 rounded focus:ring-purple-500"
            />
            <div>
              <span className="font-medium text-gray-800 block">ترتيب عشوائي للأسئلة</span>
              <span className="text-sm text-gray-600">عرض الأسئلة بترتيب مختلف لكل مستخدم لمنع الغش</span>
            </div>
          </label>
        </div>
      </div>
    </div>
  )
}
