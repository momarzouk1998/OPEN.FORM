'use client'

import { Suspense } from 'react'
import FormEditor from '@/components/FormEditor'

export default function CreateFormPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" /></div>}>
      <FormEditor mode="create" />
    </Suspense>
  )
}
