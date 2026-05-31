import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

export const AIRecommendation = ({ recommendations = [], mode = 'balanced' }) => {
  const getModeLabel = (m) => {
    switch (m) {
      case 'recovery':
        return 'Recovery Priority Mode';
      case 'peak_performance':
        return 'Peak Cognitive Execution';
      default:
        return 'Standard Balanced Optimization';
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-white/5 bg-gradient-to-r from-cyan-500/5 to-accent-blue/5 shadow-glow-blue/5 flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-cyan-400 animate-pulse" />
          <h3 className="text-sm font-black uppercase tracking-wider text-white">AI Productivity Engine</h3>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
          {getModeLabel(mode)}
        </span>
      </div>

      <div className="space-y-3">
        {recommendations.length === 0 ? (
          <p className="text-xs text-slate-500 font-semibold">Generating optimization targets...</p>
        ) : (
          recommendations.map((rec, index) => (
            <div key={index} className="flex items-start gap-3 text-xs leading-relaxed text-slate-300">
              <ArrowRight className="h-4 w-4 text-cyan-400 mt-0.5 shrink-0" />
              <p className="font-medium">{rec}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
export default AIRecommendation;
