import React, { useState, useEffect } from 'react';
import { Eye, TrendingUp, TrendingDown, Target, Brain, AlertTriangle, Cpu, Globe, Clock } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid } from 'recharts';
import api from '../services/api';

export const PredictiveOracle = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOracle = async () => {
      try {
        const res = await api.analytics.getOracleData();
        if (res.success) {
          setData(res.data);
        } else {
          setError(res.message || 'Failed to generate simulation.');
        }
      } catch (err) {
        console.error("Failed to fetch Oracle predictions", err);
        setError(err.message || 'Connection to Oracle failed.');
      } finally {
        setLoading(false);
      }
    };
    fetchOracle();
  }, []);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-red-500 font-bold bg-red-500/10 p-6 rounded-xl border border-red-500/30">
          Error: {error}
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="relative flex flex-col items-center justify-center space-y-4">
          <Brain className="h-16 w-16 animate-pulse text-cyan-500/50" />
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400 animate-pulse">Analyzing your recent study patterns...</div>
        </div>
      </div>
    );
  }

  const { timeline, trajectoryVector, projections, verdict, graphData } = data;
  const isDeclining = trajectoryVector < 0;
  const isAccelerating = trajectoryVector > 1.0;

  // Theming based on trajectory
  const theme = isDeclining 
    ? { color: 'red', text: 'text-red-500', glow: 'text-glow-red', border: 'border-red-500/30', bg: 'bg-red-500/10' }
    : isAccelerating
      ? { color: 'cyan', text: 'text-cyan-400', glow: 'text-glow-cyan', border: 'border-cyan-500/30', bg: 'bg-cyan-500/10' }
      : { color: 'amber', text: 'text-amber-500', glow: 'text-glow-gold', border: 'border-amber-500/30', bg: 'bg-amber-500/10' };

  return (
    <div className="space-y-6 animate-fade-in relative max-w-7xl mx-auto">
      {/* Background Ambience */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] blur-[150px] -z-10 rounded-full pointer-events-none transition-colors duration-1000 ${
        isDeclining ? 'bg-red-600/10' : isAccelerating ? 'bg-cyan-600/10' : 'bg-amber-600/10'
      }`} />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Brain className={`h-6 w-6 ${theme.text}`} />
            <h1 className={`text-3xl md:text-4xl font-display font-light tracking-[0.5em] uppercase ${theme.text} ${theme.glow}`}>
              THE ORACLE (AI ADVISOR)
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest pl-9">
            AI-Powered Performance & Focus Extrapolation
          </p>
        </div>
        
        <div className={`glass-panel p-4 rounded-2xl border flex flex-col items-end gap-1 shadow-lg transition-colors ${theme.border} ${
          isDeclining ? 'shadow-[0_0_30px_rgba(239,68,68,0.15)]' : isAccelerating ? 'shadow-[0_0_30px_rgba(6,182,212,0.15)]' : 'shadow-[0_0_30px_rgba(245,158,11,0.15)]'
        }`}>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Time Until Deadline</p>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-white" />
            <p className="text-xl font-black text-white">{timeline.timeRemainingStr}</p>
          </div>
          <p className="text-[10px] font-bold text-slate-400 mt-1">Semester Ends: {timeline.endDate}</p>
        </div>
      </div>

      {/* The Verdict Box */}
      <div className={`glass-panel rounded-3xl p-8 border relative overflow-hidden transition-colors ${theme.border} ${theme.bg}`}>
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Brain className="w-48 h-48" />
        </div>
        <div className="relative z-10 max-w-4xl">
          <h2 className={`text-xs font-black uppercase tracking-[0.4em] mb-4 ${theme.text}`}>Mentor's Verdict</h2>
          <p className="text-xl md:text-2xl font-light leading-relaxed text-white tracking-wide">
            {verdict}
          </p>
        </div>
      </div>

      {/* Consequence Matrix */}
      <div className="grid gap-6 md:grid-cols-3 pt-4">
        {/* Trajectory Vector */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Focus Momentum</h3>
            {isDeclining ? <TrendingDown className="w-4 h-4 text-red-500" /> : <TrendingUp className="w-4 h-4 text-cyan-400" />}
          </div>
          <p className={`text-4xl font-black ${theme.text}`}>
            {trajectoryVector > 0 ? '+' : ''}{trajectoryVector}
          </p>
          <p className="text-xs text-slate-400 mt-2 font-semibold">Your daily focus momentum based on recent habits.</p>
        </div>

        {/* Global Matrix Consequence */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Predicted Class Standing</h3>
            <Globe className="w-4 h-4 text-white" />
          </div>
          <p className="text-4xl font-black text-white relative z-10">
            #{projections.rank}
          </p>
          <p className="text-xs text-slate-400 mt-2 font-semibold relative z-10">Where you will stand in {timeline.timeRemainingStr}.</p>
          
          {/* Subtle background graph for rank dropping */}
          {isDeclining && (
             <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-red-500/20 to-transparent pointer-events-none" />
          )}
        </div>

        {/* System Failure Consequence */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Burnout Risk Horizon</h3>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className={`text-4xl font-black ${projections.burnoutHorizon && projections.burnoutHorizon.includes('Critical') ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            {projections.burnoutHorizon}
          </p>
          <p className="text-xs text-slate-400 mt-2 font-semibold">Estimated time before fatigue compromises performance.</p>
        </div>
      </div>

      {/* Futuristic Trajectory Chart */}
      <div className="glass-panel rounded-3xl p-6 border border-white/5 mt-6 h-[400px]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Focus Trend Analysis</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Reviewing your past 2 weeks to guide the next 2 weeks</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height="85%">
          <AreaChart data={graphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorHistorical" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isDeclining ? '#ef4444' : isAccelerating ? '#06b6d4' : '#f59e0b'} stopOpacity={0.4}/>
                <stop offset="95%" stopColor={isDeclining ? '#ef4444' : isAccelerating ? '#06b6d4' : '#f59e0b'} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
            <XAxis 
              dataKey="day" 
              stroke="#ffffff30" 
              fontSize={10}
              tickFormatter={(val) => val && typeof val === 'string' ? val.substring(5) : val} // MM-DD
              tick={{fill: '#94a3b8'}}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis 
              stroke="#ffffff30" 
              fontSize={10}
              tick={{fill: '#94a3b8'}}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '0.75rem' }}
              itemStyle={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 'bold' }}
              labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '4px' }}
            />
            
            {/* Historical Area */}
            <Area 
              type="monotone" 
              dataKey="focus" 
              stroke="#3b82f6" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorHistorical)" 
              name="Historical Focus"
            />
            
            {/* Projected Area */}
            <Area 
              type="monotone" 
              dataKey="projectedFocus" 
              stroke={isDeclining ? '#ef4444' : isAccelerating ? '#06b6d4' : '#f59e0b'} 
              strokeWidth={3}
              strokeDasharray="5 5"
              fillOpacity={1} 
              fill="url(#colorProjected)" 
              name="Projected Trajectory"
            />

            {/* Separator Line for "Today" */}
            <ReferenceLine 
              x={graphData.find(d => d.type === 'projection')?.day} 
              stroke="#ffffff40" 
              strokeDasharray="3 3"
              label={{ position: 'top', value: 'TODAY', fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};

export default PredictiveOracle;
