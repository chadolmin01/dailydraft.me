/**
 * 랜딩 스크린샷 민감 영역 블러 처리.
 *
 * Why: asan-doers-evidence/screenshots/ 의 실제 프로덕트 캡처에는 학생 실명·
 *      내부 팀명·API 키 일부가 노출돼 있어 공개 랜딩 페이지에 그대로 쓸 수 없음.
 *
 * 좌표는 이미지 크기 대비 비율(%)로 지정 — 리사이즈돼도 안전.
 * 각 영역은 가우시안 블러 σ=24 로 픽셀 뭉개기 (텍스트 판독 불가).
 *
 * 실행: pnpm --filter main exec node ../scripts/blur-landing-screenshots.mjs
 *       또는 cd main && node ../scripts/blur-landing-screenshots.mjs
 */

import sharp from 'sharp'
import { mkdir, readdir } from 'node:fs/promises'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = resolve(__dirname, '../../asan-doers-evidence/screenshots')
const DST = resolve(__dirname, '../public/landing/screenshots')
const BLUR_SIGMA = 24

/** 각 파일별 블러 영역 (비율 0~1). 파일에 없는 키는 블러 안 함. */
const REGIONS = {
  '01_dashboard.png': [
    // 우상단 프로필 아바타·이름
    { x: 0.92, y: 0.0, w: 0.08, h: 0.07, label: 'profile-pill' },
    // 메인 이름 헤딩 "이성민"
    { x: 0.025, y: 0.10, w: 0.12, h: 0.10, label: 'main-name' },
  ],
  '02_persona.png': [
    { x: 0.92, y: 0.0, w: 0.08, h: 0.07, label: 'profile-pill' },
  ],
  '03_ghostwriter.png': [
    // Discord 임베드 카드 내 "팀별 현황" 리스트 (팀명 6개)
    { x: 0.435, y: 0.47, w: 0.20, h: 0.18, label: 'team-list' },
    // 미제출 경고 블록 (팀명 포함)
    { x: 0.435, y: 0.67, w: 0.18, h: 0.10, label: 'overdue-warning' },
  ],
  '04_threads_chain.png': [
    // LinkedIn 계정 ID — "계정: FSXKv5U2z1..." 라인. 좌표 흔들림 커서 여유 있게.
    { x: 0.03, y: 0.36, w: 0.15, h: 0.12, label: 'linkedin-account-block' },
  ],
  '05_explore.png': [
    { x: 0.92, y: 0.0, w: 0.08, h: 0.07, label: 'profile-pill' },
  ],
  '06_feed.png': [
    // 프로젝트 타이틀 "DRAME..."
    { x: 0.025, y: 0.13, w: 0.45, h: 0.07, label: 'project-title' },
    // 제작자 "강민규·PM·경희대학교"
    { x: 0.03, y: 0.19, w: 0.20, h: 0.04, label: 'creator-meta' },
    // 본문 "프로젝트 소개" 블록 내 프로젝트명 재노출
    { x: 0.025, y: 0.455, w: 0.30, h: 0.07, label: 'intro-body-name' },
    // 우측 사이드바 팀 정보 (이름·학교)
    { x: 0.62, y: 0.47, w: 0.22, h: 0.10, label: 'team-info' },
  ],
  '07_discord_activity.png': [
    // 우측 메시지 전체 (회의 내용·논의 내용 그대로 노출)
    { x: 0.30, y: 0.08, w: 0.68, h: 0.82, label: 'discord-messages' },
    // 하단 좌측 "이성민" 프로필
    { x: 0.02, y: 0.90, w: 0.14, h: 0.08, label: 'user-footer' },
    // 좌측 사이드바 프로젝트 채널명
    { x: 0.075, y: 0.55, w: 0.22, h: 0.35, label: 'channel-names' },
  ],
}

async function processOne(file) {
  const src = join(SRC, file)
  const dst = join(DST, file)
  const regions = REGIONS[file]
  if (!regions) {
    console.log(`skip (no regions): ${file}`)
    return
  }

  const img = sharp(src)
  const { width, height } = await img.metadata()

  // 각 영역별로 블러된 크롭 버퍼 생성 → composite 입력 목록 준비
  const overlays = []
  for (const r of regions) {
    // 비율 → 픽셀 좌표, 경계 clamp
    const left = Math.max(0, Math.floor(r.x * width))
    const top = Math.max(0, Math.floor(r.y * height))
    const w = Math.min(width - left, Math.floor(r.w * width))
    const h = Math.min(height - top, Math.floor(r.h * height))
    if (w <= 0 || h <= 0) {
      console.warn(`  skip ${r.label}: zero-size region`)
      continue
    }
    // 왜 extract 를 매 영역마다 새로 생성하는지: sharp 인스턴스는 한 번 체인되면
    // 재사용 시 이전 op 가 누적될 수 있어 매번 원본에서 새로 파이프라인 시작.
    const buf = await sharp(src)
      .extract({ left, top, width: w, height: h })
      .blur(BLUR_SIGMA)
      .toBuffer()
    overlays.push({ input: buf, left, top })
    console.log(`  ${r.label}: ${w}×${h} @ (${left},${top})`)
  }

  await img.composite(overlays).toFile(dst)
  console.log(`✓ ${file} → ${dst}`)
}

async function main() {
  await mkdir(DST, { recursive: true })
  const files = (await readdir(SRC)).filter((f) => f.endsWith('.png'))
  for (const f of files) {
    try {
      await processOne(f)
    } catch (err) {
      console.error(`✗ ${f}: ${err.message}`)
    }
  }
}

main()
