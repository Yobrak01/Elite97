import React, { useState, useEffect } from 'react';
import { Skull, Zap, ChevronRight, Activity } from 'lucide-react';
import api from '../services/api';

export const WeeklyBriefing = () => {
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBriefing = async () => {
      try {
        const res = await api.analytics.getWeeklyReview();
        setBriefing(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBriefing();
  }, []);

  if (loading) {
    return (
      <div className="glass-panel rounded-3xl p-8 border border-white/5 animate-pulse h-48">
        <div className="h-6 w-48 bg-white/10 rounded mb-4"></div>
        <div className="h-4 w-full bg-white/5 rounded mb-2"></div>
        <div className="h-4 w-3/4 bg-white/5 rounded"></div>
      </div>
    );
  }

  if (!briefing) return null;

  return (
    <div className="bg-navy-900/80 backdrop-blur-2xl rounded-3xl p-8 border border-red-500/20 shadow-[0_10px_50px_rgba(239,68,68,0.1)] hover:border-red-500/40 hover:shadow-[0_0_40px_rgba(239,68,68,0.2)] transition-all duration-700 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity duration-700">
         <Skull className="w-40 h-40 text-red-500" />
      </div>
      
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="p-2 bg-red-500/20 rounded-lg">
          <Activity className="h-6 w-6 text-red-400" />
        </div>
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-widest">7-Day Intelligence Briefing</h2>
          <p className="text-xs text-red-400 font-bold tracking-widest uppercase">Ruthless Systems Analysis</p>
        </div>
      </div>

      <div className="relative z-10 grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <div className="bg-black/40 rounded-2xl p-6 border border-white/5 shadow-inner max-h-[300px] overflow-y-auto custom-scrollbar">
            <p className="text-sm font-semibold leading-relaxed text-slate-300">
              {briefing.report.split('[CRITICAL FAILURE]').join('').split('[SYSTEM STRAIN DETECTED]').join('').split('[STEADY STATE]').join('').split('DIRECTIVE:')[0]}
            </p>
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-xs font-black uppercase text-red-400 mb-2 flex items-center gap-2">
                <ChevronRight className="h-4 w-4" /> Tactical Directive
              </p>
              <p className="text-sm font-bold text-white">
                {briefing.report.split('DIRECTIVE:')[1]}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center text-center h-full gap-2 hover:bg-white/10 transition-colors">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Output</p>
            <p className="text-4xl font-black text-white">{briefing.metrics.totalHours}<span className="text-sm text-slate-500">h</span></p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center text-center h-full gap-2 hover:bg-white/10 transition-colors">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Avg Focus</p>
            <p className="text-4xl font-black text-cyan-400">{briefing.metrics.avgFocus}<span className="text-sm text-cyan-500/50">%</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyBriefing;
