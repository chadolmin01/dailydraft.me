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
      <div className="relative bg-surface-card w-[98vw] max-w-[112.5rem] h-[95vh] shadow-brutal border-2 border-border-strong flex flex-col overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-50 w-8 h-8 flex items-center justify-center bg-surface-card hover:bg-surface-sunken transition-colors border border-border-strong"
        >
          <X className="w-5 h-5 text-txt-disabled" />
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
