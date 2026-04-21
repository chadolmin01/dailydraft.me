import { test, expect, type Page } from '@playwright/test'

/**
 * Meta App Review 데모 영상 녹화 스펙.
 *
 * 4개 test 로 분리 — 각 test 가 Playwright 한 개 webm 을 뱉고,
 * stitch.mjs 가 순서대로 concat.
 *
 * 환경변수:
 *   - DEMO_USER_EMAIL / DEMO_USER_PASSWORD  : 테스트 계정 (Meta Tester 로 등록된 유저)
 *   - DEMO_PERSONA_PATH                     : 페르소나 설정 경로 (/clubs/<slug>/settings/persona)
 *
 * 셀렉터 방침:
 *   - 가능한 한 텍스트/role 기반 (data-testid 가 없는 코드베이스)
 *   - 페르소나 페이지 내 콘텐츠 생성 버튼은 실 UI 가 빈번히 바뀌므로
 *     fallback 셀렉터를 여러 개 준비 (`.or(...)` 체인)
 */

const DEMO_EMAIL = process.env.DEMO_USER_EMAIL ?? ''
const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD ?? ''
const PERSONA_PATH = process.env.DEMO_PERSONA_PATH ?? '/clubs/demo/settings/persona'

async function expectLoaded(page: Page) {
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {
    // networkidle 가 안 올 수도 있음 (Next dev HMR, RSC stream). 무시하고 진행.
  })
}

/**
 * 공용 로그인 헬퍼.
 * part 2~4 는 이미 part 1 이 남긴 storageState 에 의존하지 않고
 * 매 test 새로 로그인 (각 test 가 독립 context) — 녹화 길이는 조금 길어지지만
 * 디버깅이 쉬움.
 */
async function signIn(page: Page) {
  if (!DEMO_EMAIL || !DEMO_PASSWORD) {
    throw new Error(
      'DEMO_USER_EMAIL / DEMO_USER_PASSWORD 환경변수가 필요합니다. ' +
        'scripts/demo/.env.demo 를 만들어 채워주시기 바랍니다.',
    )
  }
  await page.goto('/login')
  await expectLoaded(page)

  await page.locator('input[type="email"]').first().fill(DEMO_EMAIL)
  await page.waitForTimeout(400)
  await page.locator('input[type="password"]').first().fill(DEMO_PASSWORD)
  await page.waitForTimeout(400)

  // 로그인 버튼 — 텍스트 기준 (한국어 UI)
  const loginButton = page
    .getByRole('button', { name: /로그인|Sign in|Log in/i })
    .first()
  await loginButton.click()

  // 대시보드 진입까지 대기
  await page.waitForURL(/\/(dashboard|onboarding|$)/, { timeout: 45_000 })
  await expectLoaded(page)
}

test.describe.configure({ mode: 'serial' })

test('part 1 - intro', async ({ page }) => {
  // 30초 목표: 랜딩 → 로그인 → 대시보드
  await page.goto('/')
  await expectLoaded(page)

  // 랜딩 훑어보기
  await page.waitForTimeout(3_000)
  await page.mouse.wheel(0, 600)
  await page.waitForTimeout(2_500)
  await page.mouse.wheel(0, 600)
  await page.waitForTimeout(2_500)

  // "로그인" CTA 클릭 (텍스트 기반, 여러 변형 허용)
  const loginCta = page
    .getByRole('link', { name: /로그인|Sign in|Log in|시작하기/i })
    .first()
  if (await loginCta.isVisible().catch(() => false)) {
    await loginCta.click()
  } else {
    await page.goto('/login')
  }
  await expectLoaded(page)
  await page.waitForTimeout(2_000)

  // 로그인 폼 작성 (signIn 을 인라인으로 — 녹화 타임라인 유지)
  if (!DEMO_EMAIL || !DEMO_PASSWORD) {
    throw new Error('DEMO_USER_EMAIL / DEMO_USER_PASSWORD 환경변수가 필요합니다.')
  }
  await page.locator('input[type="email"]').first().fill(DEMO_EMAIL)
  await page.waitForTimeout(600)
  await page.locator('input[type="password"]').first().fill(DEMO_PASSWORD)
  await page.waitForTimeout(600)

  await page
    .getByRole('button', { name: /로그인|Sign in|Log in/i })
    .first()
    .click()

  await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 45_000 })
  await expectLoaded(page)
  await page.waitForTimeout(4_000)

  // 대시보드 스크롤
  await page.mouse.wheel(0, 400)
  await page.waitForTimeout(2_500)
  await page.mouse.wheel(0, 400)
  await page.waitForTimeout(2_500)

  expect(page.url()).toMatch(/\/(dashboard|onboarding)/)
})

