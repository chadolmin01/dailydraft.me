'use client';

import React from 'react';
import { X } from 'lucide-react';
import IdeaValidator from './idea-validator/IdeaValidator';

interface IdeaValidatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IdeaValidatorModal: React.FC<IdeaValidatorModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white w-[98vw] max-w-[1800px] h-[95vh] rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-50 w-8 h-8 flex items-center justify-center rounded-lg bg-white/80 hover:bg-gray-100 transition-colors shadow-sm"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* IdeaValidator */}
        <div className="flex-1 overflow-hidden">
          <IdeaValidator onClose={onClose} />
        </div>
      </div>
    </div>
  );
};

export default IdeaValidatorModal;
