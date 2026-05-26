'use client'

interface Props {
  draftRestored: boolean
  draftDismissed: boolean
  onStartFresh: () => void
  autoSave: { getDraftAge: () => string; clearDraft: () => void }
}

export default function FormFillerDraftBanner({ draftRestored, draftDismissed, onStartFresh, autoSave }: Props) {
  if (!draftRestored || draftDismissed) return null
  return (
    <div className="mb-4 flex items-center justify-between bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm">
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>
          تم استعادة مسودتك المحفوظة ({autoSave.getDraftAge()}) — يمكنك المتابعة من حيث توقفت.
        </span>
      </div>
      <button
        onClick={onStartFresh}
        className="mr-3 text-amber-600 hover:text-amber-900 font-medium whitespace-nowrap"
      >
        بدء من جديد
      </button>
    </div>
  )
}
