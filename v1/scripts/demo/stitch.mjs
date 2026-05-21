#!/usr/bin/env node
/**
 * ffmpeg 기반 데모 영상 합성 스크립트 (ESM).
 *
 * 전제:
 *   - ffmpeg 가 PATH 에 있음
 *   - Playwright 녹화(`pnpm demo:record`) 완료 — scripts/demo/tmp/<test-dir>/video.webm 존재
 *   - 자막 생성(`pnpm demo:subs`) 완료 — scripts/demo/out/*.srt 존재
 *   - OAuth 수동 클립(선택) — scripts/demo/tmp/oauth-manual.mp4 — 없으면 placeholder 카드 생성
 *
 * 산출물:
 *   - scripts/demo/out/draft-threads-demo.mp4 (한국어 자막 burn-in)
 *   - scripts/demo/out/draft-threads-demo.en.srt (external, Meta 업로드 시 함께 제출)
 *
 * 왜 concat demuxer 인가:
 *   - stream copy 로 재인코딩 최소화 — 품질 손실/시간 낭비 방지.
 *   - 단, 각 segment 가 동일 codec/resolution/fps 여야 함 → 앞단에서 통일.
 *
 * 왜 자막 burn-in + external 분리인가:
 *   - Meta 리뷰어는 영문 자막 토글 가능한 상태를 선호.
 *   - 그러나 플레이어에 따라 external .srt 인식 못함 → 한국어는 burn-in 해서 항상 보이게.
 */

