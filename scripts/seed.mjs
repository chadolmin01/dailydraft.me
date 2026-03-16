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
      desired_position: 'Frontend Developer',
      interest_tags: ['React', 'TypeScript', 'UI/UX'],
      vision_summary: '사용자 경험에 진심인 프론트엔드 개발자. 디자인 시스템과 접근성에 관심이 많습니다.',
      profile_visibility: 'public',
      onboarding_completed: true,
    },
    projects: [
      {
        title: 'CampusMate — 대학생 시간표 공유 앱',
        description: '같은 수업을 듣는 친구를 자동으로 매칭해주는 시간표 기반 소셜 앱입니다. React Native로 MVP 개발 중이며, 백엔드 개발자를 찾고 있습니다.',
        type: 'team_building',
        status: 'active',
        needed_roles: ['Backend Developer', 'Mobile Developer'],
        interest_tags: ['React Native', 'Node.js', 'PostgreSQL'],
        location: '서울',
        location_type: 'hybrid',
        time_commitment: 'part_time',
        compensation_type: 'equity',
        compensation_details: '공동창업 (지분 협의)',
      },
      {
        title: 'DesignTok — 디자인 영감 숏폼 플랫폼',
        description: 'Dribbble + TikTok 컨셉. 디자이너들이 30초 영상으로 작업 과정을 공유하는 플랫폼. Figma 플러그인도 개발 예정.',
        type: 'team_building',
        status: 'active',
        needed_roles: ['UX/UI Designer', 'Backend Developer'],
        interest_tags: ['Figma', 'Next.js', 'AWS'],
        location: '서울',
        location_type: 'remote',
        time_commitment: 'part_time',
        compensation_type: 'equity',
        compensation_details: '초기 팀원 지분 배분',
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
      desired_position: 'Product Manager',
      interest_tags: ['Product', 'Growth', 'Data Analysis'],
      vision_summary: '데이터 기반 의사결정을 좋아하는 PM 지망생. 스타트업 인턴 경험 2회.',
      profile_visibility: 'public',
      onboarding_completed: true,
    },
    projects: [
      {
        title: 'FitBuddy — AI 운동 파트너 매칭',
        description: '운동 스타일, 위치, 시간대를 기반으로 운동 파트너를 매칭해주는 서비스. 현재 랜딩페이지 완성, 개발 시작 단계.',
        type: 'team_building',
        status: 'active',
        needed_roles: ['Full Stack Developer', 'Designer'],
        interest_tags: ['Flutter', 'Firebase', 'AI/ML'],
        location: '서울',
        location_type: 'onsite',
        time_commitment: 'part_time',
        compensation_type: 'equity',
        compensation_details: '공동창업자 모집',
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
      desired_position: 'AI Engineer',
      interest_tags: ['Python', 'LLM', 'Computer Vision'],
      vision_summary: 'LLM과 컴퓨터 비전을 결합한 멀티모달 AI에 관심. Kaggle 은메달 보유.',
      profile_visibility: 'public',
      onboarding_completed: true,
    },
    projects: [
      {
        title: 'StudyLens — AI 논문 요약 & 토론 플랫폼',
        description: 'arXiv 논문을 자동 요약하고, 같은 논문을 읽는 사람들끼리 토론할 수 있는 플랫폼. GPT-4o 기반 요약 엔진 프로토타입 완성.',
        type: 'team_building',
        status: 'active',
        needed_roles: ['Frontend Developer', 'ML Engineer'],
        interest_tags: ['LLM', 'RAG', 'Next.js', 'Python'],
        location: '대전',
        location_type: 'remote',
        time_commitment: 'part_time',
        compensation_type: 'unpaid',
        compensation_details: 'AI 연구 경험 + 포트폴리오',
      },
      {
        title: 'PicNote — 사진으로 만드는 스마트 노트',
        description: '칠판/화이트보드 사진을 찍으면 AI가 텍스트를 추출하고 노트로 정리해주는 앱. OCR + LLM 파이프라인 구축 중.',
        type: 'team_building',
        status: 'active',
        needed_roles: ['iOS Developer', 'Backend Developer'],
        interest_tags: ['Swift', 'OCR', 'OpenAI', 'FastAPI'],
        location: '대전',
        location_type: 'remote',
        time_commitment: 'part_time',
        compensation_type: 'unpaid',
        compensation_details: '사이드 프로젝트 (포트폴리오)',
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
      desired_position: 'UX/UI Designer',
      interest_tags: ['Figma', 'Branding', 'Design System'],
      vision_summary: '브랜딩과 UX를 모두 다루는 디자이너. 스타트업 2곳에서 디자인 리드 경험.',
      profile_visibility: 'public',
      onboarding_completed: true,
    },
    projects: [
      {
        title: 'Moodboard — 감성 기반 인테리어 추천',
        description: '사용자의 무드보드를 AI가 분석해서 가구/소품을 추천하는 서비스. 현재 디자인 시스템 구축 완료, 개발팀 모집 중.',
        type: 'team_building',
        status: 'active',
        needed_roles: ['Frontend Developer', 'Backend Developer'],
        interest_tags: ['React', 'Tailwind', 'Supabase', 'AI'],
        location: '서울',
        location_type: 'hybrid',
        time_commitment: 'part_time',
        compensation_type: 'equity',
        compensation_details: '초기 멤버 지분 배분',
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
      desired_position: 'Growth Hacker',
      interest_tags: ['Growth', 'SEO', 'Data', 'Marketing'],
      vision_summary: '그로스 해킹과 데이터 분석에 강점. 블로그 월 5만 PV 운영 경험.',
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
      desired_position: 'Backend Developer',
      interest_tags: ['Go', 'Kubernetes', 'MSA', 'DevOps'],
      vision_summary: '분산 시스템과 인프라에 관심 있는 백엔드 개발자. 오픈소스 컨트리뷰터.',
      profile_visibility: 'public',
      onboarding_completed: true,
    },
    projects: [
      {
        title: 'DevLog — 개발자 TIL 공유 플랫폼',
        description: 'GitHub 잔디처럼 TIL(Today I Learned)을 시각화하고 공유하는 플랫폼. 마크다운 에디터 + AI 태그 자동 생성.',
        type: 'team_building',
        status: 'active',
        needed_roles: ['Frontend Developer', 'Designer'],
        interest_tags: ['Next.js', 'Go', 'Redis', 'Markdown'],
        location: '수원',
        location_type: 'remote',
        time_commitment: 'part_time',
        compensation_type: 'unpaid',
        compensation_details: '사이드 프로젝트',
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
          console.log(`  ⏭️  ${userData.profile.nickname} (${userData.email}) — 이미 존재`)
          createdUserIds.push(existing.id)
          continue
        }
      }
      console.error(`  ❌ ${userData.email}: ${authError.message}`)
      continue
    }

    const userId = authData.user.id
    createdUserIds.push(userId)
    console.log(`  ✅ ${userData.profile.nickname} (${userId.slice(0, 8)}...)`)

    // 2. Profile 생성
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        ...userData.profile,
      }, { onConflict: 'user_id' })

    if (profileError) {
      console.error(`     프로필 에러: ${profileError.message}`)
    }

    // 3. Projects 생성
    for (const project of userData.projects) {
      const { error: projError } = await supabase
        .from('opportunities')
        .insert({
          creator_id: userId,
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
    // opportunities, profiles는 CASCADE로 자동 삭제
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
