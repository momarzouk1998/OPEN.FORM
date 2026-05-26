import { parseOptions, parseMatrixData, type Question } from './formFillerUtils'

export function getQuestionMaxScore(q: Question): number {
  const opts = parseOptions(q.options)
  switch (q.type) {
    case 'text':
    case 'textarea':
      return q.points || 0
    case 'single_choice':
      return Math.max(0, ...(Array.isArray(opts) ? opts : []).map((o: any) => o.points || 0))
    case 'multiple_choice':
      return (Array.isArray(opts) ? opts : []).reduce((sum: number, o: any) => sum + (o.points || 0), 0)
    case 'dropdown':
      if (opts.dropdown_type === 'multiple') {
        return ((opts.correct_option_ids || []) as string[]).reduce((sum: number, id: string) => {
          const opt = (opts.options || []).find((o: any) => o.id === id)
          return sum + (opt?.points || 0)
        }, 0)
      }
      if (opts.correct_option_ids?.length) {
        const opt = (opts.options || []).find((o: any) => o.id === opts.correct_option_ids[0])
        return opt?.points || 0
      }
      return Math.max(0, ...(Array.isArray(opts) ? opts : []).map((o: any) => o.points || 0))
    case 'scale':
      return Math.max(10, ...(Array.isArray(opts) ? opts : []).map((o: any) => o.points || 0))
    case 'ranking':
      return (Array.isArray(opts) ? opts : []).reduce((sum: number, o: any) => sum + (o.points || 0), 0)
    case 'matrix': {
      const md = parseMatrixData(q)
      if (md) {
        const colSum = (md.matrix_columns || []).reduce((s: number, c: any) => s + (c.points || 0), 0)
        return colSum * (md.matrix_rows || []).length
      }
      return 0
    }
    default:
      return 0
  }
}

export function calculateScore(visibleQuestions: Question[], answers: Record<string, any>) {
  let score = 0
  let maxScore = 0

  visibleQuestions.forEach((q) => {
    const answer = answers[q.id]
    const options = parseOptions(q.options)

    if (q.type === 'matrix') {
      const matrixData = parseMatrixData(q)
      if (matrixData) {
        maxScore += (matrixData.matrix_columns || []).reduce((sum: number, col: any) => sum + (col.points || 0), 0) * (matrixData.matrix_rows || []).length
        const rowAnswers = answer || {}
        Object.values(rowAnswers).forEach((val: any) => {
          if (Array.isArray(val)) {
            val.forEach((colId: string) => {
              const col = (matrixData.matrix_columns || []).find((c: any) => c.id === colId)
              if (col) score += col.points || 0
            })
          } else if (val) {
            const col = (matrixData.matrix_columns || []).find((c: any) => c.id === val)
            if (col) score += col.points || 0
          }
        })
      }
      return
    }

    if (q.type === 'text' || q.type === 'textarea') {
      maxScore += q.points || 0
    } else if (q.type === 'single_choice') {
      maxScore += Math.max(0, ...(Array.isArray(options) ? options : []).map((o: any) => o.points || 0))
    } else if (q.type === 'multiple_choice') {
      maxScore += (Array.isArray(options) ? options : []).reduce((sum: number, o: any) => sum + (o.points || 0), 0)
    } else if (q.type === 'ranking') {
      maxScore += (Array.isArray(options) ? options : []).reduce((sum: number, o: any) => sum + (o.points || 0), 0)
    } else if (q.type === 'scale') {
      maxScore += Math.max(10, ...(Array.isArray(options) ? options : []).map((o: any) => o.points || 0))
    } else if (q.type === 'dropdown') {
      const dropOpts = options.options || options
      if (Array.isArray(dropOpts)) {
        if (options.dropdown_type === 'multiple') {
          maxScore += ((options.correct_option_ids || []) as string[]).reduce((sum: number, id: string) => {
            const opt = dropOpts.find((o: any) => o.id === id)
            return sum + (opt?.points || 0)
          }, 0)
        } else if (options.correct_option_ids?.length) {
          const opt = dropOpts.find((o: any) => o.id === options.correct_option_ids[0])
          maxScore += opt?.points || 0
        } else {
          maxScore += Math.max(0, ...dropOpts.map((o: any) => o.points || 0))
        }
      }
    }

    if (answer === undefined || answer === null || answer === '') return

    if (q.type === 'single_choice' && options.length > 0) {
      const optId = typeof answer === 'object' ? (answer as any).option_id : answer
      const mainOption = options.find((opt: any) => opt.id === optId)
      if (mainOption) {
        if (q.has_counter && mainOption.counter_target) {
          const count = typeof answer === 'object' ? ((answer as any).count || 0) : 0
          if (count >= mainOption.counter_target) {
            score += mainOption.points || 0
          }
        } else {
          score += mainOption.points || 0
        }
      }
    } else if (q.type === 'multiple_choice' && options.length > 0 && Array.isArray(answer)) {
      answer.forEach((selectedId: string) => {
        const mainOption = options.find((opt: any) => opt.id === selectedId)
        if (mainOption) score += mainOption.points || 0
      })
    } else if (q.type === 'dropdown' && options.dropdown_type === 'multiple' && Array.isArray(answer)) {
      const dropOpts = options.options || []
      answer.forEach((id: string) => {
        const opt = dropOpts.find((o: any) => o.id === id)
        if (opt && (options.correct_option_ids || []).includes(id)) {
          score += opt.points || 0
        }
      })
    } else if (q.type === 'ranking' && Array.isArray(answer) && Array.isArray(options)) {
      answer.forEach((optId: string, pos: number) => {
        const correctOptAtPos = options[pos]
        if (correctOptAtPos && optId === correctOptAtPos.id) {
          score += correctOptAtPos.points || 0
        }
      })
    } else if (q.type === 'scale') {
      score += parseFloat(String(answer)) || 0
    } else if (q.type === 'text' || q.type === 'textarea') {
      score += String(answer).trim() ? (q.points || 0) : 0
    }
  })

  return { score, maxScore }
}
