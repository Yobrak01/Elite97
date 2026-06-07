import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend }) => {
  const getColorClasses = (c) => {
    switch (c) {
      case 'red':
        return {
          bg: 'bg-red-500/10 border-red-500/20 text-red-400',
          glow: 'hover:shadow-glow-red/20 hover:border-red-500/30'
        };
      case 'green':
        return {
          bg: 'bg-green-500/10 border-green-500/20 text-green-400',
          glow: 'hover:shadow-glow-green/20 hover:border-green-500/30'
        };
      case 'yellow':
        return {
          bg: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
          glow: 'hover:shadow-glow-yellow/20 hover:border-yellow-500/30'
        };
      default:
        return {
          bg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
          glow: 'hover:shadow-glow-cyan/25 hover:border-cyan-500/40'
        };
    }
  };

  const theme = getColorClasses(color);

  return (
    <div className={`glass-panel rounded-2xl p-5 border border-white/5 transition-all duration-300 ${theme.glow} flex justify-between items-center`}>
      <div className="space-y-2">
        <span className="text-xs font-black uppercase tracking-widest text-slate-400">{title}</span>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-sans font-bold tracking-widest text-white text-glow-cyan drop-shadow-md">{value}</span>
          {trend && (
            <span className={`text-xs font-bold ${trend.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
              {trend}
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs text-slate-400 font-medium">{subtitle}</p>}
      </div>

      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${theme.bg}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  );
};
export default StatCard;

