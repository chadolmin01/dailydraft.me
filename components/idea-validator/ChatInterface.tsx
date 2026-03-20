'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Send, Cpu, Paintbrush, DollarSign, ArrowRight, Lightbulb, Check, MessageSquare, X, Edit3, Sparkles, MessageCircle, TrendingUp, AlertTriangle, ShieldCheck, Layers, Coins, Lock, Zap, Sword, MoreHorizontal } from 'lucide-react';
import { ChatMessage, AnalysisMetrics, ValidationLevel } from './types';
import { analyzeIdea } from './geminiService';
import { createSessionTracker, trackSessionEnd, type TurnData, type SessionData } from '@/src/lib/analytics/sessionTracker';

// Preloaded context from external startup idea
interface PreloadedStartupContext {
  startupId: string;
  startupName: string;
  description?: string;
  koreaFitReason?: string;
  suggestedLocalization?: string;
}

interface ChatInterfaceProps {
  onComplete: (history: string, idea: string, reflectedAdvice: string[]) => void;
  level: ValidationLevel;
  // External input control (for using persistent input from parent)
  externalInput?: string;
  onExternalInputChange?: (value: string) => void;
  hideInput?: boolean;
  onRegisterSend?: (sendFn: () => void) => void;
  // Preloaded context from external startup idea
  preloadedContext?: PreloadedStartupContext;
}

