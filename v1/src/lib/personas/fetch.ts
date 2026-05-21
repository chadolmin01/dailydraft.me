/**
 * Persona 체인 fetch 헬퍼.
 *
 * leaf 페르소나 id로부터 parent_persona_id를 따라 올라가며
 * 상속 체인 전체와 각 노드의 persona_fields를 모아온다.
 *
 * 순환 참조 방어: 최대 5단계로 제한. 3계층 설계이므로 정상 케이스는 3 이하.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/src/types/database'
import type { PersonaWithFields } from './inherit'
import type { PersonaFieldRow, PersonaRow } from './types'

const MAX_CHAIN_DEPTH = 5

type Client = SupabaseClient<Database>

/**
 * 단일 페르소나 + 필드 fetch.
 */
async function fetchPersonaNode(
  supabase: Client,
  personaId: string,
): Promise<PersonaWithFields | null> {
  const [personaRes, fieldsRes] = await Promise.all([
    supabase
      .from('personas' as never)
      .select('*')
      .eq('id', personaId)
      .maybeSingle(),
    supabase
      .from('persona_fields' as never)
      .select('*')
      .eq('persona_id', personaId),
  ])

  if (personaRes.error) throw personaRes.error
  if (fieldsRes.error) throw fieldsRes.error
  if (!personaRes.data) return null

  return {
    persona: personaRes.data as unknown as PersonaRow,
    fields: (fieldsRes.data ?? []) as unknown as PersonaFieldRow[],
  }
}

/**
 * leaf → 최상위 조상 순서로 체인 fetch 후, 최상위 → leaf 순서로 반환.
 * resolvePersonaChain()에 그대로 투입 가능한 형태.
 */
export async function fetchPersonaChain(
  supabase: Client,
  leafPersonaId: string,
): Promise<PersonaWithFields[]> {
  const chainReverse: PersonaWithFields[] = []
  let currentId: string | null = leafPersonaId

  for (let depth = 0; depth < MAX_CHAIN_DEPTH && currentId; depth++) {
    const node: PersonaWithFields | null = await fetchPersonaNode(supabase, currentId)
    if (!node) break
    chainReverse.push(node)
    currentId = node.persona.parent_persona_id
  }

  if (currentId !== null) {
    // 깊이 초과 → 순환 가능성. 로그만 남기고 현재까지의 체인으로 진행.
    // eslint-disable-next-line no-console
    console.warn(
      `[persona] chain depth limit reached from leaf=${leafPersonaId}. ` +
        'possible cycle in parent_persona_id.',
    )
  }

  return chainReverse.reverse()
}
