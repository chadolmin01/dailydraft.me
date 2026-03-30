import React from 'react';
import { Send, Lock } from 'lucide-react';

interface ChatInputAreaProps {
  input: string;
  isTyping: boolean;
  isLimitReached: boolean;
  hideInput: boolean;
  tokens: number;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onConsumeToken: () => void;
}

const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  input,
  isTyping,
  isLimitReached,
  hideInput,
  tokens,
  onInputChange,
  onSend,
  onConsumeToken,
}) => {
  if (isLimitReached) {
    return (
      <div className="p-4 md:p-6 bg-surface-card border-t border-border shrink-0 z-10">
        <div className="max-w-4xl mx-auto relative">
          <div className="w-full bg-surface-sunken rounded-xl border border-border p-4 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-surface-sunken flex items-center justify-center text-txt-tertiary">
                    <Lock size={14} />
                </div>
                <div className="text-sm">
                    <span className="font-bold text-txt-primary block">대화 턴 소진</span>
                    <span className="text-xs text-txt-tertiary">심도 있는 검증을 위해 토큰을 사용하세요.</span>
                </div>
             </div>
             <button
                onClick={onConsumeToken}
                className="bg-surface-inverse text-txt-inverse px-4 py-2 text-xs font-bold hover:bg-surface-inverse/90 transition-colors hover:opacity-90 active:scale-[0.97]"
             >
                토큰 1개 사용 (잔여: {tokens})
             </button>
          </div>
        </div>
      </div>
    );
  }

  if (hideInput) {
    return null;
  }

  return (
    <div className="p-4 md:p-6 bg-surface-card border-t border-border shrink-0 z-10">
      <div className="max-w-4xl mx-auto relative">
        <div className="relative">
            <textarea
              className="w-full min-h-[3.5rem] pl-5 pr-14 py-4 bg-surface-sunken rounded-xl border border-border focus:outline-none focus:bg-surface-card rounded-xl focus:border-border focus:ring-1 focus:ring-black/10 resize-none text-sm transition-all"
              placeholder="아이디어나 답변을 입력하세요..."
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
              disabled={isTyping}
              rows={1}
            />
            <button
              onClick={onSend}
              disabled={isTyping || !input.trim()}
              className={`absolute right-3 bottom-3 p-2 transition-colors
                ${input.trim() && !isTyping
                  ? 'bg-surface-inverse text-txt-inverse hover:bg-surface-inverse/90'
                  : 'bg-surface-sunken text-txt-tertiary cursor-not-allowed'}
              `}
            >
              <Send size={16} />
            </button>
        </div>
        <p className="text-center text-[0.625rem] text-txt-tertiary mt-3 font-mono">
          Draft AI can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  );
};

export default ChatInputArea;
