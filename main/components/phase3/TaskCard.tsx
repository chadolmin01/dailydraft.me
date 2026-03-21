'use client';

import React from 'react';
import { Task, TaskType } from '@/types';
import { MoreHorizontal, Clock, Signal, MessageSquare, Link as LinkIcon } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onClick: (task: Task) => void;
}

const getTaskStyles = (type: TaskType) => {
  switch (type) {
    case 'PLANNING':
      return {
        card: 'bg-amber-50 hover:bg-amber-100 border-amber-200',
        badge: 'bg-white/80 text-amber-800 ring-1 ring-amber-200'
      };
    case 'DESIGN':
      return {
        card: 'bg-pink-50 hover:bg-pink-100 border-pink-200',
        badge: 'bg-white/80 text-pink-800 ring-1 ring-pink-200'
      };
    case 'ARCHITECTURE':
      return {
        card: 'bg-slate-50 hover:bg-slate-100 border-slate-200',
        badge: 'bg-white/80 text-slate-700 ring-1 ring-slate-200'
      };
    case 'FRONTEND':
      return {
        card: 'bg-status-info-bg hover:bg-status-info-bg border-status-info-text/20',
        badge: 'bg-white/80 text-status-info-text ring-1 ring-status-info-text/20'
      };
    case 'BACKEND':
      return {
        card: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200',
        badge: 'bg-white/80 text-emerald-700 ring-1 ring-emerald-200'
      };
    case 'DEVOPS':
      return {
        card: 'bg-orange-50 hover:bg-orange-100 border-orange-200',
        badge: 'bg-white/80 text-orange-700 ring-1 ring-orange-200'
      };
    case 'MARKETING':
      return {
        card: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
        badge: 'bg-white/80 text-purple-700 ring-1 ring-purple-200'
      };
    default:
      return {
        card: 'bg-surface-card hover:bg-surface-sunken border-border',
        badge: 'bg-surface-sunken text-txt-secondary border-border'
      };
  }
};

const getPriorityColor = (p: string) => {
  switch (p) {
    case 'HIGH': return 'text-status-danger-text';
    case 'MEDIUM': return 'text-status-warning-text';
    case 'LOW': return 'text-status-info-text';
    default: return 'text-txt-disabled';
  }
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onDragStart, onClick }) => {
  const styles = getTaskStyles(task.type);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={() => onClick(task)}
      className={`group p-4 border shadow-sharp hover:shadow-brutal transition-all cursor-grab active:cursor-grabbing mb-3 relative ${styles.card}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[0.625rem] font-mono text-txt-tertiary">{task.id}</span>
          {task.synced && (
            <div className="flex items-center gap-1 text-[0.625rem] text-txt-tertiary bg-white/50 px-1.5 py-0.5 border border-black/5" title={`${task.externalTicketId}에 동기화됨`}>
              <LinkIcon size={8} />
              <span>{task.externalTicketId}</span>
            </div>
          )}
        </div>
        <button className="text-txt-disabled hover:text-txt-secondary sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <MoreHorizontal size={14} />
        </button>
      </div>

      <h4 className="text-sm font-bold text-txt-primary mb-1.5 leading-snug">
        {task.title}
      </h4>

      <p className="text-xs text-txt-secondary mb-4 line-clamp-2 leading-relaxed opacity-90">
        {task.description}
      </p>

      <div className="flex items-center justify-between mt-auto">
        <span className={`text-[0.625rem] px-2 py-1 font-bold shadow-sharp ${styles.badge}`}>
          {task.type}
        </span>

        <div className="flex items-center gap-3">
          {task.comments && task.comments.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-txt-tertiary">
              <MessageSquare size={12} />
              <span>{task.comments.length}</span>
            </div>
          )}

          <div className="flex items-center gap-1 text-xs text-txt-tertiary" title="예상 소요 시간">
            <Clock size={12} />
            <span>{task.estimate}</span>
          </div>

          <div title={`우선순위: ${task.priority}`}>
            <Signal size={12} className={getPriorityColor(task.priority)} />
          </div>

          {task.assignee ? (
            <div className="w-6 h-6 bg-surface-card border border-border text-txt-secondary flex items-center justify-center text-[0.625rem] font-bold shadow-sharp">
              {task.assignee}
            </div>
          ) : (
            <div className="w-6 h-6 border border-dashed border-border-strong flex items-center justify-center text-txt-disabled hover:border-border-strong hover:text-txt-secondary transition-colors bg-white/50">
              <span className="text-[0.625rem]">+</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
