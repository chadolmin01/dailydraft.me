// Fallback/mock data for Explore page
// Remove this file once all sections are connected to real data

export const FALLBACK_CATEGORIES = [
  { id: 'all', label: '전체', count: 0 },
  { id: 'AI/ML', label: 'AI / ML', count: 0 },
  { id: 'SaaS', label: 'SaaS', count: 0 },
  { id: 'Fintech', label: 'Fintech', count: 0 },
  { id: 'HealthTech', label: 'Health', count: 0 },
  { id: 'Social', label: 'Community', count: 0 },
] as const

export const FALLBACK_TRENDING_TAGS = [
  { tag: 'AI Agent', count: 234 },
  { tag: 'Automation', count: 189 },
  { tag: 'No-Code', count: 156 },
  { tag: 'B2B SaaS', count: 142 },
  { tag: 'Developer Tools', count: 98 },
]

export const FALLBACK_PROJECTS = [
  {
    id: '1',
    title: 'Pet Care Platform',
    desc: '반려동물 건강 데이터를 분석하는 모바일 앱 MVP 제작 중입니다.',
    role: 'UX/UI Designer',
    stack: ['Figma', 'React Native'],
    members: 3,
  },
  {
    id: '2',
    title: 'EduTech Math Tutor',
    desc: '수학 문제 풀이 AI 튜터 서비스. 초기 알고리즘 개발자 찾습니다.',
    role: 'AI Researcher',
    stack: ['Python', 'PyTorch'],
    members: 2,
  },
  {
    id: '3',
    title: 'Sustainable Fashion',
    desc: '친환경 의류 리세일 플랫폼. 마케팅 전략을 함께 짤 CMO 구인.',
    role: 'Co-founder',
    stack: ['Growth', 'Brand'],
    members: 4,
  },
  {
    id: '4',
    title: 'Local Community DAO',
    desc: '지역 기반 커뮤니티 DAO 프로젝트. 스마트 컨트랙트 개발자 모집.',
    role: 'Blockchain Dev',
    stack: ['Solidity', 'Web3'],
    members: 5,
  },
]

export const FALLBACK_TALENTS = [
  {
    id: 't1', name: 'Sarah Kim', role: 'Product Designer', exp: '5y+', tags: ['Figma', 'Protopie'], status: 'OPEN' as const,
  },
  {
    id: 't2', name: 'David Lee', role: 'Full Stack Dev', exp: '3y', tags: ['React', 'Node.js'], status: 'BUSY' as const,
  },
  {
    id: 't3', name: 'Elena Park', role: 'Growth Marketer', exp: '7y+', tags: ['GA4', 'SEO'], status: 'ADVISOR' as const,
  },
  {
    id: 't4', name: 'Minu Jung', role: 'Flutter Dev', exp: '2y', tags: ['Mobile', 'Dart'], status: 'OPEN' as const,
  },
]
