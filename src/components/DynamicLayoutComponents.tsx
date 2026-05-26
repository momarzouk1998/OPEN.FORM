'use client'

import dynamic from 'next/dynamic'

const ServiceWorker = dynamic(() => import('@/components/ServiceWorker'), { ssr: false })
const FooterBar = dynamic(() => import('@/components/FooterBar'), { ssr: false })
const ToastContainer = dynamic(() => import('@/components/ToastContainer'), { ssr: false })

export default function DynamicLayoutComponents() {
  return (
    <>
      <ServiceWorker />
      <ToastContainer />
      <FooterBar />
    </>
  )
}
