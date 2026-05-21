'use client'

import { useEffect } from 'react'

/**
 * 편집 중 unsaved 변경이 있을 때 창 닫기·라우트 이탈을 막는 경고.
 *
 * - `beforeunload`: 브라우저 창 닫기·뒤로가기 시 네이티브 "이 사이트를 떠나시겠습니까?" 다이얼로그
 * - Next.js 클라이언트 네비게이션 (Link 클릭) 은 이 이벤트로 막히지 않음.
 *   → 그 경우 개별 폼에서 router.push 대신 확인 핸들러 거치게 처리 (v2 과제)
 *
 * 사용:
 *   const [isDirty, setIsDirty] = useState(false)
 *   useUnsavedChangesWarning(isDirty)
 *
 * 폼 값 변경 시 setIsDirty(true), submit 성공 후 setIsDirty(false).
 */
export function useUnsavedChangesWarning(enabled: boolean, message?: string) {
  useEffect(() => {
    if (!enabled) return

    const handler = (e: BeforeUnloadEvent) => {
      // 모던 브라우저는 커스텀 메시지 무시하고 자체 문구 노출. 반환값 존재 여부만 체크.
      e.preventDefault()
      e.returnValue = message ?? '저장하지 않은 변경사항이 있습니다. 이 페이지를 떠나시겠습니까?'
      return e.returnValue
    }

    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [enabled, message])
}
