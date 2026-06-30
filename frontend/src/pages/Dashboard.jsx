import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, CheckCircle2, RefreshCw, BarChart2, Plus, Sparkles, Award, AlertTriangle, X } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import useAnalytics from '../hooks/useAnalytics';
import useTasks from '../hooks/useTasks';
import api from '../services/api';
import StatCard from '../components/StatCard';
import FocusGauge from '../components/FocusGauge';
import BurnoutIndicator from '../components/BurnoutIndicator';
import StreakCounter from '../components/StreakCounter';
import WeeklyChart from '../components/WeeklyChart';
import StudyBreakdownChart from '../components/StudyBreakdownChart';
import AIRecommendation from '../components/AIRecommendation';
import CircadianAnchor from '../components/CircadianAnchor';
import RuthlessOverseer from '../components/RuthlessOverseer';

export const Dashboard = () => {
  const { dashboardData, weeklyData, trackerWeekly, burnoutData, loading, error, refresh } = useAnalytics();
  const { tasks, stats: taskStats } = useTasks();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [showLogModal, setShowLogModal] = useState(false);
  const [studyHours, setStudyHours] = useState('');
  const [focusScore, setFocusScore] = useState(70);
  const [breaks, setBreaks] = useState(1);
  const [subjects, setSubjects] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Auto-populate modal with personal study time ONLY (not lecture/gym/etc)
  const openLogModal = async () => {
    let autoStudyHours = '';
    try {
      const res = await api.tracker.getTodayLogs();
      const logs = res.data || [];
      const personalStudyMinutes = logs
        .filter(l => l.activityType === 'personal_study')
        .reduce((sum, l) => {
          // Include live running timer elapsed if not yet stopped
          if (!l.endTime && l.startTime && !l.isPaused) {
            const resumeTime = l.lastResumeTime ? new Date(l.lastResumeTime) : new Date(l.startTime);
            const liveSeconds = (l.accumulatedSeconds || 0) + Math.max(0, (Date.now() - resumeTime.getTime()) / 1000);
            return sum + (liveSeconds / 60);
          } else if (!l.endTime && l.isPaused) {
            return sum + ((l.accumulatedSeconds || 0) / 60);
          }
          return sum + (l.durationMinutes || 0);
        }, 0);
      autoStudyHours = personalStudyMinutes > 0 ? (personalStudyMinutes / 60).toFixed(2) : '';
    } catch (err) {
      console.error('Failed to fetch today logs for modal:', err);
    }
    setStudyHours(autoStudyHours);
    setFocusScore(70);
    setBreaks(1);
    setSubjects('');
    setNotes('');
    setShowLogModal(true);
  };

  const handleLogSession = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    try {
      await api.sessions.create({
        studyHours: Number(studyHours),
        focusScore: Number(focusScore),
        breaks: Number(breaks),
        subjects: subjects.split(',').map(s => s.trim()),
        notes
      });
      setShowLogModal(false);
      refresh();
    } catch (err) {
      console.error(err);
      setSubmitError(err.message || 'Failed to commit session. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const dueTodayOrOverdue = tasks.filter(t => t.status !== 'completed' && t.deadline && new Date(t.deadline) <= todayEnd);
  const completedToday = tasks.filter(t => t.status === 'completed' && t.completedAt && new Date(t.completedAt) >= todayStart);
  const totalTasksToday = dueTodayOrOverdue.length + completedToday.length;
  const todayCompletionPct = totalTasksToday > 0 ? Math.round((completedToday.length / totalTasksToday) * 100) : 0;

  const handleSyncAnalytics = async () => {
    try {
      await api.analytics.calculate();
      refresh();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const handleTimeLogged = () => {
      handleSyncAnalytics();
    };
    window.addEventListener('time-logged', handleTimeLogged);
    return () => window.removeEventListener('time-logged', handleTimeLogged);
  }, []);

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
          <h1 className="text-2xl md:text-3xl font-display font-light tracking-[0.5em] text-cyan-50 text-glow-cyan uppercase opacity-80">ELITE DASHBOARD</h1>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mt-1">
            Student node: <span className="text-cyan-400 font-black">ACTIVE</span> • Operations: <span className="text-blue-400 font-black">NOMINAL</span>
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
            onClick={() => navigate('/override')}
            className="hidden sm:flex items-center gap-1.5 rounded-xl bg-black hover:bg-cyan-950 border border-cyan-500/50 text-cyan-400 px-3.5 py-2 text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer hover:scale-105"
          >
            <Sparkles className="h-4 w-4" />
            Neural Override
          </button>
          <button
            onClick={openLogModal}
            className="flex items-center gap-1.5 rounded-xl bg-accent-gold/20 hover:bg-accent-gold/30 border border-accent-gold/50 text-accent-gold px-3.5 py-2 text-xs font-black uppercase tracking-widest shadow-glow-gold transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Log Session
          </button>
        </div>
      </div>

      {/* 5AM Circadian Protocol Widget */}
      {user?.settings?.circadianEnabled && (
        <CircadianAnchor onAnchorUpdate={handleSyncAnalytics} />
      )}

      {/* Ruthless AI Overseer */}
      {dashboardData?.ruthlessCritique && (
        <RuthlessOverseer critique={dashboardData.ruthlessCritique} severity={dashboardData.critiqueSeverity} />
      )}

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
          title="Daily Total Logs"
          value={`${Number(dashboardData?.studyHours || 0).toFixed(1)} hrs`}
          subtitle="Combined workload logged."
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
          <StudyBreakdownChart trackerWeekly={trackerWeekly} />
          
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

      {/* Log Session Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-navy-900 border border-white/10 p-6 shadow-2xl relative overflow-hidden">
            {/* Modal background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-accent-gold/10 blur-[50px] rounded-full pointer-events-none"></div>
            
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent-gold/20 rounded-xl border border-accent-gold/30">
                  <BookOpen className="h-5 w-5 text-accent-gold" />
                </div>
                <div>
                  <h2 className="text-lg font-black uppercase tracking-wider text-white">Daily Reflection</h2>
                  <p className="text-xs text-slate-400 font-semibold">Commit to the Grid</p>
                </div>
              </div>
              <button 
                onClick={() => setShowLogModal(false)}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              >
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleLogSession} className="space-y-4 relative z-10">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Study Hours <span className="text-accent-gold">(Personal Study Only)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={studyHours}
                    onChange={(e) => setStudyHours(e.target.value)}
                    placeholder="Auto-filled from tracker"
                    className="w-full rounded-xl bg-black/50 border border-white/5 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-gold/50 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Focus Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={focusScore}
                    onChange={(e) => setFocusScore(e.target.value)}
                    className="w-full rounded-xl bg-black/50 border border-white/5 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-gold/50 transition-colors"
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Number of Breaks</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={breaks}
                  onChange={(e) => setBreaks(e.target.value)}
                  className="w-full rounded-xl bg-black/50 border border-white/5 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-gold/50 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Subjects Studied (comma separated)</label>
                <input
                  type="text"
                  required
                  value={subjects}
                  onChange={(e) => setSubjects(e.target.value)}
                  placeholder="e.g. Math, Physics, Coding"
                  className="w-full rounded-xl bg-black/50 border border-white/5 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-gold/50 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Daily Reflection / Active Recall Notes</label>
                <textarea
                  rows="3"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What did you achieve today? What needs work tomorrow?"
                  className="w-full rounded-xl bg-black/50 border border-white/5 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-gold/50 transition-colors resize-none"
                ></textarea>
              </div>

              {submitError && (
                <p className="text-xs font-bold text-red-400 text-center bg-red-500/10 rounded-xl px-4 py-2 border border-red-500/20">
                  {submitError}
                </p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 mt-4 rounded-xl bg-accent-gold/20 hover:bg-accent-gold/30 border border-accent-gold/50 text-accent-gold text-xs font-black uppercase tracking-widest shadow-glow-gold transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Committing...' : 'Commit to Global Matrix'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
