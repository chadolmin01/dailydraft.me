'use client';

import React from 'react';
import { X, FlaskConical } from 'lucide-react';
import { BuildModule } from './phase3/BuildModule';
import type { PRDResult } from '@/src/lib/api/prd';

interface BuildModalProps {
  isOpen: boolean;
  onClose: () => void;
  prdData?: PRDResult | null;
}

export const BuildModal: React.FC<BuildModalProps> = ({ isOpen, onClose, prdData }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-surface-card w-[98vw] max-w-[100rem] h-[92vh] shadow-brutal border border-border-strong flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-border-strong px-6 py-4 flex items-center justify-between bg-surface-card">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black flex items-center justify-center text-white">
              <FlaskConical className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-lg text-txt-primary">Phase 3: Build</h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#4F46E5]/10 text-[#4F46E5] text-[0.625rem] font-bold font-mono border border-[#4F46E5]">
                <FlaskConical size={10} />
                BETA
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-surface-sunken transition-colors border border-border-strong"
          >
            <X className="w-5 h-5 text-txt-disabled" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden p-4">
          <BuildModule prdData={prdData} />
        </div>
      </div>
    </div>
  );
};

export default BuildModal;
