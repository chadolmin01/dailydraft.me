'use client'

export type WizardStep = 'server' | 'bot-install' | 'connecting'

const STEPS: { key: WizardStep; label: string }[] = [
  { key: 'server', label: '서버 준비' },
  { key: 'bot-install', label: '봇 설치' },
  { key: 'connecting', label: '연결' },
]

interface StepIndicatorProps {
  current: WizardStep
}

export function StepIndicator({ current }: StepIndicatorProps) {
  const currentIndex = STEPS.findIndex(s => s.key === current)

  return (
    <div className="flex items-center gap-2">
      {STEPS.map((step, i) => {
        const isDone = i < currentIndex
        const isActive = i === currentIndex

        return (
          <div key={step.key} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className={`w-6 h-px transition-colors ${
                  isDone ? 'bg-brand' : 'bg-border'
                }`}
              />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center transition-all ${
                  isDone
                    ? 'bg-brand text-white'
                    : isActive
                      ? 'bg-brand/10 text-brand ring-1 ring-brand/30'
                      : 'bg-surface-sunken text-txt-disabled'
                }`}
              >
                {isDone ? '✓' : i + 1}
              </div>
              <span
                className={`text-[11px] font-semibold transition-colors ${
                  isActive ? 'text-txt-primary' : isDone ? 'text-brand' : 'text-txt-disabled'
                }`}
              >
                {step.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
