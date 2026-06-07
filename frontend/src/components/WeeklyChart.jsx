import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const WeeklyChart = ({ data = [] }) => {
  const customTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel rounded-xl p-3 border border-white/10 text-xs shadow-glow-cyan/20">
          <p className="font-bold text-white mb-1">{payload[0].payload.dayName || 'Date'}</p>
          <p className="text-cyan-400 font-semibold">Hours: {payload[0].value} hrs</p>
          {payload[1] && <p className="text-blue-400 font-semibold">Focus: {payload[1].value}%</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col space-y-4">
      <div>
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">Weekly Performance Vectors</h3>
        <p className="text-xs text-slate-500 font-semibold">Aggregated study cycles and cognitive focus values.</p>
      </div>

      <div className="h-64 w-full">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-500">
            No study sessions logged this week.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis
                dataKey="dayName"
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={customTooltip} />
              <Area
                type="monotone"
                dataKey="studyHours"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorHours)"
              />
              <Area
                type="monotone"
                dataKey="focusScore"
                stroke="#06b6d4"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorFocus)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
export default WeeklyChart;

