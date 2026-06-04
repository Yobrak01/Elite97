import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Timer, Play, Square, ChevronDown, ChevronUp, BookOpen, GraduationCap, Dumbbell, Brush, Moon, Clock } from 'lucide-react';
import api from '../services/api';

const ACTIVITIES = [
  { key: 'personal_study', label: 'Study', icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30', glow: 'shadow-blue-500/20' },
  { key: 'lecture', label: 'Lecture', icon: GraduationCap, color: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-purple-500/30', glow: 'shadow-purple-500/20' },
  { key: 'gym', label: 'Gym', icon: Dumbbell, color: 'text-green-400', bg: 'bg-green-500/15', border: 'border-green-500/30', glow: 'shadow-green-500/20' },
  { key: 'chore', label: 'Chore', icon: Brush, color: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/30', glow: 'shadow-yellow-500/20' },
  { key: 'rest', label: 'Rest', icon: Moon, color: 'text-slate-400', bg: 'bg-slate-500/15', border: 'border-slate-500/30', glow: 'shadow-slate-500/20' }
];

const formatTime = (totalSeconds) => {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const formatMinutes = (mins) => {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

export const LiveTimer = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeLogId, setActiveLogId] = useState(null);
  const [activityType, setActivityType] = useState('personal_study');
  const [todayLogs, setTodayLogs] = useState([]);
  const [loadingAction, setLoadingAction] = useState(false);
  const intervalRef = useRef(null);

  // Fetch today's logs
  const fetchTodayLogs = useCallback(async () => {
    try {
      const res = await api.tracker.getTodayLogs();
      setTodayLogs(res.data || []);
    } catch (err) {
      console.error('Failed to fetch today logs:', err);
    }
  }, []);

  useEffect(() => {
    fetchTodayLogs();
  }, [fetchTodayLogs]);

  // Timer tick
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const handleStart = async () => {
    if (loadingAction) return;
    setLoadingAction(true);
    try {
      const res = await api.tracker.startTimer({ activityType });
      setActiveLogId(res.data?._id || res.data?.id);
      setElapsedSeconds(0);
      setIsRunning(true);
    } catch (err) {
      console.error('Failed to start timer:', err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleStop = async () => {
    if (loadingAction || !activeLogId) return;
    setLoadingAction(true);
    try {
      await api.tracker.stopTimer(activeLogId);
      setIsRunning(false);
      setActiveLogId(null);
      setElapsedSeconds(0);
      fetchTodayLogs();
    } catch (err) {
      console.error('Failed to stop timer:', err);
    } finally {
      setLoadingAction(false);
    }
  };

  const activeActivity = ACTIVITIES.find(a => a.key === activityType) || ACTIVITIES[0];
  const ActiveIcon = activeActivity.icon;

  // Aggregate today's logs by type
  const todaySummary = ACTIVITIES.map(act => {
    const totalMinutes = todayLogs
      .filter(log => log.activityType === act.key && log.duration)
      .reduce((sum, log) => sum + (log.duration || 0), 0);
    return { ...act, totalMinutes };
  }).filter(a => a.totalMinutes > 0);

  const totalTodayMinutes = todaySummary.reduce((sum, a) => sum + a.totalMinutes, 0);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Expanded Panel */}
      {isExpanded && (
        <div className="glass-panel w-80 rounded-2xl border border-white/10 p-5 space-y-4 animate-fade-in shadow-2xl shadow-black/40">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-accent-blue" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Live Tracker</span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {/* Timer Display */}
          <div className="text-center py-3">
            <div className={`text-4xl font-black tracking-wider tabular-nums ${isRunning ? activeActivity.color : 'text-white'} transition-colors`}>
              {formatTime(elapsedSeconds)}
            </div>
            {isRunning && (
              <p className={`mt-1 text-[10px] font-bold uppercase tracking-widest ${activeActivity.color}`}>
                {activeActivity.label} — In Progress
              </p>
            )}
          </div>

          {/* Activity Selector */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Activity Type</p>
            <div className="grid grid-cols-5 gap-1.5">
              {ACTIVITIES.map((act) => {
                const Icon = act.icon;
                const isSelected = activityType === act.key;
                return (
                  <button
                    key={act.key}
                    onClick={() => !isRunning && setActivityType(act.key)}
                    disabled={isRunning}
                    className={`flex flex-col items-center gap-1 rounded-xl p-2 text-[9px] font-bold uppercase tracking-wider transition-all ${
                      isSelected
                        ? `${act.bg} ${act.color} border ${act.border} shadow-lg ${act.glow}`
                        : 'text-slate-500 hover:bg-white/5 hover:text-slate-300 border border-transparent'
                    } ${isRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{act.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Start / Stop Button */}
          <div>
            {!isRunning ? (
              <button
                onClick={handleStart}
                disabled={loadingAction}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent-blue/20 border border-accent-blue/30 text-accent-blue hover:bg-accent-blue hover:text-white py-3 text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-accent-blue/10 disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                {loadingAction ? 'Starting...' : 'Start Session'}
              </button>
            ) : (
              <button
                onClick={handleStop}
                disabled={loadingAction}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white py-3 text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-red-500/10 disabled:opacity-50"
              >
                <Square className="h-4 w-4" />
                {loadingAction ? 'Stopping...' : 'Stop Session'}
              </button>
            )}
          </div>

          {/* Today's Summary */}
          {todaySummary.length > 0 && (
            <div className="space-y-2 border-t border-white/5 pt-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Today's Log</p>
                <span className="text-[10px] font-black text-accent-blue">{formatMinutes(totalTodayMinutes)} total</span>
              </div>
              <div className="space-y-1.5">
                {todaySummary.map((entry) => {
                  const Icon = entry.icon;
                  return (
                    <div key={entry.key} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-3.5 w-3.5 ${entry.color}`} />
                        <span className="text-xs font-semibold text-slate-300">{entry.label}</span>
                      </div>
                      <span className={`text-xs font-black ${entry.color}`}>{formatMinutes(entry.totalMinutes)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`group relative flex h-14 w-14 items-center justify-center rounded-2xl border transition-all duration-300 shadow-2xl ${
          isRunning
            ? `${activeActivity.bg} ${activeActivity.border} ${activeActivity.color} shadow-lg ${activeActivity.glow}`
            : 'glass-panel border-white/10 text-accent-blue hover:border-accent-blue/30 hover:shadow-lg hover:shadow-accent-blue/20'
        }`}
      >
        {isRunning ? (
          <div className="relative">
            <ActiveIcon className="h-6 w-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          </div>
        ) : isExpanded ? (
          <ChevronDown className="h-6 w-6" />
        ) : (
          <Timer className="h-6 w-6 group-hover:scale-110 transition-transform" />
        )}
      </button>
    </div>
  );
};

export default LiveTimer;
