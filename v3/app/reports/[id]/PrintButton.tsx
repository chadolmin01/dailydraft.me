'use client'

// 의도: puppeteer / @react-pdf 같은 무거운 dep 없이 브라우저 print 활용.
//       한글 폰트 자동 (브라우저 system), CSS @media print 로 nav 숨김.
//       사용자가 PDF 로 저장하려면 "PDF 로 저장" 옵션 선택.
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="btn-primary text-sm"
    >
      인쇄 / PDF 저장
    </button>
  )
}
