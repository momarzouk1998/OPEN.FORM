'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { User } from '@/types'
import NotificationsPopover from './NotificationsPopover'

interface HeaderProps {
  user: User
  settings: any
  onMenuClick?: () => void
  showMenuButton?: boolean
}

export default function Header({ user, settings, onMenuClick, showMenuButton = true }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleMenuClick = () => {
    if (onMenuClick) {
      onMenuClick()
    } else {
      setMobileMenuOpen(!mobileMenuOpen)
    }
  }

  return (
    <>
      <header className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-30 border-b border-gray-100/80">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showMenuButton && (
              <button
                onClick={handleMenuClick}
                className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
            )}

            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200/50">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <span className="font-bold text-lg text-gray-800">Forms<span className="text-pink-500">.OpenappO</span></span>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            <Link href="/dashboard" className="px-3.5 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium">
              الرئيسية
            </Link>
            <Link href="/templates" className="px-3.5 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium">
              القوالب
            </Link>
            <Link href="/partners" className="px-3.5 py-2 text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium">
              شركاء النجاح
            </Link>
            <Link href="/profile" className="px-3.5 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium">
              الملف الشخصي
            </Link>
            {user?.role === 'admin' && (
              <Link href="/admin" className="px-3.5 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium">
                لوحة التحكم
              </Link>
            )}
            <NotificationsPopover />
            <div className="w-px h-5 bg-gray-200 mx-2"></div>
            <button onClick={handleLogout} className="px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium">
              تسجيل الخروج
            </button>
          </nav>
        </div>
      </header>

      {!onMenuClick && mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-100 px-4 py-2 flex flex-col gap-1 shadow-sm">
          <Link href="/dashboard" className="px-3 py-2.5 text-gray-700 hover:bg-blue-50 rounded-lg text-sm font-medium">الرئيسية</Link>
          <Link href="/templates" className="px-3 py-2.5 text-gray-700 hover:bg-blue-50 rounded-lg text-sm font-medium">القوالب</Link>
          <Link href="/partners" className="px-3 py-2.5 text-gray-700 hover:bg-indigo-50 rounded-lg text-sm font-medium">شركاء النجاح</Link>
          <Link href="/profile" className="px-3 py-2.5 text-gray-700 hover:bg-blue-50 rounded-lg text-sm font-medium">الملف الشخصي</Link>
          {user?.role === 'admin' && (
            <Link href="/admin" className="px-3 py-2.5 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium">لوحة التحكم</Link>
          )}
          <button onClick={handleLogout} className="text-right px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium">تسجيل الخروج</button>
        </div>
      )}
    </>
  )
}
