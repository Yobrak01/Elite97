import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export const StudyBreakdownChart = ({ trackerWeekly }) => {
  if (!trackerWeekly || !trackerWeekly.dailyBreakdown) {
    return (
      <div className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col h-full">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">Activity Breakdown</h3>
          <p className="text-xs text-slate-500 font-semibold">Loading data...</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-cyan-500 border-r-transparent border-b-transparent border-l-transparent"></div>
        </div>
      </div>
    );
  }

  const { dailyBreakdown } = trackerWeekly;

  // Format data for Recharts Stacked Bar
  // We need flat objects like: { date: 'Mon', personal_study: 2.5, lecture: 1.0, group_discussion: 0.5 }
  const formattedData = dailyBreakdown.map(day => {
    // Parse the date to get a short weekday
    const dateObj = new Date(day._id);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

    const dataPoint = { dayName };
    
    // Convert minutes to hours for plotting
    day.activities.forEach(act => {
      dataPoint[act.activityType] = Number((act.totalMinutes / 60).toFixed(2));
    });

    return dataPoint;
  });

  // Calculate totals for the header stats
  const totals = {
    personal: 0,
    lecture: 0,
    discussion: 0,
    total: 0
  };

  trackerWeekly.summary.forEach(sum => {
    if (sum._id === 'personal_study') totals.personal = Number((sum.totalMinutes / 60).toFixed(1));
    if (sum._id === 'lecture') totals.lecture = Number((sum.totalMinutes / 60).toFixed(1));
    if (sum._id === 'group_discussion') totals.discussion = Number((sum.totalMinutes / 60).toFixed(1));
  });
  totals.total = trackerWeekly.grandTotalHours;

  const customTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel rounded-xl p-3 border border-white/10 text-xs shadow-glow-cyan/20 min-w-[120px]">
          <p className="font-bold text-white mb-2 pb-1 border-b border-white/10">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex justify-between items-center gap-4 my-1">
              <span style={{ color: entry.color }} className="font-semibold capitalize">
                {entry.name.replace('_', ' ')}
              </span>
              <span className="text-white font-bold">{entry.value}h</span>
            </div>
          ))}
          <div className="flex justify-between items-center gap-4 mt-2 pt-1 border-t border-white/10">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Total</span>
            <span className="text-white font-black">
              {payload.reduce((sum, entry) => sum + entry.value, 0).toFixed(2)}h
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">Study Breakdown Matrix</h3>
          <p className="text-xs text-slate-500 font-semibold">Granular analysis of cognitive investment</p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-[9px] font-black uppercase tracking-widest text-blue-400">Personal</p>
            <p className="text-sm font-black text-white">{totals.personal}h</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black uppercase tracking-widest text-purple-400">Lecture</p>
            <p className="text-sm font-black text-white">{totals.lecture}h</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black uppercase tracking-widest text-orange-400">Discussion</p>
            <p className="text-sm font-black text-white">{totals.discussion}h</p>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        {formattedData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-500">
            No activity logged this week.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
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
              <Tooltip content={customTooltip} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
              <Legend 
                wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} 
                iconType="circle"
              />
              <Bar dataKey="personal_study" name="Personal Study" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} />
              <Bar dataKey="lecture" name="Lecture" stackId="a" fill="#a855f7" />
              <Bar dataKey="group_discussion" name="Discussion" stackId="a" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default StudyBreakdownChart;
