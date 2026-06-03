import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  const token = request.cookies.get('session')?.value
  if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const payload = verifyToken(token)
  if (!payload || payload.role !== 'admin') return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const { userId, password } = await request.json()
  if (!userId) return NextResponse.json({ error: 'userId مطلوب' }, { status: 400 })

  try {
    if (password) {
      const bcrypt = await import('bcryptjs')
      const hash = await bcrypt.hash(password, 12)
      await query('UPDATE profiles SET password_hash = ? WHERE id = ?', [hash, userId])
    }
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
