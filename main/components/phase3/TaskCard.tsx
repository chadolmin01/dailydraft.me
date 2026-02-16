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
        card: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
        badge: 'bg-white/80 text-blue-700 ring-1 ring-blue-200'
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
        card: 'bg-white hover:bg-gray-50 border-gray-200',
        badge: 'bg-gray-100 text-gray-700 border-gray-200'
      };
  }
};

const getPriorityColor = (p: string) => {
  switch (p) {
    case 'HIGH': return 'text-red-500';
    case 'MEDIUM': return 'text-yellow-600';
    case 'LOW': return 'text-blue-500';
    default: return 'text-gray-400';
  }
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onDragStart, onClick }) => {
  const styles = getTaskStyles(task.type);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={() => onClick(task)}
      className={`group p-4 rounded-xl border shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing mb-3 relative ${styles.card}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-gray-500/80">{task.id}</span>
          {task.synced && (
            <div className="flex items-center gap-1 text-[10px] text-gray-500/80 bg-white/50 px-1.5 py-0.5 rounded border border-black/5" title={`${task.externalTicketId}에 동기화됨`}>
              <LinkIcon size={8} />
              <span>{task.externalTicketId}</span>
            </div>
          )}
        </div>
        <button className="text-gray-400 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal size={14} />
        </button>
      </div>

      <h4 className="text-sm font-bold text-gray-900 mb-1.5 leading-snug">
        {task.title}
      </h4>

      <p className="text-xs text-gray-600 mb-4 line-clamp-2 leading-relaxed opacity-90">
        {task.description}
      </p>

      <div className="flex items-center justify-between mt-auto">
        <span className={`text-[10px] px-2 py-1 rounded-md font-bold shadow-sm ${styles.badge}`}>
          {task.type}
        </span>

        <div className="flex items-center gap-3">
          {task.comments && task.comments.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MessageSquare size={12} />
              <span>{task.comments.length}</span>
            </div>
          )}

          <div className="flex items-center gap-1 text-xs text-gray-500" title="예상 소요 시간">
            <Clock size={12} />
            <span>{task.estimate}</span>
          </div>

          <div title={`우선순위: ${task.priority}`}>
            <Signal size={12} className={getPriorityColor(task.priority)} />
          </div>

          {task.assignee ? (
            <div className="w-6 h-6 rounded-full bg-white border border-gray-200 text-gray-700 flex items-center justify-center text-[10px] font-bold shadow-sm">
              {task.assignee}
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-gray-500 hover:text-gray-600 transition-colors bg-white/50">
              <span className="text-[10px]">+</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
