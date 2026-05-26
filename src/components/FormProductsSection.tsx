'use client'

import Image from 'next/image'
import { formatCountdown, type ProductGroup } from '@/lib/formFillerUtils'

interface FormProductsSectionProps {
  productGroups: ProductGroup[]
  cart: Record<string, number>
  cartTotal: number
  cartCount: number
  offerEndStr: string | null
  offerCountdown: number
  questions: any[]
  submitted: boolean
  setCart: (updater: Record<string, number> | ((prev: Record<string, number>) => Record<string, number>)) => void
}

export function FormProductsSection({ productGroups, cart, cartTotal, cartCount, offerEndStr, offerCountdown, questions, submitted, setCart }: FormProductsSectionProps) {
  if (questions?.some((q: any) => q.type === 'products_block') || productGroups.length === 0 || submitted) return null

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6 form-themed-card">
      <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
        {offerEndStr && offerCountdown > 0 && (
          <span className="mr-auto text-sm font-mono text-red-500 tracking-wider" dir="ltr">{formatCountdown(offerCountdown)}</span>
        )}
      </h3>
      {productGroups.map(group => (
        <div key={group.id} className="mb-6 last:mb-0">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-0.5 flex-1 bg-gradient-to-l from-blue-100 to-transparent rounded-full" />
            <h4 className="text-sm font-bold text-gray-700 px-2">{group.name}</h4>
            <div className="h-0.5 flex-1 bg-gradient-to-r from-blue-100 to-transparent rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {group.items.filter(p => p.available !== false).map((prod) => {
              const qty = cart[prod.id] || 0
              return (
                <div key={prod.id} className="border border-gray-200 rounded-xl overflow-hidden hover:border-blue-300 hover:shadow-md transition-all">
                  {prod.image_url && (
                    <div className="h-36 bg-gray-50 overflow-hidden relative">
                      <Image src={prod.image_url} alt={prod.name} fill className="object-cover" loading="lazy" />
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

export function FormOfferCountdownBanner({ offerEndStr, offerCountdown, questions, submitted }: {
  offerEndStr: string | null; offerCountdown: number; questions: any[]; submitted: boolean
}) {
  if (questions?.some((q: any) => q.type === 'countdown_timer') || !offerEndStr || offerCountdown <= 0 || submitted) return null

  return (
    <div className="bg-gradient-to-l from-red-500 to-orange-500 rounded-2xl p-4 mb-6 shadow-lg text-center">
      <p className="text-white/80 text-xs mb-1">العرض ينتهي خلال</p>
      <p className="text-white text-3xl font-mono font-bold tracking-widest" dir="ltr">
        {formatCountdown(offerCountdown)}
      </p>
    </div>
  )
}
