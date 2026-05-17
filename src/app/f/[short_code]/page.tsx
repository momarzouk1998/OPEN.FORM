import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function ShortCodePage({ params }: { params: Promise<{ short_code: string }> }) {
  const { short_code } = await params
  const supabase = await createClient()

  const { data: form } = await supabase
    .from('forms')
    .select('id')
    .eq('short_code', short_code.toUpperCase())
    .maybeSingle()

  if (!form) {
    redirect('/404')
  }

  redirect(`/forms/${form.id}`)
}
