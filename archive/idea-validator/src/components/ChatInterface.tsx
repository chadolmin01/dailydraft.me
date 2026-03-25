import React, { useState, useRef, useEffect } from 'react';
import { Send, Cpu, Paintbrush, DollarSign, ArrowRight, Lightbulb, Check, MessageSquare, X, Edit3, Sparkles, MessageCircle, TrendingUp, AlertTriangle, ShieldCheck, Layers, Coins, Lock, Zap, Sword, MoreHorizontal } from 'lucide-react';
import { ChatMessage, AnalysisMetrics, ValidationLevel } from '../types';
import { analyzeIdea } from '../services/geminiService';

interface ChatInterfaceProps {
  onComplete: (history: string, idea: string, reflectedAdvice: string[]) => void;
  level: ValidationLevel;
}

interface ReflectionModalState {
  msgId: string;
  respIdx: number;
  role: string;
  originalContent: string;
  suggestedActions: string[];
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onComplete, level }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Metrics State
  const [metrics, setMetrics] = useState<AnalysisMetrics | null>(null);

  // Modal State
  const [reflectionModal, setReflectionModal] = useState<ReflectionModalState | null>(null);
  const [reflectionText, setReflectionText] = useState('');

  // Token System State
  const FREE_TURNS = 5;
  const [turnCount, setTurnCount] = useState(0);
  const [tokens, setTokens] = useState(30); 

  // Initial greeting
  useEffect(() => {
    let greeting = "";
    if (level === ValidationLevel.SKETCH) {
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
        role: 'System' as any,
        name: 'Draft. OS',
        avatar: '',
        content: greeting,
        tone: 'Neutral',
        suggestedActions: []
      }]
    }]);
  }, [level]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Core AI processing logic
  const processAIResponse = async (userInput: string, currentMessages: ChatMessage[]) => {
    setIsTyping(true);
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

      // Update Metrics
      setMetrics(analysisResult.metrics);

      // Update Messages
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        isUser: false,
        responses: analysisResult.responses.map(r => ({ ...r, isReflected: false })),
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, aiMsg]);
      setTurnCount(prev => prev + 1); // Increment turn count
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async () => {
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
    
    const currentInput = input;
    setInput('');
    
    await processAIResponse(currentInput, newMessages);
  };

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

  const handleFinish = () => {
    const fullConv = messages.map(m => {
      if(m.isUser) return `User: ${m.text}`;
      return m.responses?.map(r => `${r.role}: ${r.content}`).join('\n');
    }).join('\n\n');
    const reflectedAdvice = messages.flatMap(m => 
      m.responses?.filter(r => r.isReflected).map(r => `[${r.role}] ${r.reflectedText || r.content}`) || []
    );
    const firstIdea = messages.find(m => m.isUser)?.text || "Startup Project";
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
      case 'Developer': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'Designer': return 'bg-pink-50 text-pink-600 border-pink-100';
      case 'VC': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const ScoreBar = ({ label, score }: { label: string, score: number }) => (
      <div className="mb-4 last:mb-0">
        <div className="flex justify-between items-center mb-1.5 text-gray-500">
          <span className="text-xs font-medium font-mono uppercase tracking-wider">{label}</span>
          <span className="text-xs font-bold text-gray-900">{score}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div className="h-full bg-black rounded-full transition-all duration-1000 ease-out" style={{ width: `${score}%` }}></div>
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
    <div className="flex h-full w-full">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative min-w-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 md:p-4 space-y-4 scrollbar-hide">
          <div className="w-full space-y-4 pb-6">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.isUser ? 'items-end' : 'items-start'}`}>
                
                {msg.isUser ? (
                  // User Bubble
                  <div className={`max-w-[85%] px-5 py-3 rounded-2xl rounded-tr-sm text-[15px] leading-relaxed mt-2 shadow-sm break-keep
                    ${msg.text?.startsWith('[종합 결정 사항]') 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-800 text-white'
                    }`}>
                    {msg.text}
                  </div>
                ) : (
                  // AI Persona Grid
                  <div className="w-full mt-2">
                    {msg.responses && msg.responses[0].role === 'System' ? (
                      <div className="flex gap-4 p-4 bg-white border border-gray-200 rounded-2xl max-w-2xl shadow-sm">
                        <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center shrink-0">
                          <span className="text-white font-bold text-xs">D.</span>
                        </div>
                        <div className="text-sm text-gray-600 leading-relaxed pt-1.5 break-keep">{msg.responses[0].content}</div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {msg.responses?.map((resp, idx) => (
                          <div 
                            key={idx} 
                            className="flex flex-col animate-in slide-in-from-bottom-2 duration-500 h-full"
                            style={{ animationDelay: `${idx * 100}ms` }}
                          >
                            <div className="flex items-center gap-2 mb-1.5 ml-1">
                              <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${getPersonaColor(resp.role)}`}>
                                {resp.role}
                              </span>
                              <span className="text-xs text-gray-400 font-medium">제안</span>
                            </div>
                            
                            <div 
                              onClick={() => resp.role !== 'System' && openReflectionModal(msg.id, idx, resp.role, resp.content, resp.suggestedActions, resp.reflectedText)}
                              className={`relative group flex flex-col justify-between p-5 rounded-xl border cursor-pointer transition-all duration-200 h-full
                                ${resp.isReflected 
                                  ? 'bg-blue-50 border-blue-500 shadow-[0_0_0_1px_#3b82f6]' 
                                  : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
                                }
                              `}
                            >
                              <p className="text-gray-800 text-[14px] leading-relaxed break-keep">
                                {resp.isReflected && resp.reflectedText ? resp.reflectedText : resp.content}
                              </p>

                              {resp.role !== 'System' && (
                                <div className="mt-4 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <span className="text-xs font-medium text-gray-400">검토 및 결정</span>
                                   <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                      <ArrowRight size={12} />
                                   </div>
                                </div>
                              )}

                              {resp.isReflected && (
                                <div className="absolute top-4 right-4 text-blue-600">
                                   <Check size={18} />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div className="flex items-center gap-2 text-gray-400 text-sm ml-1">
                 <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
                 <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-75"></div>
                 <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-150"></div>
              </div>
            )}
            <div className="h-4"></div>
          </div>
        </div>

        {/* Input Area */}
        <div className="p-3 bg-white border-t border-gray-200 shrink-0 z-10">
          <div className="w-full relative">
            
            {isLimitReached ? (
                <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                          <Lock size={14} />
                      </div>
                      <div className="text-sm">
                          <span className="font-bold text-gray-900 block">대화 턴 소진</span>
                          <span className="text-gray-500">심도 있는 검증을 위해 토큰을 사용하세요.</span>
                      </div>
                   </div>
                   <button 
                      onClick={consumeTokenAndContinue}
                      className="bg-black text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors"
                   >
                      토큰 1개 사용 (잔여: {tokens})
                   </button>
                </div>
            ) : hasPendingReflections ? (
              <div className="animate-in slide-in-from-bottom-2 fade-in duration-300 bg-white rounded-2xl border border-gray-200 p-2 shadow-lg flex items-center gap-2">
                <div className="flex-1 px-4 py-2">
                   <div className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-0.5">의사결정 모드</div>
                   <div className="text-sm font-medium text-gray-900">{pendingReflections.length}개의 조언을 실행하기로 결정했습니다.</div>
                </div>
                <button 
                  onClick={handleConsolidatedSend}
                  disabled={isTyping}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2"
                >
                  <Sparkles size={16} />
                  다음 단계
                </button>
              </div>
            ) : (
              <div className="relative group">
                  <input
                    type="text"
                    className="w-full bg-white border border-gray-200 text-gray-900 placeholder-gray-400 text-[15px] rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 block p-4 pr-14 transition-all shadow-sm group-hover:shadow-md outline-none"
                    placeholder="답변을 입력하세요..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    disabled={isTyping}
                  />
                  <button 
                    onClick={handleSend}
                    disabled={isTyping || !input.trim()}
                    className="absolute right-2 top-2 bottom-2 aspect-square bg-gray-900 text-white rounded-lg hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    <ArrowRight size={18} />
                  </button>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Right Sidebar - Analytics Panel */}
      <div className="w-44 sm:w-48 md:w-56 lg:w-64 bg-white border-l border-gray-200 overflow-y-auto shrink-0 p-2 sm:p-3 md:p-4">
         
         {/* Sharp Mode Indicator */}
         <div className="mb-8 border border-gray-200 p-4 bg-white rounded-lg">
           <div className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-3">Current Session</div>
           <div className="flex items-center gap-3">
              <div className={`p-2 border rounded-md ${
                  level === ValidationLevel.SKETCH ? 'bg-yellow-50 border-yellow-100 text-yellow-600' :
                  level === ValidationLevel.DEFENSE ? 'bg-red-50 border-red-100 text-red-600' :
                  'bg-blue-50 border-blue-100 text-blue-600'
              }`}>
                  {level === ValidationLevel.SKETCH ? <Zap size={16}/> : level === ValidationLevel.DEFENSE ? <Sword size={16}/> : <Layers size={16}/>}
              </div>
              <div>
                  <div className="font-bold text-gray-900 text-sm font-mono uppercase">
                    {level === ValidationLevel.SKETCH ? 'Lv.1 Sketch' : level === ValidationLevel.DEFENSE ? 'Lv.3 Defense' : 'Lv.2 MVP Build'}
                  </div>
              </div>
           </div>
         </div>

         {/* Live Status */}
         <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                 <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">실시간 분석</span>
             </div>
             <button className="text-gray-400 hover:text-gray-600">
                 <MoreHorizontal size={16} />
             </button>
         </div>

         {/* Simple White Card for Metrics (Replaces Blue/Black Cards) */}
         <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8 relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Sparkles size={14} className="text-black" />
                          <h3 className="text-xs font-bold uppercase tracking-widest text-black">AI Analysis</h3>
                        </div>
                        <h3 className="text-lg font-bold leading-tight text-gray-900">Startup Fit<br/>Report</h3>
                    </div>
                    {metrics && (
                        <div className="text-3xl font-bold tracking-tighter text-gray-900">{metrics.score}</div>
                    )}
                </div>

                {metrics ? (
                    <div className="space-y-4">
                        <ScoreBar label="시장성" score={metrics.vcScore} />
                        <ScoreBar label="기술 실현 가능성" score={metrics.developerScore} />
                        <ScoreBar label="UX 완성도" score={metrics.designerScore} />
                    </div>
                ) : (
                    <div className="h-32 flex flex-col items-center justify-center text-gray-400 text-xs border border-gray-100 rounded-lg bg-gray-50">
                        <div className="animate-pulse mb-2 font-bold text-lg">...</div>
                        데이터 대기 중
                    </div>
                )}
                
                {metrics && (
                   <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                       <button onClick={handleFinish} className="w-full bg-black text-white py-2.5 rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors uppercase tracking-wide">
                           전체 리포트 보기
                       </button>
                   </div>
                )}
            </div>
         </div>

         {/* Key Insights List */}
         {metrics && (
             <div className="space-y-6">
                 <div>
                     <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">핵심 강점</h4>
                     <div className="space-y-2">
                        {metrics.keyStrengths.map((str, i) => (
                            <div key={i} className="flex gap-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <Check size={16} className="text-green-500 shrink-0" />
                                <span className="text-xs leading-relaxed break-keep">{str}</span>
                            </div>
                        ))}
                     </div>
                 </div>

                 <div>
                     <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">치명적 리스크</h4>
                     <div className="space-y-2">
                        {metrics.keyRisks.map((risk, i) => (
                            <div key={i} className="flex gap-3 text-sm text-gray-700 bg-red-50 p-3 rounded-lg border border-red-50">
                                <AlertTriangle size={16} className="text-red-500 shrink-0" />
                                <span className="text-xs leading-relaxed break-keep">{risk}</span>
                            </div>
                        ))}
                     </div>
                 </div>
             </div>
         )}
      </div>

      {/* Reflection Modal */}
      {reflectionModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                 <div className={`p-2 bg-gray-100 rounded-lg text-gray-700`}>
                    {getPersonaIcon(reflectionModal.role)}
                 </div>
                 <div>
                    <h3 className="font-bold text-gray-900 text-lg">조언 반영하기</h3>
                    <p className="text-xs text-gray-500">피드백을 구체적인 실행 계획으로 전환합니다.</p>
                 </div>
              </div>
              <button 
                onClick={closeReflectionModal} 
                className="text-gray-400 hover:text-gray-900 transition-colors p-1 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
               <div className="mb-6">
                  <label className="text-xs font-bold text-gray-400 uppercase mb-2 block tracking-wider">제안 내용</label>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-700 leading-relaxed break-keep">
                    {reflectionModal.originalContent}
                  </div>
               </div>

               {reflectionModal.suggestedActions && reflectionModal.suggestedActions.length > 0 && (
                   <div className="mb-6">
                       <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">
                           <Sparkles size={12} className="text-blue-500" />
                           빠른 선택
                       </label>
                       <div className="grid grid-cols-1 gap-2">
                           {reflectionModal.suggestedActions.map((action, idx) => (
                               <button 
                                   key={idx}
                                   onClick={() => setReflectionText(action)}
                                   className={`text-left p-3 rounded-xl border transition-all text-sm group ${
                                       reflectionText === action 
                                       ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500 text-blue-800' 
                                       : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm text-gray-600'
                                   }`}
                               >
                                   <div className="flex items-start gap-3">
                                       <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                           reflectionText === action ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                                       }`}>
                                           {reflectionText === action && <Check size={10} className="text-white" />}
                                       </div>
                                       <span className="break-keep">{action}</span>
                                   </div>
                               </button>
                           ))}
                       </div>
                   </div>
               )}

              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">
                   나의 결정
                </label>
                <textarea 
                  value={reflectionText}
                  onChange={(e) => setReflectionText(e.target.value)}
                  className="w-full h-32 p-4 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 resize-none transition-shadow"
                  placeholder="이 피드백을 어떻게 해결할지 구체적으로 적어주세요..."
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0 rounded-b-2xl">
              {messages.find(m => m.id === reflectionModal.msgId)?.responses?.[reflectionModal.respIdx].isReflected && (
                <button 
                  onClick={removeReflection}
                  className="mr-auto text-red-500 text-xs font-bold uppercase hover:underline"
                >
                  선택 취소
                </button>
              )}
              
              <button 
                onClick={saveReflectionLocally}
                disabled={!reflectionText.trim()}
                className="px-6 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-black shadow-md transform active:scale-95 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {messages.find(m => m.id === reflectionModal.msgId)?.responses?.[reflectionModal.respIdx].isReflected ? '결정 수정' : '결정 확정'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;