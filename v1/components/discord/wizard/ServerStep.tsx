'use client'

interface ServerStepProps {
  onNext: () => void
}

/**
 * Step 1: 서버 준비 안내
 *
 * Discord 서버가 없는 유저에게 서버 생성 방법을 안내하고,
 * 이미 있는 유저는 바로 다음 단계로 넘어갈 수 있도록 한다.
 */
export function ServerStep({ onNext }: ServerStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-txt-primary mb-1">Discord 서버가 있으신가요?</h3>
        <p className="text-xs text-txt-tertiary">
          Draft 봇은 Discord 서버에 설치됩니다. 서버가 없으면 먼저 만들어주세요.
        </p>
      </div>

      {/* 서버 만들기 안내 */}
      <div className="bg-surface-bg rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-txt-secondary">서버가 없다면</p>
        <ol className="text-xs text-txt-tertiary space-y-2 list-decimal list-inside">
          <li>Discord 앱 좌측 하단의 <span className="font-semibold text-txt-secondary">+</span> 버튼 클릭</li>
          <li><span className="font-semibold text-txt-secondary">"내 서버 만들기"</span> 선택</li>
          <li>동아리 이름으로 서버 생성</li>
        </ol>
        <a
          href="https://discord.com/app"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
        >
          Discord 열기
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </div>

      {/* 다음 단계 */}
      <button
        onClick={onNext}
        className="w-full py-2.5 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-hover transition-colors"
      >
        서버 준비 완료
      </button>
    </div>
  )
}
