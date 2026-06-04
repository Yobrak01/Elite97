import React from 'react';
import { BookOpen, Coffee, Dumbbell, Award, Landmark, User, CheckSquare } from 'lucide-react';

export const ScheduleBlock = ({ block, onComplete }) => {
  const getCategoryTheme = (cat) => {
    switch (cat) {
      case 'study':
        return { icon: BookOpen, css: 'text-accent-gold bg-accent-gold/10 border-accent-gold/20' };
      case 'break':
        return { icon: Coffee, css: 'text-green-400 bg-green-500/10 border-green-500/20' };
      case 'exercise':
        return { icon: Dumbbell, css: 'text-orange-400 bg-orange-500/10 border-orange-500/20' };
      case 'revision':
        return { icon: Award, css: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
      case 'lecture':
        return { icon: Landmark, css: 'text-purple-400 bg-purple-500/10 border-purple-500/20' };
      default:
        return { icon: User, css: 'text-slate-400 bg-white/5 border-white/10' };
    }
  };

  const theme = getCategoryTheme(block.category);
  const Icon = theme.icon;

  return (
    <div className="flex items-stretch gap-4 relative pl-4 border-l-2 border-navy-800 py-2">
      {/* Node bullet pointer */}
      <div className="absolute left-[-5px] top-4 h-2.5 w-2.5 rounded-full bg-navy-700 border-2 border-navy-950" />

      {/* Time duration column */}
      <div className="w-20 shrink-0 flex flex-col justify-center text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
        <span>{block.startTime}</span>
        <span className="text-[10px] text-slate-600 mt-1">{block.endTime}</span>
      </div>

      {/* Main card info */}
      <div className={`glass-panel flex-1 rounded-2xl p-4 border flex items-center justify-between gap-4 ${theme.css}`}>
        <div className="space-y-1">
          <h5 className="text-sm font-bold text-white tracking-wide">{block.activity}</h5>
          <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">
            {block.category} • {block.duration} mins
          </p>
        </div>

        <div className="flex items-center gap-3">
          {block.taskId && onComplete && (
            <button
              onClick={() => onComplete(block.taskId)}
              className="flex items-center gap-1 rounded-lg bg-accent-gold/10 border border-accent-gold/20 text-accent-gold hover:bg-accent-gold hover:text-white px-2 py-1 text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <CheckSquare className="h-3.5 w-3.5" />
            </button>
          )}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-900 border border-white/5">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </div>
    </div>
  );
};
export default ScheduleBlock;