interface ReflectionModalState {
  msgId: string;
  respIdx: number;
  role: string;
  originalContent: string;
  suggestedActions: string[];
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onComplete, level, externalInput, onExternalInputChange, hideInput = false, onRegisterSend, preloadedContext }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [internalInput, setInternalInput] = useState('');

  // Use external input if provided, otherwise use internal
  const input = externalInput !== undefined ? externalInput : internalInput;
  const setInput = onExternalInputChange || setInternalInput;
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Error state for retry functionality
  const [aiError, setAiError] = useState<{ message: string; lastInput: string } | null>(null);

  // Metrics State
  const [metrics, setMetrics] = useState<AnalysisMetrics | null>(null);

  // Modal State
  const [reflectionModal, setReflectionModal] = useState<ReflectionModalState | null>(null);
  const [reflectionText, setReflectionText] = useState('');

  // Token System State
  const FREE_TURNS = 5;
  const [turnCount, setTurnCount] = useState(0);
  const [tokens, setTokens] = useState(30);

  // Session Tracking for Analytics
  const [firstUserInput, setFirstUserInput] = useState<string>('');
  const sessionTracker = useMemo(() => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    return createSessionTracker({
      sessionId,
      level: level as 'SKETCH' | 'MVP' | 'DEFENSE',
      ideaText: '', // Will be set on first user input
      fromStartupIdea: !!preloadedContext,
      startupSource: preloadedContext?.startupId ? 'external' : undefined
    });
  }, [level, preloadedContext]);

  // Initial greeting
  useEffect(() => {
    let greeting = "";

    // Check if we have preloaded context from an external startup idea
    if (preloadedContext) {
      const { startupName, description, koreaFitReason, suggestedLocalization } = preloadedContext;
      greeting = `안녕하세요! 해외 서비스 '${startupName}'을 한국에 로컬라이징하는 프로젝트를 시작합니다.\n\n`;

      if (description) {
        greeting += `**원본 서비스**: ${description}\n`;
      }
      if (koreaFitReason) {
        greeting += `**한국 시장 분석**: ${koreaFitReason}\n`;
      }
      if (suggestedLocalization) {
        greeting += `**현지화 포인트**: ${suggestedLocalization}\n`;
      }

      greeting += `\n이 서비스를 한국에서 어떤 타겟에게 제공하고 싶으세요? 구체적인 고객층이나 사용 시나리오를 알려주시면 함께 검증해 드릴게요.`;
    } else if (level === ValidationLevel.SKETCH) {
      greeting = "환영합니다! 아이디어 스케치 모드입니다. 부담 갖지 말고 생각나는 대로 말씀해 주세요. 우리가 함께 다듬어 드릴게요!";
    } else if (level === ValidationLevel.DEFENSE) {
      greeting = "투자자 방어 모드입니다. 준비 되셨습니까? 논리가 빈약하면 살아남기 힘들 겁니다. 아이디어를 제시하세요.";
    } else {
      greeting = "Draft. 시스템 가동. MVP 빌딩 모드입니다. 가상의 공동 창업자들(개발, 디자인, VC)이 냉철하게 검증을 시작합니다.";
    }

    setMessages([{
      id: 'init',
      isUser: false,
      timestamp: Date.now(),
      responses: [{
        role: 'System',
        name: 'Draft. OS',
        avatar: '',
        content: greeting,
        tone: 'Neutral',
        suggestedActions: []
      }]
    }]);
  }, [level, preloadedContext]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Session Analytics: 이탈 시 데이터 전송
  useEffect(() => {
    const handleBeforeUnload = () => {
      // 세션이 시작되었고 완료되지 않은 경우에만 이탈 추적
      if (firstUserInput && sessionTracker.getTurns().length > 0) {
        // sendBeacon은 페이지 언로드 시에도 안정적으로 전송
        // 하지만 Supabase는 직접 지원하지 않으므로 abandon() 호출
        sessionTracker.abandon();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [firstUserInput, sessionTracker]);

  // Core AI processing logic
  const processAIResponse = async (userInput: string, currentMessages: ChatMessage[]) => {
    setIsTyping(true);
    setAiError(null); // Clear previous error
    try {
      // Build history for context with explicit Decision/Reflection markers
      const historyStrings = currentMessages.flatMap(m => {
        if (m.isUser) return [`User: ${m.text}`];
        // For AI responses, if it was reflected, mark it clearly so Gemini knows user committed to it.
        return m.responses?.map(r => {
             if (r.isReflected) {
                 return `[User ACCEPTED & DECIDED]: The user has decided to follow the advice from ${r.role}: "${r.reflectedText || r.content}"`;
             }
             return `${r.role}: ${r.content}`;
        }) || [];
      });

      const analysisResult = await analyzeIdea(userInput, historyStrings, level);

      // Safety check for responses
      if (!analysisResult.responses || !Array.isArray(analysisResult.responses)) {
        console.error('Invalid response format:', analysisResult);
        throw new Error('AI 응답 형식이 올바르지 않습니다');
      }

      // Update Metrics
      if (analysisResult.metrics) {
        setMetrics(analysisResult.metrics);
      }

      // Update Messages
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        isUser: false,
        responses: analysisResult.responses.map(r => ({ ...r, isReflected: false })),
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, aiMsg]);

      // Session Analytics: 턴 데이터 추적
      const newTurnCount = turnCount + 1;
      const turnData: TurnData = {
        turn: newTurnCount,
        scores: analysisResult.metrics ? {
          score: analysisResult.metrics.score,
          vcScore: analysisResult.metrics.vcScore,
          developerScore: analysisResult.metrics.developerScore,
          designerScore: analysisResult.metrics.designerScore
        } : undefined,
        adviceShown: analysisResult.responses?.length || 0,
        adviceReflected: 0, // 나중에 반영 시 업데이트됨
        reflectedCategories: [],
        personaEngagement: analysisResult.responses?.reduce((acc, r) => {
          acc[r.role] = (acc[r.role] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {}
      };
      sessionTracker.addTurn(turnData);

      setTurnCount(prev => prev + 1); // Increment turn count
    } catch (e) {
      console.error('[ChatInterface] AI response failed:', e);
      // Set error state for retry UI
      setAiError({
        message: e instanceof Error ? e.message : 'AI 응답 중 오류가 발생했습니다',
        lastInput: userInput,
      });
    } finally {
      setIsTyping(false);
    }
  };

  // Retry handler for failed AI requests
  const handleRetry = useCallback(() => {
    if (!aiError?.lastInput) return;
    const lastInput = aiError.lastInput;
    setAiError(null);
    processAIResponse(lastInput, messages);
  }, [aiError, messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim()) return;

    // Token Check
    if (turnCount >= FREE_TURNS) {
       if (tokens <= 0) {
         alert("토큰이 부족합니다.");
         return;
       }
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      isUser: true,
      text: input,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    // Session Analytics: 첫 번째 사용자 입력 저장
    if (!firstUserInput) {
      setFirstUserInput(input);
    }

    const currentInput = input;
    setInput('');

    await processAIResponse(currentInput, newMessages);
  }, [input, turnCount, tokens, messages, setInput, firstUserInput]);

  // Register handleSend with parent if using external input
  useEffect(() => {
    if (onRegisterSend) {
      onRegisterSend(handleSend);
    }
  }, [onRegisterSend, handleSend]);

  const consumeTokenAndContinue = () => {
    if (tokens > 0) {
       setTokens(prev => prev - 1);
       setTurnCount(0);
    }
  };

  const openReflectionModal = (msgId: string, idx: number, role: string, content: string, suggestedActions: string[] = [], existingReflectedText?: string) => {
    setReflectionModal({
      msgId,
      respIdx: idx,
      role,
      originalContent: content,
      suggestedActions
    });
    setReflectionText(existingReflectedText || '');
  };

  const closeReflectionModal = () => {
    setReflectionModal(null);
    setReflectionText('');
  };

  const saveReflectionLocally = () => {
    if (!reflectionModal) return;
    const finalText = reflectionText.trim() || reflectionModal.originalContent;
    const updatedMessages = messages.map(msg => {
      if (msg.id !== reflectionModal.msgId || !msg.responses) return msg;
      const newResponses = [...msg.responses];
      newResponses[reflectionModal.respIdx] = {
        ...newResponses[reflectionModal.respIdx],
        isReflected: true,
        reflectedText: finalText
      };
      return { ...msg, responses: newResponses };
    });
    setMessages(updatedMessages);
    closeReflectionModal();
  };

  const removeReflection = () => {
    if (!reflectionModal) return;
    setMessages(prevMessages => prevMessages.map(msg => {
      if (msg.id !== reflectionModal.msgId || !msg.responses) return msg;
      const newResponses = [...msg.responses];
      newResponses[reflectionModal.respIdx] = {
        ...newResponses[reflectionModal.respIdx],
        isReflected: false,
        reflectedText: undefined
      };
      return { ...msg, responses: newResponses };
    }));
    closeReflectionModal();
  };

  const handleConsolidatedSend = async () => {
      const lastAiMsg = messages[messages.length - 1];
      if (!lastAiMsg || !lastAiMsg.responses) return;
      const stagedReflections = lastAiMsg.responses.filter(r => r.isReflected);
      if (stagedReflections.length === 0) return;

      const reflectionSummary = stagedReflections.map(r => `• ${r.role} 결정: ${r.reflectedText}`).join('\n');
      const consolidatedText = `[종합 결정 사항]\n${reflectionSummary}\n\n위 결정들을 바탕으로 아이디어를 발전시키고 다음 단계를 진행해주세요.`;

      const userMsg: ChatMessage = {
          id: Date.now().toString(),
          isUser: true,
          text: consolidatedText,
          timestamp: Date.now(),
      };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      await processAIResponse(consolidatedText, newMessages);
  };

  const handleFinish = async () => {
    const fullConv = messages.map(m => {
      if(m.isUser) return `User: ${m.text}`;
      return m.responses?.map(r => `${r.role}: ${r.content}`).join('\n');
    }).join('\n\n');
    const reflectedAdvice = messages.flatMap(m =>
      m.responses?.filter(r => r.isReflected).map(r => `[${r.role}] ${r.reflectedText || r.content}`) || []
    );
    const firstIdea = messages.find(m => m.isUser)?.text || "Startup Project";

    // Session Analytics: 세션 완료 추적
    if (firstUserInput) {
      // 세션 트래커의 ideaText 업데이트 (첫 입력 기준)
      await trackSessionEnd({
        sessionId: `session_${Date.now()}`,
        level: level as 'SKETCH' | 'MVP' | 'DEFENSE',
        ideaText: firstUserInput,
        turns: sessionTracker.getTurns(),
        fromStartupIdea: !!preloadedContext,
        startupSource: preloadedContext?.startupId ? 'external' : undefined
      }, true);
    }

    onComplete(fullConv, firstIdea, reflectedAdvice);
  };

  const getPersonaIcon = (role: string) => {
    switch (role) {
      case 'Developer': return <Cpu size={16} />;
      case 'Designer': return <Paintbrush size={16} />;
      case 'VC': return <DollarSign size={16} />;
      default: return <Cpu size={16} />;
    }
  };

  const getPersonaColor = (role: string) => {
    switch (role) {
      case 'Developer': return 'bg-draft-blue/10 border-draft-blue/20 text-draft-blue';
      case 'Designer': return 'bg-draft-accent/10 border-draft-accent/20 text-draft-accent';
      case 'VC': return 'bg-status-success-bg border-indicator-online/20 text-indicator-online';
      default: return 'bg-surface-sunken border-border text-txt-secondary';
    }
  };

  const ScoreBar = ({ label, score }: { label: string, score: number }) => (
      <div className="mb-4 last:mb-0">
        <div className="flex justify-between items-center mb-1.5 text-txt-tertiary">
          <span className="text-xs font-medium font-mono uppercase tracking-wider">{label}</span>
          <span className="text-xs font-bold text-txt-primary">{score}%</span>
        </div>
        <div className="w-full bg-surface-sunken h-1.5 overflow-hidden">
          <div className="h-full bg-black transition-all duration-1000 ease-out" style={{ width: `${score}%` }}></div>
        </div>
      </div>
  );

  const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
  const pendingReflections = lastMsg && !lastMsg.isUser && lastMsg.responses
    ? lastMsg.responses.filter(r => r.isReflected)
    : [];
  const hasPendingReflections = pendingReflections.length > 0;
  const isLimitReached = turnCount >= FREE_TURNS;

  return (
    <div className="flex h-full w-full bg-surface-bg">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative min-w-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-hide">
          <div className={`w-full max-w-4xl mx-auto space-y-6 pt-4 ${hideInput ? 'pb-20' : 'pb-6'}`}>
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.isUser ? 'justify-end' : 'justify-start'}`}>

                {msg.isUser ? (
                  // User Message
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
                            ? 'bg-black text-white border border-black'
                            : 'bg-surface-card border border-border text-txt-primary'
                        }`}>
                        {msg.text}
                      </div>
                    </div>
                    <div className="w-8 h-8 bg-surface-sunken flex items-center justify-center shrink-0 mt-6">
                      <span className="text-txt-tertiary text-xs font-bold">U</span>
                    </div>
                  </>
                ) : (
                  // AI Persona Grid
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
                          <div className="p-4 bg-surface-card border border-border text-sm text-txt-secondary leading-relaxed break-keep shadow-sharp">
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
                              onClick={() => resp.role !== 'System' && openReflectionModal(msg.id, idx, resp.role, resp.content, resp.suggestedActions, resp.reflectedText)}
                              className={`relative flex flex-col items-start p-5 border transition-all duration-200 text-left group w-full h-full
                                ${resp.isReflected
                                  ? 'bg-surface-sunken border-border-strong ring-1 ring-black'
                                  : 'bg-surface-card border-border hover:border-border-strong hover:shadow-sharp'
                                }
                              `}
                              style={{ animationDelay: `${idx * 100}ms` }}
                            >
                              {/* Persona Icon */}
                              <div className={`w-9 h-9 border flex items-center justify-center mb-4 transition-colors
                                ${resp.isReflected
                                  ? 'bg-black border-black text-white'
                                  : `${getPersonaColor(resp.role)} group-hover:bg-black group-hover:border-border-strong group-hover:text-white`
                                }
                              `}>
                                {getPersonaIcon(resp.role)}
                              </div>

                              {/* Role Label */}
                              <span className="font-bold text-sm text-txt-primary mb-2">{resp.role}</span>

                              {/* Content */}
                              <p className="text-xs text-txt-tertiary leading-relaxed break-keep flex-1">
                                {resp.isReflected && resp.reflectedText ? resp.reflectedText : resp.content}
                              </p>

                              {/* Selected Badge */}
                              {resp.isReflected && (
                                <div className="absolute top-4 right-4 w-5 h-5 bg-black flex items-center justify-center">
                                   <Check size={12} className="text-white" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>

                        {/* Next Step Button */}
                        {msg.id === lastMsg?.id && msg.responses?.some(r => r.isReflected) && (
                          <div className="ml-10 mt-4 flex items-center justify-between p-3 bg-surface-sunken border border-border">
                            <div className="flex items-center gap-3">
                              <div className="text-[0.625rem] font-bold font-mono text-txt-tertiary uppercase tracking-widest">
                                {msg.responses.filter(r => r.isReflected).length}개 조언 선택됨
                              </div>
                            </div>
                            <button
                              onClick={handleConsolidatedSend}
                              disabled={isTyping}
                              className="bg-black hover:bg-[#333] text-white px-5 py-2 font-bold text-xs transition-all flex items-center gap-2 disabled:opacity-50 shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
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

            {/* AI Error with Retry */}
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
                        onClick={handleRetry}
                        className="px-3 py-1.5 bg-status-danger-text text-white text-xs font-medium hover:bg-status-danger-text/90 transition-colors shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                      >
                        다시 시도
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiError(null)}
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
        </div>

        {/* Token Limit Warning */}
        {isLimitReached && (
          <div className="p-4 md:p-6 bg-surface-card border-t border-border shrink-0 z-10">
            <div className="max-w-4xl mx-auto relative">
              <div className="w-full bg-surface-sunken border border-border p-4 flex items-center justify-between">
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
                    onClick={consumeTokenAndContinue}
                    className="bg-black text-white px-4 py-2 text-xs font-bold hover:bg-[#333] transition-colors shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                 >
                    토큰 1개 사용 (잔여: {tokens})
                 </button>
              </div>
            </div>
          </div>
        )}

        {/* Regular Input Area */}
        {!hideInput && !isLimitReached && (
          <div className="p-4 md:p-6 bg-surface-card border-t border-border shrink-0 z-10">
            <div className="max-w-4xl mx-auto relative">
              <div className="relative">
                  <textarea
                    className="w-full min-h-[3.5rem] pl-5 pr-14 py-4 bg-surface-sunken border border-border focus:outline-none focus:bg-surface-card focus:border-border-strong focus:ring-1 focus:ring-black/10 resize-none text-sm transition-all"
                    placeholder="아이디어나 답변을 입력하세요..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    disabled={isTyping}
                    rows={1}
                  />
                  <button
                    onClick={handleSend}
                    disabled={isTyping || !input.trim()}
                    className={`absolute right-3 bottom-3 p-2 transition-colors
                      ${input.trim() && !isTyping
                        ? 'bg-black text-white hover:bg-[#333]'
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
        )}
      </div>

      {/* Right Sidebar - Analytics Panel */}
      <div className="w-56 lg:w-64 bg-surface-card border-l border-border overflow-y-auto shrink-0 p-4 hidden md:block">

         {/* Mode Indicator */}
         <div className="mb-6 border border-border p-4 bg-surface-card">
           <div className="text-[0.5625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-3">Current Session</div>
           <div className="flex items-center gap-3">
              <div className={`p-2 border ${
                  level === ValidationLevel.SKETCH ? 'bg-status-warning-bg border-status-warning-text/20 text-status-warning-text' :
                  level === ValidationLevel.DEFENSE ? 'bg-status-danger-bg border-status-danger-text/20 text-status-danger-text' :
                  'bg-surface-sunken border-border text-txt-primary'
              }`}>
                  {level === ValidationLevel.SKETCH ? <Zap size={14}/> : level === ValidationLevel.DEFENSE ? <Sword size={14}/> : <Layers size={14}/>}
              </div>
              <div className="font-bold text-txt-primary text-xs font-mono uppercase">
                {level === ValidationLevel.SKETCH ? 'Lv.1 Sketch' : level === ValidationLevel.DEFENSE ? 'Lv.3 Defense' : 'Lv.2 MVP'}
              </div>
           </div>
         </div>

         {/* Live Status */}
         <div className="flex items-center justify-between mb-5">
             <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-indicator-online animate-pulse"></div>
                 <span className="text-[0.5625rem] font-bold font-mono text-txt-tertiary uppercase tracking-widest">Live Analysis</span>
             </div>
         </div>

         {/* Metrics Card */}
         <div className="bg-surface-card p-5 border border-border mb-6">
            <div className="flex justify-between items-start mb-5">
                <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Sparkles size={12} className="text-txt-primary" />
                      <h3 className="text-[0.5625rem] font-bold font-mono uppercase tracking-widest text-txt-tertiary">AI Analysis</h3>
                    </div>
                    <h3 className="text-sm font-bold text-txt-primary">Startup Fit Report</h3>
                </div>
                {metrics && (
                    <div className="text-2xl font-bold font-mono text-txt-primary">{metrics.score}</div>
                )}
            </div>

            {metrics ? (
                <div className="space-y-3">
                    <ScoreBar label="시장성" score={metrics.vcScore} />
                    <ScoreBar label="기술" score={metrics.developerScore} />
                    <ScoreBar label="UX" score={metrics.designerScore} />
                </div>
            ) : (
                <div className="h-24 flex flex-col items-center justify-center text-txt-tertiary text-xs border border-border-subtle bg-surface-sunken">
                    <div className="animate-pulse mb-1 font-bold">...</div>
                    <span className="text-[0.625rem] font-mono">데이터 대기 중</span>
                </div>
            )}

            {metrics && (
               <div className="mt-5 pt-4 border-t border-dashed border-border">
                   <button onClick={handleFinish} className="w-full bg-black text-white py-2.5 text-xs font-bold hover:bg-[#333] transition-colors flex items-center justify-center gap-2 shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]">
                       전체 리포트 보기
                       <ArrowRight size={14} />
                   </button>
               </div>
            )}
         </div>

         {/* Key Insights */}
         {metrics && (
             <div className="space-y-5">
                 <div>
                     <h4 className="text-[0.5625rem] font-bold font-mono text-txt-tertiary uppercase tracking-widest mb-2">Strengths</h4>
                     <div className="space-y-1.5">
                        {metrics.keyStrengths.map((str, i) => (
                            <div key={i} className="flex gap-2 text-xs text-txt-secondary bg-surface-sunken p-2.5 border border-border-subtle">
                                <Check size={12} className="text-status-success-text shrink-0 mt-0.5" />
                                <span className="leading-relaxed break-keep">{str}</span>
                            </div>
                        ))}
                     </div>
                 </div>

                 <div>
                     <h4 className="text-[0.5625rem] font-bold font-mono text-txt-tertiary uppercase tracking-widest mb-2">Risks</h4>
                     <div className="space-y-1.5">
                        {metrics.keyRisks.map((risk, i) => (
                            <div key={i} className="flex gap-2 text-xs text-txt-secondary bg-status-danger-bg p-2.5 border border-status-danger-text/20">
                                <AlertTriangle size={12} className="text-status-danger-text shrink-0 mt-0.5" />
                                <span className="leading-relaxed break-keep">{risk}</span>
                            </div>
                        ))}
                     </div>
                 </div>
             </div>
         )}
      </div>

      {/* Reflection Modal */}
      {reflectionModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-surface-card w-full max-w-xl shadow-brutal flex flex-col max-h-[85vh] overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-surface-card shrink-0">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-surface-sunken text-txt-secondary">
                    {getPersonaIcon(reflectionModal.role)}
                 </div>
                 <div>
                    <h3 className="font-bold text-txt-primary text-sm">조언 반영하기</h3>
                    <p className="text-[0.625rem] text-txt-tertiary font-mono">피드백을 실행 계획으로 전환</p>
                 </div>
              </div>
              <button
                onClick={closeReflectionModal}
                className="text-txt-tertiary hover:text-txt-primary transition-colors p-1.5 hover:bg-surface-sunken"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto">
               <div className="mb-5">
                  <label className="text-[0.5625rem] font-bold font-mono text-txt-tertiary uppercase mb-2 block tracking-widest">Original</label>
                  <div className="p-4 bg-surface-sunken border border-border text-sm text-txt-secondary leading-relaxed break-keep">
                    {reflectionModal.originalContent}
                  </div>
               </div>

               {reflectionModal.suggestedActions && reflectionModal.suggestedActions.length > 0 && (
                   <div className="mb-5">
                       <label className="flex items-center gap-2 text-[0.5625rem] font-bold font-mono text-txt-tertiary uppercase mb-2 tracking-widest">
                           <Sparkles size={10} />
                           Quick Select
                       </label>
                       <div className="grid grid-cols-1 gap-2">
                           {reflectionModal.suggestedActions.map((action, idx) => (
                               <button
                                   key={idx}
                                   onClick={() => setReflectionText(action)}
                                   className={`text-left p-3 border transition-all text-sm ${
                                       reflectionText === action
                                       ? 'bg-surface-sunken border-border-strong ring-1 ring-black text-txt-primary'
                                       : 'bg-surface-card border-border hover:border-border-strong text-txt-secondary'
                                   }`}
                               >
                                   <div className="flex items-start gap-3">
                                       <div className={`mt-0.5 w-4 h-4 border flex items-center justify-center shrink-0 ${
                                           reflectionText === action ? 'border-black bg-black' : 'border-border-strong'
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
                <label className="text-[0.5625rem] font-bold font-mono text-txt-tertiary uppercase mb-2 block tracking-widest">
                   My Decision
                </label>
                <textarea
                  value={reflectionText}
                  onChange={(e) => setReflectionText(e.target.value)}
                  className="w-full h-28 p-4 bg-surface-card border border-border text-txt-primary text-sm leading-relaxed focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-black/10 resize-none transition-all"
                  placeholder="이 피드백을 어떻게 해결할지 구체적으로 적어주세요..."
                />
              </div>
            </div>

            <div className="p-4 border-t border-border bg-surface-sunken flex justify-end gap-3 shrink-0">
              {messages.find(m => m.id === reflectionModal.msgId)?.responses?.[reflectionModal.respIdx].isReflected && (
                <button
                  onClick={removeReflection}
                  className="mr-auto text-status-danger-text text-[0.625rem] font-bold font-mono uppercase hover:underline"
                >
                  Cancel
                </button>
              )}

              <button
                onClick={saveReflectionLocally}
                disabled={!reflectionText.trim()}
                className="px-5 py-2 bg-black text-white font-bold hover:bg-[#333] transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
              >
                {messages.find(m => m.id === reflectionModal.msgId)?.responses?.[reflectionModal.respIdx].isReflected ? 'Update' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
