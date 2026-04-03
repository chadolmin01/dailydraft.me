import { PROJECT_ROLES } from '@/src/constants/roles'
import { PROJECT_CATEGORIES, categoryLabel } from '@/src/constants/categories'

export const TYPE_OPTIONS = [
  { value: 'side_project', label: '함께 만들기' },
  { value: 'startup', label: '창업 준비' },
  { value: 'study', label: '함께 배우기' },
]

export const ROLE_OPTIONS = PROJECT_ROLES.map(r => ({
  value: r.slug,
  label: r.label,
  icon: r.icon,
}))

export const LOCATION_TYPE_OPTIONS = [
  { value: 'remote', label: '원격' },
  { value: 'hybrid', label: '하이브리드' },
  { value: 'offline', label: '오프라인' },
]

export const TIME_OPTIONS = [
  { value: 'part_time', label: '파트타임' },
  { value: 'full_time', label: '풀타임' },
]

export const COMPENSATION_OPTIONS = [
  { value: 'unpaid', label: '무급' },
  { value: 'equity', label: '지분' },
  { value: 'salary', label: '유급' },
  { value: 'hybrid', label: '혼합' },
]

export const CATEGORY_TAGS = PROJECT_CATEGORIES.map(c => c.slug)

/** slug -> 한글 라벨 조회. 못 찾으면 slug 그대로 반환 */
export const CATEGORY_TAG_LABELS: Record<string, string> = Object.fromEntries(
  PROJECT_CATEGORIES.map(c => [c.slug, c.label])
)

export { categoryLabel }

export type TypeTheme = {
  badge: string
  slidingBg: string
  status: string
  statusDot: string
  roleOn: string
  roleIconOn: string
  chipOn: string
  cta: string
  ctaBtn: string
  mobileBtn: string
  painBg: string
  titlePlaceholder: string
  descPlaceholder: string
  painLabel: string
  painPlaceholder: string
  ctaTitle: string
  ctaDesc: string
  rolesLabel: string
}

export const TYPE_THEMES: Record<string, TypeTheme> = {
  side_project: {
    badge: 'bg-indigo-600 text-txt-inverse',
    slidingBg: 'bg-indigo-600',
    status: 'bg-indigo-100/70 text-indigo-600',
    statusDot: 'bg-indigo-500',
    roleOn: 'bg-indigo-600 text-txt-inverse border-indigo-600',
    roleIconOn: 'text-indigo-300',
    chipOn: 'bg-indigo-600 text-txt-inverse border-indigo-600',
    cta: 'bg-indigo-600',
    ctaBtn: 'bg-surface-card text-indigo-700 hover:bg-indigo-50',
    mobileBtn: 'bg-indigo-600 hover:bg-indigo-700 text-txt-inverse',
    painBg: 'bg-indigo-50/50',
    titlePlaceholder: '예: AI 기반 대학생 매칭 플랫폼',
    descPlaceholder: '어떤 걸 만들고 있는지, 현재 어디까지 진행했는지 자유롭게 적어주세요',
    painLabel: '해결하려는 문제',
    painPlaceholder: '이 프로젝트로 어떤 불편함을 해결하나요?',
    ctaTitle: '함께 만들 팀원을 찾아볼까요?',
    ctaDesc: '등록하면 관심있는 팀원이 커피챗을 신청할 수 있어요.',
    rolesLabel: '함께할 포지션 *',
  },
  startup: {
    badge: 'bg-surface-inverse text-txt-inverse',
    slidingBg: 'bg-surface-inverse',
    status: 'bg-status-success-bg/70 text-indicator-online',
    statusDot: 'bg-indicator-online',
    roleOn: 'bg-surface-inverse text-txt-inverse border-surface-inverse',
    roleIconOn: 'text-txt-tertiary',
    chipOn: 'bg-surface-inverse text-txt-inverse border-surface-inverse',
    cta: 'bg-surface-inverse',
    ctaBtn: 'bg-surface-card text-txt-primary hover:bg-accent-secondary',
    mobileBtn: 'bg-surface-inverse hover:bg-accent-hover text-txt-inverse',
    painBg: 'bg-surface-sunken',
    titlePlaceholder: '예: 대학생 중고거래 플랫폼 "캠퍼스마켓"',
    descPlaceholder: '어떤 시장을 타겟하는지, 비즈니스 모델과 현재 단계를 설명해주세요',
    painLabel: '타겟 시장의 문제',
    painPlaceholder: '고객이 겪고 있는 핵심 문제는 무엇인가요?',
    ctaTitle: '함께 창업할 팀원을 찾아볼까요?',
    ctaDesc: '등록하면 관심있는 팀원이 커피챗을 신청할 수 있어요.',
    rolesLabel: '모집 중인 포지션 *',
  },
  study: {
    badge: 'bg-teal-600 text-txt-inverse',
    slidingBg: 'bg-teal-600',
    status: 'bg-teal-100/70 text-teal-600',
    statusDot: 'bg-teal-500',
    roleOn: 'bg-teal-600 text-txt-inverse border-teal-600',
    roleIconOn: 'text-teal-300',
    chipOn: 'bg-teal-600 text-txt-inverse border-teal-600',
    cta: 'bg-teal-600',
    ctaBtn: 'bg-surface-card text-teal-700 hover:bg-teal-50',
    mobileBtn: 'bg-teal-600 hover:bg-teal-700 text-txt-inverse',
    painBg: 'bg-teal-50/50',
    titlePlaceholder: '예: CS 알고리즘 스터디, UX 리서치 북클럽',
    descPlaceholder: '무엇을 공부하는지, 어떤 방식으로 진행하는지 알려주세요',
    painLabel: '스터디 목표',
    painPlaceholder: '이 스터디를 통해 달성하고 싶은 목표는?',
    ctaTitle: '함께 배울 스터디원을 찾아볼까요?',
    ctaDesc: '등록하면 관심있는 스터디원이 참여 신청할 수 있어요.',
    rolesLabel: '찾고 있는 스터디원 *',
  },
}
