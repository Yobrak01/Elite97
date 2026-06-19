import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Activity, Target, Zap, Dumbbell, Brush, Coffee, BookOpen } from 'lucide-react';
import api from '../services/api';

export const HistoricalWeeks = () => {
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeeks = async () => {
      try {
        const res = await api.tracker.getHistoricalWeeks();
        setWeeks(res.data);
      } catch (err) {
        console.error('Failed to fetch historical weeks', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWeeks();
  }, []);

  if (loading) {
    return (
      <div className="glass-panel rounded-3xl p-8 border border-white/5 animate-pulse h-48 flex items-center justify-center mt-6">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-cyan-500 border-r-transparent border-b-transparent border-l-transparent"></div>
      </div>
    );
  }

  if (!weeks || weeks.length === 0) {
    return (
      <div className="bg-navy-900/60 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_10px_50px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-700 mt-6 p-10 text-center flex flex-col items-center">
        <div className="h-12 w-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
          <Calendar className="h-6 w-6 text-cyan-400 opacity-50" />
        </div>
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-2">Historical Weekly Output</h3>
        <p className="text-xs font-bold text-slate-500 max-w-sm">No operational cycles recorded yet. Initiate matrix tracking to generate your high-level weekly aggregates.</p>
      </div>
    );
  }

  const formatAvg = (hours) => {
    return (hours / 7).toFixed(1);
  };

  return (
    <div className="bg-navy-900/60 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_10px_50px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-700 mt-6">
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-white/[0.02] to-transparent">
        <div>
          <h3 className="text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-cyan-400" />
            Macro Weekly Operations
          </h3>
          <p className="text-xs text-slate-400 font-semibold mt-1">High-altitude view of total volume and operational consistency.</p>
        </div>
      </div>

      <div className="divide-y divide-white/5 max-h-[700px] overflow-y-auto custom-scrollbar">
        {weeks.map((week) => (
          <div key={week.id} className="p-8 hover:bg-white/[0.02] transition-colors group relative overflow-hidden">
            
            {/* Elite background glow effect on hover */}
            <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-cyan-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 relative z-10">
              <div className="flex items-center gap-4">
                <div className="h-12 w-1 flex flex-col justify-between">
                  <div className="h-[48%] w-full bg-cyan-400 rounded-full"></div>
                  <div className="h-[48%] w-full bg-slate-600 rounded-full"></div>
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{week.weekLabel.split('.')[0]}</h4>
                  <h5 className="text-lg font-black text-white tracking-wider">{week.weekLabel.split('.')[1]}</h5>
                </div>
              </div>

              <div className="flex items-center gap-6 bg-navy-950/50 rounded-2xl p-4 border border-white/5">
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Volume</p>
                  <p className="text-2xl font-black text-white">{week.totalStudyHours}<span className="text-xs text-slate-500 ml-1">hrs</span></p>
                </div>
                <div className="h-10 w-px bg-white/10"></div>
                <div>
                  <p className="text-[9px] font-black text-cyan-500 uppercase tracking-widest mb-1">Daily Average</p>
                  <p className="text-2xl font-black text-cyan-400">{week.averageStudyHoursPerDay}<span className="text-xs text-cyan-500/50 ml-1">h/d</span></p>
                </div>
              </div>
            </div>

            {/* Granular Breakdown Matrix */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 relative z-10">
              
              <div className="bg-navy-950 border border-blue-500/20 rounded-xl p-4 relative overflow-hidden group/card hover:border-blue-500/50 transition-colors">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover/card:opacity-20 transition-opacity"><BookOpen className="h-10 w-10 text-blue-500" /></div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-2 w-2 rounded-full bg-blue-500 shadow-glow-blue"></div>
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider">Personal Study</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-xl font-black text-white">{week.breakdown.personalStudy}<span className="text-[10px] text-slate-500 ml-1">h</span></span>
                </div>
                <div className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Avg: <span className="text-blue-400">{formatAvg(week.breakdown.personalStudy)}</span> h/d
                </div>
              </div>

              <div className="bg-navy-950 border border-purple-500/20 rounded-xl p-4 relative overflow-hidden group/card hover:border-purple-500/50 transition-colors">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover/card:opacity-20 transition-opacity"><Target className="h-10 w-10 text-purple-500" /></div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-2 w-2 rounded-full bg-purple-500 shadow-glow-purple"></div>
                  <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider">Lectures</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-xl font-black text-white">{week.breakdown.lecture}<span className="text-[10px] text-slate-500 ml-1">h</span></span>
                </div>
                <div className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Avg: <span className="text-purple-400">{formatAvg(week.breakdown.lecture)}</span> h/d
                </div>
              </div>

              <div className="bg-navy-950 border border-green-500/20 rounded-xl p-4 relative overflow-hidden group/card hover:border-green-500/50 transition-colors">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover/card:opacity-20 transition-opacity"><Dumbbell className="h-10 w-10 text-green-500" /></div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-2 w-2 rounded-full bg-green-500 shadow-glow-green"></div>
                  <span className="text-[10px] font-black text-green-400 uppercase tracking-wider">Gym & PT</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-xl font-black text-white">{week.breakdown.gym}<span className="text-[10px] text-slate-500 ml-1">h</span></span>
                </div>
                <div className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Avg: <span className="text-green-400">{formatAvg(week.breakdown.gym)}</span> h/d
                </div>
              </div>

              <div className="bg-navy-950 border border-slate-500/20 rounded-xl p-4 relative overflow-hidden group/card hover:border-slate-500/50 transition-colors">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover/card:opacity-20 transition-opacity"><Coffee className="h-10 w-10 text-slate-500" /></div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-2 w-2 rounded-full bg-slate-500"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Rest & Sleep</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-xl font-black text-white">{week.breakdown.rest}<span className="text-[10px] text-slate-500 ml-1">h</span></span>
                </div>
                <div className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Avg: <span className="text-slate-300">{formatAvg(week.breakdown.rest)}</span> h/d
                </div>
              </div>

              <div className="bg-navy-950 border border-orange-500/20 rounded-xl p-4 relative overflow-hidden group/card hover:border-orange-500/50 transition-colors">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover/card:opacity-20 transition-opacity"><Activity className="h-10 w-10 text-orange-500" /></div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-2 w-2 rounded-full bg-orange-500 shadow-glow-orange"></div>
                  <span className="text-[10px] font-black text-orange-400 uppercase tracking-wider">Other / Chores</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-xl font-black text-white">{(week.breakdown.chore + week.breakdown.other).toFixed(1)}<span className="text-[10px] text-slate-500 ml-1">h</span></span>
                </div>
                <div className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Avg: <span className="text-orange-400">{formatAvg(week.breakdown.chore + week.breakdown.other)}</span> h/d
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoricalWeeks;
