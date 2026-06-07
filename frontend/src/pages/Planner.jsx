import React, { useState, useEffect } from 'react';
import { Calendar, Cpu, Sparkles, AlertTriangle, Play, RefreshCw, Landmark } from 'lucide-react';
import api from '../services/api';
import ScheduleBlock from '../components/ScheduleBlock';
import ModeSelector from '../components/ModeSelector';

export const Planner = () => {
  const [plan, setPlan] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

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
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    setActionLoading(true);
    try {
      await api.tasks.complete(taskId);
      await fetchPlanData(); // Refetch the plan which will update tasks
    } catch (err) {
      console.error(err);
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-display font-black tracking-widest text-white text-glow-gold">AI PRODUCTIVITY PLANNER</h1>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mt-1">
            Dynamic Pomodoro scheduling customized to cognitive levels.
          </p>
        </div>
        <button
          onClick={handleGeneratePlan}
          disabled={actionLoading}
          className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-500/90 border border-amber-500/20 text-white px-3.5 py-2 text-xs font-black uppercase tracking-widest shadow-glow-amber transition-all cursor-pointer disabled:opacity-50"
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
                <Calendar className="h-5 w-5 text-accent-gold" />
                <h3 className="text-xs font-black uppercase tracking-wider text-white">Target Core Timeline</h3>
              </div>
              <span className="text-[10px] font-black tracking-wider uppercase text-amber-400/90">
                {plan?.planDate ? `Plan for: ${plan.planDate}` : 'Target: Today'}
              </span>
            </div>

            <div className="space-y-4 pt-2">
              {plan?.blocks && plan.blocks.length > 0 ? (
                plan.blocks.map((block, idx) => (
                  <ScheduleBlock key={idx} block={block} onComplete={handleCompleteTask} onStart={handleStartTask} />
                ))
              ) : (
                <div className="text-center py-12 text-xs text-slate-500 font-semibold">
                  Click 'Generate Daily Plan' above to build customized Pomodoro sessions.
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
                <Cpu className="h-5 w-5 text-accent-gold" />
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
              <Sparkles className="h-5 w-5 text-amber-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-white">AI Core Recommendations</h3>
            </div>
            
            <ul className="space-y-3.5 text-xs text-slate-300">
              {recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2.5 leading-relaxed">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span className="font-semibold">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Planner;

