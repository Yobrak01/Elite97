import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Timer, Play, Square, Pause, Trash2, ChevronDown, ChevronUp, BookOpen, GraduationCap, Dumbbell, Brush, Moon, Clock, Check, Users, Briefcase } from 'lucide-react';
import api from '../services/api';

const ACTIVITIES = [
  { key: 'personal_study', label: 'Study', icon: BookOpen, color: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/30', glow: 'shadow-yellow-500/20' },
  { key: 'group_discussion', label: 'Group', icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30', glow: 'shadow-blue-500/20' },
  { key: 'project', label: 'Project', icon: Briefcase, color: 'text-indigo-400', bg: 'bg-indigo-600/15', border: 'border-indigo-600/30', glow: 'shadow-orange-500/20' },
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
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('elite97_timer_pos');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return { right: 24, bottom: 24 };
  });
  const positionRef = useRef(position);
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const offsetRef = useRef({ x: 0, y: 0 });
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeLogId, setActiveLogId] = useState(null);
  const [activityType, setActivityType] = useState('personal_study');
  const [manualMode, setManualMode] = useState(false);
  const [manualDuration, setManualDuration] = useState('');
  const [todayLogs, setTodayLogs] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);
  const [pendingFocusLogId, setPendingFocusLogId] = useState(null); // log awaiting focus rating
  const [postStopFocus, setPostStopFocus] = useState(75);
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

  const fetchCourses = useCallback(async () => {
    try {
      const res = await api.courses.getAll();
      setCourses(res.data || []);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    }
  }, []);

  useEffect(() => {
    fetchTodayLogs();
    fetchCourses();
  }, [fetchTodayLogs, fetchCourses]);

  const dragStartRef = useRef({ pointerX: 0, pointerY: 0, initialRight: 0, initialBottom: 0 });
  const WIDGET_SIZE = 56; // ~h-14 w-14 in px

  const handlePointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    // Use currentTarget (the button), not target (could be child SVG icon)
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    setHasMoved(false);
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      initialRight: positionRef.current.right,
      initialBottom: positionRef.current.bottom
    };
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    setHasMoved(true);
    const deltaX = dragStartRef.current.pointerX - e.clientX;
    const deltaY = dragStartRef.current.pointerY - e.clientY;
    // Clamp so widget stays within the viewport
    const maxRight = window.innerWidth - WIDGET_SIZE;
    const maxBottom = window.innerHeight - WIDGET_SIZE;
    const newPos = {
      right: Math.min(Math.max(dragStartRef.current.initialRight + deltaX, 0), maxRight),
      bottom: Math.min(Math.max(dragStartRef.current.initialBottom + deltaY, 0), maxBottom)
    };
    setPosition(newPos);
    positionRef.current = newPos;
  };

  const handlePointerUp = (e) => {
    if (isDragging) {
      setIsDragging(false);
      e.currentTarget.releasePointerCapture(e.pointerId);
      localStorage.setItem('elite97_timer_pos', JSON.stringify(positionRef.current));
    }
  };

  // Restore running timer if one exists in today's logs
  useEffect(() => {
    const activeLog = todayLogs.find(log => !log.endTime && log.startTime);
    if (activeLog && !isRunning && !isPaused) {
      setActiveLogId(activeLog._id || activeLog.id);
      setActivityType(activeLog.activityType);
      
      let elapsed = activeLog.accumulatedSeconds || 0;
      if (!activeLog.isPaused) {
        const resumeTime = activeLog.lastResumeTime ? new Date(activeLog.lastResumeTime) : new Date(activeLog.startTime);
        elapsed += Math.floor((Date.now() - resumeTime.getTime()) / 1000);
      }
      setElapsedSeconds(elapsed > 0 ? elapsed : 0);
      
      setIsPaused(activeLog.isPaused || false);
      setIsRunning(!activeLog.isPaused);
    }
  }, [todayLogs, isRunning, isPaused]);

  // Timer tick
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, isPaused]);

  const handleStart = useCallback(async (overrideType = null, description = null) => {
    if (loadingAction) return;
    setLoadingAction(true);
    
    // Support passing in a type directly, especially for event listeners
    const typeToUse = typeof overrideType === 'string' ? overrideType : activityType;
    if (typeof overrideType === 'string' && overrideType !== activityType) {
      setActivityType(overrideType);
    }
    
    const finalDesc = description || customDescription || (selectedCourse ? `[Unit: ${selectedCourse}]` : undefined);

    try {
      const res = await api.tracker.startTimer({ activityType: typeToUse, description: finalDesc });
      setActiveLogId(res.data?._id || res.data?.id);
      setElapsedSeconds(0);
      setIsPaused(false);
      setIsRunning(true);
    } catch (err) {
      console.error('Failed to start timer:', err);
    } finally {
      setLoadingAction(false);
    }
  }, [loadingAction, activityType, selectedCourse]);

  useEffect(() => {
    const handleStartTimerEvent = async (e) => {
      const { type, name } = e.detail;
      setIsExpanded(true);
      
      if (!isRunning) {
        handleStart(type, name);
      }
    };

    window.addEventListener('start-timer', handleStartTimerEvent);
    return () => window.removeEventListener('start-timer', handleStartTimerEvent);
  }, [isRunning, handleStart]);

  const handleStop = async () => {
    if (loadingAction || !activeLogId) return;
    setLoadingAction(true);
    try {
      await api.tracker.stopTimer(activeLogId);
      setIsRunning(false);
      setIsPaused(false);
      // Show focus rating panel instead of immediately resetting
      setPendingFocusLogId(activeLogId);
      setPostStopFocus(75);
      setActiveLogId(null);
      setElapsedSeconds(0);
      fetchTodayLogs();
    } catch (err) {
      console.error('Failed to stop timer:', err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSaveFocus = async () => {
    if (!pendingFocusLogId) return;
    setLoadingAction(true);
    try {
      await api.tracker.logFocus(pendingFocusLogId, postStopFocus);
    } catch (err) {
      console.error('Failed to save focus score:', err);
    } finally {
      setPendingFocusLogId(null);
      window.dispatchEvent(new CustomEvent('time-logged'));
      setLoadingAction(false);
    }
  };

  const handleSkipFocus = () => {
    setPendingFocusLogId(null);
    window.dispatchEvent(new CustomEvent('time-logged'));
  };

  const handlePause = async () => {
    if (loadingAction || !activeLogId || isPaused) return;
    setLoadingAction(true);
    try {
      await api.tracker.pauseTimer(activeLogId);
      setIsPaused(true);
      setIsRunning(false);
    } catch (err) {
      console.error('Failed to pause timer:', err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleResume = async () => {
    if (loadingAction || !activeLogId || !isPaused) return;
    setLoadingAction(true);
    try {
      await api.tracker.resumeTimer(activeLogId);
      setIsPaused(false);
      setIsRunning(true);
    } catch (err) {
      console.error('Failed to resume timer:', err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeleteLog = async (id) => {
    if (!window.confirm("Are you sure you want to delete this log?")) return;
    try {
      await api.tracker.deleteLog(id);
      fetchTodayLogs();
      window.dispatchEvent(new CustomEvent('time-logged'));
    } catch (err) {
      console.error('Failed to delete log:', err);
    }
  };

  const handleManualLog = async () => {
    if (loadingAction || !manualDuration || Number(manualDuration) <= 0) return;
    setLoadingAction(true);
    const finalDesc = customDescription || (selectedCourse ? `[Unit: ${selectedCourse}]` : undefined);
    try {
      const res = await api.tracker.manualLog({
        activityType,
        durationMinutes: Number(manualDuration),
        description: finalDesc,
        allowOverlap: true // Fix: allow overlapping manual logs so long sleep/rest doesn't get silently rejected
      });
      setManualDuration('');
      const newLogId = res.data?._id || res.data?.id;
      if (newLogId && ['personal_study', 'lecture', 'group_discussion', 'project'].includes(activityType)) {
        // Show focus rating panel for study-related activities
        setPendingFocusLogId(newLogId);
        setPostStopFocus(75);
      } else {
        // Non-study activities don't need focus rating, dispatch immediately
        window.dispatchEvent(new CustomEvent('time-logged'));
      }
    } catch (err) {
      console.error('Failed to log manually:', err);
      alert(err.message || 'Failed to log time. Please try again.');
    } finally {
      setLoadingAction(false);
    }
  };


  const activeActivity = ACTIVITIES.find(a => a.key === activityType) || ACTIVITIES[0];
  const ActiveIcon = activeActivity.icon;

  const todaySummary = ACTIVITIES.map(act => {
    const totalMinutes = todayLogs
      .filter(log => log.activityType === act.key)
      .reduce((sum, log) => {
        // Include live elapsed time for the currently running session
        if (!log.endTime && log.startTime && !log.isPaused) {
          const resumeTime = log.lastResumeTime ? new Date(log.lastResumeTime) : new Date(log.startTime);
          const liveSeconds = (log.accumulatedSeconds || 0) + Math.max(0, (Date.now() - resumeTime.getTime()) / 1000);
          return sum + Math.round(liveSeconds / 60);
        } else if (!log.endTime && log.isPaused) {
          return sum + Math.round((log.accumulatedSeconds || 0) / 60);
        }
        return sum + (log.durationMinutes || 0);
      }, 0);
    return { ...act, totalMinutes };
  }).filter(a => a.totalMinutes > 0);

  const totalTodayMinutes = todaySummary.reduce((sum, a) => sum + a.totalMinutes, 0);

  return (
    <div 
      className="fixed z-50 flex flex-col items-end gap-3"
      style={{ right: `${position.right}px`, bottom: `${position.bottom}px` }}
    >
      {/* Expanded Panel */}
      {isExpanded && (
        <div className="glass-panel w-80 rounded-2xl border border-white/10 p-5 space-y-4 animate-fade-in shadow-2xl shadow-black/40">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-cyan-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">
                {manualMode ? 'Manual Log' : 'Live Tracker'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => !isRunning && setManualMode(!manualMode)}
                disabled={isRunning}
                className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded transition-colors ${
                  manualMode ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:text-white'
                } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Manual
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Timer / Input Display */}
          <div className="text-center py-3">
            {manualMode ? (
              <div className="flex flex-col items-center gap-2">
                <input
                  type="number"
                  min="1"
                  placeholder="Minutes"
                  value={manualDuration}
                  onChange={(e) => setManualDuration(e.target.value)}
                  className="w-32 bg-navy-900 border border-white/10 rounded-xl px-4 py-3 text-2xl font-black text-center text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
                <p className={`text-[10px] font-bold uppercase tracking-widest ${activeActivity.color}`}>
                  {activeActivity.label}
                </p>
              </div>
            ) : (
              <>
                <div className={`text-4xl font-black tracking-wider tabular-nums ${isRunning ? activeActivity.color : 'text-white'} transition-colors`}>
                  {formatTime(elapsedSeconds)}
                </div>
                {isRunning && (
                  <p className={`mt-1 text-[10px] font-bold uppercase tracking-widest ${activeActivity.color}`}>
                    {activeActivity.label} — In Progress
                  </p>
                )}
              </>
            )}
          </div>

          {/* Activity Selector */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Activity Type</p>
            <div className="grid grid-cols-4 gap-1.5">
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
          
          {/* Course Unit Selector */}
          {(!isRunning && (activityType === 'personal_study' || activityType === 'lecture' || activityType === 'group_discussion' || activityType === 'project')) && (
            <div className="space-y-2 animate-fade-in">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Course Unit (Optional)</p>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full rounded-xl bg-navy-900 border border-white/5 py-2.5 px-4 text-xs text-white focus:outline-none focus:border-cyan-500/30 transition-colors"
              >
                <option value="">-- No specific unit --</option>
                {courses.map(c => (
                  <option key={c._id} value={c.unitCode}>{c.unitCode} - {c.unitName}</option>
                ))}
              </select>
            </div>
          )}

          {/* Custom Activity Name */}
          {!isRunning && (
            <div className="space-y-2 animate-fade-in">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Activity Name (Optional)</p>
              <input
                type="text"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder={activityType === 'gym' ? 'e.g. Chest & Triceps' : activityType === 'chore' ? 'e.g. Groceries' : 'Specific topic or task...'}
                className="w-full rounded-xl bg-navy-900 border border-white/5 py-2.5 px-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/30 transition-colors"
              />
            </div>
          )}

          {/* Start / Stop / Log Button */}
          <div className="flex gap-2">
            {manualMode ? (
              <button
                onClick={handleManualLog}
                disabled={loadingAction || !manualDuration || Number(manualDuration) <= 0}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent-blue/20 border border-accent-blue/30 text-accent-blue hover:bg-accent-blue hover:text-white py-3 text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-accent-blue/10 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                {loadingAction ? 'Saving...' : 'Log Time'}
              </button>
            ) : !isRunning && !isPaused ? (
              <button
                onClick={handleStart}
                disabled={loadingAction}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500 hover:text-white py-3 text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-accent-gold/10 disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                {loadingAction ? 'Starting...' : 'Start Session'}
              </button>
            ) : (
              <>
                <button
                  onClick={isPaused ? handleResume : handlePause}
                  disabled={loadingAction}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500 hover:text-white py-3 text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-yellow-500/10 disabled:opacity-50"
                >
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
                <button
                  onClick={handleStop}
                  disabled={loadingAction}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white py-3 text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-red-500/10 disabled:opacity-50"
                >
                  <Square className="h-4 w-4" />
                  {loadingAction ? 'Stopping...' : 'Stop'}
                </button>
              </>
            )}
          </div>

          {/* Post-Stop Focus Rating Panel */}
          {pendingFocusLogId && (
            <div className="space-y-3 border border-cyan-500/20 bg-cyan-500/5 rounded-2xl p-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Rate Your Focus</p>
                <span className="text-xl font-black text-cyan-400">{postStopFocus}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={postStopFocus}
                onChange={(e) => setPostStopFocus(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
              <div className="flex justify-between text-[9px] text-slate-600 font-bold uppercase tracking-widest">
                <span>Distracted</span><span>Moderate</span><span>Flow State</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSkipFocus}
                  className="flex-1 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={handleSaveFocus}
                  disabled={loadingAction}
                  className="flex-1 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                >
                  {loadingAction ? 'Saving...' : 'Save Focus'}
                </button>
              </div>
            </div>
          )}

          {/* Today's Summary */}
          {todaySummary.length > 0 && (
            <div className="space-y-2 border-t border-white/5 pt-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Today's Log</p>
                <span className="text-[10px] font-black text-cyan-400">{formatMinutes(totalTodayMinutes)} total</span>
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
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={() => {
          if (!hasMoved) setIsExpanded(!isExpanded);
        }}
        style={{ touchAction: 'none', userSelect: 'none' }}
        className={`group relative flex h-14 w-14 items-center justify-center rounded-2xl border transition-all duration-300 shadow-2xl cursor-move ${
          isRunning
            ? `${activeActivity.bg} ${activeActivity.border} ${activeActivity.color} shadow-lg ${activeActivity.glow}`
            : 'glass-panel border-white/10 text-cyan-400 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-accent-gold/20'
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

