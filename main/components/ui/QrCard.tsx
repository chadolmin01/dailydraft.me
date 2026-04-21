'use client'

import { useState } from 'react'
import { Copy, Check, Printer, QrCode } from 'lucide-react'

/**
 * QrCard — 공개 프로필 명함, 클럽 초대 등에 재사용하는 QR 카드.
 *
 * 구성:
 *   - 상단: QR 이미지(SVG, /api/qr 서버 생성)
 *   - 하단: URL + 복사 버튼 + 인쇄 버튼
 *
 * 인쇄: 버튼 누르면 이 카드만 A4 에 중앙 배치해서 print dialog.
 * 공유: URL 복사 + 네이티브 Web Share (모바일)
 */
interface QrCardProps {
  url: string
  title: string
  subtitle?: string
  size?: number
}

export function QrCard({ url, title, subtitle, size = 240 }: QrCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 보안 컨텍스트 아니면 fallback
      const ta = document.createElement('textarea')
      ta.value = url
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await (navigator as Navigator & { share: (d: { url: string; title: string }) => Promise<void> })
          .share({ url, title })
      } catch {
        // 취소됨 — 무시
      }
    } else {
      handleCopy()
    }
  }

  const handlePrint = () => {
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`<!doctype html><html><head><title>${escapeHtml(title)}</title>
      <style>
        body { margin: 0; font-family: -apple-system, 'Noto Sans KR', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
        .card { text-align: center; padding: 40px; border: 1px solid #e5e8eb; border-radius: 16px; max-width: 420px; }
        h1 { font-size: 20px; margin: 12px 0 4px; }
        p { color: #8a8a8a; font-size: 13px; margin: 0 0 20px; }
        img { width: 320px; height: 320px; }
        .url { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #4a4a4a; word-break: break-all; margin-top: 20px; padding: 8px; background: #f7f8fa; border-radius: 6px; }
        @media print { .card { border: none; } }
      </style>
    </head><body>
      <div class="card">
        <img src="/api/qr?value=${encodeURIComponent(url)}&size=640" alt="QR" />
        <h1>${escapeHtml(title)}</h1>
        ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}
        <div class="url">${escapeHtml(url)}</div>
      </div>
      <script>window.onload = () => setTimeout(() => window.print(), 200);</script>
    </body></html>`)
    w.document.close()
  }

  return (
    <div className="bg-surface-card border border-border rounded-2xl p-6 space-y-4 max-w-md">
      <div className="flex items-start gap-3">
        <QrCode size={18} className="text-txt-tertiary mt-0.5 shrink-0" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-semibold text-txt-primary">{title}</h3>
          {subtitle && (
            <p className="text-[12px] text-txt-tertiary mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      {/* QR 이미지 — 서버에서 SVG 생성, 캐시 1시간 */}
      <div className="flex justify-center p-4 bg-white rounded-xl border border-border-subtle">
        <img
          src={`/api/qr?value=${encodeURIComponent(url)}&size=${size * 2}`}
          alt={`${title} QR code`}
          width={size}
          height={size}
          className="block"
        />
      </div>

      {/* URL + 액션 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-2.5 bg-surface-sunken rounded-lg">
          <code className="flex-1 text-[11px] font-mono text-txt-secondary truncate">{url}</code>
          <button
            onClick={handleCopy}
            className="shrink-0 p-1.5 rounded-md hover:bg-surface-card transition-colors"
            aria-label={copied ? '복사 완료' : '링크 복사'}
          >
            {copied ? (
              <Check size={14} className="text-indicator-online" aria-hidden="true" />
            ) : (
              <Copy size={14} className="text-txt-tertiary" aria-hidden="true" />
            )}
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleShare}
            className="flex-1 py-2 text-[12px] font-semibold bg-surface-inverse text-txt-inverse rounded-lg hover:opacity-90 transition-opacity"
          >
            공유하기
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-2 text-[12px] font-semibold border border-border rounded-lg hover:border-txt-tertiary transition-colors inline-flex items-center gap-1.5"
            aria-label="인쇄용 명함 열기"
          >
            <Printer size={12} aria-hidden="true" />
            인쇄
          </button>
        </div>
      </div>
    </div>
  )
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
