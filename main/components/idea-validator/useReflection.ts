import { useState } from 'react';
import { ChatMessage } from './types';

interface ReflectionModalState {
  msgId: string;
  respIdx: number;
  role: string;
  originalContent: string;
  suggestedActions: string[];
}

export function useReflection(messages: ChatMessage[], setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>) {
  const [reflectionModal, setReflectionModal] = useState<ReflectionModalState | null>(null);
  const [reflectionText, setReflectionText] = useState('');

  const openReflectionModal = (msgId: string, idx: number, role: string, content: string, suggestedActions: string[] = [], existingReflectedText?: string) => {
    setReflectionModal({
      msgId,
      respIdx: idx,
      role,
      originalContent: content,
      suggestedActions
    });
    setReflectionText(existingReflectedText || '');
  };

  const closeReflectionModal = () => {
    setReflectionModal(null);
    setReflectionText('');
  };

  const saveReflectionLocally = () => {
    if (!reflectionModal) return;
    const finalText = reflectionText.trim() || reflectionModal.originalContent;
    const updatedMessages = messages.map(msg => {
      if (msg.id !== reflectionModal.msgId || !msg.responses) return msg;
      const newResponses = [...msg.responses];
      newResponses[reflectionModal.respIdx] = {
        ...newResponses[reflectionModal.respIdx],
        isReflected: true,
        reflectedText: finalText
      };
      return { ...msg, responses: newResponses };
    });
    setMessages(updatedMessages);
    closeReflectionModal();
  };

  const removeReflection = () => {
    if (!reflectionModal) return;
    setMessages(prevMessages => prevMessages.map(msg => {
      if (msg.id !== reflectionModal.msgId || !msg.responses) return msg;
      const newResponses = [...msg.responses];
      newResponses[reflectionModal.respIdx] = {
        ...newResponses[reflectionModal.respIdx],
        isReflected: false,
        reflectedText: undefined
      };
      return { ...msg, responses: newResponses };
    }));
    closeReflectionModal();
  };

  return {
    reflectionModal,
    reflectionText,
    setReflectionText,
    openReflectionModal,
    closeReflectionModal,
    saveReflectionLocally,
    removeReflection,
  };
}
