import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import FormFiller from './FormFiller'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function FormPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Get form data
  const { data: form } = await supabase
    .from('forms')
    .select('*')
    .eq('id', id)
    .single()

  if (!form) {
    redirect('/')
  }

  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('form_id', id)
    .order('order_index', { ascending: true })

  // Check if user is authenticated (optional)
  const { data: { user } } = await supabase.auth.getUser()
  let existingResponse = null
  let allResponses: any[] = []

  if (user) {
    const { data: responses } = await supabase
      .from('form_responses')
      .select('*')
      .eq('form_id', id)
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false })

    allResponses = responses || []
    existingResponse = allResponses.length > 0 ? allResponses[0] : null
  }

  return (
    <FormFiller
      form={form}
      questions={questions || []}
      existingResponse={existingResponse}
      allUserResponses={allResponses}
      project={null}
      userId={user?.id || null}
    />
  )
}