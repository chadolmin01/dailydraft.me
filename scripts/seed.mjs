/**
 * Seed script: 테스트 유저 + 프로필 + 프로젝트 생성
 *
 * 실행: node scripts/seed.mjs
 * 정리: node scripts/seed.mjs --clean
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://prxqjiuibfrmuwwmkhqb.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY 환경변수를 설정하세요.')
  console.error('  export SUPABASE_SERVICE_ROLE_KEY="your-key"')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ── 시드 데이터 ──

// 프로필 사진 URLs (Unsplash — 한국/아시안 젊은 사람 포트레이트)
const AVATAR_URLS = {
  // 여 — 흰 블라우스 프로페셔널 느낌
  'seed-minji@draft.test': 'https://images.unsplash.com/photo-1554641111-0ff288c2bf71?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
  // 여 — 캐주얼 오렌지 체어
  'seed-jiwon@draft.test': 'https://images.unsplash.com/photo-1545367288-630c0e371c41?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
  // 남 — 안경 지적인 느낌
  'seed-hyunwoo@draft.test': 'https://images.unsplash.com/photo-1642599235990-0e6ee6e8eaba?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
  // 여 — 계단 앞 감각적
  'seed-soyeon@draft.test': 'https://images.unsplash.com/photo-1623517006691-00db997b4c58?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
  // 남 — 깔끔한 캐주얼 빌딩 앞
  'seed-donghyuk@draft.test': 'https://images.unsplash.com/photo-1548682690-ed05ed4f2d95?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
  // 여 — 모던 테크 느낌
  'seed-yuna@draft.test': 'https://images.unsplash.com/photo-1632719708243-24d34dba666e?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
}

const SEED_USERS = [
  {
    email: 'seed-minji@draft.test',
    password: 'DraftTest123!',
    profile: {
      nickname: '김민지',
      university: '연세대학교',
      major: '컴퓨터과학',
      graduation_year: 2027,
      location: '서울',
      desired_position: '프론트엔드 개발자',
      affiliation_type: '대학생',
      bio: 'React와 TypeScript로 사용자 경험을 설계하는 프론트엔드 개발자입니다. 디자인 시스템과 웹 접근성에 깊은 관심을 갖고 있으며, 사이드 프로젝트를 통해 꾸준히 성장 중입니다.',
      interest_tags: ['React', 'TypeScript', 'UI/UX', 'Next.js'],
      skills: [
        { name: 'React', level: '고급' },
        { name: 'TypeScript', level: '고급' },
        { name: 'Next.js', level: '중급' },
        { name: 'Tailwind CSS', level: '고급' },
        { name: 'Figma', level: '중급' },
      ],
      personality: { risk: 6, time: 7, communication: 8, decision: 7 },
      // current_situation: 'has_project_need_member',
      contact_email: 'minji.dev@gmail.com',
      github_url: 'https://github.com/minji-dev',
      portfolio_url: 'https://minji.dev',
      vision_summary: JSON.stringify({
        summary: '사용자 경험에 진심인 프론트엔드 개발자. 디자인 시스템과 접근성에 관심이 많습니다.',
        goals: ['디자인 시스템 구축 경험 쌓기', '접근성 기반 UI 라이브러리 개발'],
        strengths: ['빠른 프로토타이핑', 'UI/UX 감각', '코드 리뷰 문화'],
        work_style: { collaboration: 7, planning: 6, perfectionism: 8 },
        team_preference: { role: '유연', preferred_size: '2-3명', atmosphere: '균형' },
        availability: { hours_per_week: 15, prefer_online: true },
      }),
      badges: ['sample'],
      profile_visibility: 'public',
      onboarding_completed: true,
    },
    projects: [
      {
        title: 'CampusMate — 대학생 시간표 공유 앱',
        description: '같은 수업을 듣는 친구를 자동으로 매칭해주는 시간표 기반 소셜 앱입니다. React Native로 MVP 개발 중이며, 현재 연세대 내 100명의 베타 테스터를 확보한 상태입니다.',
        type: 'startup',
        status: 'active',
        needed_roles: ['백엔드 개발자', '모바일 개발자'],
        interest_tags: ['React Native', 'Node.js', 'PostgreSQL'],
        location: '서울',
        location_type: 'hybrid',
        time_commitment: 'part_time',
        compensation_type: 'equity',
        compensation_details: '공동창업 (지분 협의)',
        pain_point: '대학생들이 같은 과목을 듣는 사람을 찾기 어려운 문제',
        demo_images: [
          'https://images.unsplash.com/photo-1661520995859-270deb9f929e?w=800&h=450&fit=crop&auto=format&q=80',
          'https://images.unsplash.com/photo-1626855428287-7ae49119eda6?w=800&h=450&fit=crop&auto=format&q=80',
        ],
        project_links: [{ label: 'Figma', url: 'https://figma.com/campusmate' }],
      },
      {
        title: 'DesignTok — 디자인 영감 숏폼 플랫폼',
        description: 'Dribbble + TikTok 컨셉. 디자이너들이 30초 영상으로 작업 과정을 공유하는 플랫폼입니다. Figma 플러그인도 개발 예정이며, 디자이너 커뮤니티 500명과 사전 인터뷰 완료.',
        type: 'startup',
        status: 'active',
        needed_roles: ['UX/UI 디자이너', '백엔드 개발자'],
        interest_tags: ['Figma', 'Next.js', 'AWS', 'FFmpeg'],
        location: '서울',
        location_type: 'remote',
        time_commitment: 'part_time',
        compensation_type: 'equity',
        compensation_details: '초기 팀원 지분 배분',
        pain_point: '디자이너들의 작업 과정 공유가 정적 이미지에 한정된 문제',
        demo_images: [
          'https://images.unsplash.com/photo-1634383501063-e83de849937e?w=800&h=450&fit=crop&auto=format&q=80',
          'https://images.unsplash.com/photo-1674210606362-a48e28595eda?w=800&h=450&fit=crop&auto=format&q=80',
        ],
      },
    ],
  },
  {
    email: 'seed-jiwon@draft.test',
    password: 'DraftTest123!',
    profile: {
      nickname: '이지원',
      university: '서울대학교',
      major: '경영학',
      graduation_year: 2026,
      location: '서울',
      desired_position: 'PM/PO',
      affiliation_type: '대학생',
      bio: '데이터 기반 의사결정을 좋아하는 PM 지망생입니다. 스타트업 인턴 2회 경험이 있고, 사용자 인터뷰와 A/B 테스트를 통해 제품을 개선하는 과정에 매력을 느낍니다.',
      interest_tags: ['Product', 'Growth', 'Data Analysis', 'Startup'],
      skills: [
        { name: 'Figma', level: '중급' },
        { name: 'SQL', level: '중급' },
        { name: 'Python', level: '초급' },
        { name: 'Notion', level: '고급' },
        { name: 'GA4', level: '중급' },
      ],
      personality: { risk: 7, time: 8, communication: 9, decision: 8 },
      // current_situation: 'has_project_need_member',
      contact_email: 'jiwon.pm@gmail.com',
      linkedin_url: 'https://linkedin.com/in/jiwon-lee',
      vision_summary: JSON.stringify({
        summary: '데이터 기반 의사결정을 좋아하는 PM 지망생. 스타트업 인턴 경험 2회.',
        goals: ['프로덕트 주도 성장(PLG) 전략 수립', '초기 팀 빌딩 및 MVP 검증'],
        strengths: ['사용자 인터뷰', 'A/B 테스트 설계', '스프린트 관리'],
        work_style: { collaboration: 9, planning: 8, perfectionism: 6 },
        team_preference: { role: '리더', preferred_size: '4-5명', atmosphere: '실무형' },
        availability: { hours_per_week: 20, prefer_online: false },
      }),
      badges: ['sample'],
      profile_visibility: 'public',
      onboarding_completed: true,
    },
    projects: [
      {
        title: 'FitBuddy — AI 운동 파트너 매칭',
        description: '운동 스타일, 위치, 시간대를 기반으로 운동 파트너를 매칭해주는 서비스입니다. 500명 대상 설문조사로 PMF 검증 완료, 현재 랜딩페이지와 대기 리스트 운영 중.',
        type: 'startup',
        status: 'active',
        needed_roles: ['풀스택 개발자', '디자이너'],
        interest_tags: ['Flutter', 'Firebase', 'AI/ML', 'Health'],
        location: '서울',
        location_type: 'onsite',
        time_commitment: 'part_time',
        compensation_type: 'equity',
        compensation_details: '공동창업자 모집 (지분 20~30%)',
        pain_point: '혼자 운동하면 작심삼일, 파트너를 찾기 어려운 문제',
        demo_images: [
          'https://images.unsplash.com/photo-1723485633150-1bbcf4e0a82b?w=800&h=450&fit=crop&auto=format&q=80',
        ],
        project_links: [{ label: '랜딩페이지', url: 'https://fitbuddy.kr' }],
      },
    ],
  },
  {
    email: 'seed-hyunwoo@draft.test',
    password: 'DraftTest123!',
    profile: {
      nickname: '박현우',
      university: 'KAIST',
      major: '전산학',
      graduation_year: 2027,
      location: '대전',
      desired_position: 'AI/ML 엔지니어',
      affiliation_type: '대학생',
      bio: 'LLM과 컴퓨터 비전을 결합한 멀티모달 AI를 연구하고 있습니다. Kaggle 은메달 보유, 논문 1편 공저자 경험이 있으며, AI를 활용한 실용적 서비스 개발에 관심이 큽니다.',
      interest_tags: ['Python', 'LLM', 'Computer Vision', 'RAG'],
      skills: [
        { name: 'Python', level: '고급' },
        { name: 'PyTorch', level: '고급' },
        { name: 'LangChain', level: '중급' },
        { name: 'FastAPI', level: '중급' },
        { name: 'Docker', level: '중급' },
      ],
      personality: { risk: 4, time: 8, communication: 4, decision: 7 },
      // current_situation: 'has_project_need_member',
      contact_email: 'hyunwoo.ai@kaist.ac.kr',
      github_url: 'https://github.com/hyunwoo-ml',
      vision_summary: JSON.stringify({
        summary: 'LLM과 컴퓨터 비전을 결합한 멀티모달 AI에 관심. Kaggle 은메달 보유.',
        goals: ['멀티모달 AI 서비스 개발', 'RAG 파이프라인 최적화'],
        strengths: ['딥러닝 모델 최적화', '논문 구현 능력', '데이터 파이프라인 설계'],
        work_style: { collaboration: 4, planning: 7, perfectionism: 9 },
        team_preference: { role: '팔로워', preferred_size: '2-3명', atmosphere: '실무형' },
        availability: { hours_per_week: 25, prefer_online: true },
      }),
      badges: ['sample'],
      profile_visibility: 'public',
      onboarding_completed: true,
    },
    projects: [
      {
        title: 'StudyLens — AI 논문 요약 & 토론 플랫폼',
        description: 'arXiv 논문을 자동 요약하고, 같은 논문을 읽는 사람들끼리 토론할 수 있는 플랫폼입니다. GPT-4o 기반 요약 엔진 프로토타입을 완성했고, KAIST 연구실 20곳에서 테스트 중.',
        type: 'side_project',
        status: 'active',
        needed_roles: ['프론트엔드 개발자', 'ML 엔지니어'],
        interest_tags: ['LLM', 'RAG', 'Next.js', 'Python'],
        location: '대전',
        location_type: 'remote',
        time_commitment: 'part_time',
        compensation_type: 'unpaid',
        compensation_details: 'AI 연구 경험 + 논문 공저 기회',
        pain_point: '연구자들이 쏟아지는 논문을 효율적으로 소화하기 어려운 문제',
        demo_images: [
          'https://images.unsplash.com/photo-1694160744683-54646352f15b?w=800&h=450&fit=crop&auto=format&q=80',
          'https://images.unsplash.com/photo-1570929057588-6952f7dd2305?w=800&h=450&fit=crop&auto=format&q=80',
        ],
        project_links: [{ label: 'GitHub', url: 'https://github.com/studylens-ai' }],
      },
      {
        title: 'PicNote — 사진으로 만드는 스마트 노트',
        description: '칠판/화이트보드 사진을 찍으면 AI가 텍스트를 추출하고 노트로 정리해주는 앱입니다. OCR + LLM 파이프라인 구축 완료, iOS 앱 개발자를 모집합니다.',
        type: 'side_project',
        status: 'active',
        needed_roles: ['iOS 개발자', '백엔드 개발자'],
        interest_tags: ['Swift', 'OCR', 'OpenAI', 'FastAPI'],
        location: '대전',
        location_type: 'remote',
        time_commitment: 'part_time',
        compensation_type: 'unpaid',
        compensation_details: '사이드 프로젝트 (포트폴리오)',
        pain_point: '수업 필기를 디지털로 정리하는 게 번거로운 문제',
        demo_images: [
          'https://images.unsplash.com/photo-1507764923504-cd90bf7da772?w=800&h=450&fit=crop&auto=format&q=80',
        ],
      },
    ],
  },
  {
    email: 'seed-soyeon@draft.test',
    password: 'DraftTest123!',
    profile: {
      nickname: '최소연',
      university: '홍익대학교',
      major: '시각디자인',
      graduation_year: 2026,
      location: '서울',
      desired_position: 'UX/UI 디자이너',
      affiliation_type: '대학생',
      bio: '브랜딩부터 UX/UI까지 폭넓게 다루는 디자이너입니다. 스타트업 2곳에서 디자인 리드를 맡았고, 디자인 시스템 구축과 사용자 리서치를 통한 개선에 자신 있습니다.',
      interest_tags: ['Figma', 'Branding', 'Design System', 'User Research'],
      skills: [
        { name: 'Figma', level: '고급' },
        { name: 'Illustrator', level: '고급' },
        { name: 'Framer', level: '중급' },
        { name: 'User Research', level: '중급' },
        { name: 'Prototyping', level: '고급' },
      ],
      personality: { risk: 8, time: 6, communication: 8, decision: 5 },
      // current_situation: 'has_project_need_member',
      contact_email: 'soyeon.design@gmail.com',
      portfolio_url: 'https://soyeon.design',
      linkedin_url: 'https://linkedin.com/in/soyeon-choi',
      vision_summary: JSON.stringify({
        summary: '브랜딩과 UX를 모두 다루는 디자이너. 스타트업 2곳에서 디자인 리드 경험.',
        goals: ['디자인 주도 스타트업 창업', '한국형 디자인 시스템 오픈소스 프로젝트'],
        strengths: ['브랜드 아이덴티티 설계', '디자인 시스템 구축', '사용자 리서치'],
        work_style: { collaboration: 8, planning: 5, perfectionism: 9 },
        team_preference: { role: '리더', preferred_size: '2-3명', atmosphere: '캐주얼' },
        availability: { hours_per_week: 12, prefer_online: false },
      }),
      badges: ['sample'],
      profile_visibility: 'public',
      onboarding_completed: true,
    },
    projects: [
      {
        title: 'Moodboard — 감성 기반 인테리어 추천',
        description: '사용자의 무드보드를 AI가 분석해서 가구/소품을 추천하는 서비스입니다. 디자인 시스템과 UI 플로우를 완성했고, 개발팀을 모집합니다. 이케아 코리아 협업 논의 중.',
        type: 'startup',
        status: 'active',
        needed_roles: ['프론트엔드 개발자', '백엔드 개발자'],
        interest_tags: ['React', 'Tailwind', 'Supabase', 'AI', 'E-commerce'],
        location: '서울',
        location_type: 'hybrid',
        time_commitment: 'part_time',
        compensation_type: 'equity',
        compensation_details: '초기 멤버 지분 배분 (15~25%)',
        pain_point: '인테리어를 꾸미고 싶지만 자기 취향을 정리하기 어려운 문제',
        demo_images: [
          'https://images.unsplash.com/photo-1616126393142-e00ab126efc4?w=800&h=450&fit=crop&auto=format&q=80',
          'https://images.unsplash.com/photo-1555209183-8facf96a4349?w=800&h=450&fit=crop&auto=format&q=80',
        ],
        project_links: [
          { label: 'Figma 프로토타입', url: 'https://figma.com/moodboard-app' },
        ],
      },
    ],
  },
  {
    email: 'seed-donghyuk@draft.test',
    password: 'DraftTest123!',
    profile: {
      nickname: '정동혁',
      university: '고려대학교',
      major: '산업경영공학',
      graduation_year: 2027,
      location: '서울',
      desired_position: '마케터',
      affiliation_type: '대학생',
      bio: '그로스 해킹과 데이터 분석을 결합해 제품 성장을 이끄는 것을 좋아합니다. 개인 블로그 월 5만 PV, 유튜브 구독자 3천명을 운영하며 콘텐츠 마케팅 경험을 쌓고 있습니다.',
      interest_tags: ['Growth', 'SEO', 'Data', 'Marketing', 'Content'],
      skills: [
        { name: 'Google Analytics', level: '고급' },
        { name: 'SQL', level: '중급' },
        { name: 'SEO', level: '고급' },
        { name: 'Notion', level: '고급' },
        { name: 'Photoshop', level: '중급' },
      ],
      personality: { risk: 8, time: 7, communication: 9, decision: 9 },
      // current_situation: 'want_to_join',
      contact_email: 'donghyuk.growth@gmail.com',
      linkedin_url: 'https://linkedin.com/in/donghyuk-jung',
      vision_summary: JSON.stringify({
        summary: '그로스 해킹과 데이터 분석에 강점. 블로그 월 5만 PV 운영.',
        goals: ['스타트업 초기 그로스 전략 수립', 'SEO/콘텐츠 기반 유기적 성장'],
        strengths: ['콘텐츠 마케팅', 'SEO 최적화', '데이터 기반 의사결정'],
        work_style: { collaboration: 7, planning: 6, perfectionism: 5 },
        team_preference: { role: '유연', preferred_size: '4-5명', atmosphere: '캐주얼' },
        availability: { hours_per_week: 15, prefer_online: true },
      }),
      badges: ['sample'],
      profile_visibility: 'public',
      onboarding_completed: true,
    },
    projects: [],
  },
  {
    email: 'seed-yuna@draft.test',
    password: 'DraftTest123!',
    profile: {
      nickname: '한유나',
      university: '성균관대학교',
      major: '소프트웨어학',
      graduation_year: 2026,
      location: '수원',
      desired_position: '백엔드 개발자',
      affiliation_type: '대학생',
      bio: '분산 시스템과 클라우드 인프라에 관심 있는 백엔드 개발자입니다. Kubernetes 기반 마이크로서비스 아키텍처를 공부하고 있고, 오픈소스 프로젝트에 꾸준히 기여하고 있습니다.',
      interest_tags: ['Go', 'Kubernetes', 'MSA', 'DevOps', 'Cloud'],
      skills: [
        { name: 'Go', level: '고급' },
        { name: 'Docker', level: '고급' },
        { name: 'Kubernetes', level: '중급' },
        { name: 'PostgreSQL', level: '고급' },
        { name: 'AWS', level: '중급' },
      ],
      personality: { risk: 3, time: 9, communication: 5, decision: 8 },
      // current_situation: 'has_project_need_member',
      contact_email: 'yuna.backend@gmail.com',
      github_url: 'https://github.com/yuna-go',
      vision_summary: JSON.stringify({
        summary: '분산 시스템과 인프라에 관심 있는 백엔드 개발자. 오픈소스 컨트리뷰터.',
        goals: ['대규모 트래픽 처리 경험', '클라우드 네이티브 아키텍처 설계'],
        strengths: ['시스템 설계', 'API 최적화', '모니터링/로깅 구축'],
        work_style: { collaboration: 5, planning: 9, perfectionism: 8 },
        team_preference: { role: '팔로워', preferred_size: '2-3명', atmosphere: '실무형' },
        availability: { hours_per_week: 20, prefer_online: true },
      }),
      badges: ['sample'],
      profile_visibility: 'public',
      onboarding_completed: true,
    },
    projects: [
      {
        title: 'DevLog — 개발자 TIL 공유 플랫폼',
        description: 'GitHub 잔디처럼 TIL(Today I Learned)을 시각화하고 공유하는 플랫폼입니다. 마크다운 에디터 + AI 태그 자동 생성 기능 구현 완료. 현재 성균관대 개발 동아리에서 30명 베타 테스트 중.',
        type: 'side_project',
        status: 'active',
        needed_roles: ['프론트엔드 개발자', '디자이너'],
        interest_tags: ['Next.js', 'Go', 'Redis', 'Markdown', 'AI'],
        location: '수원',
        location_type: 'remote',
        time_commitment: 'part_time',
        compensation_type: 'unpaid',
        compensation_details: '사이드 프로젝트 (포트폴리오 + 오픈소스)',
        pain_point: '개발 학습 기록을 체계적으로 관리하고 공유하기 어려운 문제',
        demo_images: [
          'https://images.unsplash.com/photo-1619682508024-64c66726a373?w=800&h=450&fit=crop&auto=format&q=80',
          'https://images.unsplash.com/photo-1562907550-096d3bf9b25c?w=800&h=450&fit=crop&auto=format&q=80',
        ],
        project_links: [{ label: 'GitHub', url: 'https://github.com/devlog-platform' }],
      },
    ],
  },
]

// ── Seed 로직 ──

async function seed() {
  console.log('🌱 시드 데이터 생성 시작...\n')

  const createdUserIds = []

  for (const userData of SEED_USERS) {
    // 1. Auth user 생성
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: { full_name: userData.profile.nickname },
    })

    if (authError) {
      if (authError.message?.includes('already been registered')) {
        // 이미 존재하면 조회
        const { data: users } = await supabase.auth.admin.listUsers()
        const existing = users?.users?.find(u => u.email === userData.email)
        if (existing) {
          console.log(`  ⏭️  ${userData.profile.nickname} (${userData.email}) — 이미 존재, 프로필 업데이트`)
          createdUserIds.push(existing.id)
          const avatarUrl = AVATAR_URLS[userData.email]
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({ user_id: existing.id, ...userData.profile, ...(avatarUrl ? { avatar_url: avatarUrl } : {}) }, { onConflict: 'user_id' })
          if (profileError) console.error(`     프로필 에러: ${profileError.message}`)
          continue
        }
      }
      console.error(`  ❌ ${userData.email}: ${authError.message}`)
      continue
    }

    const userId = authData.user.id
    createdUserIds.push(userId)
    console.log(`  ✅ ${userData.profile.nickname} (${userId.slice(0, 8)}...)`)

    // 2. Profile 생성 (아바타 URL 포함)
    const avatarUrl = AVATAR_URLS[userData.email]
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        ...userData.profile,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      }, { onConflict: 'user_id' })

    if (profileError) {
      console.error(`     프로필 에러: ${profileError.message}`)
    }

    // 4. Projects 생성 (sample 뱃지 자동 추가)
    for (const project of userData.projects) {
      const { error: projError } = await supabase
        .from('opportunities')
        .insert({
          creator_id: userId,
          badges: ['sample'],
          ...project,
        })

      if (projError) {
        console.error(`     프로젝트 에러 (${project.title}): ${projError.message}`)
      } else {
        console.log(`     📦 ${project.title}`)
      }
    }
  }

  console.log(`\n✨ 완료! 유저 ${createdUserIds.length}명, 프로젝트 ${SEED_USERS.reduce((n, u) => n + u.projects.length, 0)}개`)
}

// ── Clean 로직 ──

async function clean() {
  console.log('🧹 시드 데이터 정리 시작...\n')

  const { data: users } = await supabase.auth.admin.listUsers()
  const seedUsers = users?.users?.filter(u => u.email?.endsWith('@draft.test')) || []

  for (const user of seedUsers) {
    // opportunities 먼저 삭제
    const { error: oppError } = await supabase
      .from('opportunities')
      .delete()
      .eq('creator_id', user.id)
    if (oppError) console.error(`  ⚠️  ${user.email} opportunities 삭제 에러: ${oppError.message}`)

    // profiles 삭제
    const { error: profError } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', user.id)
    if (profError) console.error(`  ⚠️  ${user.email} profile 삭제 에러: ${profError.message}`)

    // auth user 삭제
    const { error } = await supabase.auth.admin.deleteUser(user.id)
    if (error) {
      console.error(`  ❌ ${user.email}: ${error.message}`)
    } else {
      console.log(`  🗑️  ${user.email} 삭제`)
    }
  }

  console.log(`\n✨ ${seedUsers.length}명 정리 완료`)
}

// ── 실행 ──

const isClean = process.argv.includes('--clean')
if (isClean) {
  clean().catch(console.error)
} else {
  seed().catch(console.error)
}
