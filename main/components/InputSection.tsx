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
    { role: Role.PM, icon: Briefcase, label: "PM", fullLabel: "기획/전략", color: "text-status-info-text", bg: "bg-status-info-bg" },
    { role: Role.DESIGNER, icon: Paintbrush, label: "Design", fullLabel: "디자인/UX", color: "text-pink-600", bg: "bg-pink-50" },
    { role: Role.DEV, icon: Terminal, label: "Dev", fullLabel: "개발/테크", color: "text-indicator-online", bg: "bg-status-success-bg" }
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
    <div className="flex flex-col w-full bg-surface-card h-full">

      {/* Compact Tabs */}
      <div className="flex border-b border-border-strong px-4 pt-2 gap-2 flex-shrink-0">
        {tabs.map((tab) => {
           const isTabSubmitted = inputs.find(i => i.role === tab.role)?.isSubmitted;
           return (
            <button
                key={tab.role}
                onClick={() => setActiveTab(tab.role)}
                className={`
                relative pb-3 pt-2 px-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wide transition-all
                ${activeTab === tab.role ? 'text-txt-primary' : 'text-txt-disabled hover:text-txt-secondary'}
                `}
            >
                <div className={`
                    w-6 h-6 flex items-center justify-center transition-colors
                    ${activeTab === tab.role ? tab.bg : 'bg-surface-sunken'}
                    ${activeTab === tab.role ? tab.color : 'text-txt-disabled'}
                `}>
                    <tab.icon className="w-3.5 h-3.5" />
                </div>
                <span>{tab.label}</span>

                {/* Submitted Indicator dot */}
                {isTabSubmitted && (
                    <div className="w-1.5 h-1.5 bg-indicator-online ml-1"></div>
                )}

                {/* Active Underline */}
                {activeTab === tab.role && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>
                )}
            </button>
        )})}
      </div>

      {/* Input & History Container - Flexible Height */}
      <div className="flex-1 overflow-y-auto p-4 bg-surface-card relative flex flex-col gap-4">

        {/* 1. Text Input */}
        <div className="relative border border-border-strong bg-surface-sunken focus-within:bg-surface-card focus-within:border-border-strong focus-within:shadow-sharp transition-all duration-200 flex-shrink-0">
            <textarea
                value={activeInput}
                onChange={(e) => onChange(activeTab, e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={getPlaceholder(activeTab)}
                rows={3}
                className="w-full p-4 resize-none outline-none text-sm text-txt-primary leading-relaxed font-sans placeholder-txt-disabled bg-transparent"
                disabled={isAnalyzing}
            />

            {/* Toolbar / Send Button Area */}
            <div className="px-3 pb-3 pt-1 flex justify-between items-center">
                <span className="text-[0.625rem] text-txt-disabled font-mono">
                     {activeInput.length} chars
                </span>

                <button
                    onClick={() => onSend(activeTab)}
                    disabled={isAnalyzing || !activeInput.trim()}
                    className={`
                        flex items-center gap-2 pl-4 pr-5 py-2 font-bold text-xs transition-all
                        ${isSubmitted && hasInitialSynthesis
                            ? 'bg-surface-sunken text-txt-secondary hover:bg-surface-card border border-border-strong'
                            : (isSubmitted
                                ? 'bg-status-success-bg text-status-success-text border border-status-success-text/20'
                                : 'bg-black text-white hover:bg-[#333] border border-black shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]')
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
                    <span className="text-[0.625rem] font-mono font-bold text-txt-disabled uppercase tracking-widest">History</span>
                    <div className="flex-1 h-px bg-border"></div>
                </div>

                <div ref={logContainerRef} className="overflow-y-auto flex-1 space-y-2 pr-1 custom-scrollbar">
                    {roleLogs.map((log) => (
                        <div key={log.id} className="group flex items-start gap-3 p-3 bg-surface-sunken border border-border hover:bg-surface-card hover:border-border-strong hover:shadow-sharp transition-all">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[0.625rem] font-mono text-txt-disabled">
                                        {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <span className="text-[0.625rem] font-bold text-txt-secondary">{log.action}</span>
                                </div>
                                <p className="text-xs text-txt-secondary line-clamp-2 break-all">
                                    &quot;{log.content}&quot;
                                </p>
                            </div>

                            <button
                                onClick={() => onUndo(log.id)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-txt-disabled hover:text-status-danger-text hover:bg-status-danger-bg transition-all"
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
