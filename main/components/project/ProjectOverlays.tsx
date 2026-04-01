import React from 'react'
import { ArrowRight } from 'lucide-react'
import { WriteUpdateForm } from '@/components/WriteUpdateForm'
import { CoffeeChatRequestForm } from '@/components/CoffeeChatRequestForm'
import { ProjectOverlaysProps } from './types'

export const ProjectOverlays: React.FC<ProjectOverlaysProps> = ({
  opportunity,
  showCoffeeChatForm,
  setShowCoffeeChatForm,
  selectedRole,
  setSelectedRole,
  showWriteUpdate,
  setShowWriteUpdate,
  showCta,
  setShowCta,
  handleSignup,
}) => {
  return (
    <>
      {/* Coffee Chat Form Overlay (Authenticated) */}
      {showCoffeeChatForm && opportunity && (
        <div className="absolute inset-0 bg-black/60 z-20 flex flex-col items-center justify-center p-4 sm:p-8 overflow-y-auto animate-backdrop-in">
          <div className="w-full max-w-sm sm:max-w-md bg-surface-card rounded-xl border border-border p-6 sm:p-8 shadow-lg-xl animate-modal-in">
            <CoffeeChatRequestForm
              opportunityId={opportunity.id}
              onClose={() => { setShowCoffeeChatForm(false); setSelectedRole(undefined) }}
              selectedRole={selectedRole}
            />
          </div>
        </div>
      )}

      {/* Write Update Modal (Owner) */}
      {opportunity && (
        <WriteUpdateForm
          opportunityId={opportunity.id}
          createdAt={opportunity.created_at}
          isOpen={showWriteUpdate}
          onClose={() => setShowWriteUpdate(false)}
        />
      )}

      {/* Signup CTA Overlay (Non-authenticated) */}
      {showCta && (
        <div className="absolute inset-0 bg-black/60 z-20 flex flex-col items-center justify-center p-4 sm:p-8 text-center overflow-y-auto animate-backdrop-in">
          <div className="w-full max-w-sm sm:max-w-md bg-surface-card rounded-xl border border-border p-6 sm:p-8 shadow-lg-xl animate-modal-in">
            <div className="w-14 h-14 bg-black flex items-center justify-center mb-6 mx-auto">
              <span className="text-white font-black text-xl font-mono">D</span>
            </div>
            <h3 className="text-xl font-bold text-txt-primary mb-2">
              이 프로젝트에 관심이 있으신가요?
            </h3>
            <p className="text-txt-tertiary mb-8 leading-relaxed break-keep max-w-sm text-sm mx-auto">
              Draft에 가입하면 관심 표현, 커피챗 신청,
              피드백 주고받기까지 모두 가능해요.
            </p>
            <button
              onClick={handleSignup}
              className="bg-black hover:bg-surface-inverse/90 text-white px-8 py-3.5 font-bold text-sm flex items-center gap-2 transition-colors mx-auto mb-3 border border-surface-inverse hover:opacity-90 active:scale-[0.97]"
            >
              무료로 시작하기
              <ArrowRight size={16} />
            </button>
            <p className="text-[10px] text-txt-disabled mb-6">
              가입 30초 · 무료 · 바로 사용 가능
            </p>
            <button
              onClick={() => setShowCta(false)}
              className="text-sm text-txt-disabled hover:text-txt-secondary transition-colors"
            >
              돌아가기
            </button>
          </div>
        </div>
      )}
    </>
  )
}
