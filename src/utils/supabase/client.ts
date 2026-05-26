import { createBrowserClient } from '@supabase/ssr'

let browserClient: ReturnType<typeof createBrowserClient> | null = null

const resilientFetch: typeof fetch = async (input, init) => {
  try {
    return await fetch(input, init)
  } catch (error) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    const isRefreshRequest = url.includes('/auth/v1/token') && url.includes('grant_type=refresh_token')

    if (isRefreshRequest) {
      await new Promise(resolve => setTimeout(resolve, 700))
      try {
        return await fetch(input, init)
      } catch {
        return new Response(JSON.stringify({
          error: 'network_unavailable',
          error_description: 'تعذر تجديد الجلسة مؤقتا بسبب تغير الاتصال بالشبكة.'
        }), {
          status: 503,
          headers: { 'content-type': 'application/json' }
        })
      }
    }

    throw error
  }
}

export const createClient = () => {
  if (browserClient) return browserClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    if (typeof window === 'undefined') {
      // In SSR/Build phase, we might not have these yet
      return {} as any
    }
    throw new Error('Missing Supabase environment variables')
  }

  browserClient = createBrowserClient(url, key, {
    global: {
      fetch: resilientFetch
    }
  })

  return browserClient
}

