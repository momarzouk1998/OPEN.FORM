'use client'

import { createClient } from '@/utils/supabase/client'
import { toast } from '@/lib/toast'

export interface ProductItem {
  id: string
  name: string
  description?: string
  price: number
  image_url?: string
  available?: boolean
}

export interface ProductGroup {
  id: string
  name: string
  items: ProductItem[]
}

interface ProductGroupsEditorProps {
  groups: ProductGroup[]
  onChange: (groups: ProductGroup[]) => void
}

export default function ProductGroupsEditor({ groups, onChange }: ProductGroupsEditorProps) {
  const safeGroups = Array.isArray(groups) ? groups : []

  const updateGroup = (groupIndex: number, updates: Partial<ProductGroup>) => {
    onChange(safeGroups.map((group, index) => index === groupIndex ? { ...group, ...updates } : group))
  }

  const updateItem = (groupIndex: number, itemIndex: number, updates: Partial<ProductItem>) => {
    onChange(safeGroups.map((group, index) => {
      if (index !== groupIndex) return group
      return {
        ...group,
        items: (group.items || []).map((item, innerIndex) => innerIndex === itemIndex ? { ...item, ...updates } : item)
      }
    }))
  }

  const uploadImage = async (groupIndex: number, itemIndex: number, file: File) => {
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`
    const { error } = await supabase.storage.from('products').upload(fileName, file)
    if (error) {
      toast('فشل رفع الصورة')
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName)
    updateItem(groupIndex, itemIndex, { image_url: publicUrl })
  }

  return (
    <div className="space-y-4">
      {safeGroups.map((group, groupIndex) => (
        <div key={group.id || groupIndex} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center gap-2 p-3 bg-gray-50 border-b border-gray-200">
            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            <input
              type="text"
              value={group.name || ''}
              onChange={(event) => updateGroup(groupIndex, { name: event.target.value })}
              placeholder="اسم المجموعة (مثلا: مشروبات ساخنة)"
              className="flex-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-bold"
            />
            <button
              onClick={() => onChange(safeGroups.filter((_, index) => index !== groupIndex))}
              className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
              title="حذف المجموعة"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          <div className="p-3 space-y-3">
            {(group.items || []).map((item, itemIndex) => (
              <div key={item.id || itemIndex} className="flex gap-2 items-start p-2 bg-gray-50 rounded-xl border border-gray-100">
                {item.image_url ? (
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                    <img src={item.image_url} alt={item.name || 'منتج'} className="w-full h-full object-cover" />
                    <button
                      onClick={() => updateItem(groupIndex, itemIndex, { image_url: '' })}
                      className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label className="w-14 h-14 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-400 shrink-0">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (file) uploadImage(groupIndex, itemIndex, file)
                      }}
                    />
                  </label>
                )}

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5">
                    <input
                      type="text"
                      value={item.name || ''}
                      onChange={(event) => updateItem(groupIndex, itemIndex, { name: event.target.value })}
                      placeholder="اسم الصنف"
                      className="flex-1 px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium"
                    />
                    <input
                      type="number"
                      min="0"
                      value={item.price || ''}
                      onChange={(event) => updateItem(groupIndex, itemIndex, { price: Number(event.target.value) })}
                      placeholder="0.00"
                      className="w-full sm:w-24 px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                  <textarea
                    value={item.description || ''}
                    onChange={(event) => updateItem(groupIndex, itemIndex, { description: event.target.value })}
                    rows={1}
                    placeholder="تفاصيل الصنف (اختياري)"
                    className="w-full px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs"
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1 text-xs text-gray-500">
                      <input
                        type="checkbox"
                        checked={item.available !== false}
                        onChange={(event) => updateItem(groupIndex, itemIndex, { available: event.target.checked })}
                        className="w-3 h-3 text-blue-600 rounded"
                      />
                      متاح
                    </label>
                    <button
                      onClick={() => updateGroup(groupIndex, { items: (group.items || []).filter((_, index) => index !== itemIndex) })}
                      className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={() => updateGroup(groupIndex, {
                items: [
                  ...(group.items || []),
                  { id: `p_${Date.now()}`, name: '', description: '', price: 0, image_url: '', available: true }
                ]
              })}
              className="w-full py-1.5 border border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors text-xs flex items-center justify-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              إضافة صنف
            </button>
          </div>
        </div>
      ))}

      <button
        onClick={() => onChange([...safeGroups, { id: `g_${Date.now()}`, name: '', items: [] }])}
        className="w-full py-2.5 border-2 border-dashed border-gray-300 text-gray-500 rounded-xl hover:border-emerald-400 hover:text-emerald-600 transition-colors text-sm flex items-center justify-center gap-1"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
        إضافة مجموعة
      </button>
    </div>
  )
}
