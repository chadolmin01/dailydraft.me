import React from 'react';
import { X, Check, Sparkles } from 'lucide-react';
import { ChatMessage } from './types';
import { getPersonaIcon } from './personaUtils';
import { useBackHandler } from '@/src/hooks/useBackHandler';

interface ReflectionModalState {
  msgId: string;
  respIdx: number;
  role: string;
  originalContent: string;
  suggestedActions: string[];
}

interface ReflectionModalProps {
  reflectionModal: ReflectionModalState;
  reflectionText: string;
  messages: ChatMessage[];
  onReflectionTextChange: (text: string) => void;
  onSave: () => void;
  onRemove: () => void;
  onClose: () => void;
}

const ReflectionModal: React.FC<ReflectionModalProps> = ({
  reflectionModal,
  reflectionText,
  messages,
  onReflectionTextChange,
  onSave,
  onRemove,
  onClose,
}) => {
  useBackHandler(true, onClose, 'reflection');
  const isAlreadyReflected = messages.find(m => m.id === reflectionModal.msgId)?.responses?.[reflectionModal.respIdx].isReflected;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-surface-card w-full max-w-xl shadow-lg flex flex-col max-h-[85vh] overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-surface-card shrink-0">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-surface-sunken text-txt-secondary">
                {getPersonaIcon(reflectionModal.role)}
             </div>
             <div>
                <h3 className="font-bold text-txt-primary text-sm">조언 반영하기</h3>
                <p className="text-[10px] text-txt-tertiary font-mono">피드백을 실행 계획으로 전환</p>
             </div>
          </div>
          <button
            onClick={onClose}
            className="text-txt-tertiary hover:text-txt-primary transition-colors p-1.5 hover:bg-surface-sunken"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
           <div className="mb-5">
              <label className="text-[10px] font-medium text-txt-tertiary mb-2 block">Original</label>
              <div className="p-4 bg-surface-sunken rounded-xl border border-border text-sm text-txt-secondary leading-relaxed break-keep">
                {reflectionModal.originalContent}
              </div>
           </div>

           {reflectionModal.suggestedActions && reflectionModal.suggestedActions.length > 0 && (
               <div className="mb-5">
                   <label className="flex items-center gap-2 text-[10px] font-medium text-txt-tertiary mb-2">
                       <Sparkles size={10} />
                       Quick Select
                   </label>
                   <div className="grid grid-cols-1 gap-2">
                       {reflectionModal.suggestedActions.map((action, idx) => (
                           <button
                               key={idx}
                               onClick={() => onReflectionTextChange(action)}
                               className={`text-left p-3 border transition-all text-sm ${
                                   reflectionText === action
                                   ? 'bg-surface-sunken border-border ring-1 ring-black text-txt-primary'
                                   : 'bg-surface-card border-border hover:bg-surface-sunken hover:border-surface-inverse/30 text-txt-secondary'
                               }`}
                           >
                               <div className="flex items-start gap-3">
                                   <div className={`mt-0.5 w-5 h-5 sm:w-4 sm:h-4 border flex items-center justify-center shrink-0 ${
                                       reflectionText === action ? 'border-surface-inverse bg-black' : 'border-border'
                                   }`}>
                                       {reflectionText === action && <Check size={10} className="text-white" />}
                                   </div>
                                   <span className="break-keep text-xs">{action}</span>
                               </div>
                           </button>
                       ))}
                   </div>
               </div>
           )}

          <div>
            <label className="text-[10px] font-medium text-txt-tertiary mb-2 block">
               My Decision
            </label>
            <textarea
              value={reflectionText}
              onChange={(e) => onReflectionTextChange(e.target.value)}
              className="w-full h-28 p-4 bg-surface-card rounded-xl border border-border text-txt-primary text-base sm:text-sm leading-relaxed focus:outline-none focus:border-border focus:ring-1 focus:ring-black/10 resize-none transition-all"
              placeholder="이 피드백을 어떻게 해결할지 구체적으로 적어주세요..."
            />
          </div>
        </div>

        <div className="p-4 border-t border-border bg-surface-sunken flex justify-end gap-3 shrink-0">
          {isAlreadyReflected && (
            <button
              onClick={onRemove}
              className="mr-auto text-status-danger-text text-[10px] font-medium hover:underline"
            >
              Cancel
            </button>
          )}

          <button
            onClick={onSave}
            disabled={!reflectionText.trim()}
            className="px-5 py-2 bg-surface-inverse text-txt-inverse font-bold hover:bg-surface-inverse/90 transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.97]"
          >
            {isAlreadyReflected ? 'Update' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReflectionModal;
