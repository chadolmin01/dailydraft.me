/**
 * v3 DB 쿼리 helper — 자주 쓰는 패턴 함수화.
 * libsql 의 execute() 는 rows 가 always object[]. number/bigint 변환은 호출자 책임.
 *
 * 의도: T extends Row 같은 제약 없이 단순 generic.
 *       libsql 의 InValue 와 우리 unknown 사이 cast 는 호출 지점에서 안전 (string/number/null 만 씀).
 */

import { getDb, ensureSchema } from './db'
import type { InValue } from '@libsql/client'

type Args = InValue[]

export async function all<T = Record<string, unknown>>(sql: string, args: Args = []): Promise<T[]> {
  await ensureSchema()
  const db = getDb()
  const rs = await db.execute({ sql, args })
  return rs.rows as unknown as T[]
}

export async function one<T = Record<string, unknown>>(sql: string, args: Args = []): Promise<T | null> {
  const rows = await all<T>(sql, args)
  return rows[0] ?? null
}

export async function run(sql: string, args: Args = []): Promise<{ lastInsertRowid: bigint | undefined; rowsAffected: number }> {
  await ensureSchema()
  const db = getDb()
  const rs = await db.execute({ sql, args })
  return { lastInsertRowid: rs.lastInsertRowid, rowsAffected: rs.rowsAffected }
}

// 의도: number 변환 (libsql 은 INTEGER 를 number 또는 bigint 로 반환 — 환경 따라 다름)
export function asInt(v: unknown): number {
  if (typeof v === 'number') return v
  if (typeof v === 'bigint') return Number(v)
  return Number(v ?? 0)
}

// 토큰 생성 — crypto.randomUUID 의 hyphen 뺀 단순화 (URL 친화).
export function genToken(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 24)
}
