import { Briefcase, Clock, Users, Target, Sparkles, Heart, Lightbulb, Zap } from 'lucide-react'
import type { DeepChatTopic, Step } from './types'

export const POSITION_OPTIONS = [
  '프론트엔드 개발', '백엔드 개발', '풀스택 개발', 'UI/UX 디자인',
  'PM / 기획', '마케팅', '데이터분석', '기타',
]

export const SITUATION_OPTIONS = [
  { value: 'has_project', label: '팀원을 찾고 있어요', desc: '프로젝트 진행 중' },
  { value: 'want_to_join', label: '프로젝트에 참여하고 싶어요', desc: '합류 희망' },
  { value: 'solo', label: '같이 시작할 사람을 찾아요', desc: '함께 시작' },
  { value: 'exploring', label: '아직 둘러보는 중이에요', desc: '탐색 중' },
] as const

export const AFFILIATION_OPTIONS = [
  { value: 'student', label: '대학생', orgPlaceholder: '대학교', rolePlaceholder: '전공' },
  { value: 'graduate', label: '졸업생', orgPlaceholder: '출신 대학', rolePlaceholder: '전공' },
  { value: 'professional', label: '현직자', orgPlaceholder: '회사', rolePlaceholder: '직무' },
  { value: 'freelancer', label: '프리랜서', orgPlaceholder: '소속 (선택)', rolePlaceholder: '분야' },
  { value: 'other', label: '기타', orgPlaceholder: '소속 (선택)', rolePlaceholder: '분야 (선택)' },
] as const

export const POPULAR_SKILLS = ['React', 'Python', 'TypeScript', 'Figma', 'Java', 'Node.js', 'Flutter', 'SQL']

export const INTEREST_OPTIONS = ['AI/ML', 'Web', 'Mobile', 'HealthTech', 'EdTech', 'Fintech', 'Social', 'E-commerce', 'IoT', 'Game', 'Blockchain', 'DevTools']

export const DEEP_CHAT_TOPICS: DeepChatTopic[] = [
  { id: 'experience', label: '프로젝트 경험', icon: Briefcase, keywords: ['프로젝트', '경험', '해본', '만들', '개발', '참여', '역할'] },
  { id: 'workstyle', label: '작업 스타일', icon: Zap, keywords: ['스타일', '혼자', '팀', '기획', '개발부터', '완벽', '속도', '계획'] },
  { id: 'availability', label: '가용 시간', icon: Clock, keywords: ['시간', '주당', '투자', '학기', '방학', '여유', '바쁜'] },
  { id: 'teamrole', label: '팀 역할', icon: Users, keywords: ['리더', '팔로워', '이끌', '따르', '관리', '맡', '역할'] },
  { id: 'goals', label: '목표', icon: Target, keywords: ['목표', '동기', '포트폴리오', '창업', '수상', '학습', '스펙', '이유'] },
  { id: 'atmosphere', label: '팀 분위기', icon: Heart, keywords: ['분위기', '진지', '캐주얼', '대면', '비대면', '온라인', '오프라인'] },
  { id: 'ideas', label: '프로젝트 아이디어', icon: Lightbulb, keywords: ['아이디어', '만들고', '해결', '문제', '서비스', '앱', '플랫폼'] },
  { id: 'strengths', label: '강점·기대', icon: Sparkles, keywords: ['강점', '잘하는', '보완', '기대', '부족', '약점', '도움'] },
]


export const AI_ACTIVITY_LABELS = [
  '대화를 분석하고 있어요',
  '답변을 정리하고 있어요',
  '맞춤 질문을 준비하고 있어요',
  '프로필을 분석하고 있어요',
]

export const ONBOARDING_TIPS = [
  '프로필을 채울수록 AI 매칭 정확도가 올라가요',
  '기본 정보를 입력하면 맞춤 추천이 시작돼요',
  '포지션과 상황을 알면 딱 맞는 팀을 찾아드려요',
  '기술 스택을 입력하면 매칭률이 최대 40% 올라가요',
  '관심 분야가 겹치는 팀원을 우선 추천해드려요',
  '대화할수록 AI가 더 정확하게 분석해요',
  '완성된 프로필은 커피챗 수락률이 2배 높아요',
]

// ─── Categorical ↔ Score mappings ────────────────────────────

/** categorical ID → 1-10 숫자 변환 (DB 저장용) */
export const CATEGORICAL_TO_SCORE: Record<string, Record<string, number>> = {
  collaboration_style: { solo: 2, organize: 6, share: 8 },
  decision_style: { careful: 3, consult: 5, fast: 8 },
  planning_style: { build_first: 3, plan_first: 8 },
  quality_style: { speed: 3, quality: 8 },
}

/** 1-10 숫자 → categorical ID 역변환 (기존 유저 호환용) */
export const SCORE_TO_CATEGORICAL: Record<string, (v: number) => string> = {
  collaboration_style: (v) => v <= 4 ? 'solo' : v <= 7 ? 'organize' : 'share',
  decision_style: (v) => v <= 4 ? 'careful' : v <= 6 ? 'consult' : 'fast',
  planning_style: (v) => v <= 5 ? 'build_first' : 'plan_first',
  quality_style: (v) => v <= 5 ? 'speed' : 'quality',
}

/** categorical ID → 한글 라벨 (UI 표시용) */
export const CATEGORICAL_LABELS: Record<string, Record<string, string>> = {
  collaboration_style: { solo: '혼자 파고든다', share: '바로 팀에 공유', organize: '정리 후 분배' },
  decision_style: { fast: '빠르게 결정', careful: '충분히 검토', consult: '의견 모아서' },
  planning_style: { plan_first: '기획형', build_first: '실행형' },
  quality_style: { quality: '완성도', speed: '속도' },
}

/** Maps bubble attachment to the step it belongs to */
export const ATTACHMENT_TO_STEP: Record<string, Step> = {
  'cta': 'cta',
  'info-form': 'info',
  'position': 'position',
  'situation': 'situation',
  'skills-input': 'skills-input',
  'skills-confirm': 'skills-confirm',
  'interests-input': 'interests-input',
  'interests-confirm': 'interests-confirm',
  'deep-chat-offer': 'deep-chat-offer',
  'deep-chat-offer-finish': 'deep-chat',
  'interactive-element': 'deep-chat',
}

/** All steps in order, for progress calculation */
export const STEP_ORDER: Step[] = [
  'greeting', 'cta', 'info', 'position', 'situation',
  'skills-input', 'skills-confirm', 'interests-input', 'interests-confirm',
  'deep-chat-offer', 'deep-chat', 'done',
]
