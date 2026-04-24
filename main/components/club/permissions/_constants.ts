import type { Channel, PresetRoleSeed } from './_types'

// PRESETS / ASSIGNMENT_TEMPLATES / DOT_PALETTE.
// PermissionsSettingsClient.tsx 에서 분리 — 메인 컴포넌트가 import.

export const PRESETS: Record<
  string,
  {
    icon: string
    name: string
    desc: string
    meta: string
    channels: Channel[]
    roles: PresetRoleSeed[]
  }
> = {
  general: {
    icon: '🎓',
    name: '일반형',
    desc: '대부분의 학생 동아리·학회',
    meta: '5개 역할 · 4개 채널',
    channels: [
      { name: '공지', category: '일반' },
      { name: '자유', category: '일반' },
      { name: '라운지', category: '일반' },
      { name: '임원진', category: '운영' },
    ],
    roles: [
      { name: '회장', desc: '최고 권한', admin: true, dot: '#8b5cf6', access: 'all' },
      { name: '부회장', desc: '운영 전반', admin: true, dot: '#3b82f6', access: 'all' },
      { name: '임원진', desc: '총무·기획·홍보 등', admin: true, dot: '#10b981', access: 'all' },
      { name: '회원', desc: '정식 구성원', admin: false, dot: '#6b7280', access: ['공지', '자유', '라운지'] },
      { name: '게스트', desc: '견학·초대 인원', admin: false, dot: '#9ca3af', access: ['공지', '라운지'] },
    ],
  },
  academic: {
    icon: '📚',
    name: '학술형',
    desc: '세미나·연구·스터디 중심',
    meta: '5개 역할 · 5개 채널',
    channels: [
      { name: '공지', category: '일반' },
      { name: '라운지', category: '일반' },
      { name: '임원진', category: '운영' },
      { name: '세미나', category: '활동' },
      { name: '스터디', category: '활동' },
    ],
    roles: [
      { name: '회장', desc: '최고 권한', admin: true, dot: '#8b5cf6', access: 'all' },
      { name: '부회장', desc: '운영 전반', admin: true, dot: '#3b82f6', access: 'all' },
      { name: '임원진', desc: '총무·세미나장 등', admin: true, dot: '#10b981', access: 'all' },
      { name: '정회원', desc: '스터디 정규 참여', admin: false, dot: '#6b7280', access: ['공지', '세미나', '스터디', '라운지'] },
      { name: '게스트', desc: '체험·청강', admin: false, dot: '#9ca3af', access: ['공지', '라운지'] },
    ],
  },
  sports: {
    icon: '⚽',
    name: '운동형',
    desc: '체육·스포츠 동아리',
    meta: '6개 역할 · 6개 채널',
    channels: [
      { name: '공지', category: '일반' },
      { name: '라운지', category: '일반' },
      { name: '임원진', category: '운영' },
      { name: '경기-일정', category: '활동' },
      { name: '훈련', category: '활동' },
      { name: '경기-결과', category: '활동' },
    ],
    roles: [
      { name: '회장', desc: '최고 권한', admin: true, dot: '#8b5cf6', access: 'all' },
      { name: '부회장', desc: '운영 전반', admin: true, dot: '#3b82f6', access: 'all' },
      { name: '주장', desc: '팀 운영', admin: true, dot: '#10b981', access: 'all' },
      {
        name: '매니저',
        desc: '경기·훈련 관리',
        admin: false,
        dot: '#f59e0b',
        access: ['공지', '임원진', '경기-일정', '훈련', '경기-결과', '라운지'],
      },
      {
        name: '선수',
        desc: '정식 선수',
        admin: false,
        dot: '#6b7280',
        access: ['공지', '경기-일정', '훈련', '경기-결과', '라운지'],
      },
      { name: '게스트', desc: '체험·견학', admin: false, dot: '#9ca3af', access: ['공지', '라운지'] },
    ],
  },
  startup: {
    icon: '🚀',
    name: '프로젝트형',
    desc: '프로덕트 제작 · 팀 단위 (예: FLIP)',
    meta: '6개 역할 · 7개 채널',
    channels: [
      { name: '공지', category: '일반' },
      { name: '라운지', category: '일반' },
      { name: '임원진', category: '운영' },
      { name: '개발팀', category: '팀' },
      { name: '디자인팀', category: '팀' },
      { name: '기획팀', category: '팀' },
      { name: '개발-피드', category: '팀' },
    ],
    roles: [
      { name: '회장', desc: '최고 권한', admin: true, dot: '#8b5cf6', access: 'all' },
      { name: '부회장', desc: '운영 전반', admin: true, dot: '#3b82f6', access: 'all' },
      {
        name: '팀장 · 개발',
        desc: '개발팀 리드',
        admin: false,
        dot: '#10b981',
        access: ['공지', '임원진', '개발팀', '라운지', '개발-피드'],
      },
      {
        name: '팀장 · 디자인',
        desc: '디자인팀 리드',
        admin: false,
        dot: '#f59e0b',
        access: ['공지', '임원진', '디자인팀', '라운지'],
      },
      {
        name: '팀원',
        desc: '소속 팀 활동',
        admin: false,
        dot: '#6b7280',
        access: ['공지', '개발팀', '디자인팀', '기획팀', '라운지', '개발-피드'],
      },
      { name: '게스트', desc: '견학·초대 인원', admin: false, dot: '#9ca3af', access: ['공지', '라운지'] },
    ],
  },
}

export const ASSIGNMENT_TEMPLATES: Record<string, Record<number, number[]>> = {
  general: { 0: [0], 1: [1], 2: [2, 3, 4], 3: [5, 6, 7, 8, 9, 10, 11], 4: [] },
  academic: { 0: [0], 1: [1], 2: [2, 3, 4], 3: [5, 6, 7, 8, 9, 10, 11], 4: [] },
  sports: { 0: [0], 1: [1], 2: [2], 3: [3, 4], 4: [5, 6, 7, 8, 9, 10, 11], 5: [] },
  startup: { 0: [0], 1: [1], 2: [2], 3: [3], 4: [4, 5, 6, 7, 8, 9, 10, 11], 5: [] },
}

export const DOT_PALETTE = [
  '#8b5cf6',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#14b8a6',
  '#6b7280',
]