import { execSync, spawnSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TMP = path.resolve(__dirname, 'tmp')
const OUT = path.resolve(__dirname, 'out')

const TITLE_TEXT = 'Draft x Threads API Demo'
const FINAL_FILENAME = 'draft-threads-demo.mp4'
const KO_SRT = path.join(OUT, 'draft-threads-demo.ko.srt')
const EN_SRT = path.join(OUT, 'draft-threads-demo.en.srt')

/** 공통 ffmpeg 대상 포맷 — concat 이 잘 되는 일정한 값. */
const TARGET = {
  width: 1920,
  height: 1080,
  fps: 30,
  vcodec: 'libx264',
  pix: 'yuv420p',
  preset: 'medium',
  crf: '20',
}

function log(msg) {
  console.log(`[stitch] ${msg}`)
}

function run(cmd) {
  log(`$ ${cmd}`)
  execSync(cmd, { stdio: 'inherit' })
}

function ensureFfmpeg() {
  const r = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' })
  if (r.status !== 0) {
    throw new Error(
      'ffmpeg 가 PATH 에 없습니다. https://ffmpeg.org/download.html 에서 설치 후 다시 실행해 주십시오.',
    )
  }
}

/**
 * Playwright 가 남긴 webm 을 test 이름 순서로 찾음.
 * test 이름이 폴더명에 포함 ("part-1-intro-...") → 정렬로 파트 순서 맞춤.
 */
function findPlaywrightVideos() {
  if (!existsSync(TMP)) {
    throw new Error(`tmp 디렉토리가 없습니다: ${TMP}. 먼저 pnpm demo:record 를 실행해 주십시오.`)
  }
  const entries = readdirSync(TMP, { withFileTypes: true })
  const videos = []
  for (const e of entries) {
    if (!e.isDirectory()) continue
    const dir = path.join(TMP, e.name)
    // Playwright 는 <test-name>/video.webm 형태로 저장
    const candidates = readdirSync(dir).filter((f) => f.endsWith('.webm'))
    for (const c of candidates) {
      videos.push({ name: e.name, file: path.join(dir, c) })
    }
  }
  // 이름에 "part 1" ~ "part 4" 순서 보장 (Playwright 가 공백을 "-" 로 바꿈)
  const order = ['part-1', 'part-2', 'part-3', 'part-4']
  videos.sort((a, b) => {
    const ai = order.findIndex((k) => a.name.toLowerCase().includes(k))
    const bi = order.findIndex((k) => b.name.toLowerCase().includes(k))
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })
  return videos
}

/**
 * 타이틀 카드 생성. 3초, 검은 배경 + 중앙 텍스트.
 * drawtext 폰트 경로 명시 — Windows 에선 시스템 폰트 경로 자동 탐지 실패가 흔함.
 */
function makeTitleCard(outPath) {
  const dur = 3
  // drawtext 필터에서 콜론/특수문자 escape 필요. 타이틀 텍스트는 순수 ASCII 로 유지.
  const filter = [
    `color=c=black:s=${TARGET.width}x${TARGET.height}:d=${dur}:r=${TARGET.fps}`,
    `format=${TARGET.pix}`,
  ].join(',')

  const draw =
    `drawtext=text='${TITLE_TEXT}':` +
    `fontcolor=white:fontsize=64:` +
    `x=(w-text_w)/2:y=(h-text_h)/2`

  run(
    [
      'ffmpeg -y',
      `-f lavfi -i "${filter}"`,
      `-vf "${draw}"`,
      `-c:v ${TARGET.vcodec} -preset ${TARGET.preset} -crf ${TARGET.crf}`,
      `-pix_fmt ${TARGET.pix} -r ${TARGET.fps}`,
      `"${outPath}"`,
    ].join(' '),
  )
}

/**
 * OAuth 수동 클립 placeholder — 실 클립이 없을 때 3초 설명 카드.
 */
function makeOauthPlaceholder(outPath) {
  const dur = 3
  const filter = [
    `color=c=0x111827:s=${TARGET.width}x${TARGET.height}:d=${dur}:r=${TARGET.fps}`,
    `format=${TARGET.pix}`,
  ].join(',')

  const draw =
    `drawtext=text='(Meta OAuth consent screen — recorded separately)':` +
    `fontcolor=white:fontsize=40:` +
    `x=(w-text_w)/2:y=(h-text_h)/2`

  run(
    [
      'ffmpeg -y',
      `-f lavfi -i "${filter}"`,
      `-vf "${draw}"`,
      `-c:v ${TARGET.vcodec} -preset ${TARGET.preset} -crf ${TARGET.crf}`,
      `-pix_fmt ${TARGET.pix} -r ${TARGET.fps}`,
      `"${outPath}"`,
    ].join(' '),
  )
}

/**
 * 입력 파일(webm/mp4) 을 "concat 에 안전한" mp4 로 재인코딩.
 * 해상도/FPS/코덱/픽셀포맷 통일이 목적 — 그냥 stream copy 하면
 * 중간에 프레임 드롭이 생김.
 */
function normalizeToMp4(input, output) {
  run(
    [
      'ffmpeg -y',
      `-i "${input}"`,
      `-vf "scale=${TARGET.width}:${TARGET.height}:force_original_aspect_ratio=decrease,` +
        `pad=${TARGET.width}:${TARGET.height}:(ow-iw)/2:(oh-ih)/2:color=black,fps=${TARGET.fps}"`,
      `-c:v ${TARGET.vcodec} -preset ${TARGET.preset} -crf ${TARGET.crf}`,
      `-pix_fmt ${TARGET.pix}`,
      '-an', // 데모 영상은 원본에 오디오 없음 — 음성 내레이션은 추후 단계
      `"${output}"`,
    ].join(' '),
  )
}

/**
 * concat demuxer 용 리스트 파일 생성.
 * 경로는 ffmpeg 가 상대 해석하므로 '\\\\' escape + single quote 사용.
 */
function writeConcatList(files, listPath) {
  const lines = files
    .map((f) => `file '${f.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`)
    .join('\n')
  writeFileSync(listPath, lines, 'utf8')
}

/**
 * 자막 burn-in — subtitles 필터.
 * Windows 경로 이슈: forward slash + drive letter escape 필요.
 * 스타일: FontSize=24, 하단 중앙.
 */
function burnSubtitles(input, srt, output) {
  // ffmpeg subtitles filter 는 Windows 경로에서 콜론 escape 가 까다로움.
  // C:/path → C\\:/path 로 바꿔야 함.
  const srtForFilter = srt.replace(/\\/g, '/').replace(/^([A-Za-z]):/, '$1\\:')
  const style = "force_style='FontSize=24,Alignment=2,MarginV=60,Outline=1,BorderStyle=1'"

  run(
    [
      'ffmpeg -y',
      `-i "${input}"`,
      `-vf "subtitles='${srtForFilter}':${style}"`,
      `-c:v ${TARGET.vcodec} -preset ${TARGET.preset} -crf ${TARGET.crf}`,
      `-pix_fmt ${TARGET.pix}`,
      `-c:a copy`,
      `"${output}"`,
    ].join(' '),
  )
}

function main() {
  ensureFfmpeg()
  mkdirSync(OUT, { recursive: true })

  // 1. 타이틀 카드
  const titleMp4 = path.join(TMP, '_title.mp4')
  makeTitleCard(titleMp4)

  // 2. Playwright webm → normalized mp4
  const videos = findPlaywrightVideos()
  if (videos.length === 0) {
    throw new Error(
      `Playwright 녹화 영상을 찾지 못했습니다. scripts/demo/tmp/*/video.webm 확인 후 pnpm demo:record 를 다시 실행해 주십시오.`,
    )
  }
  log(`found ${videos.length} Playwright video(s)`)

  const partMp4s = []
  for (const v of videos) {
    const outFile = path.join(TMP, `_${v.name}.mp4`)
    normalizeToMp4(v.file, outFile)
    partMp4s.push({ name: v.name, file: outFile })
  }

  // 3. OAuth 수동 클립 — part 2 와 part 3 사이에 삽입
  const oauthManual = path.join(TMP, 'oauth-manual.mp4')
  let oauthFile
  if (existsSync(oauthManual) && statSync(oauthManual).size > 0) {
    log('using hand-recorded OAuth clip')
    const normalized = path.join(TMP, '_oauth.mp4')
    normalizeToMp4(oauthManual, normalized)
    oauthFile = normalized
  } else {
    log('no OAuth clip found — generating placeholder card')
    oauthFile = path.join(TMP, '_oauth.mp4')
    makeOauthPlaceholder(oauthFile)
  }

  // 4. 순서 조립: title → part1 → part2 → oauth → part3 → part4
  const inPartByName = (prefix) =>
    partMp4s.find((p) => p.name.toLowerCase().includes(prefix))?.file
  const ordered = [
    titleMp4,
    inPartByName('part-1'),
    inPartByName('part-2'),
    oauthFile,
    inPartByName('part-3'),
    inPartByName('part-4'),
  ].filter(Boolean)

  if (ordered.length < 5) {
    log(
      'warning: 예상한 모든 파트를 찾지 못했습니다. 녹화 tmp 디렉토리 이름을 확인해 주십시오.',
    )
  }

  const listFile = path.join(TMP, '_concat.txt')
  writeConcatList(ordered, listFile)

  const concatOut = path.join(TMP, '_concat.mp4')
  run(
    [
      'ffmpeg -y',
      '-f concat -safe 0',
      `-i "${listFile}"`,
      // 동일 codec 이므로 stream copy — 재인코딩 비용 절감
      '-c copy',
      `"${concatOut}"`,
    ].join(' '),
  )

  // 5. 한국어 자막 burn-in → 최종 산출물
  if (!existsSync(KO_SRT)) {
    throw new Error(
      `한국어 자막 파일이 없습니다: ${KO_SRT}. 먼저 pnpm demo:subs 를 실행해 주십시오.`,
    )
  }
  const finalPath = path.join(OUT, FINAL_FILENAME)
  burnSubtitles(concatOut, KO_SRT, finalPath)

  // 6. 영문 자막 external 은 이미 subtitles.ts 가 out/ 에 생성함 — 별도 작업 불필요.
  if (!existsSync(EN_SRT)) {
    log(`warning: 영문 자막 파일이 없습니다: ${EN_SRT}. (선택 사항이지만 Meta 리뷰 시 권장)`)
  }

  log('')
  log(`완료: ${finalPath}`)
  log(`외부 영문 자막: ${EN_SRT}`)
  log('')
  log('Meta App Review 업로드 시 .mp4 + .en.srt 를 함께 제출해 주십시오.')
}

try {
  main()
} catch (err) {
  console.error(`[stitch] 실패: ${err instanceof Error ? err.message : String(err)}`)
  process.exit(1)
}

// cleanup 은 의도적으로 안 함 — 디버깅 시 중간 파일 필요.
// 완전 초기화하려면 `rm -rf scripts/demo/tmp/_*.mp4 scripts/demo/tmp/_concat.*`.
void rmSync
