import mysql from 'mysql2/promise'

let pool: mysql.Pool | null = null

function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    })
  }
  return pool
}

export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const [rows] = await getPool().execute(sql, params)
  return rows as T[]
}

export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(sql, params)
  return rows[0] || null
}

export async function insert(table: string, data: Record<string, any>): Promise<number> {
  const keys = Object.keys(data)
  const values = Object.values(data)
  const placeholders = keys.map(() => '?').join(', ')
  const sql = `INSERT INTO \`${table}\` (${keys.map(k => '`' + k + '`').join(', ')}) VALUES (${placeholders})`
  const [result] = await getPool().execute(sql, values)
  return (result as any).insertId
}

export async function update(table: string, data: Record<string, any>, where: string, whereParams: any[]): Promise<void> {
  const keys = Object.keys(data)
  const values = Object.values(data)
  const setClause = keys.map(k => '`' + k + '` = ?').join(', ')
  const sql = `UPDATE \`${table}\` SET ${setClause} WHERE ${where}`
  await getPool().execute(sql, [...values, ...whereParams])
}
