import React from 'react';
import { AlertOctagon, Heart, CheckCircle2 } from 'lucide-react';

export const BurnoutIndicator = ({ risk, level, factors = [], recommendations = [] }) => {
  const getTheme = (lvl) => {
    switch (lvl) {
      case 'high':
        return {
          icon: AlertOctagon,
          bg: 'from-red-500/10 to-red-600/10 border-red-500/20',
          text: 'text-red-400',
          bar: 'bg-red-500 shadow-glow-red',
          label: 'CRITICAL SYSTEM FATIGUE'
        };
      case 'moderate':
        return {
          icon: AlertOctagon,
          bg: 'from-yellow-500/10 to-yellow-600/10 border-yellow-500/20',
          text: 'text-yellow-400',
          bar: 'bg-yellow-500 shadow-glow-yellow',
          label: 'MODERATE RISK DETECTED'
        };
      default:
        return {
          icon: Heart,
          bg: 'from-green-500/10 to-green-600/10 border-green-500/20',
          text: 'text-green-400',
          bar: 'bg-green-500 shadow-glow-green',
          label: 'SYSTEM NOMINAL'
        };
    }
  };

  const theme = getTheme(level);
  const Icon = theme.icon;

  return (
    <div className={`glass-panel bg-gradient-to-br ${theme.bg} border rounded-2xl p-6 flex flex-col space-y-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${theme.text}`} />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Burnout Monitor</span>
        </div>
        <span className={`text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded border border-white/5 ${theme.text}`}>
          {theme.label}
        </span>
      </div>

      <div className="space-y-1">
        <div className="flex items-baseline justify-between text-xs font-bold">
          <span className="text-slate-400">Burnout Threshold Index</span>
          <span className={theme.text}>{risk}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-navy-950 overflow-hidden border border-white/5">
          <div className={`h-full rounded-full transition-all duration-500 ${theme.bar}`} style={{ width: `${risk}%` }} />
        </div>
      </div>

      {factors.length > 0 && (
        <div className="space-y-1 text-xs">
          <span className="font-bold text-slate-400 uppercase tracking-wide">Stress Factors:</span>
          <ul className="space-y-1 text-slate-300">
            {factors.map((f, idx) => (
              <li key={idx} className="flex items-center gap-1.5">
                <span className={`h-1 w-1 rounded-full ${theme.bar}`} />
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="space-y-2 border-t border-white/5 pt-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">AI Intervention Recommendations:</span>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {recommendations.map((r, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent-gold mt-0.5 shrink-0" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
export default BurnoutIndicator;
