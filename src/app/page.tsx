import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PublicProjectsView from '@/components/PublicProjectsView'

export default async function HomePage() {
  const supabase = await createClient()

  // Check if user is already logged in
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    // If logged in, redirect to dashboard
    redirect('/dashboard')
  }

  // Get counts
  const { count: projectsCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })

  const { count: formsCount } = await supabase
    .from('forms')
    .select('*', { count: 'exact', head: true })

  const { count: responsesCount } = await supabase
    .from('form_responses')
    .select('*', { count: 'exact', head: true })

  return <PublicProjectsView 
    stats={{
      projects: projectsCount || 0,
      forms: formsCount || 0,
      responses: responsesCount || 0
    }} 
  />
}
