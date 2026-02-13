import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, FileText, BarChart3, Mail, MoreHorizontal, Plus, History, ChevronRight, Loader2 } from 'lucide-react';
import { Card } from './ui/Card';
import { useAuth } from '../src/context/AuthContext';
import { useProfile } from '../src/hooks/useProfile';
import { useSendGeneralAiMessage } from '../src/lib/api/ai-chat';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  type?: 'text' | 'report' | 'code';
  timestamp: string;
}

export const Chat: React.FC = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const sendAiMessage = useSendGeneralAiMessage();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const userName = profile?.nickname || user?.email?.split('@')[0] || 'User';

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      content: `안녕하세요, ${userName}님. Draft AI 코파운더입니다.\n오늘은 어떤 업무를 도와드릴까요? 사업계획서 초안 작성부터 시장 조사 분석까지 함께할 수 있습니다.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Try to call the Edge Function
      const result = await sendAiMessage.mutateAsync({
        message: userMessage,
        context: { type: 'general' }
      });

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: result.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiResponse]);
    } catch {
      // Fallback to mock response if Edge Function fails
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: '요청하신 내용을 바탕으로 분석 중입니다...\n\n스타트업 초기 팀 빌딩 시 고려해야 할 핵심 지표 3가지를 정리해드릴까요?\n\n(참고: AI 서비스에 연결되지 않아 샘플 응답입니다. Edge Functions 배포 후 정상 작동합니다.)',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const PromptCard = ({ icon: Icon, title, desc, onClick }: any) => (
    <button 
      onClick={onClick}
      className="flex flex-col items-start p-4 bg-white border border-gray-200 rounded-lg hover:border-black hover:shadow-md transition-all text-left group w-full"
    >
      <div className="w-8 h-8 bg-gray-50 rounded-md flex items-center justify-center mb-3 group-hover:bg-black group-hover:text-white transition-colors text-gray-600">
        <Icon size={18} />
      </div>
      <span className="font-bold text-sm text-gray-900 mb-1">{title}</span>
      <span className="text-xs text-gray-500 leading-snug break-keep">{desc}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-[#FAFAFA] bg-grid-engineering overflow-hidden">
      
      {/* Left Sidebar: Session History (Desktop only) */}
      <div className="w-80 border-r border-gray-200 bg-white hidden lg:flex flex-col z-10">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <div className="font-bold text-sm flex items-center gap-2">
            <History size={16} className="text-gray-500" />
            Workspace
          </div>
          <button className="p-1.5 hover:bg-gray-100 rounded text-gray-500 transition-colors">
            <Plus size={18} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <div className="px-3 py-2 text-xs font-mono text-gray-400">TODAY</div>
          <button className="w-full text-left px-3 py-2.5 bg-gray-100 rounded text-sm font-medium text-gray-900 border border-gray-200">
            예비창업패키지 사업계획서 
          </button>
          <button className="w-full text-left px-3 py-2.5 hover:bg-gray-50 rounded text-sm text-gray-600 transition-colors truncate">
            헬스케어 시장 TAM/SAM/SOM 분석
          </button>
          
          <div className="px-3 py-2 text-xs font-mono text-gray-400 mt-4">PREVIOUS 7 DAYS</div>
          <button className="w-full text-left px-3 py-2.5 hover:bg-gray-50 rounded text-sm text-gray-600 transition-colors truncate">
            개발자 채용공고 문구 수정
          </button>
          <button className="w-full text-left px-3 py-2.5 hover:bg-gray-50 rounded text-sm text-gray-600 transition-colors truncate">
            투자자 콜드메일 초안
          </button>
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
           <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs text-gray-500 font-mono">Draft AI v2.0 Online</span>
           </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative max-w-[1200px] mx-auto w-full shadow-xl bg-white/50 backdrop-blur-sm">
        
        {/* Chat Header */}
        <div className="px-6 py-4 bg-white/80 border-b border-gray-200 flex justify-between items-center backdrop-blur z-10 sticky top-0">
          <div>
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Sparkles size={16} className="text-draft-blue fill-draft-blue" />
              AI Co-founder
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Powered by Draft Engine</p>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-black">
            <MoreHorizontal size={20} />
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Welcome / Empty State Prompts - Only show if few messages */}
          {messages.length === 1 && (
            <div className="max-w-3xl mx-auto mt-8 mb-12">
               <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">무엇을 도와드릴까요?</h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <PromptCard 
                    icon={FileText} 
                    title="사업계획서 작성" 
                    desc="PSST 양식에 맞춘 초기 창업 패키지 서류 초안을 작성합니다."
                    onClick={() => setInput("예비창업패키지 사업계획서 PSST 양식으로 개요 작성해줘.")}
                  />
                  <PromptCard 
                    icon={BarChart3} 
                    title="시장 조사 분석" 
                    desc="타겟 시장의 규모와 경쟁사 현황을 빠르게 리서치합니다."
                    onClick={() => setInput("국내 시니어 헬스케어 시장 규모와 주요 경쟁사 분석해줘.")}
                  />
                  <PromptCard 
                    icon={Mail} 
                    title="콜드메일 작성" 
                    desc="투자자나 잠재 고객에게 보낼 매력적인 제안 메일을 씁니다."
                    onClick={() => setInput("엔젤 투자자에게 보낼 콜드메일 초안 작성해줘. 우리 서비스는...")}
                  />
               </div>
            </div>
          )}

          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'ai' && (
                <div className="w-8 h-8 rounded-sm bg-black flex items-center justify-center shrink-0 mt-1">
                  <Bot size={16} className="text-white" />
                </div>
              )}
              
              <div className={`max-w-[80%] md:max-w-[70%] space-y-1`}>
                <div className="flex items-center gap-2 mb-1">
                   <span className="text-xs font-bold text-gray-900">
                      {msg.role === 'user' ? 'Me' : 'Draft AI'}
                   </span>
                   <span className="text-[10px] font-mono text-gray-400">{msg.timestamp}</span>
                </div>
                
                <div 
                  className={`
                    p-4 rounded-lg text-sm leading-relaxed whitespace-pre-wrap shadow-sm break-keep
                    ${msg.role === 'user' 
                      ? 'bg-white border border-gray-200 text-gray-900 rounded-tr-none' 
                      : 'bg-white border border-blue-100 text-gray-800 rounded-tl-none ring-1 ring-blue-50'}
                  `}
                >
                  {msg.content}
                </div>
                
                {/* AI Action Chips (Mock) */}
                {msg.role === 'ai' && messages.length > 1 && (
                   <div className="flex gap-2 mt-2">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-500 hover:border-gray-400 hover:text-black transition-colors">
                         <FileText size={12} /> 리포트로 저장
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-500 hover:border-gray-400 hover:text-black transition-colors">
                         <ChevronRight size={12} /> 더 자세히 설명해줘
                      </button>
                   </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-sm bg-gray-200 flex items-center justify-center shrink-0 mt-1">
                  <User size={16} className="text-gray-500" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-gray-200">
          <div className="relative max-w-4xl mx-auto">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Draft AI에게 업무를 요청하세요..."
              className="w-full min-h-[56px] pl-5 pr-14 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black/10 resize-none text-sm transition-all"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`absolute right-3 bottom-3 p-2 rounded-lg transition-colors
                ${input.trim() && !isLoading
                  ? 'bg-black text-white hover:bg-gray-800'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
              `}
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
          <p className="text-center text-[10px] text-gray-400 mt-3 font-mono">
            Draft AI can make mistakes. Consider checking important information.
          </p>
        </div>

      </div>
    </div>
  );
};