'use client'

import { useState } from 'react'
import type { ThemeSettings } from '@/types'

interface SubmitButton {
  text?: string
  color?: string
  textColor?: string
}

interface ThemeDesignerProps {
  isOpen: boolean
  theme: ThemeSettings | null
  submitButton: SubmitButton
  onUpdate: (updates: Partial<ThemeSettings>) => void
  onSubmitButtonChange: (updates: SubmitButton) => void
  onClose: () => void
}

type DesignerTab = 'themes' | 'colors' | 'styles' | 'layout' | 'button'

const PRESET_THEMES: Array<{ name: string; label: string; settings: ThemeSettings }> = [
  {
    name: 'Default',
    label: 'الافتراضي الكلاسيكي',
    settings: {
      pageColor: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      formBgColor: '#ffffff',
      textColor: '#1e293b',
      primaryColor: '#2563eb',
      borderRadius: '16px',
      spacing: 'normal',
      fontFamily: 'Cairo',
      flatLayout: false,
      borderStyle: 'none',
      borderWidth: 0
    }
  },
  {
    name: 'Simplicity',
    label: 'البساطة الفائقة',
    settings: {
      pageColor: '#ffffff',
      formBgColor: '#fafafa',
      textColor: '#262626',
      primaryColor: '#171717',
      borderRadius: '8px',
      spacing: 'compact',
      fontFamily: 'Inter',
      flatLayout: true,
      borderStyle: 'solid',
      borderWidth: 1
    }
  },
  {
    name: 'Sunset Poetry',
    label: 'شعر الغروب',
    settings: {
      pageColor: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fca5a5 100%)',
      formBgColor: '#ffffffc0',
      textColor: '#78350f',
      primaryColor: '#db2777',
      borderRadius: '24px',
      spacing: 'cozy',
      fontFamily: 'Tajawal',
      flatLayout: false,
      borderStyle: 'none',
      borderWidth: 0
    }
  },
  {
    name: 'Vintage Star',
    label: 'النجم الكلاسيكي',
    settings: {
      pageColor: 'linear-gradient(135deg, #fefbf3 0%, #f1efe3 100%)',
      formBgColor: '#fdfcf7',
      textColor: '#4a3f35',
      primaryColor: '#b45309',
      borderRadius: '4px',
      spacing: 'normal',
      fontFamily: 'Cairo',
      flatLayout: false,
      borderStyle: 'solid',
      borderWidth: 2
    }
  },
  {
    name: 'Brick Wall',
    label: 'جدار الطوب الدافئ',
    settings: {
      pageColor: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
      formBgColor: '#ffffff',
      textColor: '#991b1b',
      primaryColor: '#dc2626',
      borderRadius: '12px',
      spacing: 'normal',
      fontFamily: 'Cairo',
      flatLayout: false,
      borderStyle: 'none',
      borderWidth: 0
    }
  },
  {
    name: 'Colorful Smart',
    label: 'الذكي الملون',
    settings: {
      pageColor: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)',
      formBgColor: '#ffffff',
      textColor: '#0f172a',
      primaryColor: '#0ea5e9',
      borderRadius: '20px',
      spacing: 'normal',
      fontFamily: 'Outfit',
      flatLayout: false,
      borderStyle: 'none',
      borderWidth: 0
    }
  },
  {
    name: 'Basic Cool',
    label: 'البارد الأساسي',
    settings: {
      pageColor: '#f1f5f9',
      formBgColor: '#ffffff',
      textColor: '#334155',
      primaryColor: '#64748b',
      borderRadius: '12px',
      spacing: 'normal',
      fontFamily: 'Inter',
      flatLayout: false,
      borderStyle: 'none',
      borderWidth: 0
    }
  },
  {
    name: 'Tech Cyber',
    label: 'السيبراني التقني',
    settings: {
      pageColor: '#030712',
      formBgColor: '#111827',
      textColor: '#f3f4f6',
      primaryColor: '#10b981',
      borderRadius: '0px',
      spacing: 'compact',
      fontFamily: 'Outfit',
      flatLayout: true,
      borderStyle: 'solid',
      borderWidth: 1
    }
  },
  {
    name: 'Pet Lover',
    label: 'عشاق الأليفة دافئ',
    settings: {
      pageColor: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)',
      formBgColor: '#ffffff',
      textColor: '#7c2d12',
      primaryColor: '#ea580c',
      borderRadius: '24px',
      spacing: 'cozy',
      fontFamily: 'Tajawal',
      flatLayout: false,
      borderStyle: 'none',
      borderWidth: 0
    }
  },
  {
    name: 'Natural Green',
    label: 'الأخضر الطبيعي',
    settings: {
      pageColor: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
      formBgColor: '#ffffff',
      textColor: '#14532d',
      primaryColor: '#16a34a',
      borderRadius: '16px',
      spacing: 'normal',
      fontFamily: 'Cairo',
      flatLayout: false,
      borderStyle: 'none',
      borderWidth: 0
    }
  },
  {
    name: 'Blue Ocean',
    label: 'المحيط الأزرق العميق',
    settings: {
      pageColor: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
      formBgColor: '#1e293b',
      textColor: '#f8fafc',
      primaryColor: '#3b82f6',
      borderRadius: '16px',
      spacing: 'normal',
      fontFamily: 'Outfit',
      flatLayout: false,
      borderStyle: 'none',
      borderWidth: 0
    }
  },
  {
    name: 'Purple Galaxy',
    label: 'مجرة الأرجوان السحرية',
    settings: {
      pageColor: 'linear-gradient(135deg, #581c87 0%, #2e1065 100%)',
      formBgColor: '#ffffff10',
      textColor: '#f3e8ff',
      primaryColor: '#a855f7',
      borderRadius: '24px',
      spacing: 'cozy',
      fontFamily: 'Cairo',
      flatLayout: false,
      borderStyle: 'dashed',
      borderWidth: 1
    }
  }
]

