import React, { useState, useEffect } from 'react';
import { Calendar, Cpu, Sparkles, CheckCircle2, X } from 'lucide-react';
import api from '../services/api';
import ScheduleBlock from '../components/ScheduleBlock';
import ModeSelector from '../components/ModeSelector';

export const Planner = () => {
  const [plan, setPlan] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchPlanData = async () => {
    try {
      const [planRes, recRes] = await Promise.all([
        api.planner.getDaily(),
        api.planner.getRecommendations()
      ]);
      setPlan(planRes);
      setRecommendations(recRes.recommendations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanData();
  }, []);

  const handleGeneratePlan = async () => {
    setActionLoading(true);
    try {
      await api.planner.generate();
      await fetchPlanData();
      showToast('Daily plan generated successfully.', 'success');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to generate plan.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    setActionLoading(true);
    try {
      await api.tasks.complete(taskId, {});
      await fetchPlanData();
      showToast('Task marked complete.', 'success');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to complete task.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartTask = async (taskId) => {
    setActionLoading(true);
    try {
      await api.tasks.start(taskId);
      await fetchPlanData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAttendLecture = async (block) => {
    setActionLoading(true);
    try {
      await api.tracker.manualLog({
        activityType: 'lecture',
        durationMinutes: block.duration,
        description: block.activity
      });
      window.dispatchEvent(new CustomEvent('time-logged'));
      showToast(`Lecture attendance logged: ${block.duration} mins.`, 'success');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error logging lecture attendance.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogStudy = async (block) => {
    setActionLoading(true);
    try {
      await api.tracker.manualLog({
        activityType: 'personal_study',
        durationMinutes: block.duration,
        description: block.activity
      });
      window.dispatchEvent(new CustomEvent('time-logged'));
      showToast(`Study session logged: ${block.duration} mins.`, 'success');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error logging study session.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleModeChange = async (mode) => {
    setLoading(true);
    try {
      await api.planner.switchMode(mode);
      await fetchPlanData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="relative h-10 w-10">
          <div className="absolute h-full w-full rounded-full border-4 border-navy-800"></div>
          <div className="absolute h-full w-full animate-spin rounded-full border-4 border-t-accent-gold border-r-transparent border-b-transparent border-l-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* In-UI Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 rounded-2xl border px-5 py-3.5 shadow-2xl animate-fade-in backdrop-blur-md ${
          toast.type === 'success'
            ? 'bg-green-500/10 border-green-500/30 text-green-300'
            : 'bg-red-500/10 border-red-500/30 text-red-300'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle2 className="h-5 w-5 shrink-0" />
            : <X className="h-5 w-5 shrink-0" />
          }
          <span className="text-xs font-bold">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100 cursor-pointer">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-light tracking-widest text-cyan-50 text-glow-cyan uppercase opacity-90">Your Personal AI Planner</h1>
          <p className="text-xs text-slate-400 font-semibold tracking-wide mt-1">
            Let me build a smart, balanced schedule tailored to your focus and energy levels.
          </p>
        </div>
        <button
          onClick={handleGeneratePlan}
          disabled={actionLoading}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-600/90 border border-blue-600/20 text-white px-3.5 py-2 text-xs font-black uppercase tracking-widest shadow-glow-amber transition-all cursor-pointer disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4 animate-pulse" />
          Generate Daily Plan
        </button>
      </div>

      {/* Mode Selector presets */}
      <ModeSelector currentMode={plan?.studyMode} onModeChange={handleModeChange} />

      {/* Grid of details */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Daily Schedule blocks flow column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-cyan-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-white">Today's Roadmap</h3>
              </div>
              <span className="text-[10px] font-black tracking-wider uppercase text-blue-400/90">
                {plan?.planDate ? `Plan for: ${plan.planDate}` : 'Target: Today'}
              </span>
            </div>

            <div className="space-y-4 pt-2">
              {plan?.blocks && plan.blocks.length > 0 ? (
                plan.blocks.map((block, idx) => (
                  <ScheduleBlock key={idx} block={block} onComplete={handleCompleteTask} onStart={handleStartTask} onAttend={handleAttendLecture} onLogStudy={handleLogStudy} />
                ))
              ) : (
                <div className="text-center py-12 px-4 border border-dashed border-white/10 rounded-xl bg-white/5">
                  <Sparkles className="h-8 w-8 text-cyan-500/50 mx-auto mb-3" />
                  <p className="text-sm text-slate-300 font-semibold mb-1">Hi there! I'm ready to organize your day.</p>
                  <p className="text-xs text-slate-500">Click 'Generate Daily Plan' above and let's crush your goals together.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Side panels with AI insights and configurations */}
        <div className="space-y-6">
          {/* Mode Configuration details */}
          {plan?.config && (
            <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-4 bg-gradient-to-b from-navy-900/40 to-transparent">
              <div className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-cyan-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-white">Interval Parameter Matrix</h3>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs border-b border-white/5 pb-4">
                <div className="space-y-1">
                  <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider">Total capacity limit</span>
                  <p className="font-extrabold text-white">{plan.config.maxStudyHours} Hours</p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider">Study Period</span>
                  <p className="font-extrabold text-white">{plan.config.breakEvery} Mins</p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider">Rest Period</span>
                  <p className="font-extrabold text-white">{plan.config.breakDuration} Mins</p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider">Workload Level</span>
                  <p className="font-extrabold text-white uppercase tracking-wider">{plan.config.workloadLevel}</p>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Description</span>
                <p className="text-slate-300 font-semibold leading-relaxed">
                  {plan.config.description}
                </p>
              </div>
            </div>
          )}

          {/* Smart AI recommendations */}
          <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-white">My Advice For You</h3>
            </div>
            
            <ul className="space-y-3.5 text-xs text-slate-300">
              {recommendations.length > 0 ? recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2.5 leading-relaxed">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span className="font-semibold">{rec}</span>
                </li>
              )) : (
                <li className="text-slate-500 font-semibold">Generate a plan to see AI recommendations.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Planner;
