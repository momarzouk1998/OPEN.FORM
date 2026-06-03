import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.cookies.get('session')?.value
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const table = searchParams.get('table')
  const action = searchParams.get('action') || 'select'

  if (!table) return NextResponse.json({ error: 'table مطلوب' }, { status: 400 })

  try {
    if (action === 'select') {
      const columns = searchParams.get('columns') || '*'
      const eqCol = searchParams.get('eqCol')
      const eqVal = searchParams.get('eqVal')
      const orderCol = searchParams.get('orderCol')
      const orderDir = searchParams.get('orderDir') || 'ASC'
      const single = searchParams.get('single') === 'true'
      const limit = searchParams.get('limit')
      const inCol = searchParams.get('inCol')
      const inValsParam = searchParams.get('inVals')

      let sql = `SELECT ${columns === '*' ? '*' : columns.split(',').map((c: string) => '`' + c.trim() + '`').join(', ')} FROM \`${table}\``
      const params: any[] = []
      const wheres: string[] = []

      if (eqCol && eqVal !== null) {
        wheres.push('`' + eqCol + '` = ?')
        params.push(eqVal)
      }

      if (inCol && inValsParam) {
        const inVals = inValsParam.split(',')
        wheres.push('`' + inCol + '` IN (' + inVals.map(() => '?').join(',') + ')')
        params.push(...inVals)
      }

      if (wheres.length) sql += ' WHERE ' + wheres.join(' AND ')
      if (orderCol) sql += ' ORDER BY `' + orderCol + '` ' + orderDir
      if (limit) sql += ' LIMIT ' + parseInt(limit)

      const rows = await query(sql, params)
      return NextResponse.json({ data: single ? rows[0] || null : rows, error: null })
    }

    if (action === 'count') {
      const eqCol = searchParams.get('eqCol')
      const eqVal = searchParams.get('eqVal')
      let sql = 'SELECT COUNT(*) as count FROM `' + table + '`'
      const params: any[] = []
      if (eqCol && eqVal !== null) {
        sql += ' WHERE `' + eqCol + '` = ?'
        params.push(eqVal)
      }
      const rows = await query<{ count: number }>(sql, params)
      return NextResponse.json({ count: rows[0]?.count || 0, error: null })
    }

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
