import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = readFileSync('.env.local','utf-8')
function getEnv(key) {
  return env.match(new RegExp(`${key}=(.+)`))?.[1]?.trim().replace(/^["']|["']$/g,'')
}

const admin = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL') || getEnv('SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'))

const USER_ID = '38c7770c-f545-4f84-a8af-7e6b34c86285'  // 이성민
const DISCORD_USER_ID = '751453898262315040'

const { error } = await admin
  .from('profiles')
  .update({ discord_user_id: DISCORD_USER_ID })
  .eq('user_id', USER_ID)

if (error) {
  console.error('❌ 업데이트 실패:', error.message)

  // discord_user_id 컬럼이 없을 수 있음
  if (error.message.includes('column')) {
    console.log('\n⚠️  profiles 테이블에 discord_user_id 컬럼이 없습니다.')
    console.log('   마이그레이션 필요: ALTER TABLE profiles ADD COLUMN discord_user_id text;')
  }
} else {
  console.log(`✅ 프로필 업데이트 완료: user=${USER_ID} → discord=${DISCORD_USER_ID}`)

  // 확인
  const { data } = await admin.from('profiles').select('nickname, discord_user_id').eq('user_id', USER_ID).single()
  console.log(`   확인: ${data?.nickname} → ${data?.discord_user_id}`)
}
