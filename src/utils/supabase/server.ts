import { getUser as getAuthUser } from '@/lib/auth'
import { query as dbQuery } from '@/lib/db'

export const createClient = async () => {
  let _user: any = undefined
  const ensureUser = async () => {
    if (_user === undefined) _user = await getAuthUser()
    return _user
  }
  return {
    auth: {
      getUser: async () => {
        const user = await ensureUser()
        return {
          data: { user: user ? { id: user.id, email: user.email, role: user.role, name: user.name, avatar_url: user.avatar_url, phone: user.phone, gender: user.gender } : null },
          error: null,
        }
      },
    },
    from: (table: string) => {
      const qb: any = {
        _selectCols: '*',
        _where: [] as string[],
        _params: [] as any[],
        _orderBy: '',
        _limit: 0,
        _offset: 0,
        _single: false,
        _maybeSingle: false,
        _count: false,
        _head: false,
        _joins: [] as string[],
        _joinCols: [] as string[],
        eq: (col: string, val: any) => { qb._where.push('`' + col + '` = ?'); qb._params.push(val); return qb },
        neq: (col: string, val: any) => { qb._where.push('`' + col + '` != ?'); qb._params.push(val); return qb },
        gt: (col: string, val: any) => { qb._where.push('`' + col + '` > ?'); qb._params.push(val); return qb },
        gte: (col: string, val: any) => { qb._where.push('`' + col + '` >= ?'); qb._params.push(val); return qb },
        lt: (col: string, val: any) => { qb._where.push('`' + col + '` < ?'); qb._params.push(val); return qb },
        lte: (col: string, val: any) => { qb._where.push('`' + col + '` <= ?'); qb._params.push(val); return qb },
        in: (col: string, vals: any[]) => { qb._where.push('`' + col + '` IN (' + vals.map(() => '?').join(',') + ')'); qb._params.push(...vals); return qb },
        is: (col: string, val: any) => { qb._where.push('`' + col + '` IS ' + (val === null ? 'NULL' : '?')); if (val !== null) qb._params.push(val); return qb },
        contains: (col: string, val: any) => { qb._where.push('`' + col + '` LIKE ?'); qb._params.push('%' + val + '%'); return qb },
        ilike: (col: string, val: any) => { qb._where.push('`' + col + '` LIKE ?'); qb._params.push('%' + val + '%'); return qb },
        like: (col: string, val: any) => { qb._where.push('`' + col + '` LIKE ?'); qb._params.push(val); return qb },
        textSearch: (col: string, val: any) => { qb._where.push('`' + col + '` LIKE ?'); qb._params.push('%' + val + '%'); return qb },
        filter: (col: string, val: any) => { qb._where.push('`' + col + '` = ?'); qb._params.push(val); return qb },
        not: (col: string, op: string, val: any) => { qb._where.push('NOT `' + col + '` ' + op + ' ?'); qb._params.push(val); return qb },
        order: (col: string, opts: any = {}) => { qb._orderBy = 'ORDER BY `' + col + '` ' + (opts.ascending !== false ? 'ASC' : 'DESC'); return qb },
        limit: (n: number) => { qb._limit = n; return qb },
        offset: (n: number) => { qb._offset = n; return qb },
        single: () => { qb._single = true; return qb },
        maybeSingle: () => { qb._maybeSingle = true; return qb },
        select: function (columns = '*', opts?: any) {
          if (opts && typeof opts === 'object') {
            if ((opts as any).count === 'exact') qb._count = true
            if ((opts as any).head === true) qb._head = true
          }
          const cols: string[] = []
          const joins: string[] = []
          if (typeof columns === 'string') {
            const parts = columns.split(',').map((c: string) => c.trim())
            for (const part of parts) {
              const aliasJoin = part.match(/^(\w+):(\w+)!(\w+)\((.+)\)$/)
              if (aliasJoin) {
                const alias = aliasJoin[1]; const jt = aliasJoin[2]; const fk = aliasJoin[3]; const jcols = aliasJoin[4]
                cols.push('`' + alias + '`.*')
                joins.push('LEFT JOIN `' + jt + '` AS `' + alias + '` ON `' + alias + '`.id = `' + table + '`.`' + fk + '`')
              } else {
                const innerJoin = part.match(/^(\w+)!inner\((.+)\)$/)
                if (innerJoin) {
                  const jt = innerJoin[1]; const jcols = innerJoin[2].split(',').map((c: string) => c.trim())
                  for (const jc of jcols) cols.push('`' + jt + '`.' + jc)
                  joins.push('INNER JOIN `' + jt + '` ON `' + jt + '`.id = `' + table + '`.user_id')
                } else {
                  cols.push('`' + table + '`.' + part)
                }
              }
            }
          }
          qb._selectCols = cols.length ? cols.join(', ') : '*'
          qb._joins = joins
          return qb
        },
        then: async (resolve: any) => {
          if (qb._count && qb._head) {
            const sql = 'SELECT COUNT(*) as count FROM `' + table + '`' + (qb._where.length ? ' WHERE ' + qb._where.join(' AND ') : '')
            const rows = await dbQuery<{ count: number }>(sql, qb._params)
            resolve({ data: null, count: rows[0]?.count || 0, error: null })
            return
          }
          let sql = 'SELECT ' + qb._selectCols + ' FROM `' + table + '`'
          if (qb._joins.length) sql += ' ' + qb._joins.join(' ')
          if (qb._where.length) sql += ' WHERE ' + qb._where.join(' AND ')
          if (qb._orderBy) sql += ' ' + qb._orderBy
          if (qb._limit) sql += ' LIMIT ' + qb._limit
          if (qb._offset) sql += ' OFFSET ' + qb._offset
          try {
            const rows = await dbQuery<any>(sql, qb._params)
            if (qb._single || qb._maybeSingle) {
              resolve({ data: rows[0] || null, error: null })
            } else {
              resolve({ data: rows, error: null })
            }
          } catch (e: any) {
            resolve({ data: qb._single || qb._maybeSingle ? null : [], error: e })
          }
        },
      }
      return qb
    },
    rpc: () => ({
      then: async (resolve: any) => resolve({ data: null, error: { message: 'RPC not supported' } }),
    }),
  }
}
