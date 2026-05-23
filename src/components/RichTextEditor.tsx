'use client'

import { useRef, useCallback } from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
}

const FONTS = [
  { label: 'افتراضي', value: 'inherit' },
  { label: 'Cairo', value: 'Cairo, sans-serif' },
  { label: 'Tajawal', value: 'Tajawal, sans-serif' },
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Amiri', value: 'Amiri, serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
]

const FONT_SIZES = [
  { label: 'صغير', value: '12px' },
  { label: 'عادي', value: '16px' },
  { label: 'وسط', value: '20px' },
  { label: 'كبير', value: '24px' },
  { label: 'كبير جداً', value: '32px' },
  { label: 'ضخم', value: '40px' },
]

export default function RichTextEditor({ value, onChange, placeholder, minHeight = 200 }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  const exec = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value)
    if (editorRef.current) {
      editorRef.current.focus()
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange])

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange])

  const insertOfferTemplate = useCallback((template: string) => {
    exec('insertHTML', template)
  }, [exec])

  const offerTemplates = [
    { label: 'خصم %', value: '<span style="color:#16a34a;font-size:24px;font-weight:bold;">🔥 خصم 20%</span>' },
    { label: 'كشف مجاني', value: '<span style="color:#2563eb;font-size:20px;font-weight:bold;">🩺 أول كشف مجاني</span>' },
    { label: 'عرض رمضان', value: '<span style="color:#dc2626;font-size:24px;font-weight:bold;">🌙 عرض رمضان</span>' },
    { label: 'خصم محدد', value: '<span style="color:#9333ea;font-size:20px;font-weight:bold;">💰 خصم 50% لفترة محدودة</span>' },
  ]

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 bg-gray-50 border-b border-gray-200">
        {/* Bold / Italic / Underline */}
        <button type="button" onClick={() => exec('bold')} title="عريض" className="p-1.5 hover:bg-gray-200 rounded text-sm font-bold min-w-[30px]">B</button>
        <button type="button" onClick={() => exec('italic')} title="مائل" className="p-1.5 hover:bg-gray-200 rounded text-sm italic min-w-[30px]">I</button>
        <button type="button" onClick={() => exec('underline')} title="تسطير" className="p-1.5 hover:bg-gray-200 rounded text-sm underline min-w-[30px]">U</button>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* Font Family */}
        <select
          onChange={(e) => exec('fontName', e.target.value)}
          className="px-2 py-1 text-xs border border-gray-200 rounded bg-white cursor-pointer"
          title="الخط"
        >
          {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>

        {/* Font Size */}
        <select
          onChange={(e) => exec('fontSize', e.target.value)}
          className="px-2 py-1 text-xs border border-gray-200 rounded bg-white cursor-pointer"
          title="حجم الخط"
        >
          {FONT_SIZES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* Text Color */}
        <label className="relative cursor-pointer p-1.5 hover:bg-gray-200 rounded" title="لون النص">
          <span className="text-xs font-medium" style={{ color: '#000', borderBottom: '3px solid #000' }}>A</span>
          <input
            type="color"
            onChange={(e) => exec('foreColor', e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
        </label>

        {/* Background Color */}
        <label className="relative cursor-pointer p-1.5 hover:bg-gray-200 rounded" title="لون الخلفية">
          <span className="text-xs" style={{ background: '#ffd700', padding: '0 2px' }}>A</span>
          <input
            type="color"
            onChange={(e) => exec('hiliteColor', e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
        </label>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* Alignment */}
        <button type="button" onClick={() => exec('justifyRight')} title="محاذاة لليمين" className="p-1.5 hover:bg-gray-200 rounded text-xs min-w-[30px]">
          <svg className="w-4 h-4 mx-auto" viewBox="0 0 16 16" fill="currentColor"><path d="M1 2h14v2H1zm0 4h10v2H1zm0 4h14v2H1zm0 4h10v2H1z"/></svg>
        </button>
        <button type="button" onClick={() => exec('justifyCenter')} title="محاذاة للوسط" className="p-1.5 hover:bg-gray-200 rounded text-xs min-w-[30px]">
          <svg className="w-4 h-4 mx-auto" viewBox="0 0 16 16" fill="currentColor"><path d="M1 2h14v2H1zm2 4h10v2H3zm0 4h10v2H3zm2 4h10v2H5z"/></svg>
        </button>
        <button type="button" onClick={() => exec('justifyLeft')} title="محاذاة لليسار" className="p-1.5 hover:bg-gray-200 rounded text-xs min-w-[30px]">
          <svg className="w-4 h-4 mx-auto" viewBox="0 0 16 16" fill="currentColor"><path d="M1 2h14v2H1zm0 4h10v2H1zm0 4h14v2H1zm0 4h10v2H1z"/></svg>
        </button>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* Lists */}
        <button type="button" onClick={() => exec('insertUnorderedList')} title="قائمة نقطية" className="p-1.5 hover:bg-gray-200 rounded text-xs min-w-[30px]">
          <svg className="w-4 h-4 mx-auto" viewBox="0 0 16 16" fill="currentColor"><path d="M2 4h1v1H2zm3 0h10v1H5zm0 4h10v1H5zm0 4h10v1H5zM2 8h1v1H2zm0 4h1v1H2z"/></svg>
        </button>
        <button type="button" onClick={() => exec('insertOrderedList')} title="قائمة مرقمة" className="p-1.5 hover:bg-gray-200 rounded text-xs min-w-[30px]">
          <svg className="w-4 h-4 mx-auto" viewBox="0 0 16 16" fill="currentColor"><path d="M2.5 3.5V2h.5v3h-.5V4H1v-.5zm0 5V7h.5v3h-.5V9H1v-.5zm0 5V12h.5v3h-.5v-1H1v-.5zM5 4h10v1H5zm0 4h10v1H5zm0 4h10v1H5z"/></svg>
        </button>
      </div>

      {/* Offers Templates */}
      <div className="flex flex-wrap items-center gap-1.5 px-2 py-1.5 bg-gradient-to-l from-amber-50 to-orange-50 border-b border-gray-200">
        <span className="text-xs text-gray-500 font-medium ml-1">عروض:</span>
        {offerTemplates.map((offer, i) => (
          <button
            key={i}
            type="button"
            onClick={() => insertOfferTemplate(offer.value)}
            className="px-2 py-0.5 text-xs bg-white border border-gray-200 rounded-md hover:border-amber-400 hover:bg-amber-50 transition-colors"
            dangerouslySetInnerHTML={{ __html: offer.label }}
          />
        ))}
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleInput}
        data-placeholder={placeholder || 'اكتب النص هنا...'}
        style={{ minHeight }}
        className="px-4 py-3 text-gray-700 focus:outline-none leading-relaxed whitespace-pre-wrap [&:empty:before]:content-[attr(data-placeholder)] [&:empty:before]:text-gray-400 [&:empty:before]:pointer-events-none"
        dangerouslySetInnerHTML={{ __html: value || '' }}
      />
    </div>
  )
}
