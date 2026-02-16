'use client';

import React, { useState } from 'react';
import SelectionScreen from './SelectionScreen';
import ChatInterface from './ChatInterface';
import ResultView from './ResultView';
import { AppState, ValidationLevel } from './types';
import { validationResultsStore } from '@/src/lib/validationResultsStore';

interface IdeaValidatorProps {
  onClose?: () => void;
  onComplete?: (result: { id: string; projectIdea: string }) => void;
  embedded?: boolean; // When true, hides the top nav (used in Chat.tsx)
  skipToLevelSelect?: boolean; // When true, skip to level selection directly
  onBack?: () => void; // Callback when back is pressed from level selection
  // External input control (for using persistent input from parent)
  externalInput?: string;
  onExternalInputChange?: (value: string) => void;
  hideInput?: boolean;
  onRegisterSend?: (sendFn: () => void) => void;
}

const IdeaValidator: React.FC<IdeaValidatorProps> = ({ onClose, onComplete, embedded = false, skipToLevelSelect = false, onBack, externalInput, onExternalInputChange, hideInput = false, onRegisterSend }) => {
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

  const [savedResultId, setSavedResultId] = useState<string | null>(null);

  const handleChatComplete = (history: string, idea: string, advice: string[]) => {
    setConversationHistory(history);
    setProjectIdea(idea);
    setReflectedAdvice(advice);
    setView(AppState.RESULT);

    // Save validation result for use in project creation
    const savedResult = validationResultsStore.save({
      projectIdea: idea,
      conversationHistory: history,
      reflectedAdvice: advice,
    });
    setSavedResultId(savedResult.id);
    // Note: Don't call onComplete here - wait for user to finish viewing results
  };

  const handleResultComplete = () => {
    // Notify parent when user is done viewing results
    if (onComplete && savedResultId) {
      onComplete({ id: savedResultId, projectIdea });
    }
  };

  const renderView = () => {
    switch (view) {
      case AppState.SELECTION:
        return <SelectionScreen onSelect={handleSelection} skipToLevelSelect={skipToLevelSelect} onBack={onBack} />;
      case AppState.CHAT:
        return (
          <div className="h-full w-full animate-in fade-in duration-500">
            <ChatInterface
              onComplete={handleChatComplete}
              level={selectedLevel}
              externalInput={externalInput}
              onExternalInputChange={onExternalInputChange}
              hideInput={hideInput}
              onRegisterSend={onRegisterSend}
            />
          </div>
        );
      case AppState.RESULT:
        return (
          <div className="h-full w-full overflow-y-auto animate-in zoom-in-95 duration-500 bg-gray-50/50">
            <ResultView
              conversationHistory={conversationHistory}
              originalIdea={projectIdea}
              reflectedAdvice={reflectedAdvice}
              onComplete={handleResultComplete}
            />
          </div>
        );
      default:
        return <SelectionScreen onSelect={handleSelection} />;
    }
  };

  return (
    <div className="h-full flex flex-col font-sans text-draft-black selection:bg-blue-100 selection:text-blue-900 bg-white overflow-hidden">
      {/* Top Navigation Bar - Hidden when embedded */}
      {!embedded && (
        <nav className="w-full h-12 border-b border-gray-200 bg-white flex shrink-0 items-center justify-between px-4 z-50">
          <div className="flex items-center cursor-pointer gap-2" onClick={() => setView(AppState.SELECTION)}>
            <div className="bg-draft-black text-white px-1.5 py-0.5 font-mono font-bold text-sm rounded-sm">D</div>
            <span className="text-base font-bold tracking-tight">Draft.</span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-2 text-[10px] font-mono text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              <span>SYSTEM OPERATIONAL</span>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors text-gray-500"
              >
                ✕
              </button>
            )}
          </div>
        </nav>
      )}

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        {renderView()}
      </main>
    </div>
  );
};

export default IdeaValidator;
