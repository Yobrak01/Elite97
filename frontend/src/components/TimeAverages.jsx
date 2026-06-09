import React, { useState, useEffect } from 'react';
import { Clock, Activity, Target, Zap, RotateCcw } from 'lucide-react';
import api from '../services/api';

export const TimeAverages = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAverages = async () => {
      try {
        const res = await api.analytics.getTimeAverages();
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAverages();
  }, []);

  if (loading) {
    return (
      <div className="glass-panel rounded-3xl p-8 border border-white/5 animate-pulse h-48 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-cyan-500 border-r-transparent border-b-transparent border-l-transparent"></div>
      </div>
    );
  }

  if (!data) return null;

  const categories = [
    { key: 'personal_study', label: 'Personal Study', color: 'bg-blue-500', text: 'text-blue-400' },
    { key: 'group_discussion', label: 'Discussions', color: 'bg-orange-500', text: 'text-orange-400' },
    { key: 'lecture', label: 'Lectures', color: 'bg-purple-500', text: 'text-purple-400' },
    { key: 'gym', label: 'Physical Training', color: 'bg-green-500', text: 'text-green-400' },
    { key: 'rest', label: 'Rest / Sleep', color: 'bg-slate-500', text: 'text-slate-400' },
    { key: 'chore', label: 'Maintenance', color: 'bg-yellow-500', text: 'text-yellow-400' },
  ];

  const formatHours = (minutes) => {
    if (!minutes) return '0.0';
    return (minutes / 60).toFixed(1);
  };

  const getStudyTotal = (periodData) => {
    if (!periodData) return 0;
    return (periodData.personal_study || 0) + (periodData.group_discussion || 0) + (periodData.lecture || 0);
  };

  return (
    <div className="bg-navy-900/60 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_10px_50px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-700 mt-6">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-cyan-400" />
            Long-Term Time Distribution Metrics
          </h3>
          <p className="text-xs text-slate-400 font-semibold mt-1">Rolling historical aggregates of your logged hours.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/5">
        {/* Weekly */}
        <div className="p-6 space-y-4 hover:bg-white/[0.02] transition-colors">
          <h4 className="text-sm font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2 mb-6">
            <Activity className="h-4 w-4" /> 7-Day Output
          </h4>
          {categories.map(cat => (
            <div key={cat.key} className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider ${cat.text}`}>{cat.label}</span>
              <span className="text-lg font-black text-white">{formatHours(data.weekly[cat.key])}<span className="text-xs text-slate-500 ml-1">h</span></span>
            </div>
          ))}
          <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-cyan-400">Total Study Time</span>
            <span className="text-xl font-black text-cyan-400">{formatHours(getStudyTotal(data.weekly))}<span className="text-xs text-cyan-500/50 ml-1">h</span></span>
          </div>
        </div>

        {/* Monthly */}
        <div className="p-6 space-y-4 hover:bg-white/[0.02] transition-colors">
          <h4 className="text-sm font-black text-blue-400 uppercase tracking-widest flex items-center gap-2 mb-6">
            <Target className="h-4 w-4" /> 30-Day Output
          </h4>
          {categories.map(cat => (
            <div key={cat.key} className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider ${cat.text}`}>{cat.label}</span>
              <span className="text-lg font-black text-white">{formatHours(data.monthly[cat.key])}<span className="text-xs text-slate-500 ml-1">h</span></span>
            </div>
          ))}
          <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-cyan-400">Total Study Time</span>
            <span className="text-xl font-black text-cyan-400">{formatHours(getStudyTotal(data.monthly))}<span className="text-xs text-cyan-500/50 ml-1">h</span></span>
          </div>
        </div>

        {/* Yearly */}
        <div className="p-6 space-y-4 hover:bg-white/[0.02] transition-colors">
          <h4 className="text-sm font-black text-purple-400 uppercase tracking-widest flex items-center gap-2 mb-6">
            <Zap className="h-4 w-4" /> 365-Day Output
          </h4>
          {categories.map(cat => (
            <div key={cat.key} className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider ${cat.text}`}>{cat.label}</span>
              <span className="text-lg font-black text-white">{formatHours(data.yearly[cat.key])}<span className="text-xs text-slate-500 ml-1">h</span></span>
            </div>
          ))}
          <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-cyan-400">Total Study Time</span>
            <span className="text-xl font-black text-cyan-400">{formatHours(getStudyTotal(data.yearly))}<span className="text-xs text-cyan-500/50 ml-1">h</span></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeAverages;
