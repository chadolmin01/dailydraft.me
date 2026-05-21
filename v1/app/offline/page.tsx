'use client'

import { useRouter } from 'next/navigation'
import { WifiOff, RefreshCw } from 'lucide-react'

export default function OfflinePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">

      {/* 배경 블러 원들 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-black/[0.03] rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-black/[0.03] rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-black/[0.02] rounded-full blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center gap-8 max-w-sm w-full">

        {/* 아이콘 */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-black/[0.04] backdrop-blur-sm flex items-center justify-center border border-black/[0.06]">
            <div className="w-16 h-16 rounded-full bg-black/[0.05] flex items-center justify-center border border-black/[0.08]">
              <WifiOff size={24} className="text-black/40" strokeWidth={1.5} />
            </div>
          </div>
          {/* 링 */}
          <div className="absolute inset-0 rounded-full border border-black/[0.06] scale-110 animate-ping" style={{ animationDuration: '3s' }} />
        </div>

        {/* 텍스트 */}
        <div className="text-center space-y-2">
          <p className="text-[10px] font-mono font-bold text-black/30 tracking-widest uppercase">
            OFFLINE
          </p>
          <h1 className="text-2xl font-black text-black/80 tracking-tight">
            인터넷 연결이 끊겼습니다
          </h1>
          <p className="text-sm text-black/40 leading-relaxed break-keep">
            Wi-Fi 또는 모바일 데이터 연결을 확인하신 뒤<br />아래 새로고침 버튼을 눌러 주세요
          </p>
        </div>

        {/* 버튼 */}
        <button
          onClick={() => router.refresh()}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-black text-white text-sm font-bold hover:bg-black/80 active:scale-95 transition-all duration-150"
        >
          <RefreshCw size={14} strokeWidth={2.5} />
          다시 시도
        </button>

        {/* Draft 로고 */}
        <div className="flex items-center gap-2 mt-4 opacity-20">
          <span className="text-xs font-black font-mono tracking-widest">DRAFT</span>
        </div>

      </div>
    </div>
  )
}
