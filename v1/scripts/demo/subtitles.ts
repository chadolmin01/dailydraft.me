/**
 * 데모 영상 자막 생성기.
 *
 * 실행: `pnpm demo:subs` (= `tsx scripts/demo/subtitles.ts`)
 * 산출물:
 *   - scripts/demo/out/draft-threads-demo.ko.srt (한국어, 합쇼체)
 *   - scripts/demo/out/draft-threads-demo.en.srt (영어)
 *
 * Meta 리뷰어는 대부분 비한국어 사용자 → 영문 자막 필수.
 * stitch.mjs 가 한국어 자막을 burn-in 하고, 영어 자막은 external .srt 로 첨부.
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.resolve(__dirname, 'out')

interface Cue {
  /** HH:MM:SS,mmm */
  start: string
  end: string
  ko: string
  en: string
}

/**
 * 큐 타임라인 설계:
 *   part 1 intro   : 00:00 – 00:30 (6 큐)
 *   part 2 connect : 00:30 – 00:50 (4 큐)
 *   part 3 publish : 00:50 – 01:50 (9 큐)
 *   part 4 verify  : 01:50 – 02:10 (4 큐)
 *   총 23 큐 / 2분 10초
 *
 * OAuth 수동 클립(약 10초)은 part 2 와 3 사이에 끼우며,
 * stitch.mjs 가 자막 타임라인을 10초씩 밀어준다. 여기서는 녹화 타임라인 기준.
 */
const cues: Cue[] = [
  // part 1 - intro
  {
    start: '00:00:00,000',
    end: '00:00:05,000',
    ko: '안녕하세요, Draft 데모 영상입니다.',
    en: 'Hello, this is the Draft demo.',
  },
  {
    start: '00:00:05,000',
    end: '00:00:11,000',
    ko: 'Draft는 대학생 동아리의 운영 OS입니다.',
    en: 'Draft is an operations OS for university student clubs.',
  },
  {
    start: '00:00:11,000',
    end: '00:00:17,000',
    ko: '회의 기록, 주간 업데이트, 외부 홍보까지 한 곳에서 관리합니다.',
    en: 'Meeting notes, weekly updates, and external comms live in one place.',
  },
  {
    start: '00:00:17,000',
    end: '00:00:22,500',
    ko: '지금부터 Meta Threads 연동 기능을 보여드리겠습니다.',
    en: 'Now I will walk you through the Meta Threads integration.',
  },
  {
    start: '00:00:22,500',
    end: '00:00:27,000',
    ko: '먼저 테스트 계정으로 로그인합니다.',
    en: 'First, I sign in with a test account.',
  },
  {
    start: '00:00:27,000',
    end: '00:00:30,000',
    ko: '대시보드에 진입했습니다.',
    en: 'I am now on the dashboard.',
  },

  // part 2 - connect
  {
    start: '00:00:30,000',
    end: '00:00:35,000',
    ko: '동아리 페르소나 설정 페이지로 이동합니다.',
    en: 'I navigate to the club persona settings page.',
  },
  {
    start: '00:00:35,000',
    end: '00:00:40,500',
    ko: '자동 발행 채널 섹션으로 스크롤합니다.',
    en: 'I scroll to the auto-publish channel section.',
  },
  {
    start: '00:00:40,500',
    end: '00:00:45,500',
    ko: '"Threads 연결하기" 버튼이 보입니다.',
    en: 'The "Connect Threads" button is visible.',
  },
  {
    start: '00:00:45,500',
    end: '00:00:50,000',
    ko: '이 버튼을 누르면 Meta OAuth 동의 화면으로 이동합니다.',
    en: 'Clicking it opens the Meta OAuth consent screen.',
  },

  // part 3 - publish
  {
    start: '00:00:50,000',
    end: '00:00:56,000',
    ko: 'Meta 승인을 마친 상태에서 콘텐츠를 생성해봅니다.',
    en: 'After completing Meta consent, I create a content draft.',
  },
  {
    start: '00:00:56,000',
    end: '00:01:02,000',
    ko: '이번 주 활동 주제를 입력하면 AI가 초안을 만들어줍니다.',
    en: 'I enter this week’s topic and the AI drafts a post.',
  },
  {
    start: '00:01:02,000',
    end: '00:01:09,000',
    ko: 'AI 초안은 발행 전 반드시 사용자 검토를 거칩니다.',
    en: 'Every AI draft requires user review before publishing.',
  },
  {
    start: '00:01:09,000',
    end: '00:01:16,000',
    ko: '문구를 확인하고 필요하면 직접 수정합니다.',
    en: 'I review the copy and edit it as needed.',
  },
  {
    start: '00:01:16,000',
    end: '00:01:23,000',
    ko: '사용자 승인 없이는 어떠한 글도 Threads에 자동 발행되지 않습니다.',
    en: 'No post is published to Threads without explicit user approval.',
  },
  {
    start: '00:01:23,000',
    end: '00:01:30,000',
    ko: '검토를 마친 뒤 "발행" 버튼을 눌러 승인합니다.',
    en: 'Once reviewed, I press "Publish" to approve.',
  },
  {
    start: '00:01:30,000',
    end: '00:01:37,000',
    ko: '사용자가 연결한 본인 Threads 계정에만 게시됩니다.',
    en: 'The post is published only to the user’s connected Threads account.',
  },
  {
    start: '00:01:37,000',
    end: '00:01:44,000',
    ko: '발행 직후 결과 화면이 떠서 성공 여부를 바로 확인할 수 있습니다.',
    en: 'The result screen appears immediately so the user can verify success.',
  },
  {
    start: '00:01:44,000',
    end: '00:01:50,000',
    ko: '오류가 발생하면 즉시 안내 메시지와 재시도 옵션이 제공됩니다.',
    en: 'On error, an in-app message and a retry option are provided.',
  },

  // part 4 - verify
  {
    start: '00:01:50,000',
    end: '00:01:56,000',
    ko: '최근 발행 이력은 페르소나 페이지에서 확인하실 수 있습니다.',
    en: 'Recent publish history is visible on the persona page.',
  },
  {
    start: '00:01:56,000',
    end: '00:02:02,000',
    ko: '데이터 삭제 안내 페이지로 이동합니다.',
    en: 'I navigate to the data deletion instructions page.',
  },
  {
    start: '00:02:02,000',
    end: '00:02:07,000',
    ko: '로그인 없이 누구나 접근할 수 있는 공개 경로입니다.',
    en: 'This is a public page accessible without authentication.',
  },
  {
    start: '00:02:07,000',
    end: '00:02:10,000',
    ko: 'Draft 데모를 시청해주셔서 감사합니다.',
    en: 'Thank you for watching the Draft demo.',
  },
]

function toSrt(track: 'ko' | 'en'): string {
  return cues
    .map((c, idx) => {
      const text = track === 'ko' ? c.ko : c.en
      return `${idx + 1}\n${c.start} --> ${c.end}\n${text}\n`
    })
    .join('\n')
}

function main(): void {
  mkdirSync(OUT_DIR, { recursive: true })

  const koPath = path.join(OUT_DIR, 'draft-threads-demo.ko.srt')
  const enPath = path.join(OUT_DIR, 'draft-threads-demo.en.srt')

  writeFileSync(koPath, toSrt('ko'), 'utf8')
  writeFileSync(enPath, toSrt('en'), 'utf8')

  console.log(`[subtitles] wrote ${cues.length} cues`)
  console.log(`  - ${koPath}`)
  console.log(`  - ${enPath}`)
}

main()
