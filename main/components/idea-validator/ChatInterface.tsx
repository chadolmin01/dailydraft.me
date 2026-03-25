'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ChatMessage, AnalysisMetrics, ValidationLevel } from './types';
import { analyzeIdea } from './geminiService';
import { createSessionTracker, trackSessionEnd, type TurnData, type SessionData } from '@/src/lib/analytics/sessionTracker';
import AnalyticsSidebar from './AnalyticsSidebar';
import ReflectionModal from './ReflectionModal';
import ChatMessages from './ChatMessages';
import ChatInputArea from './ChatInputArea';
import { useReflection } from './useReflection';

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
  externalInput?: string;
  onExternalInputChange?: (value: string) => void;
  hideInput?: boolean;
  onRegisterSend?: (sendFn: () => void) => void;
  preloadedContext?: PreloadedStartupContext;
}

function buildGreeting(level: ValidationLevel, preloadedContext?: PreloadedStartupContext): string {
  if (preloadedContext) {
    const { startupName, description, koreaFitReason, suggestedLocalization } = preloadedContext;
    let greeting = `안녕하세요! 해외 서비스 '${startupName}'을 한국에 로컬라이징하는 프로젝트를 시작합니다.\n\n`;
    if (description) greeting += `**원본 서비스**: ${description}\n`;
    if (koreaFitReason) greeting += `**한국 시장 분석**: ${koreaFitReason}\n`;
    if (suggestedLocalization) greeting += `**현지화 포인트**: ${suggestedLocalization}\n`;
    greeting += `\n이 서비스를 한국에서 어떤 타겟에게 제공하고 싶으세요? 구체적인 고객층이나 사용 시나리오를 알려주시면 함께 검증해 드릴게요.`;
    return greeting;
  }
  if (level === ValidationLevel.SKETCH) {
    return "환영합니다! 아이디어 스케치 모드입니다. 부담 갖지 말고 생각나는 대로 말씀해 주세요. 우리가 함께 다듬어 드릴게요!";
  }
  if (level === ValidationLevel.DEFENSE) {
    return "투자자 방어 모드입니다. 준비 되셨습니까? 논리가 빈약하면 살아남기 힘들 겁니다. 아이디어를 제시하세요.";
  }
  return "Draft. 시스템 가동. MVP 빌딩 모드입니다. 가상의 공동 창업자들(개발, 디자인, VC)이 냉철하게 검증을 시작합니다.";
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onComplete, level, externalInput, onExternalInputChange, hideInput = false, onRegisterSend, preloadedContext }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [internalInput, setInternalInput] = useState('');

  const input = externalInput !== undefined ? externalInput : internalInput;
  const setInput = onExternalInputChange || setInternalInput;
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [aiError, setAiError] = useState<{ message: string; lastInput: string } | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  const [metrics, setMetrics] = useState<AnalysisMetrics | null>(null);

  const {
    reflectionModal, reflectionText, setReflectionText,
    openReflectionModal, closeReflectionModal,
    saveReflectionLocally, removeReflection,
  } = useReflection(messages, setMessages);

  const FREE_TURNS = 5;
  const [turnCount, setTurnCount] = useState(0);
  const [tokens, setTokens] = useState(30);

  const [firstUserInput, setFirstUserInput] = useState<string>('');
  const sessionTracker = useMemo(() => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    return createSessionTracker({
      sessionId,
      level: level as 'SKETCH' | 'MVP' | 'DEFENSE',
      ideaText: '',
      fromStartupIdea: !!preloadedContext,
      startupSource: preloadedContext?.startupId ? 'external' : undefined
    });
  }, [level, preloadedContext]);

  useEffect(() => {
    setMessages([{
      id: 'init',
      isUser: false,
      timestamp: Date.now(),
      responses: [{
        role: 'System',
        name: 'Draft. OS',
        avatar: '',
        content: buildGreeting(level, preloadedContext),
        tone: 'Neutral',
        suggestedActions: []
      }]
    }]);
  }, [level, preloadedContext]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (firstUserInput && sessionTracker.getTurns().length > 0) {
        sessionTracker.abandon();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [firstUserInput, sessionTracker]);

  const processAIResponse = async (userInput: string, currentMessages: ChatMessage[]) => {
    setIsTyping(true);
    setAiError(null);
    try {
      const historyStrings = currentMessages.flatMap(m => {
        if (m.isUser) return [`User: ${m.text}`];
        return m.responses?.map(r => {
             if (r.isReflected) {
                 return `[User ACCEPTED & DECIDED]: The user has decided to follow the advice from ${r.role}: "${r.reflectedText || r.content}"`;
             }
             return `${r.role}: ${r.content}`;
        }) || [];
      });

      const analysisResult = await analyzeIdea(userInput, historyStrings, level);

      if (!analysisResult.responses || !Array.isArray(analysisResult.responses)) {
        console.error('Invalid response format:', analysisResult);
        throw new Error('AI 응답 형식이 올바르지 않습니다');
      }

      if (analysisResult.metrics) {
        setMetrics(analysisResult.metrics);
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        isUser: false,
        responses: analysisResult.responses.map(r => ({ ...r, isReflected: false })),
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, aiMsg]);

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
        adviceReflected: 0,
        reflectedCategories: [],
        personaEngagement: analysisResult.responses?.reduce((acc, r) => {
          acc[r.role] = (acc[r.role] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {}
      };
      sessionTracker.addTurn(turnData);

      setTurnCount(prev => prev + 1);
    } catch (e) {
      console.error('[ChatInterface] AI response failed:', e);
      setAiError({
        message: e instanceof Error ? e.message : 'AI 응답 중 오류가 발생했습니다',
        lastInput: userInput,
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleRetry = useCallback(() => {
    if (!aiError?.lastInput) return;
    const lastInput = aiError.lastInput;
    setAiError(null);
    processAIResponse(lastInput, messagesRef.current);
  }, [aiError]);

  const handleSend = useCallback(async () => {
    if (!input.trim()) return;

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

    if (!firstUserInput) {
      setFirstUserInput(input);
    }

    const currentInput = input;
    setInput('');

    await processAIResponse(currentInput, newMessages);
  }, [input, turnCount, tokens, messages, setInput, firstUserInput]);

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

    if (firstUserInput) {
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

  const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
  const isLimitReached = turnCount >= FREE_TURNS;

  return (
    <div className="flex h-full w-full bg-surface-bg">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative min-w-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-hide">
          <ChatMessages
            messages={messages}
            isTyping={isTyping}
            aiError={aiError}
            lastMsg={lastMsg}
            onOpenReflectionModal={openReflectionModal}
            onConsolidatedSend={handleConsolidatedSend}
            onRetry={handleRetry}
            onDismissError={() => setAiError(null)}
            hideInput={hideInput}
          />
        </div>

        <ChatInputArea
          input={input}
          isTyping={isTyping}
          isLimitReached={isLimitReached}
          hideInput={hideInput}
          tokens={tokens}
          onInputChange={setInput}
          onSend={handleSend}
          onConsumeToken={consumeTokenAndContinue}
        />
      </div>

      <AnalyticsSidebar
        level={level}
        metrics={metrics}
        onFinish={handleFinish}
      />

      {reflectionModal && (
        <ReflectionModal
          reflectionModal={reflectionModal}
          reflectionText={reflectionText}
          messages={messages}
          onReflectionTextChange={setReflectionText}
          onSave={saveReflectionLocally}
          onRemove={removeReflection}
          onClose={closeReflectionModal}
        />
      )}
    </div>
  );
};

export default ChatInterface;
