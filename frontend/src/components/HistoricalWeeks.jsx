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
      <div className="bg-navy-900/60 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_10px_50px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-700 mt-6 p-8 text-center">
        <h3 className="text-lg font-black uppercase tracking-wider text-slate-500 mb-2">Historical Weekly Output</h3>
        <p className="text-sm font-bold text-slate-600">No time logs recorded yet. Start tracking to generate your weekly aggregates!</p>
      </div>
    );
  }

  return (
    <div className="bg-navy-900/60 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_10px_50px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-700 mt-6">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-400" />
            Historical Weekly Output
          </h3>
          <p className="text-xs text-slate-400 font-semibold mt-1">Total aggregated volume segmented by operational weeks.</p>
        </div>
      </div>

      <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto custom-scrollbar">
        {weeks.map((week) => (
          <div key={week.id} className="p-6 hover:bg-white/[0.02] transition-colors">
            
            {/* Header row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h4 className="text-sm font-black text-cyan-400 uppercase tracking-widest">{week.weekLabel}</h4>
                <div className="flex items-center gap-6 mt-2">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Study Volume</p>
                    <p className="text-2xl font-black text-white">{week.totalStudyHours}<span className="text-sm text-slate-500 ml-1">hrs</span></p>
                  </div>
                  <div className="h-8 w-px bg-white/10"></div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Daily Average</p>
                    <p className="text-2xl font-black text-cyan-400">{week.averageStudyHoursPerDay}<span className="text-sm text-cyan-500/50 ml-1">hrs/day</span></p>
                  </div>
                </div>
              </div>
            </div>

            {/* Breakdown grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 pt-4 border-t border-white/5">
              
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex flex-col items-center text-center justify-center">
                <BookOpen className="h-5 w-5 text-blue-400 mb-2" />
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Personal Study</span>
                <span className="text-lg font-black text-white">{week.breakdown.personalStudy}<span className="text-xs text-slate-500 ml-1">h</span></span>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 flex flex-col items-center text-center justify-center">
                <Target className="h-5 w-5 text-purple-400 mb-2" />
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">Lectures</span>
                <span className="text-lg font-black text-white">{week.breakdown.lecture}<span className="text-xs text-slate-500 ml-1">h</span></span>
              </div>

              <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex flex-col items-center text-center justify-center">
                <Dumbbell className="h-5 w-5 text-green-400 mb-2" />
                <span className="text-xs font-bold text-green-400 uppercase tracking-wider mb-1">Gym & Fitness</span>
                <span className="text-lg font-black text-white">{week.breakdown.gym}<span className="text-xs text-slate-500 ml-1">h</span></span>
              </div>

              <div className="bg-slate-500/10 border border-slate-500/20 rounded-2xl p-4 flex flex-col items-center text-center justify-center">
                <Coffee className="h-5 w-5 text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Rest & Sleep</span>
                <span className="text-lg font-black text-white">{week.breakdown.rest}<span className="text-xs text-slate-500 ml-1">h</span></span>
              </div>

              <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex flex-col items-center text-center justify-center">
                <Activity className="h-5 w-5 text-orange-400 mb-2" />
                <span className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">Other / Chores</span>
                <span className="text-lg font-black text-white">{(week.breakdown.chore + week.breakdown.other).toFixed(1)}<span className="text-xs text-slate-500 ml-1">h</span></span>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoricalWeeks;
