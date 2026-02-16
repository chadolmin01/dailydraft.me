'use client';

import React from 'react';
import { Task, TaskType } from '@/types';

interface RoleFilterProps {
  currentFilter: TaskType | 'ALL';
  onFilterChange: (filter: TaskType | 'ALL') => void;
  tasks: Task[];
}

const ROLES: { id: TaskType | 'ALL'; label: string; color: string }[] = [
  { id: 'ALL', label: '전체 보기', color: 'bg-gray-800 text-white border-gray-800' },
  { id: 'PLANNING', label: '기획', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { id: 'DESIGN', label: '디자인', color: 'bg-pink-100 text-pink-800 border-pink-200' },
  { id: 'ARCHITECTURE', label: '아키텍처', color: 'bg-slate-100 text-slate-800 border-slate-200' },
  { id: 'FRONTEND', label: '프론트엔드', color: 'bg-blue-100 text-blue-800 border-blue-200' },
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

        let buttonClass = "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap border";

        if (isActive) {
          if (role.id === 'ALL') {
            buttonClass += ` ${role.color} ring-2 ring-gray-200 shadow-md`;
          } else {
            buttonClass += ` ${role.color} ring-2 ring-offset-1 ring-gray-300 shadow-sm saturate-150 border-transparent`;
          }
        } else {
          buttonClass += " bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-900";
        }

        return (
          <button
            key={role.id}
            onClick={() => onFilterChange(role.id)}
            className={buttonClass}
          >
            {role.id !== 'ALL' && (
              <span className={`w-2 h-2 rounded-full ${role.color.split(' ')[0].replace('100', '400')}`}></span>
            )}
            {role.label}
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${isActive ? 'bg-white/40 text-current' : 'bg-gray-100 text-gray-500'}`}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
