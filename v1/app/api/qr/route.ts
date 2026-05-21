import { NextRequest } from 'next/server'
import { renderQrSvg } from '@/src/lib/qr'
import { applyRateLimit, getClientIp } from '@/src/lib/rate-limit'

export const runtime = 'nodejs'

/**
 * GET /api/qr?value=<string>&size=<int>
 *
 * 공용 QR 생성 엔드포인트. 공개 프로필 명함·초대 코드·이벤트 출석 등
 * 다용도로 쓰임. 서버에서 SVG 렌더 → <img src="/api/qr?..."> 로 임베드
 * 또는 <svg dangerouslySetInnerHTML> 로 인라인.
 *
 * 보안: value 길이 제한(<= 512) + IP rate limit. SVG 생성 자체는 abuse
 * 가능성 낮지만 URL 주입·XSS 회피 위해 value 는 그대로 QR 페이로드로만
 * 사용되고 HTML 로 파싱되지 않음.
 *
 * 캐시: 같은 value 면 결과 동일 → 1시간 edge cache.
 */
export async function GET(request: NextRequest) {
  const rlRes = applyRateLimit(null, getClientIp(request))
  if (rlRes) return rlRes

  const { searchParams } = new URL(request.url)
  const value = searchParams.get('value')?.trim() ?? ''
  const size = Math.max(64, Math.min(parseInt(searchParams.get('size') ?? '240'), 1024))

  if (!value) return new Response('missing value', { status: 400 })
  if (value.length > 512) return new Response('value too long', { status: 400 })

  const svg = await renderQrSvg(value, { size })
  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, immutable',
    },
  })
}
