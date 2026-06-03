'use client'

import { useState, useEffect } from 'react'

interface AppSettings {
  app_logo: string
  app_name: string
  app_description: string
}

const defaults: AppSettings = {
  app_logo: '',
  app_name: 'أحلى شباب',
  app_description: 'منصة متكاملة لإدارة المتطوعين والمشاريع',
}

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaults)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchSettings() }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      const json = await res.json()
      if (json.settings) {
        setSettings({
          app_logo: json.settings.app_logo || defaults.app_logo,
          app_name: json.settings.app_name || defaults.app_name,
          app_description: json.settings.app_description || defaults.app_description,
        })
      }
    } catch (e) {
      console.error('Error fetching settings:', e)
    } finally {
      setLoading(false)
    }
  }



  return { settings, loading, refetch: fetchSettings }

}

