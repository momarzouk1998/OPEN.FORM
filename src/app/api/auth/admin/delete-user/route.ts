import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  const token = request.cookies.get('session')?.value
  if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const payload = verifyToken(token)
  if (!payload || payload.role !== 'admin') return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const { userId } = await request.json()
  if (!userId) return NextResponse.json({ error: 'userId مطلوب' }, { status: 400 })

  try {
    await query('DELETE FROM profiles WHERE id = ?', [userId])
    await query('DELETE FROM form_responses WHERE user_id = ?', [userId])
    await query('DELETE FROM user_projects WHERE user_id = ?', [userId])
    await query('DELETE FROM project_supervisors WHERE user_id = ?', [userId])
    await query('DELETE FROM project_bans WHERE user_id = ?', [userId])
    await query('DELETE FROM notifications WHERE user_id = ?', [userId])
    await query('DELETE FROM notification_preferences WHERE user_id = ?', [userId])
    await query('DELETE FROM lesson_progress WHERE user_id = ?', [userId])
    await query('DELETE FROM lesson_comments WHERE user_id = ?', [userId])

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
