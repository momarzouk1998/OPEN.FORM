import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import * as XLSX from 'xlsx'

function formatAnswerForExcel(q: any, answerVal: any): string {
  if (answerVal === undefined || answerVal === null || answerVal === '') return ''

  let options = q.options
  if (typeof options === 'string') {
    try { options = JSON.parse(options) } catch { options = [] }
  }

  if (q.type === 'text' || q.type === 'textarea' || q.type === 'scale') {
    return String(answerVal)
  }

  if (q.type === 'single_choice' || q.type === 'multiple_choice' || q.type === 'dropdown' || q.type === 'ranking') {
    let opts = Array.isArray(options) ? options : (options?.options || [])
    const findText = (id: string) => {
      const opt = opts.find((o: any) => o.id === id)
      return opt ? opt.text : id
    }
    if (Array.isArray(answerVal)) {
      return answerVal.map(findText).join('، ')
    } else if (typeof answerVal === 'object' && answerVal !== null) {
      const optText = findText(answerVal.option_id || '')
      const count = answerVal.count
      return count ? `${optText} (×${count})` : optText
    } else {
      return findText(String(answerVal))
    }
  }

  if (q.type === 'matrix') {
    let rows = options?.matrix_rows || []
    let cols = options?.matrix_columns || []
    if (rows.length === 0 && Array.isArray(options) && options[0]?.sub_options) {
      rows = options
      cols = options[0].sub_options
    }
    let res: string[] = []
    if (typeof answerVal === 'object' && answerVal !== null) {
      Object.keys(answerVal).forEach(rowId => {
        const rowText = rows.find((r: any) => r.id === rowId)?.text || rowId
        let colVals = answerVal[rowId]
        if (!Array.isArray(colVals)) colVals = [colVals]
        const colTexts = colVals.map((colId: string) =>
          cols.find((c: any) => c.id === colId)?.text || colId
        )
        res.push(`${rowText}: ${colTexts.join('، ')}`)
      })
      return res.join(' | ')
    }
    return JSON.stringify(answerVal)
  }

  return String(answerVal)
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params

    const form: any = await queryOne('SELECT * FROM forms WHERE id = ?', [formId])
    if (!form) {
      return NextResponse.json({ error: 'النموذج غير موجود' }, { status: 404 })
    }

    const questions: any[] = await query(
      'SELECT id, text, type, points, options FROM questions WHERE form_id = ? ORDER BY order_index',
      [formId]
    )

    const responses: any[] = await query(
      'SELECT * FROM form_responses WHERE form_id = ? ORDER BY submitted_at DESC',
      [formId]
    )

    const userIds = [...new Set(responses.map((r: any) => r.user_id))]
    let profiles: any[] = []
    if (userIds.length > 0) {
      const placeholders = userIds.map(() => '?').join(',')
      profiles = await query(
        `SELECT id, name, email FROM profiles WHERE id IN (${placeholders})`,
        userIds
      )
    }
    const profileMap = Object.fromEntries(profiles.map((p: any) => [p.id, p]))

    const headers = [
      '#',
      'اسم المستخدم',
      'البريد الإلكتروني',
      'النتيجة',
      'النسبة',
      'تاريخ التقديم',
      ...questions.map((q: any) => q.text),
    ]

    const rows = responses.map((r: any, idx: number) => {
      const profile = profileMap[r.user_id] || {}
      const percentage = Number(r.max_score) > 0
        ? Math.round((Number(r.score) / Number(r.max_score)) * 100)
        : 0

      const answers = questions.map((q: any) => formatAnswerForExcel(q, r.answers?.[q.id] ?? r.answers?.[q.text]))
      return [
        idx + 1,
        profile.name || 'غير معروف',
        profile.email || '',
        `${Number(r.score).toFixed(1)} / ${Number(r.max_score).toFixed(1)}`,
        `${percentage}%`,
        r.submitted_at ? new Date(r.submitted_at).toLocaleString('ar-SA') : '',
        ...answers,
      ]
    })

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])

    const colWidths = [
      { wch: 4 }, { wch: 25 }, { wch: 30 }, { wch: 12 }, { wch: 8 }, { wch: 20 },
      ...questions.map(() => ({ wch: 30 })),
    ]
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, 'الردود')

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${form.name || 'export'}.xlsx"`,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'حدث خطأ' }, { status: 500 })
  }
}
