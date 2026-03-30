import React from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { ChatMessage } from './types';
import { getPersonaIcon, getPersonaColor } from './personaUtils';

interface ChatMessagesProps {
  messages: ChatMessage[];
  isTyping: boolean;
  aiError: { message: string; lastInput: string } | null;
  lastMsg: ChatMessage | null;
  onOpenReflectionModal: (msgId: string, idx: number, role: string, content: string, suggestedActions: string[], existingReflectedText?: string) => void;
  onConsolidatedSend: () => void;
  onRetry: () => void;
  onDismissError: () => void;
  hideInput: boolean;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isTyping,
  aiError,
  lastMsg,
  onOpenReflectionModal,
  onConsolidatedSend,
  onRetry,
  onDismissError,
  hideInput,
}) => {
  return (
    <div className={`w-full max-w-4xl mx-auto space-y-6 pt-4 ${hideInput ? 'pb-20' : 'pb-6'}`}>
      {messages.map((msg) => (
        <div key={msg.id} className={`flex gap-3 ${msg.isUser ? 'justify-end' : 'justify-start'}`}>

          {msg.isUser ? (
            <>
              <div className="max-w-[70%] space-y-1">
                <div className="flex items-center gap-2 mb-1 justify-end">
                  <span className="text-xs font-bold text-txt-primary">Me</span>
                  <span className="text-[0.625rem] font-mono text-txt-tertiary">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className={`p-4 text-sm leading-relaxed shadow-sharp break-keep
                  ${msg.text?.startsWith('[종합 결정 사항]')
                      ? 'bg-surface-inverse text-txt-inverse border border-surface-inverse'
                      : 'bg-surface-card rounded-xl border border-border text-txt-primary'
                  }`}>
                  {msg.text}
                </div>
              </div>
              <div className="w-8 h-8 bg-surface-sunken flex items-center justify-center shrink-0 mt-6">
                <span className="text-txt-tertiary text-xs font-bold">U</span>
              </div>
            </>
          ) : (
            <>
              {msg.responses && msg.responses[0].role === 'System' ? (
                <>
                  <div className="w-8 h-8 bg-black flex items-center justify-center shrink-0 mt-6">
                    <span className="text-white font-bold text-xs">D</span>
                  </div>
                  <div className="max-w-[70%] space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-txt-primary">Draft AI</span>
                      <span className="text-[0.625rem] font-mono text-txt-tertiary">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="p-4 bg-surface-card rounded-xl border border-border text-sm text-txt-secondary leading-relaxed break-keep shadow-sharp">
                      {msg.responses[0].content}
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-black flex items-center justify-center">
                      <span className="text-white font-bold text-xs">D</span>
                    </div>
                    <span className="text-xs font-bold text-txt-primary">Draft AI</span>
                    <span className="text-[0.625rem] font-mono text-txt-tertiary">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-10">
                    {msg.responses?.map((resp, idx) => (
                      <button
                        key={idx}
                        onClick={() => resp.role !== 'System' && onOpenReflectionModal(msg.id, idx, resp.role, resp.content, resp.suggestedActions || [], resp.reflectedText)}
                        className={`relative flex flex-col items-start p-5 border transition-all duration-200 text-left group w-full h-full
                          ${resp.isReflected
                            ? 'bg-surface-sunken border-border ring-1 ring-black'
                            : 'bg-surface-card border-border hover:border-border hover:shadow-sharp'
                          }
                        `}
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        <div className={`w-9 h-9 border flex items-center justify-center mb-4 transition-colors
                          ${resp.isReflected
                            ? 'bg-black border-surface-inverse text-white'
                            : `${getPersonaColor(resp.role)} group-hover:bg-black group-hover:border-border group-hover:text-white`
                          }
                        `}>
                          {getPersonaIcon(resp.role)}
                        </div>

                        <span className="font-bold text-sm text-txt-primary mb-2">{resp.role}</span>

                        <p className="text-xs text-txt-tertiary leading-relaxed break-keep flex-1">
                          {resp.isReflected && resp.reflectedText ? resp.reflectedText : resp.content}
                        </p>

                        {resp.isReflected && (
                          <div className="absolute top-4 right-4 w-5 h-5 bg-black flex items-center justify-center">
                             <Check size={12} className="text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {msg.id === lastMsg?.id && msg.responses?.some(r => r.isReflected) && (
                    <div className="ml-10 mt-4 flex items-center justify-between p-3 bg-surface-sunken rounded-xl border border-border">
                      <div className="flex items-center gap-3">
                        <div className="text-[0.625rem] font-medium text-txt-tertiary">
                          {msg.responses.filter(r => r.isReflected).length}개 조언 선택됨
                        </div>
                      </div>
                      <button
                        onClick={onConsolidatedSend}
                        disabled={isTyping}
                        className="bg-black hover:bg-surface-inverse/90 text-white px-5 py-2 font-bold text-xs transition-all flex items-center gap-2 disabled:opacity-50 hover:opacity-90 active:scale-[0.97]"
                      >
                        다음 단계
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      ))}

      {isTyping && (
        <div className="flex items-center gap-3 ml-10">
           <div className="w-2 h-2 bg-txt-disabled animate-bounce"></div>
           <div className="w-2 h-2 bg-txt-disabled animate-bounce" style={{ animationDelay: '75ms' }}></div>
           <div className="w-2 h-2 bg-txt-disabled animate-bounce" style={{ animationDelay: '150ms' }}></div>
        </div>
      )}

      {aiError && !isTyping && (
        <div className="ml-10 p-4 bg-status-danger-bg border border-status-danger-text/20">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-status-danger-bg flex items-center justify-center shrink-0">
              <span className="text-status-danger-text text-sm">!</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-status-danger-text mb-1">
                AI 응답 중 오류가 발생했습니다
              </p>
              <p className="text-xs text-status-danger-text mb-3">
                {aiError.message}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onRetry}
                  className="px-3 py-1.5 bg-status-danger-text text-white text-xs font-medium hover:bg-status-danger-text/90 transition-colors hover:opacity-90 active:scale-[0.97]"
                >
                  다시 시도
                </button>
                <button
                  type="button"
                  onClick={onDismissError}
                  className="px-3 py-1.5 bg-surface-card text-status-danger-text text-xs font-medium border border-status-danger-text/20 hover:bg-status-danger-bg transition-colors"
                >
                  무시
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="h-4"></div>
    </div>
  );
};

export default ChatMessages;
