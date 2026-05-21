import { defineConfig, devices } from '@playwright/test'
import path from 'node:path'

/**
 * Meta App Review 데모 영상 전용 Playwright 설정.
 *
 * 왜 별도 config 인가:
 *   - 기본 `playwright.config.ts` 는 headless + 30s timeout 스모크 테스트용.
 *   - 데모 녹화는 headed + video on + slowMo + 긴 timeout 이 필요.
 *   - 설정이 달라 같은 파일에서 분기하면 CI 실수 위험 → 물리 분리.
 *
 * 산출물:
 *   - scripts/demo/tmp/part-N/video.webm  (part 별 webm, N=1..4)
 *   - stitch.mjs 가 이걸 mp4 로 변환 후 합성.
 */

// 파트별 녹화 길이에 여유를 주기 위한 넉넉한 timeout.
// Playwright default 30s → 데모 녹화에선 부족 (part 3 publish 는 실측 60s 이상).
const PER_TEST_TIMEOUT_MS = 5 * 60 * 1000

export default defineConfig({
  testDir: path.resolve(__dirname),
  testMatch: /record\.spec\.ts$/,
  timeout: PER_TEST_TIMEOUT_MS,
  expect: { timeout: 15 * 1000 },
  fullyParallel: false, // 영상 파일 경로 충돌 방지 + 로그인 세션 공유 우려
  workers: 1,
  retries: 0, // 녹화는 재시도 시 파일 덮어써서 의미 없음
  reporter: [['list']],
  outputDir: path.resolve(__dirname, 'tmp'),
  use: {
    baseURL: process.env.DEMO_BASE_URL ?? 'http://localhost:3000',
    headless: false,
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    // video: 'on' — retain-on-failure 금지 (성공해도 영상 필요)
    video: {
      mode: 'on',
      size: { width: 1920, height: 1080 },
    },
    trace: 'off',
    screenshot: 'off',
    launchOptions: {
      slowMo: 120, // 시청자가 인지 가능하도록 UI 조작 사이 120ms
      args: ['--window-size=1920,1080', '--force-device-scale-factor=1'],
    },
    actionTimeout: 20 * 1000,
    navigationTimeout: 45 * 1000,
  },
  projects: [
    {
      name: 'demo-chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        headless: false,
      },
    },
  ],
})
