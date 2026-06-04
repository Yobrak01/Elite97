import React from 'react';
import { Award, ShieldAlert, Heart, Landmark, RefreshCw } from 'lucide-react';

export const ModeSelector = ({ currentMode, onModeChange }) => {
  const modes = [
    {
      id: 'normal',
      name: 'Normal Mode',
      icon: Award,
      color: 'text-accent-gold bg-accent-gold/10 border-accent-gold/20',
      description: 'Standard pomodoro-based daily study sessions.'
    },
    {
      id: 'cat_prep',
      name: 'CAT Prep Mode',
      icon: Landmark,
      color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
      description: 'Intense revision, formula cycles, and high task goals.'
    },
    {
      id: 'exam_prep',
      name: 'Exam Prep Mode',
      icon: ShieldAlert,
      color: 'text-red-400 bg-red-500/10 border-red-500/20',
      description: 'Maximum focus intervals, isolation, and full simulations.'
    },
    {
      id: 'recovery',
      name: 'Recovery Mode',
      icon: Heart,
      color: 'text-green-400 bg-green-500/10 border-green-500/20',
      description: 'Cognitive rest. Shorter sessions and deep recovery cycles.'
    },
    {
      id: 'unexpected_event',
      name: 'Interruption Mode',
      icon: RefreshCw,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      description: 'Adapt schedules dynamically during system blocks.'
    }
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">System Study Presets</h3>
        <p className="text-xs text-slate-500 font-semibold">Change mode variables to alter AI duration metrics and breaks.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {modes.map((m) => {
          const Icon = m.icon;
          const isActive = currentMode === m.id;

          return (
            <button
              key={m.id}
              onClick={() => onModeChange(m.id)}
              className={`glass-panel text-left rounded-2xl p-4 border transition-all duration-300 flex flex-col justify-between h-36 ${
                isActive
                  ? `${m.color} scale-[1.02] ring-1 ring-white/10 shadow-glow-gold/10`
                  : 'border-white/5 text-slate-400 hover:border-white/10 hover:text-white'
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-navy-900 border border-white/5 ${isActive ? 'text-white' : ''}`}>
                  <Icon className="h-5 w-5" />
                </div>
                {isActive && (
                  <span className="text-[9px] font-black uppercase tracking-widest text-glow-gold px-2 py-0.5 rounded bg-white/5 border border-white/10">
                    ACTIVE
                  </span>
                )}
              </div>

              <div className="space-y-1 mt-3">
                <h4 className="text-xs font-extrabold tracking-wide text-white">{m.name}</h4>
                <p className="text-[10px] text-slate-400 leading-normal font-medium line-clamp-2">
                  {m.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
export default ModeSelector;
