/**
 * 봇 전용 Supabase Admin 클라이언트 (lazy init)
 *
 * 이유 주석:
 *   `src/lib/supabase/admin` 은 Next.js 런타임 전용 유틸이라 Dockerfile.bot 컨테이너에
 *   복사되지 않습니다. 봇 모듈은 이 파일을 대신 import 해서 service-role 키로 직접
 *   @supabase/supabase-js 클라이언트를 만듭니다. (db-persist.ts와 동일 패턴)
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export function getBotSupabase(): SupabaseClient | null {
  if (_client) return _client;

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.warn('[Bot] SUPABASE 환경변수 없음 — DB 기능 비활성');
    return null;
  }

  _client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _client;
}
