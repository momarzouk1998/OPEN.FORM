'use client'

async function doFetch(url: string, options?: RequestInit): Promise<any> {
  const res = await fetch(url, options)
  if (!res.ok) {
    try {
      const json = await res.json()
      return { data: null, error: json.error || { message: 'خطأ في الاستعلام' } }
    } catch {
      return { data: null, error: { message: 'خطأ في الاتصال' } }
    }
  }
  return res.json()
}

function buildUrl(table: string, params: Record<string, string>): string {
  const qs = new URLSearchParams({ table, ...params })
  return '/api/query?' + qs.toString()
}

export function createClient() {
  return {
    auth: {
      getUser: async () => {
        const res = await fetch('/api/auth/me')
        if (!res.ok) return { data: { user: null } }
        const json = await res.json()
        return { data: { user: json.user } }
      },
      signOut: async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
      },
      admin: {
        deleteUser: async (userId: string) => {
          const res = await fetch('/api/auth/admin/delete-user', { method: 'POST', body: JSON.stringify({ userId }) })
          const data = await res.json()
          return { error: data.error || null }
        },
        updateUserById: async (userId: string, data: any) => {
          const res = await fetch('/api/auth/admin/update-user', { method: 'POST', body: JSON.stringify({ userId, ...data }) })
          const json = await res.json()
          return { error: json.error || null }
        },
      },
    },
    storage: {
      from: () => ({
        upload: async (path: string, file: File) => {
          const formData = new FormData()
          formData.append('file', file)
          const res = await fetch('/api/upload', { method: 'POST', body: formData })
          const json = await res.json()
          return { error: json.error || null }
        },
        getPublicUrl: (path: string) => ({ data: { publicUrl: '/uploads/' + path.split('/').pop() } }),
      }),
    },
    rpc: (fn: string, _params: any) => ({
      then: async (resolve: any) => resolve({ data: null, error: { message: 'RPC not supported: ' + fn } }),
    }),
    from: (table: string) => {
      const qb: any = {
        _action: 'select',
        _insertData: null,
        _updateData: null,
        _returning: false,
        _eqCol: '', _eqVal: null,
        _orderCol: '', _orderDir: 'ASC',
        _single: false,
        _columns: '*',
        _count: false,
        _head: false,
        _inCol: '', _inVals: [] as string[],
        eq: (col: string, val: any) => { qb._eqCol = col; qb._eqVal = val; return qb },
        order: (col: string, opts: any = {}) => { qb._orderCol = col; qb._orderDir = opts.ascending !== false ? 'ASC' : 'DESC'; return qb },
        single: () => { qb._single = true; return qb },
        maybeSingle: () => { qb._single = true; return qb },
        limit: (n: number) => { qb._limit = n; return qb },
        in: (col: string, vals: any[]) => { qb._inCol = col; qb._inVals = vals; return qb },
        insert: (data: any) => { qb._action = 'insert'; qb._insertData = data; return qb },
        update: (data: any) => { qb._action = 'update'; qb._updateData = data; return qb },
        delete: (opts?: any) => {
          qb._action = 'delete'
          if (opts && typeof opts === 'object') {
            if ((opts as any).count === 'exact') qb._count = true
          }
          return qb
        },
        select: (columns = '*', opts?: any) => {
          qb._columns = columns
          if (qb._action === 'insert') qb._returning = true
          if (opts && typeof opts === 'object') {
            if ((opts as any).count === 'exact') qb._count = true
            if ((opts as any).head === true) qb._head = true
          }
          return qb
        },
        then: async (resolve: any) => {
          if (qb._action === 'insert' || qb._action === 'update' || qb._action === 'delete') {
            const payload: any = { table, action: qb._action }
            if (qb._action === 'insert') {
              payload.data = qb._insertData
              if (qb._returning) payload.returning = true
            }
            if (qb._action === 'update') {
              payload.data = qb._updateData
              if (qb._eqCol) payload.where = { column: qb._eqCol, value: qb._eqVal }
            }
            if (qb._action === 'delete') {
              if (qb._eqCol) payload.where = { column: qb._eqCol, value: qb._eqVal }
            }
            const result = await doFetch('/api/query', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
            resolve(result)
            return
          }

          if (qb._count && qb._head) {
            const params: Record<string, string> = { table, action: 'count' }
            if (qb._eqCol) { params.eqCol = qb._eqCol; params.eqVal = String(qb._eqVal) }
            const result = await doFetch(buildUrl(table, params))
            resolve({ data: null, count: result.count || 0, error: null })
            return
          }
          const params: Record<string, string> = { table, action: 'select', columns: qb._columns }
          if (qb._single) params.single = 'true'
          if (qb._limit) params.limit = String(qb._limit)
          if (qb._eqCol) { params.eqCol = qb._eqCol; params.eqVal = String(qb._eqVal) }
          if (qb._orderCol) { params.orderCol = qb._orderCol; params.orderDir = qb._orderDir }
          if (qb._inVals.length) { params.inCol = qb._inCol; params.inVals = qb._inVals.join(',') }
          const result = await doFetch(buildUrl(table, params))
          resolve(result)
        },
      }
      return qb
    },
  }
}
