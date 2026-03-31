import React from 'react';
import { ArrowRight, Sparkles, Check, AlertTriangle, Layers, Zap, Sword } from 'lucide-react';
import { AnalysisMetrics, ValidationLevel } from './types';

interface AnalyticsSidebarProps {
  level: ValidationLevel;
  metrics: AnalysisMetrics | null;
  onFinish: () => void;
}

const ScoreBar = ({ label, score }: { label: string, score: number }) => (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between items-center mb-1.5 text-txt-tertiary">
        <span className="text-xs font-medium">{label}</span>
        <span className="text-xs font-bold text-txt-primary">{score}%</span>
      </div>
      <div className="w-full bg-surface-sunken h-1.5 overflow-hidden">
        <div className="h-full bg-black transition-all duration-1000 ease-out" style={{ width: `${score}%` }}></div>
      </div>
    </div>
);

const AnalyticsSidebar: React.FC<AnalyticsSidebarProps> = ({ level, metrics, onFinish }) => {
  return (
    <div className="w-56 lg:w-64 bg-surface-card border-l border-border overflow-y-auto shrink-0 p-4 hidden md:block">

       {/* Mode Indicator */}
       <div className="mb-6 border border-border p-4 bg-surface-card rounded-xl">
         <div className="text-[0.5625rem] font-medium text-txt-tertiary mb-3">Current Session</div>
         <div className="flex items-center gap-3">
            <div className={`p-2 border ${
                level === ValidationLevel.SKETCH ? 'bg-status-warning-bg border-status-warning-text/20 text-status-warning-text' :
                level === ValidationLevel.DEFENSE ? 'bg-status-danger-bg border-status-danger-text/20 text-status-danger-text' :
                'bg-surface-sunken border-border text-txt-primary'
            }`}>
                {level === ValidationLevel.SKETCH ? <Zap size={14}/> : level === ValidationLevel.DEFENSE ? <Sword size={14}/> : <Layers size={14}/>}
            </div>
            <div className="font-medium text-txt-primary text-xs">
              {level === ValidationLevel.SKETCH ? 'Lv.1 Sketch' : level === ValidationLevel.DEFENSE ? 'Lv.3 Defense' : 'Lv.2 MVP'}
            </div>
         </div>
       </div>

       {/* Live Status */}
       <div className="flex items-center justify-between mb-5">
           <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-indicator-online animate-pulse"></div>
               <span className="text-[0.5625rem] font-medium text-txt-tertiary">Live Analysis</span>
           </div>
       </div>

       {/* Metrics Card */}
       <div className="bg-surface-card p-5 border border-border mb-6">
          <div className="flex justify-between items-start mb-5">
              <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles size={12} className="text-txt-primary" />
                    <h3 className="text-[0.5625rem] font-medium text-txt-tertiary">AI Analysis</h3>
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
             <div className="mt-5 pt-4 border-t border-border">
                 <button onClick={onFinish} className="w-full bg-surface-inverse text-txt-inverse py-2.5 text-xs font-bold hover:bg-surface-inverse/90 transition-colors flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.97]">
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
                   <h4 className="text-[0.5625rem] font-medium text-txt-tertiary mb-2">Strengths</h4>
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
                   <h4 className="text-[0.5625rem] font-medium text-txt-tertiary mb-2">Risks</h4>
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
  );
};

export default AnalyticsSidebar;
