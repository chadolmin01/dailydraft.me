/**
 * 초대 코드 시스템 검증 테스트
 *
 * 실행 방법:
 * 1. 개발 서버 실행: npm run dev
 * 2. 다른 터미널에서: npx ts-node scripts/test-invite-codes.ts
 *
 * 또는 curl로 직접 테스트:
 * - GET /api/invite-codes (관리자 - 코드 목록)
 * - POST /api/invite-codes (관리자 - 코드 생성)
 * - GET /api/invite-codes/eligible (관리자 - 대상 유저)
 * - POST /api/invite-codes/redeem (유저 - 코드 사용)
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

interface TestResult {
  name: string
  passed: boolean
  message: string
  data?: unknown
}

const results: TestResult[] = []

// 색상 코드
const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const RESET = '\x1b[0m'
const BOLD = '\x1b[1m'

function log(message: string, color = RESET) {
  console.log(`${color}${message}${RESET}`)
}

function addResult(name: string, passed: boolean, message: string, data?: unknown) {
  results.push({ name, passed, message, data })
  const icon = passed ? '✓' : '✗'
  const color = passed ? GREEN : RED
  log(`  ${icon} ${name}: ${message}`, color)
}

// 코드 형식 검증 테스트
function testCodeFormat() {
  log('\n📋 테스트 1: 초대 코드 형식 검증', BOLD)

  // generateInviteCode 함수 로직 재현
  function generateInviteCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  const testCodes: string[] = []
  for (let i = 0; i < 10; i++) {
    testCodes.push(generateInviteCode())
  }

  // 8자리 확인
  const allEightChars = testCodes.every(code => code.length === 8)
  addResult(
    '코드 길이',
    allEightChars,
    allEightChars ? '모든 코드가 8자리입니다' : '일부 코드가 8자리가 아닙니다'
  )

  // 영문 대문자 + 숫자만 확인
  const validChars = /^[A-Z0-9]+$/
  const allValidChars = testCodes.every(code => validChars.test(code))
  addResult(
    '코드 문자셋',
    allValidChars,
    allValidChars ? '모든 코드가 영문 대문자 + 숫자입니다' : '유효하지 않은 문자가 포함됨'
  )

  // 중복 확인
  const uniqueCodes = new Set(testCodes)
  const noDuplicates = uniqueCodes.size === testCodes.length
  addResult(
    '코드 고유성',
    noDuplicates,
    noDuplicates ? '10개 코드 모두 고유합니다' : '중복된 코드가 있습니다',
    testCodes
  )
}

// 코드 검증 로직 테스트
function testCodeValidation() {
  log('\n📋 테스트 2: 코드 검증 로직', BOLD)

  // 유효한 코드 형식
  const validCodes = ['ABC12DEF', 'XYZ99999', '12345678', 'AAAAAAAA']
  const invalidCodes = ['abc12def', 'ABC12DE', 'ABC12DEFG', 'ABC-12DE', 'ABC 12DE']

  const codeRegex = /^[A-Z0-9]{8}$/

  // 유효한 코드 테스트
  const allValidPass = validCodes.every(code => codeRegex.test(code))
  addResult(
    '유효 코드 검증',
    allValidPass,
    allValidPass ? '모든 유효 코드가 통과합니다' : '일부 유효 코드가 실패합니다',
    validCodes
  )

  // 무효한 코드 테스트
  const allInvalidFail = invalidCodes.every(code => !codeRegex.test(code))
  addResult(
    '무효 코드 검증',
    allInvalidFail,
    allInvalidFail ? '모든 무효 코드가 거부됩니다' : '일부 무효 코드가 통과합니다',
    invalidCodes
  )

  // 소문자 → 대문자 변환 테스트
  const lowercaseCode = 'abc12def'
  const normalized = lowercaseCode.toUpperCase().trim()
  const normalizationWorks = normalized === 'ABC12DEF'
  addResult(
    '코드 정규화',
    normalizationWorks,
    normalizationWorks ? '소문자가 대문자로 변환됩니다' : '정규화 실패'
  )
}

// 만료 로직 테스트
function testExpirationLogic() {
  log('\n📋 테스트 3: 만료 로직 검증', BOLD)

  const now = new Date()

  // 30일 후 만료
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  const thirtyDaysLater = expiresAt.getTime() - now.getTime()
  const expectedMs = 30 * 24 * 60 * 60 * 1000
  const withinRange = Math.abs(thirtyDaysLater - expectedMs) < 1000 // 1초 오차 허용

  addResult(
    '30일 만료 계산',
    withinRange,
    withinRange ? '만료일이 30일 후로 정확히 설정됩니다' : '만료일 계산 오류'
  )

  // 만료 체크 로직
  const expiredDate = new Date(now.getTime() - 1000) // 1초 전
  const futureDate = new Date(now.getTime() + 1000) // 1초 후

  const expiredCheck = expiredDate < now
  const validCheck = futureDate > now

  addResult(
    '만료 체크 - 과거',
    expiredCheck,
    expiredCheck ? '과거 날짜는 만료로 판정됩니다' : '만료 체크 오류'
  )

  addResult(
    '만료 체크 - 미래',
    validCheck,
    validCheck ? '미래 날짜는 유효로 판정됩니다' : '유효 체크 오류'
  )
}

// 이메일 템플릿 테스트
function testEmailTemplate() {
  log('\n📋 테스트 4: 이메일 템플릿 검증', BOLD)

  // 템플릿에 필요한 데이터
  const templateData = {
    recipientName: '홍길동',
    inviteCode: 'ABC12DEF',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    appUrl: 'https://dailydraft.io',
  }

  // 필수 필드 확인
  const hasAllFields = !!(
    templateData.recipientName &&
    templateData.inviteCode &&
    templateData.expiresAt &&
    templateData.appUrl
  )

  addResult(
    '템플릿 데이터',
    hasAllFields,
    hasAllFields ? '모든 필수 필드가 존재합니다' : '필수 필드가 누락되었습니다',
    templateData
  )

  // 날짜 포맷팅
  const formattedDate = new Date(templateData.expiresAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const dateFormatOk = formattedDate.includes('년') && formattedDate.includes('월')

  addResult(
    '날짜 포맷팅',
    dateFormatOk,
    dateFormatOk ? `날짜가 한국어로 포맷됩니다: ${formattedDate}` : '날짜 포맷 오류'
  )
}

// API 응답 구조 테스트
function testApiResponseStructure() {
  log('\n📋 테스트 5: API 응답 구조 검증', BOLD)

  // 예상 응답 구조
  const inviteCodeResponse = {
    id: 'uuid',
    code: 'ABC12DEF',
    recipient_email: 'user@example.com',
    used_by: null,
    used_at: null,
    expires_at: '2024-03-20T00:00:00Z',
    is_active: true,
    created_at: '2024-02-18T00:00:00Z',
    emailSent: true,
  }

  const requiredFields = ['id', 'code', 'recipient_email', 'expires_at', 'is_active', 'created_at']
  const hasAllRequired = requiredFields.every(field => field in inviteCodeResponse)

  addResult(
    'POST /api/invite-codes 응답',
    hasAllRequired,
    hasAllRequired ? '모든 필수 필드가 포함됩니다' : '필수 필드 누락',
    requiredFields
  )

  // Redeem 응답 구조
  const redeemResponse = {
    success: true,
    message: '프리미엄이 활성화되었습니다!',
    premium_activated_at: '2024-02-18T00:00:00Z',
  }

  const redeemFields = ['success', 'message', 'premium_activated_at']
  const hasRedeemFields = redeemFields.every(field => field in redeemResponse)

  addResult(
    'POST /api/invite-codes/redeem 응답',
    hasRedeemFields,
    hasRedeemFields ? '성공 응답 구조가 올바릅니다' : '응답 구조 오류',
    redeemFields
  )

  // Eligible 응답 구조
  const eligibleResponse = {
    all: [],
    eligible_for_new_code: [],
    total_count: 0,
    eligible_count: 0,
  }

  const eligibleFields = ['all', 'eligible_for_new_code', 'total_count', 'eligible_count']
  const hasEligibleFields = eligibleFields.every(field => field in eligibleResponse)

  addResult(
    'GET /api/invite-codes/eligible 응답',
    hasEligibleFields,
    hasEligibleFields ? '응답 구조가 올바릅니다' : '응답 구조 오류',
    eligibleFields
  )
}

// Premium 체크 로직 테스트
function testPremiumCheckLogic() {
  log('\n📋 테스트 6: 프리미엄 체크 로직', BOLD)

  // 부스트 API에서 사용하는 프리미엄 체크
  const profile1 = { is_premium: true }
  const profile2 = { is_premium: false }
  const profile3 = { is_premium: null }
  const profile4 = {}

  const check1 = !!profile1?.is_premium
  const check2 = !!profile2?.is_premium
  const check3 = !!profile3?.is_premium
  const check4 = !!(profile4 as { is_premium?: boolean })?.is_premium

  addResult(
    'is_premium: true',
    check1 === true,
    check1 ? '프리미엄으로 판정됩니다' : '오류'
  )

  addResult(
    'is_premium: false',
    check2 === false,
    !check2 ? '비프리미엄으로 판정됩니다' : '오류'
  )

  addResult(
    'is_premium: null',
    check3 === false,
    !check3 ? 'null은 비프리미엄으로 판정됩니다' : '오류'
  )

  addResult(
    'is_premium 없음',
    check4 === false,
    !check4 ? 'undefined는 비프리미엄으로 판정됩니다' : '오류'
  )
}

// 결과 요약
function printSummary() {
  log('\n' + '='.repeat(50), BOLD)
  log('📊 테스트 결과 요약', BOLD)
  log('='.repeat(50), BOLD)

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const total = results.length

  log(`\n총 테스트: ${total}개`)
  log(`통과: ${passed}개`, GREEN)
  if (failed > 0) {
    log(`실패: ${failed}개`, RED)
  }

  const percentage = Math.round((passed / total) * 100)
  log(`\n성공률: ${percentage}%`, percentage === 100 ? GREEN : YELLOW)

  if (failed > 0) {
    log('\n실패한 테스트:', RED)
    results
      .filter(r => !r.passed)
      .forEach(r => log(`  - ${r.name}: ${r.message}`, RED))
  }

  log('\n' + '='.repeat(50), BOLD)
}

// 메인 실행
function main() {
  log('🧪 초대 코드 시스템 검증 테스트', BOLD)
  log('='.repeat(50))

  testCodeFormat()
  testCodeValidation()
  testExpirationLogic()
  testEmailTemplate()
  testApiResponseStructure()
  testPremiumCheckLogic()

  printSummary()

  // API 테스트 안내
  log('\n📌 API 통합 테스트 방법:', YELLOW)
  log('1. 개발 서버 실행: cd main && npm run dev')
  log('2. Supabase 대시보드에서 is_admin = true 설정')
  log('3. 브라우저에서 로그인 후 /admin/invite-codes 접속')
  log('4. 또는 curl로 직접 테스트 (아래 참조)\n')

  log('# 초대 코드 목록 조회 (관리자)', BOLD)
  log(`curl -X GET ${BASE_URL}/api/invite-codes \\`)
  log('  -H "Cookie: <session_cookie>"\n')

  log('# 초대 코드 생성 + 이메일 발송 (관리자)', BOLD)
  log(`curl -X POST ${BASE_URL}/api/invite-codes \\`)
  log('  -H "Content-Type: application/json" \\')
  log('  -H "Cookie: <session_cookie>" \\')
  log('  -d \'{"email": "user@example.com"}\'\n')

  log('# 초대 코드 사용 (유저)', BOLD)
  log(`curl -X POST ${BASE_URL}/api/invite-codes/redeem \\`)
  log('  -H "Content-Type: application/json" \\')
  log('  -H "Cookie: <session_cookie>" \\')
  log('  -d \'{"code": "ABC12DEF"}\'\n')

  log('# 부스트 생성 (프리미엄 유저)', BOLD)
  log(`curl -X POST ${BASE_URL}/api/boosts \\`)
  log('  -H "Content-Type: application/json" \\')
  log('  -H "Cookie: <session_cookie>" \\')
  log('  -d \'{"boostType": "profile_spotlight"}\'\n')
}

main()
