import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import FormFiller from './FormFiller'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function FormPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Get form data - accept UUID or serial_number
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  const { data: form } = await supabase
    .from('forms')
    .select('*')
    .eq(isUUID ? 'id' : 'serial_number', isUUID ? id : parseInt(id))
    .single()

  if (!form) {
    redirect('/')
  }

  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('form_id', form.id)
    .order('order_index', { ascending: true })

  // Check if user is authenticated (optional)
  const { data: { user } } = await supabase.auth.getUser()
  let existingResponse = null
  let allResponses: any[] = []

  if (user) {
    const { data: responses } = await supabase
      .from('form_responses')
      .select('*')
      .eq('form_id', form.id)
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