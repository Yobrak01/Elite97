import React from 'react';
import { Flame } from 'lucide-react';

export const StreakCounter = ({ streak = 0 }) => {
  const getFlameClass = (strk) => {
    if (strk >= 15) return 'text-red-500 animate-bounce shadow-glow-red/30';
    if (strk >= 7) return 'text-orange-500 animate-pulse';
    return 'text-yellow-500';
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-white/5 flex items-center justify-between text-glow-blue bg-gradient-to-r from-accent-blue/5 to-transparent">
      <div className="space-y-1">
        <span className="text-xs font-black uppercase tracking-wider text-slate-400">Consistency Lock-In</span>
        <h4 className="text-3xl font-extrabold tracking-tight text-white">{streak} Days</h4>
        <p className="text-xs text-slate-400 font-semibold">Active uninterrupted daily schedule logs.</p>
      </div>

      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10 ${getFlameClass(streak)}`}>
        <Flame className="h-8 w-8" />
      </div>
    </div>
  );
};
export default StreakCounter;
