import React from 'react';
import { Cpu, Paintbrush, DollarSign } from 'lucide-react';

export const getPersonaIcon = (role: string) => {
  switch (role) {
    case 'Developer': return <Cpu size={16} />;
    case 'Designer': return <Paintbrush size={16} />;
    case 'VC': return <DollarSign size={16} />;
    default: return <Cpu size={16} />;
  }
};

export const getPersonaColor = (role: string) => {
  switch (role) {
    case 'Developer': return 'bg-draft-blue/10 border-draft-blue/20 text-draft-blue';
    case 'Designer': return 'bg-draft-accent/10 border-draft-accent/20 text-draft-accent';
    case 'VC': return 'bg-status-success-bg border-indicator-online/20 text-indicator-online';
    default: return 'bg-surface-sunken border-border text-txt-secondary';
  }
};
