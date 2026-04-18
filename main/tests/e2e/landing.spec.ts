import { test, expect } from '@playwright/test'

test.describe('Landing page', () => {
  test('loads with Hero CTA and nav links', async ({ page }) => {
    await page.goto('/')

    // Hero 카피 중 변경이 적은 핵심 단어로 매칭. 전체 문장 대신 '동아리 운영' 만 확인해
    // 카피 수정 있어도 테스트 쉽게 안 깨지게.
    await expect(page.getByRole('heading', { level: 1 })).toContainText('동아리 운영')

    // CTA — '무료로 시작하기' 버튼이 /login 으로 연결
    const cta = page.getByRole('link', { name: '무료로 시작하기' }).first()
    await expect(cta).toBeVisible()
    await expect(cta).toHaveAttribute('href', '/login')
  })

  test('skip-to-main link exists for keyboard users', async ({ page }) => {
    await page.goto('/')

    // sr-only 라 visible 은 아니지만 Tab focus 시 드러남.
    const skipLink = page.getByRole('link', { name: '메인 콘텐츠로 이동' })
    await expect(skipLink).toHaveAttribute('href', '#main-content')
  })

  test('mobile menu opens and closes with Escape', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile viewport 전용 테스트')

    await page.goto('/')

    const hamburger = page.getByRole('button', { name: '메뉴 열기' })
    await hamburger.click()

    // dialog role 로 변경됐는지
    const menu = page.getByRole('dialog', { name: '모바일 메뉴' })
    await expect(menu).toBeVisible()

    // Escape 키로 닫기
    await page.keyboard.press('Escape')
    await expect(menu).not.toBeVisible()
  })
})
