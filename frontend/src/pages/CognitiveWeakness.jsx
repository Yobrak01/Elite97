import React, { useState, useEffect } from 'react';
import { BrainCircuit, AlertTriangle, Crosshair, Zap, Activity, Clock, BarChart3 } from 'lucide-react';
import api from '../services/api';

export const CognitiveWeakness = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  
  const [selectedType, setSelectedType] = useState('Procrastination');
  const [intensity, setIntensity] = useState(5);
  const [trigger, setTrigger] = useState('');

  const WEAKNESSES = [
    { id: 'Procrastination', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/20', border: 'border-amber-500/50' },
    { id: 'Overconfidence', icon: Zap, color: 'text-red-500', bg: 'bg-red-500/20', border: 'border-red-500/50' },
    { id: 'Perfectionism', icon: Crosshair, color: 'text-blue-500', bg: 'bg-blue-500/20', border: 'border-blue-500/50' },
    { id: 'Distraction', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-500/20', border: 'border-purple-500/50' },
    { id: 'Impulsive decisions', icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-500/20', border: 'border-orange-500/50' }
  ];

  const fetchWeaknesses = async () => {
    try {
      const res = await api.weakness.getAll();
      if (res.data) {
        setLogs(res.data.logs || []);
        setStats(res.data.stats || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeaknesses();
  }, []);

  const handleLog = async (e) => {
    e.preventDefault();
    try {
      await api.weakness.log({ weaknessType: selectedType, intensity: Number(intensity), trigger });
      setTrigger('');
      setIntensity(5);
      fetchWeaknesses();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="relative h-10 w-10">
          <div className="absolute h-full w-full rounded-full border-4 border-navy-800"></div>
          <div className="absolute h-full w-full animate-spin rounded-full border-4 border-t-red-500 border-r-transparent border-b-transparent border-l-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-red-500/30 to-purple-500/30 rounded-lg blur-xl opacity-50"></div>
        <div className="relative flex flex-col md:flex-row items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/20 to-purple-500/20 border border-red-500/30">
            <BrainCircuit className="h-8 w-8 text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
          </div>
          <div>
            <h1 className="text-3xl md:text-5xl font-display font-black tracking-[0.3em] text-white uppercase drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]">Cognitive Profile</h1>
            <p className="text-xs text-red-400 font-bold uppercase tracking-[0.4em] mt-2">
              Outcompete Past Versions Of Yourself
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Logging Form */}
        <div className="lg:col-span-1 glass-panel p-6 rounded-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col relative overflow-hidden group hover:border-red-500/30 transition-all duration-500">
          <div className="absolute -right-20 -top-20 w-40 h-40 bg-red-500/10 rounded-full blur-3xl group-hover:bg-red-500/20 transition-all duration-700"></div>
          
          <h2 className="text-sm font-black uppercase tracking-widest text-white mb-6 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" /> Log Weakness Breach
          </h2>

          <form onSubmit={handleLog} className="space-y-5 relative z-10">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Breach Type</label>
              <div className="grid grid-cols-1 gap-2">
                {WEAKNESSES.map(w => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setSelectedType(w.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      selectedType === w.id 
                        ? `bg-white/10 ${w.border} ${w.color} shadow-[0_0_15px_rgba(0,0,0,0.2)]` 
                        : 'bg-transparent border-white/5 text-slate-400 hover:bg-white/5'
                    }`}
                  >
                    <w.icon className={`w-4 h-4 ${selectedType === w.id ? w.color : 'text-slate-500'}`} />
                    <span className="text-xs font-black uppercase tracking-wider">{w.id}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Intensity (1-10)</label>
                <span className="text-xs font-black text-white">{intensity}</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={intensity} 
                onChange={(e) => setIntensity(e.target.value)}
                className="w-full accent-red-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Trigger / Context</label>
              <textarea
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
                placeholder="What caused this? E.g. 'Got stuck on a bug and opened Twitter...'"
                className="w-full bg-navy-950/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all text-xs resize-none"
                rows="3"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(239,68,68,0.5)]"
            >
              <BarChart3 className="w-4 h-4" />
              Commit Log
            </button>
          </form>
        </div>

        {/* Analytics Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
            {WEAKNESSES.map(w => {
              const count = stats[w.id] || 0;
              return (
                <div key={w.id} className="glass-panel p-4 rounded-2xl border border-white/5 flex flex-col items-center text-center justify-center relative overflow-hidden group hover:border-white/10 transition-colors">
                  <div className={`absolute -inset-2 ${w.bg} opacity-0 group-hover:opacity-100 transition-opacity blur-xl rounded-full`} />
                  <w.icon className={`w-5 h-5 ${w.color} mb-2 relative z-10`} />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 relative z-10 line-clamp-1 break-all">{w.id.split(' ')[0]}</span>
                  <span className="text-2xl font-black text-white relative z-10 mt-1">{count}</span>
                </div>
              );
            })}
          </div>

          {/* Recent Logs */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" /> Breach History
              </h2>
            </div>
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {logs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs font-bold uppercase tracking-wider">
                  No cognitive breaches recorded yet.
                </div>
              ) : (
                [...logs].reverse().map(log => {
                  const weakInfo = WEAKNESSES.find(w => w.id === log.weaknessType) || WEAKNESSES[0];
                  return (
                    <div key={log._id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-white/10 transition-colors">
                      <div className={`p-3 rounded-lg ${weakInfo.bg} border ${weakInfo.border} shrink-0`}>
                        <weakInfo.icon className={`w-5 h-5 ${weakInfo.color}`} />
                      </div>
                        <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-black text-white">{log.weaknessType}</h4>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Intensity: {log.intensity}/10</span>
                        </div>
                        {log.trigger && (
                          <p className="text-xs text-slate-400 mt-1 font-medium truncate">{log.trigger}</p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs font-black text-white mt-0.5">
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CognitiveWeakness;