test('part 2 - connect', async ({ page }) => {
  // 20초 목표: 페르소나 설정 → 스크롤 → Threads 연결 버튼 hover
  await signIn(page)
  await page.goto(PERSONA_PATH)
  await expectLoaded(page)
  await page.waitForTimeout(3_000)

  // 채널 연결 섹션까지 스크롤
  const channelHeading = page
    .getByRole('heading', { name: /어디로 자동 발행할까요|채널|SNS|발행/i })
    .first()
  await channelHeading
    .scrollIntoViewIfNeeded({ timeout: 10_000 })
    .catch(async () => {
      await page.mouse.wheel(0, 1200)
    })
  await page.waitForTimeout(3_000)

  // "Threads 연결하기" 버튼 hover
  // 컴포넌트: components/persona/PersonaChannelConnections.tsx
  // 문구: `{def.label} 연결하기` → "Threads 연결하기"
  const threadsConnect = page
    .getByRole('link', { name: /Threads 연결하기|다시 연결하기/i })
    .first()
    .or(page.getByText('Threads', { exact: false }).first())

  await threadsConnect.scrollIntoViewIfNeeded().catch(() => {})
  await threadsConnect.hover({ timeout: 10_000 }).catch(() => {})
  await page.waitForTimeout(2_500)
})

test('part 3 - publish', async ({ page }) => {
  // 60초 목표: 콘텐츠 생성 UI 조작 → 발행 승인
  await signIn(page)
  await page.goto(PERSONA_PATH)
  await expectLoaded(page)
  await page.waitForTimeout(2_500)

  // 페이지 최상단으로 (콘텐츠 생성 섹션이 상단에 있음 — 페이지별 상이)
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  await page.waitForTimeout(2_000)

  // 초안 생성 / 주제 입력 CTA — 여러 이름 허용 (UI 자주 바뀜)
  const draftCta = page
    .getByRole('button', { name: /초안 생성|AI 초안|생성|Generate|새 글|바로 만들기/i })
    .first()

  if (await draftCta.isVisible().catch(() => false)) {
    await draftCta.click().catch(() => {})
    await page.waitForTimeout(5_000)
  }

  // 텍스트 입력 영역이 있으면 주제 입력
  const topicInput = page
    .locator('textarea, input[type="text"]')
    .filter({ hasText: '' })
    .first()

  if (await topicInput.isVisible().catch(() => false)) {
    await topicInput
      .fill('이번 주 스터디 회고 — 팀원 3명이 React Query 마이그레이션을 끝냈습니다.')
      .catch(() => {})
    await page.waitForTimeout(2_500)
  }

  // AI 생성 실행 버튼
  const runBtn = page
    .getByRole('button', { name: /생성|Generate|실행|만들기/i })
    .first()
  await runBtn.click().catch(() => {})
  await page.waitForTimeout(8_000)

  // 초안 렌더 대기 — 편집 영역 내 텍스트가 차는 모습을 보여준다.
  await page.waitForTimeout(6_000)

  // 유저 검토 단계: 살짝 편집하는 모션 (문서 내 스크롤 + 약간의 텍스트 이동)
  await page.mouse.wheel(0, 300)
  await page.waitForTimeout(3_000)
  await page.mouse.wheel(0, -150)
  await page.waitForTimeout(3_000)

  // 발행 승인 버튼 — "게시/발행/승인/Publish" 텍스트 하나에 매칭
  const publishBtn = page
    .getByRole('button', { name: /발행|게시|승인|Publish|Post/i })
    .first()

  await publishBtn.scrollIntoViewIfNeeded().catch(() => {})
  await publishBtn.hover().catch(() => {})
  await page.waitForTimeout(2_000)
  await publishBtn.click().catch(() => {})
  await page.waitForTimeout(8_000)
})

test('part 4 - verify', async ({ page }) => {
  // 20초 목표: 발행 결과 확인 → /legal/data-deletion
  await signIn(page)
  await page.goto(PERSONA_PATH)
  await expectLoaded(page)
  await page.waitForTimeout(3_000)

  // 발행 이력 / 최근 발행된 글 영역을 보여주는 움직임
  await page.mouse.wheel(0, 600)
  await page.waitForTimeout(3_000)

  // 데이터 삭제 경로 — Meta 리뷰어에게 명시적으로 보여줘야 함
  await page.goto('/legal/data-deletion')
  await expectLoaded(page)
  await page.waitForTimeout(3_000)

  await page.mouse.wheel(0, 400)
  await page.waitForTimeout(3_500)
  await page.mouse.wheel(0, 400)
  await page.waitForTimeout(3_500)
})
