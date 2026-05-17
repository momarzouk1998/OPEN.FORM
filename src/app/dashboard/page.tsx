import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import DashboardContent from './DashboardContent'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  if (profile.status === 'pending') {
    await supabase.auth.signOut()
    redirect('/login?pending=true')
  }

  if (profile.status === 'rejected') {
    await supabase.auth.signOut()
    redirect('/login?rejected=true')
  }

  // Get stats for admins
  let stats = null
  if (profile.role === 'admin') {
    const [{ count: usersCount }, { count: pendingCount }] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending')
    ])

    stats = {
      total_users: usersCount || 0,
      total_projects: 0,
      pending_approvals: pendingCount || 0
    }
  }

  return (
    <DashboardContent
      profile={profile}
      stats={stats ?? undefined}
    />
  )
}
