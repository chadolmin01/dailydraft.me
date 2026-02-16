'use client';

import React, { useRef } from 'react';
import { Role, RoleInputData, LogEntry } from '../types';
import { Briefcase, Paintbrush, Terminal, Send, Check, RotateCcw } from 'lucide-react';

interface InputSectionProps {
  inputs: RoleInputData[];
  logs: LogEntry[];
  onChange: (role: Role, value: string) => void;
  onSend: (role: Role) => void;
  onUndo: (logId: number) => void;
  isAnalyzing: boolean;
  hasInitialSynthesis: boolean;
}

const InputSection: React.FC<InputSectionProps> = ({ inputs, logs, onChange, onSend, onUndo, isAnalyzing, hasInitialSynthesis }) => {
  const [activeTab, setActiveTab] = React.useState<Role>(Role.PM);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const activeInputData = inputs.find(i => i.role === activeTab);
  const activeInput = activeInputData?.content || '';
  const isSubmitted = activeInputData?.isSubmitted || false;

  // Filter logs for the active role
  const roleLogs = logs.filter(l => l.role === activeTab);

  const tabs = [
    { role: Role.PM, icon: Briefcase, label: "PM", fullLabel: "기획/전략", color: "text-blue-600", bg: "bg-blue-50" },
    { role: Role.DESIGNER, icon: Paintbrush, label: "Design", fullLabel: "디자인/UX", color: "text-pink-600", bg: "bg-pink-50" },
    { role: Role.DEV, icon: Terminal, label: "Dev", fullLabel: "개발/테크", color: "text-emerald-600", bg: "bg-emerald-50" }
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      onSend(activeTab);
    }
  };

  const getPlaceholder = (role: Role) => {
    switch(role) {
      case Role.PM: return "비즈니스 목표와 핵심 요구사항을 입력하세요...";
      case Role.DESIGNER: return "디자인 컨셉과 UX 방향성을 입력하세요...";
      case Role.DEV: return "기술 스택과 구현 제약사항을 입력하세요...";
      default: return "";
    }
  }

  return (
    <div className="flex flex-col w-full bg-white h-full">

      {/* Compact Tabs */}
      <div className="flex border-b border-gray-100 px-4 pt-2 gap-2 flex-shrink-0">
        {tabs.map((tab) => {
           const isTabSubmitted = inputs.find(i => i.role === tab.role)?.isSubmitted;
           return (
            <button
                key={tab.role}
                onClick={() => setActiveTab(tab.role)}
                className={`
                relative pb-3 pt-2 px-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wide transition-all
                ${activeTab === tab.role ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}
                `}
            >
                <div className={`
                    w-6 h-6 rounded-md flex items-center justify-center transition-colors
                    ${activeTab === tab.role ? tab.bg : 'bg-gray-100'}
                    ${activeTab === tab.role ? tab.color : 'text-gray-400'}
                `}>
                    <tab.icon className="w-3.5 h-3.5" />
                </div>
                <span>{tab.label}</span>

                {/* Submitted Indicator dot */}
                {isTabSubmitted && (
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 ml-1"></div>
                )}

                {/* Active Underline */}
                {activeTab === tab.role && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-t-full"></div>
                )}
            </button>
        )})}
      </div>

      {/* Input & History Container - Flexible Height */}
      <div className="flex-1 overflow-y-auto p-4 bg-white relative flex flex-col gap-4">

        {/* 1. Text Input */}
        <div className="relative border border-gray-200 rounded-xl bg-gray-50 focus-within:bg-white focus-within:border-gray-400 focus-within:shadow-sm transition-all duration-200 flex-shrink-0">
            <textarea
                value={activeInput}
                onChange={(e) => onChange(activeTab, e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={getPlaceholder(activeTab)}
                rows={3}
                className="w-full p-4 resize-none outline-none text-sm text-gray-800 leading-relaxed font-sans placeholder-gray-400 bg-transparent"
                disabled={isAnalyzing}
            />

            {/* Toolbar / Send Button Area */}
            <div className="px-3 pb-3 pt-1 flex justify-between items-center">
                <span className="text-[10px] text-gray-400 font-medium">
                     {activeInput.length} chars
                </span>

                <button
                    onClick={() => onSend(activeTab)}
                    disabled={isAnalyzing || !activeInput.trim()}
                    className={`
                        flex items-center gap-2 pl-4 pr-5 py-2 rounded-lg font-bold text-xs transition-all
                        ${isSubmitted && hasInitialSynthesis
                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' // Update mode
                            : (isSubmitted
                                ? 'bg-green-50 text-green-700 border border-green-200' // Sent but waiting for others
                                : 'bg-black text-white hover:bg-gray-800 hover:shadow-md') // Ready to send
                        }
                        ${(isAnalyzing || !activeInput.trim()) && 'opacity-50 cursor-not-allowed shadow-none'}
                    `}
                >
                    {isAnalyzing ? (
                        <span className="animate-pulse">Sending...</span>
                    ) : (
                        <>
                           {isSubmitted ? (
                                hasInitialSynthesis ? (
                                    <>Update <Send className="w-3 h-3" /></>
                                ) : (
                                    <>Sent <Check className="w-3 h-3" /></>
                                )
                           ) : (
                                <>Send <Send className="w-3 h-3" /></>
                           )}
                        </>
                    )}
                </button>
            </div>
        </div>

        {/* 2. History Log (Scrollable) */}
        {roleLogs.length > 0 && (
            <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center gap-2 mb-2 px-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">History</span>
                    <div className="flex-1 h-px bg-gray-100"></div>
                </div>

                <div ref={logContainerRef} className="overflow-y-auto flex-1 space-y-2 pr-1 custom-scrollbar">
                    {roleLogs.map((log) => (
                        <div key={log.id} className="group flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100 hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-mono text-gray-400">
                                        {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-600">{log.action}</span>
                                </div>
                                <p className="text-xs text-gray-600 line-clamp-2 break-all">
                                    &quot;{log.content}&quot;
                                </p>
                            </div>

                            <button
                                onClick={() => onUndo(log.id)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                                title="Undo / Delete"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default InputSection;
