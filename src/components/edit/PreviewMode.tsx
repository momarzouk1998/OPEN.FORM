'use client'

import dynamic from 'next/dynamic'

const FormFiller = dynamic(() => import('@/app/forms/[id]/FormFiller'), { ssr: false })

interface PreviewModeProps {
  formData: any
  questions: any[]
  previewDevice: 'mobile' | 'tablet' | 'desktop'
}

function prepareQuestionsForPreview(questions: any[]) {
  return (questions || []).filter((q: any) => !q.hidden).map((q: any) => {
    const cloned = { ...q }
    if (cloned._preserve_old_options) {
      delete cloned._preserve_old_options
    }
    if (cloned.options && cloned.options._visibility_rules) {
      if (Array.isArray(cloned.options)) {
        cloned.options = [...cloned.options, { _visibility_rules: cloned.options._visibility_rules }]
      }
    }
    return cloned
  })
}

export default function PreviewMode({ formData, questions, previewDevice }: PreviewModeProps) {
  return (
    <div className="bg-slate-900/5 min-h-[calc(100vh-73px)] w-full py-6 flex flex-col items-center justify-start overflow-y-auto">
      {previewDevice === 'mobile' && (
        <div className="relative mx-auto my-4 border-[12px] border-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden bg-white w-[375px] h-[780px] max-h-[80vh] flex flex-col shrink-0">
          <div className="absolute top-0 inset-x-0 h-4 bg-slate-900 rounded-b-xl flex items-center justify-center z-20">
            <div className="w-16 h-1 bg-black/40 rounded-full" />
          </div>
          <div id="preview-device-content" className="w-full h-full overflow-y-auto pt-4 scrollbar-hide">
            <FormFiller
              form={formData as any}
              questions={prepareQuestionsForPreview(questions)}
              existingResponse={null}
              allUserResponses={[]}
              project={null}
              userId={null}
              isPreview={true}
            />
          </div>
          <div className="absolute bottom-1 inset-x-0 h-1 w-24 bg-slate-900/40 rounded-full mx-auto z-20" />
        </div>
      )}

      {previewDevice === 'tablet' && (
        <div className="relative mx-auto my-4 border-[14px] border-slate-900 rounded-[2rem] shadow-2xl overflow-hidden bg-white w-[768px] h-[1024px] max-h-[85vh] flex flex-col shrink-0">
          <div className="absolute bottom-1 inset-x-0 h-1.5 w-20 bg-slate-900/40 rounded-full mx-auto z-20" />
          <div id="preview-device-content" className="w-full h-full overflow-y-auto">
            <FormFiller
              form={formData as any}
              questions={prepareQuestionsForPreview(questions)}
              existingResponse={null}
              allUserResponses={[]}
              project={null}
              userId={null}
              isPreview={true}
            />
          </div>
        </div>
      )}

      {previewDevice === 'desktop' && (
        <div className="w-full max-w-5xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <FormFiller
              form={formData as any}
              questions={prepareQuestionsForPreview(questions)}
              existingResponse={null}
              allUserResponses={[]}
              project={null}
              userId={null}
              isPreview={true}
            />
          </div>
        </div>
      )}
    </div>
  )
}
