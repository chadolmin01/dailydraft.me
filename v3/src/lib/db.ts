/**
 * v3 로컬 SQLite (libsql) — Supabase 대신 single-file DB.
 *
 * 의도:
 * - Phase 1 PoC = 인증/멀티테넌시 없음. 단일 매니저 가정.
 * - data/v3.sqlite 파일 1개에 모든 데이터.
 * - @libsql/client = prebuilt binary (better-sqlite3 native build 회피).
 *   Turso 서비스도 같은 client — 추후 cloud sync 결정 시 0 코드 변경.
 *
 * 사용 (서버 컴포넌트 / route handler 전용 — 클라이언트 import 금지):
 *   import { getDb } from '@/src/lib/db'
 *   const db = getDb()
 *   const rs = await db.execute('select * from programs')
 *   rs.rows  // [{ id, name, ... }, ...]
 */

import { createClient, type Client } from '@libsql/client'
import { mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const DATA_DIR = join(process.cwd(), 'data')
const DB_FILE = join(DATA_DIR, 'v3.sqlite')

let _db: Client | null = null
let _schemaReady = false

export function getDb(): Client {
  if (_db) return _db
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  _db = createClient({ url: `file:${DB_FILE}` })
  return _db
}

// 의도: 첫 접근 시 1회 schema 보장. async 라 함수 분리.
//       서버 컴포넌트에서 await ensureSchema() 후 쿼리.
export async function ensureSchema(): Promise<void> {
  if (_schemaReady) return
  const db = getDb()
  await db.executeMultiple(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS programs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      start_date TEXT,
      end_date TEXT,
      total_weeks INTEGER NOT NULL DEFAULT 12,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS forms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program_id INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      fields_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS milestones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program_id INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
      week_no INTEGER NOT NULL,
      title TEXT NOT NULL,
      due_date TEXT,
      form_id INTEGER REFERENCES forms(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (program_id, week_no)
    );

    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program_id INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      role TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS submission_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      milestone_id INTEGER NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
      team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT,
      sent_at TEXT,
      submitted_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS submission_links_token_idx ON submission_links (token);

    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      milestone_id INTEGER NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
      team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      submission_link_id INTEGER REFERENCES submission_links(id) ON DELETE SET NULL,
      member_name TEXT,
      data_json TEXT NOT NULL DEFAULT '{}',
      submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS submissions_milestone_team_idx
      ON submissions (milestone_id, team_id);

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program_id INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      generated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      data_json TEXT NOT NULL DEFAULT '{}'
    );
  `)
  _schemaReady = true
}
