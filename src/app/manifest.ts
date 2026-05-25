import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  const appLogo = process.env.NEXT_PUBLIC_APP_LOGO || '/icon.svg'
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Forms.OpenappO'

  return {
    name: appName,
    short_name: 'Forms.OpenappO',
    description: 'منصة Forms.OpenappO لإنشاء النماذج والحجوزات والقوالب الذكية',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#12D8D8',
    orientation: 'portrait-primary',
    dir: 'rtl',
    lang: 'ar',
    icons: [
      {
        src: appLogo,
        sizes: '192x192',
        purpose: 'maskable',
      },
    ],
  }
}
