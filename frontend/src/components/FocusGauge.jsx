import React from 'react';

export const FocusGauge = ({ score }) => {
  const percentage = Math.min(100, Math.max(0, score));
  const radius = 50;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColor = (s) => {
    if (s < 30) return { stroke: 'stroke-red-500', text: 'text-red-400', glow: 'shadow-glow-red/20' };
    if (s < 60) return { stroke: 'stroke-yellow-500', text: 'text-yellow-400', glow: 'shadow-glow-yellow/20' };
    if (s < 80) return { stroke: 'stroke-green-500', text: 'text-green-400', glow: 'shadow-glow-green/20' };
    return { stroke: 'stroke-accent-blue', text: 'text-accent-blue', glow: 'shadow-glow-blue/20' };
  };

  const theme = getColor(percentage);

  return (
    <div className="glass-panel flex flex-col items-center justify-center rounded-2xl p-6 border border-white/5 text-center">
      <h3 className="mb-4 text-xs font-black uppercase tracking-wider text-slate-400">Cognitive Focus Score</h3>
      
      <div className="relative flex items-center justify-center">
        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
          {/* Base track */}
          <circle
            className="stroke-navy-800"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Active progress */}
          <circle
            className={`transition-all duration-500 ease-in-out ${theme.stroke}`}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <div className={`absolute flex flex-col items-center justify-center font-extrabold ${theme.text}`}>
          <span className="text-3xl tracking-tight">{percentage}</span>
          <span className="text-[10px] uppercase font-black tracking-widest">Score</span>
        </div>
      </div>
      
      <p className="mt-4 text-xs font-semibold text-slate-400">
        {percentage >= 80 ? 'Peak execution state.' : percentage >= 50 ? 'Stable cognitive conversion.' : 'Focus decay. Alert.'}
      </p>
    </div>
  );
};
export default FocusGauge;
