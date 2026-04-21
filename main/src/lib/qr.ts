import QRCode from 'qrcode'

/**
 * 서버·클라이언트 공용 QR 생성 유틸.
 *
 * 사용처:
 *   - 공개 프로필 명함 공유: 학생이 자기 Draft URL 을 QR 로 공유
 *   - 클럽 초대 코드: 오프라인 모임에서 한번에 부원 가입 유도
 *   - 이벤트 출석 체크: 추후
 *
 * API 라우트에서 호출 시 SVG(문자열) 반환 — 클라에서 dangerouslySetInnerHTML 로 렌더.
 * 클라이언트에서도 호출 가능 (브라우저 번들 OK, qrcode 는 isomorphic).
 */
export async function renderQrSvg(
  value: string,
  options?: { size?: number; margin?: number },
): Promise<string> {
  return QRCode.toString(value, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    width: options?.size ?? 240,
    margin: options?.margin ?? 2,
    color: {
      dark: '#111418',
      light: '#FFFFFF',
    },
  })
}

/** PNG data URL (img src 바로 사용 가능) */
export async function renderQrDataUrl(
  value: string,
  options?: { size?: number; margin?: number },
): Promise<string> {
  return QRCode.toDataURL(value, {
    errorCorrectionLevel: 'M',
    width: options?.size ?? 240,
    margin: options?.margin ?? 2,
    color: {
      dark: '#111418',
      light: '#FFFFFF',
    },
  })
}
