import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, CheckCircle2, RefreshCw, BarChart2, Plus, Sparkles, Award, AlertTriangle } from 'lucide-react';
import useAnalytics from '../hooks/useAnalytics';
import useTasks from '../hooks/useTasks';
import api from '../services/api';
import StatCard from '../components/StatCard';
import FocusGauge from '../components/FocusGauge';
import BurnoutIndicator from '../components/BurnoutIndicator';
import StreakCounter from '../components/StreakCounter';
import WeeklyChart from '../components/WeeklyChart';
import AIRecommendation from '../components/AIRecommendation';

export const Dashboard = () => {
  const { dashboardData, weeklyData, burnoutData, loading, error, refresh } = useAnalytics();
  const { tasks, stats: taskStats } = useTasks();
  const navigate = useNavigate();

  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  const todayEnd = new Date();
  todayEnd.setHours(23,59,59,999);

  const dueTodayOrOverdue = tasks.filter(t => t.status !== 'completed' && t.deadline && new Date(t.deadline) <= todayEnd);
  const completedToday = tasks.filter(t => t.status === 'completed' && t.completedAt && new Date(t.completedAt) >= todayStart);
  const totalTasksToday = dueTodayOrOverdue.length + completedToday.length;
  const todayCompletionPct = totalTasksToday > 0 ? Math.round((completedToday.length / totalTasksToday) * 100) : 0;

  const [modalOpen, setModalOpen] = useState(false);
  const [studyHours, setStudyHours] = useState('');
  const [focusScoreInput, setFocusScoreInput] = useState('');
  const [breaks, setBreaks] = useState('');
  const [subjects, setSubjects] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogSession = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const subjectArray = subjects.split(',').map(s => s.trim()).filter(Boolean);
      await api.sessions.create({
        studyHours: Number(studyHours),
        focusScore: focusScoreInput ? Number(focusScoreInput) : undefined,
        breaks: Number(breaks) || 0,
        subjects: subjectArray,
        notes
      });
      setModalOpen(false);
      setStudyHours('');
      setFocusScoreInput('');
      setBreaks('');
      setSubjects('');
      setNotes('');
      refresh();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error occurred logging study session.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSyncAnalytics = async () => {
    try {
      await api.analytics.calculate();
      refresh();
    } catch (err) {
      console.error(err);
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

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="glass-panel p-8 rounded-3xl border border-red-500/30 bg-red-500/5 text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-black text-white tracking-wide uppercase">System Error</h3>
          <p className="text-sm text-red-400 mt-2 font-medium">{typeof error === 'string' ? error : error.message || 'An unexpected error occurred.'}</p>
          <button onClick={refresh} className="mt-6 px-6 py-2.5 bg-red-500/20 hover:bg-red-500 border border-red-500/30 text-red-400 hover:text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all">
            Retry Initialization
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-display font-black tracking-widest text-white text-glow-gold">SYSTEM DASHBOARD</h1>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mt-1">
            Student node: <span className="text-accent-gold font-black">ACTIVE</span> • Operations: <span className="text-amber-400 font-black">NOMINAL</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncAnalytics}
            className="flex items-center gap-1.5 rounded-xl border border-white/5 hover:border-white/10 bg-white/5 hover:bg-white/10 px-3.5 py-2 text-xs font-bold text-slate-300 transition-all cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            Recalculate
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-accent-gold hover:bg-accent-gold/90 border border-accent-gold/20 text-white px-3.5 py-2 text-xs font-black uppercase tracking-widest shadow-glow-gold transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Log Session
          </button>
        </div>
      </div>

      {/* Critical Overdue Alert */}
      {dueTodayOrOverdue.length > 0 && (
        <div className="glass-panel rounded-xl p-4 border border-red-500/30 bg-red-500/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-400" />
            <div>
              <h4 className="text-sm font-bold text-white tracking-wide">Priority Escalation: Tasks Due!</h4>
              <p className="text-xs text-red-200 mt-0.5">You have {dueTodayOrOverdue.length} pending task(s) that are due today or overdue. Priority auto-escalated to Critical.</p>
            </div>
          </div>
          <button onClick={() => navigate('/tasks')} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-widest rounded-lg transition-colors">
            Execute Now
          </button>
        </div>
      )}

      {/* Grid of Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Daily Study Logs"
          value={`${Number(dashboardData?.studyHours || 0).toFixed(1)} hrs`}
          subtitle="Direct conceptual workload logged."
          icon={Clock}
          color="blue"
        />
        <StatCard
          title="Focus Score"
          value={`${dashboardData?.focusScore || 0}%`}
          subtitle="Cognitive performance index."
          icon={Award}
          color={dashboardData?.focusScore >= 80 ? 'green' : dashboardData?.focusScore >= 50 ? 'yellow' : 'red'}
        />
        <StatCard
          title="Burnout Risk"
          value={`${dashboardData?.burnoutRisk || 0}%`}
          subtitle="Physical exhaustion factor."
          icon={BarChart2}
          color={dashboardData?.burnoutLevel === 'high' ? 'red' : dashboardData?.burnoutLevel === 'moderate' ? 'yellow' : 'green'}
        />
        <StatCard
          title="Today's Task Progress"
          value={`${todayCompletionPct}%`}
          subtitle={`Completed ${completedToday.length} / ${totalTasksToday} tasks today`}
          icon={CheckCircle2}
          color="green"
        />
      </div>

      {/* Main Core Widgets Dashboard */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Double-Width Dashboard Core elements */}
        <div className="lg:col-span-2 space-y-6">
          <WeeklyChart data={weeklyData} />
          
          <div className="grid gap-4 sm:grid-cols-2">
            <StreakCounter streak={dashboardData?.streak || 0} />
            <AIRecommendation recommendations={dashboardData?.recommendations || []} mode={dashboardData?.mode} />
          </div>
        </div>

        {/* Right Single-Width Widgets */}
        <div className="space-y-6">
          <FocusGauge score={dashboardData?.focusScore || 0} />
          
          <BurnoutIndicator
            risk={burnoutData?.risk || 0}
            level={burnoutData?.level || 'low'}
            factors={burnoutData?.factors || []}
            recommendations={burnoutData?.recommendations || []}
          />
        </div>
      </div>

      {/* Modal dialog box overlay for logging study session */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 border border-white/10 shadow-2xl relative">
            <h3 className="text-2xl font-display font-black tracking-widest text-accent-gold mb-4 uppercase text-glow-gold">Log Study Session</h3>
            
            <form onSubmit={handleLogSession} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Study Duration (Hours)</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={studyHours}
                  onChange={(e) => setStudyHours(e.target.value)}
                  placeholder="e.g. 4"
                  className="w-full rounded-xl bg-navy-900 border border-white/5 py-2.5 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-gold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Focus Score (Optional, %)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={focusScoreInput}
                  onChange={(e) => setFocusScoreInput(e.target.value)}
                  placeholder="e.g. 85"
                  className="w-full rounded-xl bg-navy-900 border border-white/5 py-2.5 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-gold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Pomodoro Breaks (# of cycles)</label>
                <input
                  type="number"
                  value={breaks}
                  onChange={(e) => setBreaks(e.target.value)}
                  placeholder="e.g. 3"
                  className="w-full rounded-xl bg-navy-900 border border-white/5 py-2.5 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-gold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Subjects / Topics (Comma separated)</label>
                <input
                  type="text"
                  value={subjects}
                  onChange={(e) => setSubjects(e.target.value)}
                  placeholder="Engineering Math, Electromagnetics"
                  className="w-full rounded-xl bg-navy-900 border border-white/5 py-2.5 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-gold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Reflections / Journal notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Today went well. Fast derivation of Maxwell equations."
                  rows="3"
                  className="w-full rounded-xl bg-navy-900 border border-white/5 py-2.5 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-gold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-white/5 hover:bg-white/5 text-slate-400 hover:text-white text-xs font-bold px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-accent-gold hover:bg-accent-gold/90 border border-accent-gold/20 text-white text-xs font-black uppercase tracking-widest px-4 py-2 cursor-pointer disabled:opacity-50"
                >
                  Commit Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Dashboard;

