import React, { useState } from 'react';
import SelectionScreen from './components/SelectionScreen';
import ChatInterface from './components/ChatInterface';
import ResultView from './components/ResultView';
import { AppState, ValidationLevel } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<AppState>(AppState.SELECTION);
  const [conversationHistory, setConversationHistory] = useState<string>('');
  const [projectIdea, setProjectIdea] = useState<string>('');
  const [reflectedAdvice, setReflectedAdvice] = useState<string[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<ValidationLevel>(ValidationLevel.MVP);

  const handleSelection = (mode: 'general' | 'ai', level?: ValidationLevel) => {
    if (mode === 'ai') {
      if (level) {
          setSelectedLevel(level);
      }
      setView(AppState.CHAT);
    } else {
      alert("일반 등록 모드는 데모에서 지원하지 않습니다. (AI 검증 모드를 체험해보세요)");
    }
  };

  const handleChatComplete = (history: string, idea: string, advice: string[]) => {
    setConversationHistory(history);
    setProjectIdea(idea);
    setReflectedAdvice(advice);
    setView(AppState.RESULT);
  };

  const renderView = () => {
    switch (view) {
      case AppState.SELECTION:
        return <SelectionScreen onSelect={handleSelection} />;
      case AppState.CHAT:
        return (
          <div className="h-full w-full animate-in fade-in duration-500">
             <ChatInterface onComplete={handleChatComplete} level={selectedLevel} />
          </div>
        );
      case AppState.RESULT:
        return (
           <div className="h-full w-full overflow-y-auto animate-in zoom-in-95 duration-500 bg-gray-50/50">
             <ResultView 
               conversationHistory={conversationHistory} 
               originalIdea={projectIdea} 
               reflectedAdvice={reflectedAdvice}
             />
           </div>
        );
      default:
        return <SelectionScreen onSelect={handleSelection} />;
    }
  };

  return (
    <div className="h-screen flex flex-col font-sans text-draft-black selection:bg-blue-100 selection:text-blue-900 bg-white overflow-hidden">
      {/* Top Navigation Bar */}
      <nav className="w-full h-14 border-b border-gray-200 bg-white flex shrink-0 items-center justify-between px-6 z-50">
        <div className="flex items-center cursor-pointer gap-2" onClick={() => setView(AppState.SELECTION)}>
          <div className="bg-draft-black text-white px-2 py-0.5 font-mono font-bold text-base rounded-sm">D</div>
          <span className="text-lg font-bold tracking-tight">Draft.</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2 text-[11px] font-mono text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            <span>SYSTEM OPERATIONAL</span>
          </div>
          <div className="w-8 h-8 bg-gradient-to-tr from-gray-200 to-gray-300 rounded-full border border-gray-100 shadow-sm"></div>
        </div>
      </nav>

      {/* Main Content Area - Full Screen */}
      <main className="flex-1 relative overflow-hidden">
        {renderView()}
      </main>
    </div>
  );
};

export default App;
