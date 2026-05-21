import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/src/types/database'

// V1 정책: 매니저 1명 = 워크스페이스 1개. UNIQUE(owner_id) 제약이 있어
// 중복 INSERT 가 발생할 일은 없지만 race 대비로 select-after-conflict 패턴.
//
// 매니저가 처음 로그인 후 어떤 API 라도 부르면 여기서 워크스페이스가 lazy 생성.
// 콜백에 박지 않은 이유: 콜백 실패 시 재시도 비용 + 단일 책임 분리.

export async function getOrCreateWorkspace(
  supabase: SupabaseClient<Database>,
  userId: string,
  defaultName = '내 워크스페이스',
): Promise<{ id: string; name: string }> {
  // 먼저 조회 — 정상 케이스 fast path
  const { data: existing, error: selectError } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('owner_id', userId)
    .maybeSingle()

  if (selectError) throw new Error(`workspace select failed: ${selectError.message}`)
  if (existing) return existing

  // 없으면 생성
  const { data: created, error: insertError } = await supabase
    .from('workspaces')
    .insert({ name: defaultName, owner_id: userId })
    .select('id, name')
    .single()

  if (insertError) {
    // race: 동시 요청 두 개가 동시에 insert 시도 → 두번째가 unique 위반 (Postgres 23505)
    // 이 경우 다시 select 해서 첫번째가 만든 row 반환.
    if (insertError.code === '23505') {
      const { data: retry } = await supabase
        .from('workspaces')
        .select('id, name')
        .eq('owner_id', userId)
        .single()
      if (retry) return retry
    }
    throw new Error(`workspace insert failed: ${insertError.message}`)
  }

  return created
}
