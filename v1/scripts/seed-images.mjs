/**
 * Seed script: 기존 프로젝트에 무료 샘플 이미지 추가
 *
 * 실행: node scripts/seed-images.mjs
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

// picsum.photos — 무료, 안정적, 다양한 사이즈
// seed 파라미터로 항상 같은 이미지를 반환
const SAMPLE_IMAGES = [
  ['https://picsum.photos/seed/draft-proj-1/800/400', 'https://picsum.photos/seed/draft-proj-1b/800/400'],
  ['https://picsum.photos/seed/draft-proj-2/800/400', 'https://picsum.photos/seed/draft-proj-2b/800/400'],
  ['https://picsum.photos/seed/draft-proj-3/800/400'],
  ['https://picsum.photos/seed/draft-proj-4/800/400', 'https://picsum.photos/seed/draft-proj-4b/800/400'],
  ['https://picsum.photos/seed/draft-proj-5/800/400'],
  ['https://picsum.photos/seed/draft-proj-6/800/400', 'https://picsum.photos/seed/draft-proj-6b/800/400'],
  ['https://picsum.photos/seed/draft-proj-7/800/400'],
  ['https://picsum.photos/seed/draft-proj-8/800/400', 'https://picsum.photos/seed/draft-proj-8b/800/400'],
  ['https://picsum.photos/seed/draft-proj-9/800/400'],
  ['https://picsum.photos/seed/draft-proj-10/800/400'],
]

async function main() {
  // 모든 프로젝트 조회
  const { data: opportunities, error } = await supabase
    .from('opportunities')
    .select('id, title, demo_images')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('프로젝트 조회 실패:', error.message)
    process.exit(1)
  }

  console.log(`총 ${opportunities.length}개 프로젝트 발견\n`)

  let updated = 0
  for (let i = 0; i < opportunities.length; i++) {
    const opp = opportunities[i]

    // 이미 이미지가 있으면 스킵
    if (opp.demo_images && opp.demo_images.length > 0) {
      console.log(`⏭ [${opp.title}] 이미 이미지 있음 — 스킵`)
      continue
    }

    const images = SAMPLE_IMAGES[i % SAMPLE_IMAGES.length]

    const { error: updateError } = await supabase
      .from('opportunities')
      .update({ demo_images: images })
      .eq('id', opp.id)

    if (updateError) {
      console.error(`✗ [${opp.title}] 업데이트 실패:`, updateError.message)
    } else {
      console.log(`✓ [${opp.title}] ${images.length}장 추가`)
      updated++
    }
  }

  console.log(`\n완료: ${updated}개 프로젝트에 이미지 추가`)
}

main()