export default function ThemeDesigner({ isOpen, theme, submitButton, onUpdate, onSubmitButtonChange, onClose }: ThemeDesignerProps) {
  const [designerTab, setDesignerTab] = useState<DesignerTab>('themes')

  const renderThemeStyles = () => {
    if (!theme) return null
    return (
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700&family=Tajawal:wght@300;400;500;700;800&display=swap');
        
        .builder-themed-container {
          ${theme.pageColor ? `background: ${theme.pageColor} !important;` : ''}
          ${theme.fontFamily ? `font-family: '${theme.fontFamily}', sans-serif !important;` : ''}
        }
        .form-themed-card {
          ${theme.formBgColor ? `background-color: ${theme.formBgColor} !important;` : ''}
          ${theme.borderRadius ? `border-radius: ${theme.borderRadius} !important;` : ''}
          ${theme.textColor ? `color: ${theme.textColor} !important;` : ''}
          ${theme.flatLayout ? `box-shadow: none !important;` : ''}
          ${theme.borderStyle && theme.borderStyle !== 'none' ? `border: ${theme.borderWidth || 1}px ${theme.borderStyle} ${theme.textColor || '#d1d5db'} !important;` : ''}
        }
        .form-themed-text {
          ${theme.textColor ? `color: ${theme.textColor} !important;` : ''}
        }
        .form-themed-description {
          ${theme.textColor ? `color: ${theme.textColor}cc !important;` : ''}
        }
        .form-themed-primary-bg {
          ${theme.primaryColor ? `background: ${theme.primaryColor} !important; background-color: ${theme.primaryColor} !important;` : ''}
          color: #ffffff !important;
        }
        .form-themed-primary-text {
          ${theme.primaryColor ? `color: ${theme.primaryColor} !important;` : ''}
        }
        .form-themed-primary-border {
          ${theme.primaryColor ? `border-color: ${theme.primaryColor} !important;` : ''}
        }
        .form-themed-spacing {
          ${theme.spacing === 'compact' ? 'margin-bottom: 0.5rem !important;' : theme.spacing === 'cozy' ? 'margin-bottom: 2rem !important;' : 'margin-bottom: 1.5rem !important;'}
        }
        .form-themed-width {
          ${theme.formWidth ? `max-width: ${theme.formWidth}px !important; width: 100% !important;` : ''}
        }
      `}} />
    )
  }

  return (
    <>
      {renderThemeStyles()}
      <div
        dir="rtl"
        className={`fixed top-[73px] start-0 bottom-0 w-full sm:w-[420px] bg-white shadow-2xl z-30 transition-transform duration-300 ease-in-out border-l border-gray-100 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 text-sm sm:text-base">مصمم النموذج</h3>
          </div>
          <button
            aria-label="إغلاق"
            onClick={onClose}
            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer text-gray-400 hover:text-gray-700 border-0 bg-transparent"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-gray-100 bg-gray-50/50 p-1">
          {[
            { id: 'themes', label: 'الثيمات', icon: '🎨' },
            { id: 'colors', label: 'الألوان', icon: '✨' },
            { id: 'styles', label: 'الأنماط', icon: '📏' },
            { id: 'layout', label: 'التخطيط', icon: '🖼️' },
            { id: 'button', label: 'الزر', icon: '🔘' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setDesignerTab(tab.id as DesignerTab)}
              className={`flex-1 py-2 px-1 text-center font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer border-0 ${
                designerTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm border border-gray-200'
                  : 'text-gray-500 hover:text-gray-800 bg-transparent'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
          {designerTab === 'themes' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 text-xs text-blue-700 font-medium">
                💡 اختر من القوالب الجاهزة لتغيير مظهر استبيانك بضغطة زر واحدة. يمكنك بعدها تخصيص الألوان والتفاصيل كما تحب.
              </div>
              <div className="grid grid-cols-2 gap-3">
                {PRESET_THEMES.map(preset => {
                  const isSelected = theme?.themeName === preset.name || (!theme?.themeName && preset.name === 'Default');
                  return (
                    <button
                      key={preset.name}
                      onClick={() => onUpdate({ ...preset.settings, themeName: preset.name })}
                      className={`p-3 rounded-xl border text-right transition-all hover:scale-[1.02] flex flex-col justify-between h-28 cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? 'border-blue-500 ring-2 ring-blue-50 bg-blue-50/10'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                      style={{
                        background: isSelected ? undefined : preset.settings.formBgColor === '#ffffff10' ? '#1e293b' : preset.settings.formBgColor
                      }}
                    >
                      <div
                        className="absolute inset-0 opacity-5 pointer-events-none"
                        style={{ background: preset.settings.pageColor }}
                      />

                      <div className="flex justify-between items-start w-full relative z-10">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 border border-white"
                          style={{ backgroundColor: preset.settings.primaryColor }}
                        />
                        {isSelected && (
                          <span className="text-blue-600 bg-blue-100 text-[10px] px-1.5 py-0.5 rounded font-bold">
                            نشط
                          </span>
                        )}
                      </div>

                      <div className="relative z-10 w-full col-span-2">
                        <h4
                          className="font-bold text-sm truncate"
                          style={{
                            color: isSelected ? '#1e293b' : preset.settings.textColor === '#f3e8ff' || preset.settings.textColor === '#f8fafc' ? '#ffffff' : preset.settings.textColor
                          }}
                        >
                          {preset.label}
                        </h4>
                        <p className="text-[10px] text-gray-400 font-medium truncate mt-0.5">{preset.name}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {designerTab === 'colors' && (
            <div className="space-y-4">
              {/* Page Background */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                <label className="block text-sm font-bold text-gray-700">لون خلفية الصفحة</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={theme?.pageColor?.startsWith('#') ? theme.pageColor : '#f8fafc'}
                    onChange={(e) => onUpdate({ pageColor: e.target.value, themeName: 'Custom' })}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200 p-0"
                  />
                  <input
                    type="text"
                    value={theme?.pageColor || ''}
                    onChange={(e) => onUpdate({ pageColor: e.target.value, themeName: 'Custom' })}
                    placeholder="#f8fafc أو gradient..."
                    className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['#f8fafc', '#f1f5f9', '#eff6ff', '#f5f3ff', '#fff7ed', '#0f172a', '#1e293b'].map(c => (
                    <button
                      key={c}
                      onClick={() => onUpdate({ pageColor: c, themeName: 'Custom' })}
                      className="w-6 h-6 rounded-full border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Card Background */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                <label className="block text-sm font-bold text-gray-700">خلفية بطاقات الأسئلة</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={theme?.formBgColor?.startsWith('#') ? theme.formBgColor : '#ffffff'}
                    onChange={(e) => onUpdate({ formBgColor: e.target.value, themeName: 'Custom' })}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200 p-0"
                  />
                  <input
                    type="text"
                    value={theme?.formBgColor || ''}
                    onChange={(e) => onUpdate({ formBgColor: e.target.value, themeName: 'Custom' })}
                    placeholder="#ffffff أو rgba..."
                    className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['#ffffff', '#f8fafc', '#f1f5f9', '#1e293b', '#0f172a', '#ffffff10', '#ffffff30'].map(c => (
                    <button
                      key={c}
                      onClick={() => onUpdate({ formBgColor: c, themeName: 'Custom' })}
                      className="w-6 h-6 rounded-full border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Primary Theme Color */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                <label className="block text-sm font-bold text-gray-700">اللون الأساسي (الأزرار والتركيز)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={theme?.primaryColor || '#2563eb'}
                    onChange={(e) => onUpdate({ primaryColor: e.target.value, themeName: 'Custom' })}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200 p-0"
                  />
                  <input
                    type="text"
                    value={theme?.primaryColor || ''}
                    onChange={(e) => onUpdate({ primaryColor: e.target.value, themeName: 'Custom' })}
                    placeholder="#2563eb"
                    className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['#2563eb', '#7c3aed', '#ec4899', '#f97316', '#10b981', '#06b6d4', '#e11d48'].map(c => (
                    <button
                      key={c}
                      onClick={() => onUpdate({ primaryColor: c, themeName: 'Custom' })}
                      className="w-6 h-6 rounded-full border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Text Color */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                <label className="block text-sm font-bold text-gray-700">لون النصوص</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={theme?.textColor || '#1e293b'}
                    onChange={(e) => onUpdate({ textColor: e.target.value, themeName: 'Custom' })}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200 p-0"
                  />
                  <input
                    type="text"
                    value={theme?.textColor || ''}
                    onChange={(e) => onUpdate({ textColor: e.target.value, themeName: 'Custom' })}
                    placeholder="#1e293b"
                    className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['#0f172a', '#1e293b', '#475569', '#f8fafc', '#f3e8ff', '#ffe4e6'].map(c => (
                    <button
                      key={c}
                      onClick={() => onUpdate({ textColor: c, themeName: 'Custom' })}
                      className="w-6 h-6 rounded-full border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {designerTab === 'styles' && (
            <div className="space-y-4">
              {/* Form Width */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-gray-700">عرض النموذج</label>
                  <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded">
                    {theme?.formWidth || 768}px
                  </span>
                </div>
                <input
                  type="range"
                  min="600"
                  max="1200"
                  step="10"
                  value={theme?.formWidth || 768}
                  onChange={(e) => onUpdate({ formWidth: Number(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-gray-400 font-semibold">
                  <span>ضيق (600px)</span>
                  <span>افتراضي (768px)</span>
                  <span>عريض (1200px)</span>
                </div>
              </div>

              {/* Spacing Selection */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
                <label className="block text-sm font-bold text-gray-700">المسافات والتباعد</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'compact', label: 'مدمج / ضيق', desc: 'compact' },
                    { id: 'normal', label: 'طبيعي', desc: 'normal' },
                    { id: 'cozy', label: 'مريح / واسع', desc: 'cozy' },
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => onUpdate({ spacing: item.id as ThemeSettings['spacing'] })}
                      className={`py-2 px-1 text-center font-bold text-xs border rounded-lg transition-colors cursor-pointer ${
                        theme?.spacing === item.id || (!theme?.spacing && item.id === 'normal')
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Border Radius */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
                <label className="block text-sm font-bold text-gray-700">انحناء الزوايا</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: '0px', label: 'حاد' },
                    { id: '8px', label: 'خفيف' },
                    { id: '16px', label: 'متوسط' },
                    { id: '28px', label: 'دائري' },
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => onUpdate({ borderRadius: item.id })}
                      className={`py-2 px-1 text-center font-bold text-xs border rounded-lg transition-colors cursor-pointer ${
                        theme?.borderRadius === item.id || (!theme?.borderRadius && item.id === '16px')
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Family */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
                <label className="block text-sm font-bold text-gray-700">خط الاستبيان</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'Cairo', label: 'خط القاهرة (Cairo)', family: "'Cairo', sans-serif" },
                    { id: 'Tajawal', label: 'خط تجول (Tajawal)', family: "'Tajawal', sans-serif" },
                    { id: 'Inter', label: 'Inter (إنجليزي)', family: "'Inter', sans-serif" },
                    { id: 'Outfit', label: 'Outfit (إنجليزي)', family: "'Outfit', sans-serif" },
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => onUpdate({ fontFamily: item.id })}
                      className={`p-3 text-center border rounded-lg transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        theme?.fontFamily === item.id || (!theme?.fontFamily && item.id === 'Cairo')
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                      style={{ fontFamily: item.family }}
                    >
                      <span className="text-sm font-bold">{item.label}</span>
                      <span className="text-xs opacity-85">أبجد هوز 123</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {designerTab === 'button' && (
            <div className="space-y-5">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 text-xs text-blue-700 font-medium">
                🔘 تخصيص شكل ونص زر الإرسال في الفورم
              </div>

              {/* Button Text */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">نص الزر</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {['إرسال', 'تسجيل', 'حجز', 'تأكيد الطلب', 'Submission'].map(t => {
                    const currentText = submitButton?.text
                    return (
                      <button key={t} type="button" onClick={() => onSubmitButtonChange({ ...submitButton, text: t })}
                        className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                          currentText === t ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >{t}</button>
                    )
                  })}
                </div>
                <input type="text" value={submitButton?.text || ''} onChange={(e) => onSubmitButtonChange({ ...submitButton, text: e.target.value })}
                  placeholder="نص مخصص..." className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
              </div>

              {/* Button Background Color */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">لون خلفية الزر</label>
                <div className="flex gap-2 items-center">
                  {['#059669', '#2563eb', '#dc2626', '#7c3aed', '#d97706', '#0891b2'].map(c => {
                    const currentColor = submitButton?.color || '#059669'
                    return <button key={c} type="button" onClick={() => onSubmitButtonChange({ ...submitButton, color: c })}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${currentColor === c ? 'border-gray-900 scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                  })}
                  <input type="color" value={submitButton?.color || '#059669'}
                    onChange={(e) => onSubmitButtonChange({ ...submitButton, color: e.target.value })}
                    className="w-7 h-7 rounded cursor-pointer border border-gray-200" />
                </div>
              </div>

              {/* Button Text Color */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">لون نص الزر</label>
                <input type="color" value={submitButton?.textColor || '#ffffff'}
                  onChange={(e) => onSubmitButtonChange({ ...submitButton, textColor: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer border border-gray-200" />
              </div>

              {/* Live Preview */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">معاينة حية</label>
                <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-xl p-6 border border-gray-200 flex items-center justify-center">
                  <button
                    className="px-8 py-3.5 rounded-2xl font-bold text-sm shadow-lg transition-all"
                    style={{
                      backgroundColor: submitButton?.color || '#059669',
                      color: submitButton?.textColor || '#ffffff',
                    }}
                  >
                    {submitButton?.text || 'إرسال'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {designerTab === 'layout' && (
            <div className="space-y-4">
              {/* Shadow Layout */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                <div>
                  <label className="block text-sm font-bold text-gray-700">تصميم مسطح بدون ظلال</label>
                  <p className="text-xs text-gray-400 mt-0.5">إلغاء تفعيل الظلال ثلاثية الأبعاد للبطاقات</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={theme?.flatLayout || false}
                    onChange={(e) => onUpdate({ flatLayout: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Border Style */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                <label className="block text-sm font-bold text-gray-700">شكل حدود البطاقات</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'none', label: 'بدون إطار' },
                    { id: 'solid', label: 'خط متصل' },
                    { id: 'dashed', label: 'خط متقطع' },
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => onUpdate({ borderStyle: item.id as ThemeSettings['borderStyle'] })}
                      className={`py-2 px-1 text-center font-bold text-xs border rounded-lg transition-colors cursor-pointer ${
                        theme?.borderStyle === item.id || (!theme?.borderStyle && item.id === 'none')
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Border Width */}
              {theme?.borderStyle && theme.borderStyle !== 'none' && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-gray-700">سمك الإطار</label>
                    <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded">
                      {theme?.borderWidth || 1}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={theme?.borderWidth || 1}
                    onChange={(e) => onUpdate({ borderWidth: Number(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 font-semibold">
                    <span>نحيف (1px)</span>
                    <span>سميك (5px)</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with Reset */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm('هل أنت متأكد من رغبتك في إعادة تعيين كافة التنسيقات للقالب الافتراضي؟')) {
                onUpdate(PRESET_THEMES[0].settings);
              }
            }}
            className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1.5 cursor-pointer bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors border-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            إعادة تعيين الافتراضي
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-all shadow-sm cursor-pointer border-0"
           >
             تم وتطبيق التغييرات
           </button>
         </div>
      </div>
    </>
  )
}
