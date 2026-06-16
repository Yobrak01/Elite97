import React from 'react';
import { Calendar, CheckSquare, Clock, Trash2, Edit2, PlayCircle, BookOpen } from 'lucide-react';

const getStudyMethod = (type, difficulty = 3) => {
  if (type === 'theory' && difficulty >= 4) return { emoji: '🧠', label: 'Feynman Technique', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' };
  if (type === 'theory') return { emoji: '📝', label: 'Blurting Method', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' };
  if (type === 'procedural' || type === 'project') return { emoji: '🔧', label: 'Procedural Chunking', color: 'text-blue-400 bg-blue-600/10 border-blue-600/20' };
  if (type === 'revision') return { emoji: '🔁', label: 'Active Recall & Spaced Repetition', color: 'text-green-400 bg-green-500/10 border-green-500/20' };
  if (type === 'assignment' && difficulty >= 4) return { emoji: '🔀', label: 'Interleaved Practice', color: 'text-indigo-400 bg-indigo-600/10 border-indigo-600/20' };
  return { emoji: '⏱️', label: '50/10 Pomodoro', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' };
};

export const TaskCard = ({ task, onComplete, onDelete, onEdit, onStart }) => {
  const getPriorityClasses = (p) => {
    if (p >= 5) return 'text-red-400 bg-red-500/10 border-red-500/20';
    if (p >= 4) return 'text-indigo-400 bg-indigo-600/10 border-indigo-600/20';
    if (p >= 3) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    return 'text-green-400 bg-green-500/10 border-green-500/20';
  };

  const getTypeClasses = (t) => {
    switch (t) {
      case 'procedural':
        return 'text-blue-400 bg-blue-600/10 border-blue-600/20';
      case 'theory':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'assignment':
        return 'text-pink-400 bg-pink-500/10 border-pink-500/20';
      default:
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    }
  };

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed';
  const studyMethod = getStudyMethod(task.type, task.difficulty || 3);

  return (
    <div className={`glass-panel rounded-2xl p-5 border border-white/5 flex flex-col justify-between space-y-4 transition-all duration-200 hover:border-white/10 ${
      task.status === 'completed' ? 'opacity-50' : ''
    }`}>
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h4 className={`text-base font-bold tracking-wide text-white leading-tight ${task.status === 'completed' ? 'line-through' : ''}`}>
            {task.title}
          </h4>
          <div className="flex gap-1.5 shrink-0">
            <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${getPriorityClasses(task.priority)}`}>
              P{task.priority}
            </span>
            <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${getTypeClasses(task.type)}`}>
              {task.type}
            </span>
            {task.courseUnit && (
              <span className="flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border-cyan-500/20">
                <BookOpen className="h-3 w-3" />
                {task.courseUnit.unitCode}
              </span>
            )}
          </div>
        </div>

        {task.description && (
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
            {task.description}
          </p>
        )}

        {/* Study Method Badge */}
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${studyMethod.color}`}>
            <span>{studyMethod.emoji}</span>
            {studyMethod.label}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/5 pt-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-cyan-400" />
            {task.estimatedHours} hrs
          </span>

          {task.deadline && (
            <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-400' : ''}`}>
              <Calendar className="h-3.5 w-3.5" />
              {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {task.status !== 'completed' && (
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('start-timer', { detail: { type: 'personal_study', name: task.title } }));
              }}
              className="flex items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white px-2.5 py-1 text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <PlayCircle className="h-3.5 w-3.5" />
              Start Timer
            </button>
          )}

          {task.status === 'pending' && onStart && (
            <button
              onClick={() => onStart(task._id)}
              className="flex items-center gap-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white px-2.5 py-1 text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <PlayCircle className="h-3.5 w-3.5" />
              In Progress
            </button>
          )}

          {task.status !== 'completed' && onComplete && (
            <button
              onClick={() => onComplete(task._id)}
              className="flex items-center gap-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-white px-2.5 py-1 text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <CheckSquare className="h-3.5 w-3.5" />
              Complete
            </button>
          )}

          {onEdit && (
            <button
              onClick={() => onEdit(task)}
              className="rounded-lg border border-white/5 hover:border-slate-400/30 hover:bg-slate-500/10 text-slate-400 hover:text-white p-1.5 transition-all"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          )}

          {onDelete && (
            <button
              onClick={() => onDelete(task._id)}
              className="rounded-lg border border-white/5 hover:border-red-500/30 hover:bg-red-500/10 text-slate-400 hover:text-red-400 p-1.5 transition-all"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default TaskCard;

