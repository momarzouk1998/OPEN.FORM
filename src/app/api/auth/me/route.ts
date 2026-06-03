import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { queryOne } from '@/lib/db'

export async function GET(request: NextRequest) {
  const token = request.cookies.get('session')?.value
  if (!token) {
    return NextResponse.json({ user: null })
  }

  const payload = verifyToken(token)
  if (!payload) {
    return NextResponse.json({ user: null })
  }

  const user = await queryOne<any>(
    'SELECT id, email, name, role, status, avatar_url, phone, gender, banned FROM profiles WHERE id = ?',
    [payload.userId]
  )

  if (!user || user.status !== 'approved' || user.banned) {
    return NextResponse.json({ user: null })
  }

  return NextResponse.json({ user })
}
