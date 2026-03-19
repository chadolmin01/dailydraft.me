import type { Tables } from '@/src/types/database'

export type Profile = Tables<'profiles'>

export const SITUATION_LABELS: Record<string, string> = {
  has_project: '프로젝트 진행 중',
  want_to_join: '팀 합류 희망',
  solo: '팀원 탐색 중',
  exploring: '탐색 중',
}
