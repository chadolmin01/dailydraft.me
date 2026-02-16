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
      <div className="relative bg-white w-[98vw] max-w-[1600px] h-[92vh] rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-200 px-6 py-4 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-md flex items-center justify-center text-white">
              <FlaskConical className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-lg">Phase 3: Build</h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full border border-amber-200">
                <FlaskConical size={10} />
                BETA
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
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
