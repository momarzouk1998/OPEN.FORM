import sys

with open(r'd:\ahla-shabab\src\app\forms\[id]\edit\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = "  const moveQuestion = (index: number, direction: 'up' | 'down') => {"
end_marker = "        {/* Form Basic Info */}"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker, start_idx)

if start_idx == -1 or end_idx == -1:
    print('Markers not found')
    sys.exit(1)

clean_code = '''
    if (!formData) return
    const newQuestions = [...formData.questions]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newQuestions.length) return
    ;[newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]]
    setFormData(prev => prev ? ({ ...prev, questions: newQuestions }) : null)
  }

  const importQuestion = (question: any) => {
    if (!formData) return
    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      text: question.text,
      type: question.type,
      required: question.required || false,
      points: question.points || 0,
      options: parseOptions(question.options)
    }
    setFormData(prev => prev ? ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }) : null)
    setShowQuestionPicker(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  if (!formData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">لم يتم العثور على النموذج</p>
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-700 mt-2 inline-block"
          >
            العودة للوحة التحكم
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="hidden sm:inline">رجوع</span>
          </button>

          <h1 className="text-lg sm:text-xl font-bold text-blue-700">تعديل النموذج</h1>
          
          <div className="w-8 sm:w-16"></div> {/* Spacer for centering */}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">

        {/* Form Actions Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex w-full sm:w-auto items-center gap-3">
               <button
                 onClick={() => setFormData(prev => prev ? ({ ...prev, is_active: !prev.is_active }) : null)}
                 className={`flex-1 sm:flex-none px-4 py-3 rounded-xl transition-colors font-bold text-sm sm:text-base ${
                   formData.is_active 
                     ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                     : 'bg-red-100 text-red-700 hover:bg-red-200'
                 }`}
               >
                 {formData.is_active ? 'النموذج مفعل' : 'النموذج معطل'}
               </button>
               {responseCount > 0 && (profile?.role === 'admin' || profile?.role === 'supervisor') && (
                 <a
                   href={'/admin/results?formId=' + formId}
                   className="flex-1 sm:flex-none px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-bold text-sm sm:text-base flex justify-center items-center gap-2 text-center shadow-lg shadow-emerald-200"
                 >
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                   <span className="hidden sm:inline">عرض التسجيلات</span>
                   <span className="sm:hidden">التسجيلات</span>
                 </a>
               )}
            </div>

            <button
              onClick={saveForm}
              disabled={saving}
              className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-bold text-lg shadow-lg shadow-blue-200"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  حفظ التعديلات
                </>
              )}
            </button>
        </div>

'''

new_content = content[:start_idx + len(start_marker)] + '\n' + clean_code + content[end_idx:]

with open(r'd:\ahla-shabab\src\app\forms\[id]\edit\page.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Success')
