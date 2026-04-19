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
          <div className="w-full max-w-sm sm:max-w-md bg-surface-card dark:bg-[#1C1C1E] rounded-[20px] p-6 sm:p-8 shadow-2xl animate-modal-in">
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
          <div className="w-full max-w-sm sm:max-w-md bg-surface-card dark:bg-[#1C1C1E] rounded-[20px] p-6 sm:p-8 shadow-2xl animate-modal-in">
            <div className="w-14 h-14 bg-[#5E6AD2] rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <span className="text-white font-bold text-xl">D</span>
            </div>
            <h3 className="text-[22px] font-bold text-txt-primary mb-2">
              이 프로젝트에 관심이 있으신가요?
            </h3>
            <p className="text-txt-tertiary mb-8 leading-relaxed break-keep max-w-sm text-[15px] mx-auto">
              Draft에 가입하면 관심 표현, 커피챗 신청,
              피드백 주고받기까지 모두 가능해요.
            </p>
            <button
              onClick={handleSignup}
              className="w-full h-14 bg-[#5E6AD2] hover:bg-[#4B4FB8] text-white rounded-2xl font-semibold text-[16px] flex items-center justify-center gap-2 transition-colors mb-3 active:scale-[0.97]"
            >
              무료로 시작하기
              <ArrowRight size={16} />
            </button>
            <p className="text-[12px] text-txt-disabled mb-6">
              가입 30초 · 무료 · 바로 사용 가능
            </p>
            <button
              onClick={() => setShowCta(false)}
              className="text-[15px] text-txt-disabled hover:text-txt-secondary transition-colors"
            >
              돌아가기
            </button>
          </div>
        </div>
      )}
    </>
  )
}
