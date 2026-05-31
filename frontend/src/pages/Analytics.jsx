import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Calendar, BarChart3, TrendingUp, Cpu } from 'lucide-react';
import api from '../services/api';

export const Analytics = () => {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const res = await api.analytics.getTrends();
        setTrends(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrends();
  }, []);

  const formattedData = trends.map(t => {
    const d = new Date(t.date);
    return {
      ...t,
      dateFormatted: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
  });

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="relative h-10 w-10">
          <div className="absolute h-full w-full rounded-full border-4 border-navy-800"></div>
          <div className="absolute h-full w-full animate-spin rounded-full border-4 border-t-accent-blue border-r-transparent border-b-transparent border-l-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-b border-white/5 pb-4">
        <h1 className="text-2xl font-black tracking-wider text-white">DEEP ANALYTICS REPORT</h1>
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mt-1">
          Extended operational analytics and cognitive vectors.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Productivity score trend */}
        <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-4">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-accent-blue" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white">Productivity Vector (30 Days)</h3>
          </div>
          <div className="h-64 w-full">
            {formattedData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-500 font-semibold">
                No logs recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="dateFormatted" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: '#0a0e1a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '10px' }} />
                  <Line type="monotone" dataKey="productivityScore" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Study Hours Trend */}
        <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-cyan-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white">Study Duration Cycles (30 Days)</h3>
          </div>
          <div className="h-64 w-full">
            {formattedData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-500 font-semibold">
                No logs recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="dateFormatted" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0a0e1a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '10px' }} />
                  <Bar dataKey="studyHours" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Burnout Risk Trend */}
        <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-4 md:col-span-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-red-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white">Burnout Index vs Focus Score Analysis</h3>
          </div>
          <div className="h-72 w-full">
            {formattedData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-500 font-semibold">
                No logs recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="dateFormatted" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0a0e1a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '10px' }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Line name="Burnout Index" type="monotone" dataKey="burnoutRisk" stroke="#ef4444" strokeWidth={2} dot={false} />
                  <Line name="Focus Level" type="monotone" dataKey="focusScore" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Analytics;
