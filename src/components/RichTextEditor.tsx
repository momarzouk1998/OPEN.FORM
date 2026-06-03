'use client'

import { useEditor, EditorContent, Extension } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TextAlign } from '@tiptap/extension-text-align'
import { TextStyle, Color } from '@tiptap/extension-text-style'
import Highlight from '@tiptap/extension-highlight'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import { useEffect, useMemo, useState, useRef } from 'react'

// Custom FontSize Extension for Tiptap
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: string) => ReturnType
      unsetFontSize: () => ReturnType
    }
  }
}

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element: HTMLElement) => element.style.fontSize || null,
            renderHTML: (attributes: Record<string, any>) => {
              if (!attributes.fontSize) return {}
              return { style: `font-size: ${attributes.fontSize}` }
            },
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize }).run()
      },
      unsetFontSize: () => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize: null }).run()
      },
    }
  },
})

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

// Curated colors for Google Docs-like premium appearance
const PALETTE_COLORS = [
  // Grayscale / Neutral
  { hex: '#000000', name: 'أسود' },
  { hex: '#374151', name: 'رمادي غامق' },
  { hex: '#6B7280', name: 'رمادي متوسط' },
  { hex: '#9CA3AF', name: 'رمادي فاتح' },
  { hex: '#D1D5DB', name: 'رمادي ناعم' },
  { hex: '#FFFFFF', name: 'أبيض' },
  
  // Brand Blue
  { hex: '#1E3A8A', name: 'أزرق كحلي' },
  { hex: '#2563EB', name: 'أزرق أساسي' },
  { hex: '#3B82F6', name: 'أزرق حيوي' },
  { hex: '#60A5FA', name: 'أزرق فاتح' },
  { hex: '#BFDBFE', name: 'أزرق ناعم' },
  { hex: '#EFF6FF', name: 'أزرق ثلجي' },

  // Emerald / Green
  { hex: '#064E3B', name: 'أخضر غامق' },
  { hex: '#059669', name: 'زمردي أساسي' },
  { hex: '#10B981', name: 'أخضر زمردي' },
  { hex: '#34D399', name: 'أخضر فاتح' },
  { hex: '#A7F3D0', name: 'أخضر ناعم' },
  { hex: '#ECFDF5', name: 'أخضر ثلجي' },

  // Amber / Yellow
  { hex: '#78350F', name: 'بني خريفي' },
  { hex: '#D97706', name: 'ذهبي أساسي' },
  { hex: '#F59E0B', name: 'برتقالي مصفر' },
  { hex: '#FBBF24', name: 'أصفر ذهبي' },
  { hex: '#FDE68A', name: 'أصفر ناعم' },
  { hex: '#FEF3C7', name: 'أصفر ثلجي' },

  // Rose / Red
  { hex: '#991B1B', name: 'أحمر غامق' },
  { hex: '#DC2626', name: 'أحمر ناري' },
  { hex: '#EF4444', name: 'أحمر أساسي' },
  { hex: '#F87171', name: 'أحمر فاتح' },
  { hex: '#FCA5A5', name: 'أحمر ناعم' },
  { hex: '#FEE2E2', name: 'أحمر ثلجي' },

  // Violet / Purple
  { hex: '#4C1D95', name: 'بنفسجي غامق' },
  { hex: '#7C3AED', name: 'بنفسجي أساسي' },
  { hex: '#8B5CF6', name: 'بنفسجي حيوي' },
  { hex: '#A78BFA', name: 'بنفسجي فاتح' },
  { hex: '#C4B5FD', name: 'بنفسجي ناعم' },
  { hex: '#F5F3FF', name: 'بنفسجي ثلجي' }
]

