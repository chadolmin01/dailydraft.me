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

export const DEEP_CHAT_SUGGESTIONS: Record<number, string[]> = {
  0: ['아직 프로젝트 경험이 없어요', '학교 수업에서 팀프로젝트 해봤어요', '개인 프로젝트를 진행하고 있어요', '해커톤에 참여한 적 있어요'],
  1: ['계획을 먼저 세우는 편이에요', '일단 만들면서 수정해요', '팀원들과 자주 소통하는 걸 좋아해요'],
  2: ['주 10시간 정도 투자할 수 있어요', '학기 중이라 시간이 많지 않아요', '방학이라 풀타임으로 가능해요'],
  3: ['리더 역할이 편해요', '시키는 걸 잘 해내는 타입이에요', '상황에 따라 유연하게 해요'],
  4: ['포트폴리오를 만들고 싶어요', '창업에 관심 있어요', '새로운 기술을 배우고 싶어요', '공모전 수상이 목표예요'],
}

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
}

/** All steps in order, for progress calculation */
export const STEP_ORDER: Step[] = [
  'greeting', 'cta', 'info', 'position', 'situation',
  'skills-input', 'skills-confirm', 'interests-input', 'interests-confirm',
  'deep-chat-offer', 'deep-chat', 'done',
]
