'use client';

import React from 'react';
import { Task, TaskType } from '@/types';

interface RoleFilterProps {
  currentFilter: TaskType | 'ALL';
  onFilterChange: (filter: TaskType | 'ALL') => void;
  tasks: Task[];
}

const ROLES: { id: TaskType | 'ALL'; label: string; color: string }[] = [
  { id: 'ALL', label: '전체 보기', color: 'bg-surface-inverse text-white border-surface-inverse' },
  { id: 'PLANNING', label: '기획', color: 'bg-status-warning-bg text-status-warning-text border-status-warning-text/20' },
  { id: 'DESIGN', label: '디자인', color: 'bg-pink-100 text-pink-800 border-pink-200' },
  { id: 'ARCHITECTURE', label: '아키텍처', color: 'bg-slate-100 text-slate-800 border-slate-200' },
  { id: 'FRONTEND', label: '프론트엔드', color: 'bg-status-info-bg text-status-info-text border-status-info-text/20' },
  { id: 'BACKEND', label: '백엔드', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'DEVOPS', label: '인프라', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { id: 'MARKETING', label: '마케팅', color: 'bg-purple-100 text-purple-800 border-purple-200' },
];

export const RoleFilter: React.FC<RoleFilterProps> = ({ currentFilter, onFilterChange, tasks }) => {
  const getCount = (role: TaskType | 'ALL') => {
    if (role === 'ALL') return tasks.length;
    return tasks.filter(t => t.type === role).length;
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-2">
      {ROLES.map((role) => {
        const count = getCount(role.id);
        const isActive = currentFilter === role.id;

        let buttonClass = "flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap border";

        if (isActive) {
          if (role.id === 'ALL') {
            buttonClass += ` ${role.color} ring-2 ring-border shadow-sharp`;
          } else {
            buttonClass += ` ${role.color} ring-2 ring-offset-1 ring-border-strong shadow-sharp saturate-150 border-transparent`;
          }
        } else {
          buttonClass += " bg-surface-card text-txt-tertiary border-border hover:bg-surface-sunken hover:text-txt-primary";
        }

        return (
          <button
            key={role.id}
            onClick={() => onFilterChange(role.id)}
            className={buttonClass}
          >
            {role.id !== 'ALL' && (
              <span className={`w-2 h-2 ${role.color.split(' ')[0].replace('100', '400')}`}></span>
            )}
            {role.label}
            <span className={`px-1.5 py-0.5 text-[0.625rem] ${isActive ? 'bg-white/40 text-current' : 'bg-surface-sunken text-txt-tertiary'}`}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
