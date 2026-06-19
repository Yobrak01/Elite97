import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle2, ChevronRight, Activity, Trash2 } from 'lucide-react';
import api from '../services/api';

export const WeeklyHistoryTable = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await api.tracker.getWeeklyLogs();
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleDeleteLog = async (id) => {
    if (!window.confirm("Are you sure you want to delete this log?")) return;
    try {
      await api.tracker.deleteLog(id);
      fetchLogs();
      window.dispatchEvent(new CustomEvent('time-logged')); // Trigger recalculation in other components
    } catch (err) {
      console.error('Failed to delete log:', err);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel rounded-3xl p-8 border border-white/5 animate-pulse h-64 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-cyan-500 border-r-transparent border-b-transparent border-l-transparent"></div>
      </div>
    );
  }

  // Group logs by day
  const groupedLogs = {};
  logs.forEach(log => {
    const d = new Date(log.date);
    const dateStr = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    if (!groupedLogs[dateStr]) groupedLogs[dateStr] = [];
    groupedLogs[dateStr].push(log);
  });

  const getFormatTime = (isoString) => {
    if (!isoString) return 'Unknown';
    return new Date(isoString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'personal_study': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'lecture': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'group_discussion': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'gym': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'chore': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'rest': return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
      case 'override_success': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'override_breach': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
    }
  };

  return (
    <div className="bg-navy-900/60 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_10px_50px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-700 mt-6">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-cyan-400" />
            7-Day Operations Log
          </h3>
          <p className="text-xs text-slate-400 font-semibold mt-1">Raw telemetry data of all tracked sessions.</p>
        </div>
      </div>
      
      {Object.keys(groupedLogs).length === 0 ? (
        <div className="p-8 text-center text-slate-500 text-sm font-bold">No operations logged in the last 7 days.</div>
      ) : (
        <div className="p-0 max-h-[600px] overflow-y-auto overflow-x-hidden custom-scrollbar">
          {Object.entries(groupedLogs).map(([dateStr, dayLogs]) => (
            <div key={dateStr} className="border-b border-white/5 last:border-0">
              <div className="bg-white/[0.02] px-6 py-3 border-y border-white/5 flex items-center gap-2">
                <p className="text-xs font-black uppercase tracking-widest text-slate-300">{dateStr}</p>
                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
              </div>
              <div className="divide-y divide-white/5">
                {dayLogs.map((log) => (
                  <div key={log._id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className={`px-3 py-1.5 rounded border text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${getActivityColor(log.activityType)}`}>
                        {log.activityType.replace('_', ' ')}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">{log.description || 'General Session'}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-medium">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {getFormatTime(log.startTime)} - {getFormatTime(log.endTime)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 sm:justify-end">
                      <div className="text-right">
                        <p className="text-xl font-black text-white">{log.durationMinutes}<span className="text-xs text-slate-500 ml-1">min</span></p>
                      </div>
                      <button
                        onClick={() => handleDeleteLog(log._id || log.id)}
                        className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete Log"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WeeklyHistoryTable;