const ToolbarButton = ({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}) => (
  <button
    type="button"
    onMouseDown={(e) => { e.preventDefault(); onClick() }}
    title={title}
    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-all cursor-pointer ${
      active
        ? 'bg-emerald-600 text-white shadow-sm font-semibold scale-[1.03]'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`}
  >
    {children}
  </button>
)

const Divider = () => <div className="w-px h-6 bg-gray-200 mx-1 align-self-center" />

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [activeMenu, setActiveMenu] = useState<'text-color' | 'bg-color' | 'font-size' | 'heading' | 'link' | null>(null)
  const [linkUrl, setLinkUrl] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

  const extensions = useMemo(() => [
    StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    Underline,
    Link.configure({ openOnClick: false }),
    FontSize,
  ], [])

  const editor = useEditor({
    extensions,
    content: value || '',
    editorProps: {
      attributes: {
        class: 'prose max-w-none min-h-[300px] px-6 py-5 text-gray-800 text-base leading-relaxed focus:outline-none bg-white rounded-b-xl border-t border-gray-100',
        dir: 'rtl',
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
  })

  // Sync external value changes safely
  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    const current = editor.getHTML()
    if (current !== value && value !== undefined) {
      editor.commands.setContent(value || '', { emitUpdate: false })
    }
  }, [value, editor])

  // Handle outside clicks to close menus
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!editor) return null

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!linkUrl) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      let formattedUrl = linkUrl.trim()
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`
      }
      editor.chain().focus().extendMarkRange('link').setLink({ href: formattedUrl }).run()
    }
    setLinkUrl('')
    setActiveMenu(null)
  }

  const openLinkMenu = () => {
    const previousUrl = editor.getAttributes('link').href || ''
    setLinkUrl(previousUrl)
    setActiveMenu(activeMenu === 'link' ? null : 'link')
  }

  // Helper to check active font size
  const getCurrentFontSize = () => {
    const attrs = editor.getAttributes('textStyle')
    return attrs.fontSize || '16px'
  }

  // Helper to check active text color
  const getCurrentTextColor = () => {
    const attrs = editor.getAttributes('textStyle')
    return attrs.color || '#374151'
  }

  // Helper to check active highlight color
  const getCurrentBgColor = () => {
    const attrs = editor.getAttributes('highlight')
    return attrs.color || 'transparent'
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-visible shadow-sm focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-400 transition-all text-right" dir="rtl">
      
      {/* ─── Google Docs-style Floating Toolbar ─── */}
      <div ref={menuRef} className="flex flex-wrap items-center gap-1 p-2 bg-gray-50/90 border-b border-gray-200/80 rounded-t-xl sticky top-0 z-20 select-none">
        
        {/* Undo / Redo */}
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="تراجع">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="إعادة">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
          </svg>
        </ToolbarButton>

        <Divider />

        {/* Heading Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActiveMenu(activeMenu === 'heading' ? null : 'heading')}
            className="h-8 px-3 py-1 text-xs font-medium bg-white hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-700 flex items-center gap-1.5 cursor-pointer shadow-xs min-w-[100px] justify-between"
          >
            <span>
              {editor.isActive('heading', { level: 1 }) ? 'عنوان كبير'
                : editor.isActive('heading', { level: 2 }) ? 'عنوان متوسط'
                : editor.isActive('heading', { level: 3 }) ? 'عنوان صغير'
                : 'نص عادي'}
            </span>
            <svg className="w-3 h-3 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {activeMenu === 'heading' && (
            <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30 animate-in fade-in slide-in-from-top-1 duration-150">
              <button
                type="button"
                onClick={() => { editor.chain().focus().setParagraph().run(); setActiveMenu(null) }}
                className={`w-full text-right px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${!editor.isActive('heading') ? 'text-emerald-600 font-semibold' : 'text-gray-700'}`}
              >
                <span>نص عادي</span>
                <span className="text-xs text-gray-400 font-sans">Ctrl+Alt+0</span>
              </button>
              <button
                type="button"
                onClick={() => { editor.chain().focus().toggleHeading({ level: 1 }).run(); setActiveMenu(null) }}
                className={`w-full text-right px-4 py-2 text-lg font-bold hover:bg-gray-50 flex items-center justify-between border-t border-gray-50 ${editor.isActive('heading', { level: 1 }) ? 'text-emerald-600 font-semibold' : 'text-gray-900'}`}
              >
                <span>عنوان كبير</span>
                <span className="text-xs text-gray-400 font-sans">Ctrl+Alt+1</span>
              </button>
              <button
                type="button"
                onClick={() => { editor.chain().focus().toggleHeading({ level: 2 }).run(); setActiveMenu(null) }}
                className={`w-full text-right px-4 py-2 text-base font-semibold hover:bg-gray-50 flex items-center justify-between border-t border-gray-50 ${editor.isActive('heading', { level: 2 }) ? 'text-emerald-600 font-semibold' : 'text-gray-800'}`}
              >
                <span>عنوان متوسط</span>
                <span className="text-xs text-gray-400 font-sans">Ctrl+Alt+2</span>
              </button>
              <button
                type="button"
                onClick={() => { editor.chain().focus().toggleHeading({ level: 3 }).run(); setActiveMenu(null) }}
                className={`w-full text-right px-4 py-2 text-sm font-semibold hover:bg-gray-50 flex items-center justify-between border-t border-gray-50 ${editor.isActive('heading', { level: 3 }) ? 'text-emerald-600 font-semibold' : 'text-gray-700'}`}
              >
                <span>عنوان صغير</span>
                <span className="text-xs text-gray-400 font-sans">Ctrl+Alt+3</span>
              </button>
            </div>
          )}
        </div>

        {/* Font Size Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActiveMenu(activeMenu === 'font-size' ? null : 'font-size')}
            className="h-8 px-2 py-1 text-xs font-semibold bg-white hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-700 flex items-center gap-1 cursor-pointer shadow-xs justify-between min-w-[65px]"
          >
            <span>{getCurrentFontSize()}</span>
            <svg className="w-3 h-3 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {activeMenu === 'font-size' && (
            <div className="absolute right-0 mt-1 w-24 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30 max-h-48 overflow-y-auto">
              {['12px', '14px', '16px', '18px', '20px', '24px', '30px'].map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => { editor.chain().focus().setFontSize(size).run(); setActiveMenu(null) }}
                  className={`w-full text-center py-1.5 hover:bg-gray-50 text-sm block font-sans ${getCurrentFontSize() === size ? 'bg-emerald-50 text-emerald-600 font-bold' : 'text-gray-700'}`}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>

        <Divider />

        {/* Basic formatting: Bold, Italic, Underline, Strike */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="عريض (Ctrl+B)">
          <span className="font-bold text-base font-sans">B</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="مائل (Ctrl+I)">
          <span className="italic text-base font-serif">I</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="تحته خط (Ctrl+U)">
          <span className="underline text-base font-sans">U</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="يتوسطه خط (Ctrl+Shift+S)">
          <span className="line-through text-base font-sans">S</span>
        </ToolbarButton>

        <Divider />

        {/* Text Color Picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActiveMenu(activeMenu === 'text-color' ? null : 'text-color')}
            className={`w-8 h-8 flex flex-col items-center justify-center rounded-lg hover:bg-gray-100 transition-all cursor-pointer relative ${activeMenu === 'text-color' ? 'bg-gray-200' : ''}`}
            title="لون النص"
          >
            <span className="font-bold text-sm font-sans leading-none relative top-0.5">A</span>
            <div className="w-5 h-1 rounded-sm mt-0.5" style={{ backgroundColor: getCurrentTextColor() }} />
          </button>

          {activeMenu === 'text-color' && (
            <div className="absolute right-0 mt-1 p-3 bg-white border border-gray-200 rounded-xl shadow-xl z-30 w-[240px]">
              <div className="text-xs text-gray-400 mb-2 font-medium">لون الخط</div>
              <div className="grid grid-cols-6 gap-2">
                {PALETTE_COLORS.map(c => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => { editor.chain().focus().setColor(c.hex).run(); setActiveMenu(null) }}
                    className="w-7 h-7 rounded-full border border-gray-200 hover:scale-110 cursor-pointer shadow-xs transition-all relative group"
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  >
                    {getCurrentTextColor().toLowerCase() === c.hex.toLowerCase() && (
                      <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${c.hex === '#FFFFFF' ? 'text-black' : 'text-white'}`}>✓</span>
                    )}
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-800 text-white text-[10px] py-0.5 px-1.5 rounded whitespace-nowrap z-40 pointer-events-none">
                      {c.name}
                    </span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => { editor.chain().focus().unsetColor().run(); setActiveMenu(null) }}
                className="mt-3 w-full py-1.5 text-xs text-center border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 font-medium cursor-pointer"
              >
                إعادة اللون التلقائي
              </button>
            </div>
          )}
        </div>

        {/* Highlight Color Picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActiveMenu(activeMenu === 'bg-color' ? null : 'bg-color')}
            className={`w-8 h-8 flex flex-col items-center justify-center rounded-lg hover:bg-gray-100 transition-all cursor-pointer relative ${activeMenu === 'bg-color' ? 'bg-gray-200' : ''}`}
            title="لون خلفية النص (تمييز)"
          >
            <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122l9.37-9.37a2.25 2.25 0 113.182 3.182l-9.372 9.372a4.5 4.5 0 01-1.871 1.174l-3.197.799.799-3.197a4.5 4.5 0 011.174-1.871zm0 0L4.75 18M10.956 4l5.43 5.43" />
            </svg>
            <div className="w-5 h-1 rounded-sm mt-0.5" style={{ backgroundColor: getCurrentBgColor() !== 'transparent' ? getCurrentBgColor() : '#E5E7EB' }} />
          </button>

          {activeMenu === 'bg-color' && (
            <div className="absolute right-0 mt-1 p-3 bg-white border border-gray-200 rounded-xl shadow-xl z-30 w-[240px]">
              <div className="text-xs text-gray-400 mb-2 font-medium">لون التمييز (الخلفية)</div>
              <div className="grid grid-cols-6 gap-2">
                {PALETTE_COLORS.map(c => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => { editor.chain().focus().setHighlight({ color: c.hex }).run(); setActiveMenu(null) }}
                    className="w-7 h-7 rounded-full border border-gray-200 hover:scale-110 cursor-pointer shadow-xs transition-all relative group"
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  >
                    {getCurrentBgColor() === c.hex && (
                      <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${c.hex === '#FFFFFF' ? 'text-black' : 'text-white'}`}>✓</span>
                    )}
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-800 text-white text-[10px] py-0.5 px-1.5 rounded whitespace-nowrap z-40 pointer-events-none">
                      {c.name}
                    </span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => { editor.chain().focus().unsetHighlight().run(); setActiveMenu(null) }}
                className="mt-3 w-full py-1.5 text-xs text-center border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 font-medium cursor-pointer"
              >
                بدون تمييز
              </button>
            </div>
          )}
        </div>

        <Divider />

        {/* Alignment */}
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="محاذاة لليمين">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="12" x2="9" y2="12"/><line x1="21" y1="18" x2="3" y2="18"/>
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="محاذاة للوسط">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <line x1="21" y1="6" x2="3" y2="6"/><line x1="18" y1="12" x2="6" y2="12"/><line x1="21" y1="18" x2="3" y2="18"/>
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="محاذاة لليسار">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <line x1="21" y1="6" x2="3" y2="6"/><line x1="15" y1="12" x2="3" y2="12"/><line x1="21" y1="18" x2="3" y2="18"/>
          </svg>
        </ToolbarButton>

        <Divider />

        {/* Lists */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="قائمة نقطية">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/>
            <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none"/>
            <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/>
            <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/>
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="قائمة رقمية">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/>
            <text x="1" y="8" fontSize="6.5" fill="currentColor" stroke="none" fontWeight="bold">1</text>
            <text x="1" y="14" fontSize="6.5" fill="currentColor" stroke="none" fontWeight="bold">2</text>
            <text x="1" y="20" fontSize="6.5" fill="currentColor" stroke="none" fontWeight="bold">3</text>
          </svg>
        </ToolbarButton>

        <Divider />

        {/* Link inserting */}
        <div className="relative">
          <button
            type="button"
            onClick={openLinkMenu}
            className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-all cursor-pointer ${
              editor.isActive('link') || activeMenu === 'link'
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
            title="إدراج رابط"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
          </button>

          {activeMenu === 'link' && (
            <form onSubmit={handleLinkSubmit} className="absolute right-0 mt-1 p-3 bg-white border border-gray-200 rounded-xl shadow-xl z-30 w-72 flex flex-col gap-2">
              <div className="text-xs text-gray-400 font-medium">إدراج رابط إلكتروني</div>
              <input
                type="text"
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                placeholder="أدخل عنوان URL للرابط"
                dir="ltr"
                className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
              />
              <div className="flex gap-2 justify-end mt-1">
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().extendMarkRange('link').unsetLink().run()
                    setActiveMenu(null)
                  }}
                  className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 border border-red-200 rounded-lg cursor-pointer"
                >
                  إزالة الرابط
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
                >
                  تطبيق
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Clear formatting */}
        <ToolbarButton
          onClick={() => {
            editor.chain().focus().unsetAllMarks().clearNodes().run()
          }}
          title="إزالة جميع التنسيقات"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </ToolbarButton>

      </div>

      {/* ─── Editor Area ─── */}
      <EditorContent editor={editor} placeholder={placeholder} />

      <style jsx global>{`
        .ProseMirror {
          direction: rtl;
          text-align: right;
          min-height: 300px;
          padding: 1.25rem;
          font-size: 1rem;
          line-height: 1.8;
          color: #1f2937;
          outline: none;
        }
        .ProseMirror p.is-empty::before {
          content: attr(data-placeholder);
          float: right;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror h1 { font-size: 2rem; font-weight: 800; margin: 1rem 0 0.5rem; color: #111827; line-height: 1.25; }
        .ProseMirror h2 { font-size: 1.625rem; font-weight: 700; margin: 0.875rem 0 0.4rem; color: #1f2937; line-height: 1.3; }
        .ProseMirror h3 { font-size: 1.375rem; font-weight: 600; margin: 0.75rem 0 0.3rem; color: #374151; line-height: 1.4; }
        .ProseMirror p { margin: 0.35rem 0; }
        .ProseMirror ul { list-style: disc; padding-right: 1.75rem; margin: 0.75rem 0; }
        .ProseMirror ol { list-style: decimal; padding-right: 1.75rem; margin: 0.75rem 0; }
        .ProseMirror li { margin: 0.3rem 0; }
        .ProseMirror blockquote {
          border-right: 4px solid #10b981;
          padding: 0.625rem 1.25rem;
          margin: 1rem 0;
          background: #ecfdf5;
          color: #065f46;
          border-radius: 0 0.75rem 0.75rem 0;
        }
        .ProseMirror code {
          background: #f3f4f6;
          padding: 0.15rem 0.4rem;
          border-radius: 0.375rem;
          font-family: monospace;
          font-size: 0.9em;
          color: #dc2626;
        }
        .ProseMirror pre {
          background: #1f2937;
          color: #f9fafb;
          padding: 1.25rem;
          border-radius: 0.75rem;
          overflow-x: auto;
          margin: 1rem 0;
          font-family: monospace;
        }
        .ProseMirror pre code { background: none; color: inherit; padding: 0; }
        .ProseMirror a { color: #10b981; text-decoration: underline; cursor: pointer; }
        .ProseMirror mark { border-radius: 4px; padding: 0.1rem 0.25rem; }
        .ProseMirror strong { font-weight: 700; }
      `}</style>
    </div>
  )
}
