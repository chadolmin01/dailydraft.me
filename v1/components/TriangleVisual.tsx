'use client';

import React, { useEffect, useState } from 'react';
import { Role, RoleInputData } from '../types';

interface TriangleVisualProps {
  inputs: RoleInputData[];
  analyzing: boolean;
  completed: boolean;
  selectedView: string;
  onSelectView: (view: string) => void;
}

const TriangleVisual: React.FC<TriangleVisualProps> = ({ inputs, analyzing, completed, selectedView, onSelectView }) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // SVG coordinates (scaled down for compact view)
  const top = { x: 150, y: 40 };
  const left = { x: 40, y: 220 };
  const right = { x: 260, y: 220 };
  const center = { x: 150, y: 150 };

  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (analyzing) {
      interval = setInterval(() => {
        setPulse(p => (p + 1) % 2);
      }, 800);
    }
    return () => clearInterval(interval);
  }, [analyzing]);

  // Check submission status
  const pmSubmitted = inputs.find(i => i.role === Role.PM)?.isSubmitted;
  const designSubmitted = inputs.find(i => i.role === Role.DESIGNER)?.isSubmitted;
  const devSubmitted = inputs.find(i => i.role === Role.DEV)?.isSubmitted;

  const getNodeColor = (role: Role, isSubmitted: boolean) => {
    const isSelected = selectedView === role;
    if (isSelected) return "#0ea5e9"; // Selected Blue
    if (isSubmitted) return "white"; // White fill but colored border
    return "#f1f5f9"; // Inactive Gray
  };

  const getNodeStroke = (role: Role, isSubmitted: boolean) => {
    const isSelected = selectedView === role;
    if (isSelected) return "#0ea5e9";
    if (isSubmitted) {
        switch(role) {
            case Role.PM: return "#2563eb"; // Blue
            case Role.DESIGNER: return "#db2777"; // Pink
            case Role.DEV: return "#059669"; // Emerald
        }
    }
    return "#e2e8f0";
  };

  const getLineColor = (isSourceSubmitted: boolean) => {
      if (analyzing) return "#0ea5e9";
      if (completed) return "#cbd5e1";
      if (isSourceSubmitted) return "#94a3b8";
      return "#f1f5f9";
  }

  // Helper for tooltip text
  const getTooltipText = () => {
      switch(hoveredNode) {
          case Role.PM: return "기획/전략 의견 보기";
          case Role.DESIGNER: return "디자인/UX 의견 보기";
          case Role.DEV: return "개발/테크 의견 보기";
          case 'VISION': return "통합된 제품 비전 보기";
          default: return "";
      }
  };

  return (
    <div className="w-full flex justify-center select-none h-full items-center relative">
      <svg width="300" height="260" viewBox="0 0 300 260" className="drop-shadow-sm max-w-full max-h-full overflow-visible">
        {/* Connections to center */}
        <line
          x1={top.x} y1={top.y} x2={center.x} y2={center.y}
          stroke={getLineColor(!!pmSubmitted)}
          strokeWidth={analyzing ? 4 : 2}
          strokeDasharray={analyzing ? "10,5" : (pmSubmitted && !completed ? "4,4" : "0")}
          className={analyzing ? "animate-pulse" : "transition-colors duration-1000"}
        />
        <line
          x1={left.x} y1={left.y} x2={center.x} y2={center.y}
          stroke={getLineColor(!!designSubmitted)}
          strokeWidth={analyzing ? 4 : 2}
          strokeDasharray={analyzing ? "10,5" : (designSubmitted && !completed ? "4,4" : "0")}
          className={analyzing ? "animate-pulse" : "transition-colors duration-1000"}
        />
        <line
          x1={right.x} y1={right.y} x2={center.x} y2={center.y}
          stroke={getLineColor(!!devSubmitted)}
          strokeWidth={analyzing ? 4 : 2}
          strokeDasharray={analyzing ? "10,5" : (devSubmitted && !completed ? "4,4" : "0")}
          className={analyzing ? "animate-pulse" : "transition-colors duration-1000"}
        />

        {/* PM Node (Top) */}
        <g
            className="cursor-pointer transition-transform duration-200 origin-center hover:scale-110"
            onClick={() => onSelectView(Role.PM)}
            onMouseEnter={() => setHoveredNode(Role.PM)}
            onMouseLeave={() => setHoveredNode(null)}
        >
            <circle
            cx={top.x} cy={top.y} r={20}
            fill={getNodeColor(Role.PM, !!pmSubmitted)}
            stroke={getNodeStroke(Role.PM, !!pmSubmitted)}
            strokeWidth={selectedView === Role.PM ? "3" : "2"}
            className="transition-colors duration-300"
            />
            <text x={top.x} y={top.y - 26} textAnchor="middle" className={`text-[10px] font-bold uppercase tracking-wider ${selectedView === Role.PM ? 'fill-blue-600' : (pmSubmitted ? 'fill-blue-600' : 'fill-gray-400')}`}>기획</text>
            <text x={top.x} y={top.y} dy=".3em" textAnchor="middle" className="text-[10px] font-mono fill-gray-500 pointer-events-none">PM</text>

            {pmSubmitted && !completed && (
                 <circle cx={top.x + 14} cy={top.y - 14} r={6} fill="#22c55e" stroke="white" strokeWidth="2" />
            )}
        </g>

        {/* Designer Node (Left) */}
        <g
            className="cursor-pointer transition-transform duration-200 origin-center hover:scale-110"
            onClick={() => onSelectView(Role.DESIGNER)}
            onMouseEnter={() => setHoveredNode(Role.DESIGNER)}
            onMouseLeave={() => setHoveredNode(null)}
        >
            <circle
            cx={left.x} cy={left.y} r={20}
            fill={getNodeColor(Role.DESIGNER, !!designSubmitted)}
            stroke={getNodeStroke(Role.DESIGNER, !!designSubmitted)}
            strokeWidth={selectedView === Role.DESIGNER ? "3" : "2"}
            className="transition-colors duration-300"
            />
            <text x={left.x} y={left.y + 32} textAnchor="middle" className={`text-[10px] font-bold uppercase tracking-wider ${selectedView === Role.DESIGNER ? 'fill-pink-600' : (designSubmitted ? 'fill-pink-600' : 'fill-gray-400')}`}>디자인</text>
            <text x={left.x} y={left.y} dy=".3em" textAnchor="middle" className="text-[10px] font-mono fill-gray-500 pointer-events-none">DS</text>

            {designSubmitted && !completed && (
                 <circle cx={left.x + 14} cy={left.y - 14} r={6} fill="#22c55e" stroke="white" strokeWidth="2" />
            )}
        </g>

        {/* Developer Node (Right) */}
        <g
            className="cursor-pointer transition-transform duration-200 origin-center hover:scale-110"
            onClick={() => onSelectView(Role.DEV)}
            onMouseEnter={() => setHoveredNode(Role.DEV)}
            onMouseLeave={() => setHoveredNode(null)}
        >
            <circle
            cx={right.x} cy={right.y} r={20}
            fill={getNodeColor(Role.DEV, !!devSubmitted)}
            stroke={getNodeStroke(Role.DEV, !!devSubmitted)}
            strokeWidth={selectedView === Role.DEV ? "3" : "2"}
            className="transition-colors duration-300"
            />
            <text x={right.x} y={right.y + 32} textAnchor="middle" className={`text-[10px] font-bold uppercase tracking-wider ${selectedView === Role.DEV ? 'fill-emerald-600' : (devSubmitted ? 'fill-emerald-600' : 'fill-gray-400')}`}>개발</text>
            <text x={right.x} y={right.y} dy=".3em" textAnchor="middle" className="text-[10px] font-mono fill-gray-500 pointer-events-none">DV</text>

            {devSubmitted && !completed && (
                 <circle cx={right.x + 14} cy={right.y - 14} r={6} fill="#22c55e" stroke="white" strokeWidth="2" />
            )}
        </g>

        {/* Center Synthesis Node (Vision) */}
        <g
            className={`${completed ? 'cursor-pointer hover:scale-105' : ''} transition-all duration-300 origin-center`}
            onClick={() => completed && onSelectView('VISION')}
            onMouseEnter={() => completed && setHoveredNode('VISION')}
            onMouseLeave={() => setHoveredNode(null)}
        >
            <circle
            cx={center.x} cy={center.y}
            r={analyzing ? 24 + (pulse * 4) : (completed ? 35 : 16)}
            fill={completed ? (selectedView === 'VISION' ? "#0f172a" : "#1e293b") : "#f8fafc"}
            stroke={completed ? (selectedView === 'VISION' ? "#0ea5e9" : "#334155") : "#e2e8f0"}
            strokeWidth={selectedView === 'VISION' ? "3" : "2"}
            className="transition-all duration-700 ease-out"
            />

            {completed ? (
                <text x={center.x} y={center.y} dy=".3em" textAnchor="middle" fill="white" className="text-xs font-bold animate-fade-in pointer-events-none">
                    비전
                </text>
            ) : (
                <text x={center.x} y={center.y} dy=".3em" textAnchor="middle" fill="#cbd5e1" className="text-[10px] font-bold">
                    {analyzing ? '...' : '?'}
                </text>
            )}
        </g>
      </svg>

      {/* Tooltip Overlay */}
      {hoveredNode && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-surface-inverse/90 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-lg backdrop-blur-sm pointer-events-none animate-fade-in z-20 whitespace-nowrap">
            {getTooltipText()}
        </div>
      )}
    </div>
  );
};

export default TriangleVisual;
