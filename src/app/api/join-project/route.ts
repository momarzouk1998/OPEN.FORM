import { NextRequest, NextResponse } from 'next/server'
import { queryOne, query, insert, update } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { token, userId } = await req.json()

    if (!token || !userId) {
      return NextResponse.json({ success: false, error: 'بيانات غير كاملة' }, { status: 400 })
    }

    const invite: any = await queryOne('SELECT * FROM project_invites WHERE token = ?', [token])

    if (!invite) {
      return NextResponse.json({ success: false, error: 'invite_not_found' })
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ success: false, error: 'invite_expired' })
    }

    if (invite.max_uses > 0 && invite.use_count >= invite.max_uses) {
      return NextResponse.json({ success: false, error: 'invite_max_uses' })
    }

    const existing: any = await queryOne(
      'SELECT id FROM user_projects WHERE user_id = ? AND project_id = ?',
      [userId, invite.project_id]
    )

    if (existing) {
      return NextResponse.json({ success: false, error: 'already_member' })
    }

    await insert('user_projects', {
      user_id: userId,
      project_id: invite.project_id,
      role: 'member',
    })

    await update('project_invites', { use_count: (invite.use_count || 0) + 1 }, 'id', invite.id)

    return NextResponse.json({ success: true, project_id: invite.project_id })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'حدث خطأ' }, { status: 500 })
  }
}
