import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Calendar, BarChart3, TrendingUp, Cpu, Target, Award, GraduationCap, Globe } from 'lucide-react';
import api from '../services/api';

export const Analytics = () => {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gpaData, setGpaData] = useState(null);
  const [mitRanking, setMitRanking] = useState(null);

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

    const fetchGpa = async () => {
      try {
        const res = await api.analytics.getGpa();
        setGpaData(res.data);
      } catch (err) {
        console.error('GPA fetch error:', err);
      }
    };
    fetchGpa();

    const fetchMitRanking = async () => {
      try {
        const res = await api.analytics.getMitRanking();
        setMitRanking(res.data);
      } catch (err) {
        console.error('MIT ranking fetch error:', err);
      }
    };
    fetchMitRanking();
  }, []);

  const formattedData = trends.map(t => {
    const d = new Date(t.date);
    return {
      ...t,
      dateFormatted: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
  });

  // Calculate averages for the radar chart
  const radarData = formattedData.length > 0 ? [
    { subject: 'Productivity', A: Math.round(formattedData.reduce((acc, val) => acc + val.productivityScore, 0) / formattedData.length), fullMark: 100 },
    { subject: 'Focus Level', A: Math.round(formattedData.reduce((acc, val) => acc + val.focusScore, 0) / formattedData.length), fullMark: 100 },
    { subject: 'Completion %', A: Math.round(formattedData.reduce((acc, val) => acc + val.completionPercentage, 0) / formattedData.length), fullMark: 100 },
    { subject: 'Discipline', A: 85, fullMark: 100 }, // Simulated based on system metrics
    { subject: 'Resilience', A: Math.round(100 - (formattedData.reduce((acc, val) => acc + val.burnoutRisk, 0) / formattedData.length)), fullMark: 100 },
  ] : [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel p-3 border border-white/10 rounded-xl shadow-2xl bg-navy-950/90 backdrop-blur-md">
          <p className="text-xs font-bold text-white mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center gap-2 text-xs font-medium">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-300">{entry.name}:</span>
              <span className="text-white font-black">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-wider text-white">DEEP ANALYTICS REPORT</h1>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mt-1">
            Extended operational analytics and cognitive vectors.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Productivity score trend */}
        <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-4 lg:col-span-2">
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
                  <defs>
                    <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="dateFormatted" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" name="Productivity" dataKey="productivityScore" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Radar Performance Chart */}
        <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white">Cognitive Profiling</h3>
          </div>
          <div className="h-64 w-full">
            {radarData.length === 0 ? (
               <div className="flex h-full items-center justify-center text-xs text-slate-500 font-semibold">
                 Insufficient Data
               </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Performance" dataKey="A" stroke="#a855f7" fill="#a855f7" fillOpacity={0.4} />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Burnout Risk Trend */}
        <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-4 lg:col-span-2">
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
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="dateFormatted" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                  <Line name="Burnout Index" type="monotone" dataKey="burnoutRisk" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                  <Line name="Focus Level" type="monotone" dataKey="focusScore" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Study Hours Trend */}
        <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-cyan-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white">Study Duration</h3>
          </div>
          <div className="h-72 w-full">
            {formattedData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-500 font-semibold">
                No logs recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="dateFormatted" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar name="Hours" dataKey="studyHours" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* GPA & MIT Ranking Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* GPA Trajectory Card */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-5">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-emerald-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white">GPA Trajectory</h3>
          </div>

          {gpaData ? (
            <div className="flex items-center gap-8">
              {/* Circular Progress */}
              <div className="relative flex h-36 w-36 shrink-0 items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                  <circle
                    cx="60" cy="60" r="52" fill="none"
                    stroke="url(#gpaGradient)" strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${((gpaData.semesterGpa || gpaData.predictedGpa || 0) / 4.0) * 326.73} 326.73`}
                  />
                  <defs>
                    <linearGradient id="gpaGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute text-center">
                  <p className="text-3xl font-black text-white">{(gpaData.semesterGpa || gpaData.predictedGpa || 0).toFixed(2)}</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Semester</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex-1 space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Cumulative GPA</p>
                  <p className="text-2xl font-black text-cyan-400">{(gpaData.cumulativeGpa || gpaData.cumGpa || 0).toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Target</p>
                  <p className="text-lg font-black text-emerald-400">4.00</p>
                </div>
                <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-700"
                    style={{ width: `${((gpaData.cumulativeGpa || gpaData.cumGpa || 0) / 4.0) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-36 items-center justify-center text-xs text-slate-500 font-semibold">
              Loading GPA data...
            </div>
          )}
        </div>

        {/* MIT Global Ranking Card */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-5">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-accent-blue" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white">MIT Global Ranking</h3>
          </div>

          {mitRanking ? (
            <div className="space-y-5">
              {/* Percentile Display */}
              <div className="text-center py-2">
                <p className="text-5xl font-black text-white">
                  {mitRanking.percentile || 0}<span className="text-2xl text-accent-blue">%</span>
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Global Percentile</p>
              </div>

              {/* Gradient Progress Bar */}
              <div className="h-3 w-full rounded-full bg-white/5 overflow-hidden relative">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 to-cyan-400 transition-all duration-700"
                  style={{ width: `${mitRanking.percentile || 0}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-5 w-1 bg-white rounded-full shadow-lg shadow-white/50 transition-all duration-700"
                  style={{ left: `${mitRanking.percentile || 0}%` }}
                />
              </div>

              {/* Scoring Vectors */}
              <div className="space-y-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Scoring Vectors</p>
                {[
                  { label: 'Study Hours', value: mitRanking.vectors?.hours || mitRanking.hours || 0, color: 'from-blue-500 to-cyan-400' },
                  { label: 'Focus Score', value: mitRanking.vectors?.focus || mitRanking.focus || 0, color: 'from-purple-500 to-pink-400' },
                  { label: 'Completion Rate', value: mitRanking.vectors?.completion || mitRanking.completion || 0, color: 'from-green-500 to-emerald-400' },
                  { label: 'Productivity', value: mitRanking.vectors?.productivity || mitRanking.productivity || 0, color: 'from-orange-500 to-yellow-400' }
                ].map((vector) => (
                  <div key={vector.label} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{vector.label}</span>
                      <span className="text-xs font-black text-white">{vector.value}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${vector.color} transition-all duration-500`}
                        style={{ width: `${vector.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-36 items-center justify-center text-xs text-slate-500 font-semibold">
              Loading ranking data...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default Analytics;
