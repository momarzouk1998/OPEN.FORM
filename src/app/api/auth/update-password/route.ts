import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, comparePassword } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

export async function POST(request: NextRequest) {
  const token = request.cookies.get('session')?.value
  if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const { currentPassword, newPassword } = await request.json()
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'كلمة المرور الحالية والجديدة مطلوبتان' }, { status: 400 })
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ error: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' }, { status: 400 })
  }

  try {
    const user = await queryOne<any>('SELECT password_hash FROM profiles WHERE id = ?', [payload.userId])
    if (!user) return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })

    const valid = await comparePassword(currentPassword, user.password_hash)
    if (!valid) return NextResponse.json({ error: 'كلمة المرور الحالية غير صحيحة' }, { status: 401 })

    const bcrypt = await import('bcryptjs')
    const hash = await bcrypt.hash(newPassword, 12)
    await query('UPDATE profiles SET password_hash = ? WHERE id = ?', [hash, payload.userId])

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
