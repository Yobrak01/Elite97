import React, { useState, useEffect } from 'react';
import {
  HeartPulse, AlertOctagon, AlertTriangle, ShieldCheck, Skull,
  Brain, BedDouble, Zap, Frown, Eye, Dumbbell, HeadphonesIcon, Activity,
  Plus, CheckCircle2, TrendingUp, BarChart3, Clock, X
} from 'lucide-react';
import api from '../services/api';

const LEVELS = [
  {
    id: 'low',
    label: 'LOW',
    subtitle: 'System Nominal',
    icon: ShieldCheck,
    bg: 'from-green-500/15 to-emerald-600/10',
    border: 'border-green-500/40',
    activeBorder: 'border-green-400',
    text: 'text-green-400',
    glow: 'shadow-[0_0_20px_rgba(34,197,94,0.3)]',
    bar: 'bg-green-500'
  },
  {
    id: 'moderate',
    label: 'MODERATE',
    subtitle: 'Elevated Friction',
    icon: AlertTriangle,
    bg: 'from-yellow-500/15 to-amber-600/10',
    border: 'border-yellow-500/40',
    activeBorder: 'border-yellow-400',
    text: 'text-yellow-400',
    glow: 'shadow-[0_0_20px_rgba(234,179,8,0.3)]',
    bar: 'bg-yellow-500'
  },
  {
    id: 'high',
    label: 'HIGH',
    subtitle: 'Approaching Failure',
    icon: AlertOctagon,
    bg: 'from-orange-500/15 to-red-600/10',
    border: 'border-orange-500/40',
    activeBorder: 'border-orange-400',
    text: 'text-orange-400',
    glow: 'shadow-[0_0_20px_rgba(249,115,22,0.3)]',
    bar: 'bg-orange-500'
  },
  {
    id: 'critical',
    label: 'CRITICAL',
    subtitle: 'Immediate Intervention',
    icon: Skull,
    bg: 'from-red-500/15 to-rose-600/10',
    border: 'border-red-500/40',
    activeBorder: 'border-red-400',
    text: 'text-red-400',
    glow: 'shadow-[0_0_20px_rgba(239,68,68,0.4)]',
    bar: 'bg-red-500'
  }
];

const SYMPTOMS = [
  { id: 'Chronic Fatigue', icon: BedDouble, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/40' },
  { id: 'Loss of Motivation', icon: Frown, color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/40' },
  { id: 'Difficulty Concentrating', icon: Brain, color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/40' },
  { id: 'Irritability', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/40' },
  { id: 'Sleep Disruption', icon: Eye, color: 'text-indigo-400', bg: 'bg-indigo-500/20', border: 'border-indigo-500/40' },
  { id: 'Physical Exhaustion', icon: Dumbbell, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/40' },
  { id: 'Emotional Numbness', icon: HeadphonesIcon, color: 'text-slate-400', bg: 'bg-slate-500/20', border: 'border-slate-500/40' },
  { id: 'Headaches/Body Pain', icon: Activity, color: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-500/40' }
];

const getLevelTheme = (level) => LEVELS.find(l => l.id === level) || LEVELS[0];

export const BurnoutLog = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Form state
  const [selectedLevel, setSelectedLevel] = useState('low');
  const [riskScore, setRiskScore] = useState(20);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [notes, setNotes] = useState('');

  const fetchLogs = async () => {
    try {
      const res = await api.burnoutLog.getAll();
      if (res.data) {
        setLogs(res.data.logs || []);
        setStats(res.data.stats || null);
      }
    } catch (err) {
      console.error('Failed to fetch burnout logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Auto-adjust risk score when level changes
  const handleLevelChange = (levelId) => {
    setSelectedLevel(levelId);
    const defaults = { low: 15, moderate: 40, high: 65, critical: 85 };
    setRiskScore(defaults[levelId] || 20);
  };

  const toggleSymptom = (symptomId) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptomId)
        ? prev.filter(s => s !== symptomId)
        : [...prev, symptomId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedbackMsg(null);
    try {
      await api.burnoutLog.create({
        level: selectedLevel,
        riskScore: Number(riskScore),
        symptoms: selectedSymptoms,
        notes
      });
      // Reset form
      setSelectedLevel('low');
      setRiskScore(20);
      setSelectedSymptoms([]);
      setNotes('');
      setFeedbackMsg({ type: 'success', text: 'Burnout assessment logged. Stay aware of your limits.' });
      fetchLogs();
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err) {
      console.error(err);
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to log burnout assessment.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRiskBarColor = (score) => {
    if (score >= 80) return 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]';
    if (score >= 60) return 'bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.4)]';
    if (score >= 30) return 'bg-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.3)]';
    return 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.3)]';
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="relative h-10 w-10">
          <div className="absolute h-full w-full rounded-full border-4 border-navy-800"></div>
          <div className="absolute h-full w-full animate-spin rounded-full border-4 border-t-red-500 border-r-transparent border-b-transparent border-l-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-500/20 rounded-xl border border-red-500/30">
            <HeartPulse className="h-6 w-6 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-light tracking-[0.4em] text-cyan-50 text-glow-cyan uppercase opacity-80">
              BURNOUT LOG
            </h1>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mt-0.5">
              Manual Risk Assessment • <span className="text-red-400 font-black">Self-Report Protocol</span>
            </p>
          </div>
        </div>
      </div>

      {/* Feedback Message */}
      {feedbackMsg && (
        <div className={`rounded-xl px-4 py-3 text-sm font-bold border flex items-center gap-2 ${
          feedbackMsg.type === 'success'
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {feedbackMsg.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertOctagon className="h-4 w-4 shrink-0" />}
          {feedbackMsg.text}
        </div>
      )}

      {/* Main Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT: Log Form (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Burnout Level Selector */}
            <div className="glass-panel rounded-2xl border border-white/5 p-6 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <HeartPulse className="h-4 w-4 text-red-400" />
                <span className="text-xs font-black uppercase tracking-widest text-slate-300">
                  Step 1 — How burned out do you feel?
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {LEVELS.map(lvl => {
                  const Icon = lvl.icon;
                  const isActive = selectedLevel === lvl.id;
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => handleLevelChange(lvl.id)}
                      className={`relative rounded-xl border p-4 text-center transition-all duration-300 cursor-pointer group
                        bg-gradient-to-br ${lvl.bg}
                        ${isActive ? `${lvl.activeBorder} ${lvl.glow} scale-[1.03]` : `${lvl.border} hover:scale-[1.02] opacity-60 hover:opacity-90`}
                      `}
                    >
                      <Icon className={`h-7 w-7 mx-auto mb-2 ${lvl.text} ${isActive ? 'animate-pulse' : ''}`} />
                      <p className={`text-xs font-black uppercase tracking-widest ${lvl.text}`}>{lvl.label}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{lvl.subtitle}</p>
                      {isActive && (
                        <div className={`absolute -top-1 -right-1 h-3 w-3 rounded-full ${lvl.bar} animate-ping`}></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Risk Score Slider */}
            <div className="glass-panel rounded-2xl border border-white/5 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-300">
                    Step 2 — Self-Assessed Risk Score
                  </span>
                </div>
                <span className={`text-lg font-black tabular-nums ${
                  riskScore >= 80 ? 'text-red-400' : riskScore >= 60 ? 'text-orange-400' : riskScore >= 30 ? 'text-yellow-400' : 'text-green-400'
                }`}>
                  {riskScore}%
                </span>
              </div>

              {/* Risk Bar Visual */}
              <div className="h-3 w-full rounded-full bg-navy-950 overflow-hidden border border-white/5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getRiskBarColor(riskScore)}`}
                  style={{ width: `${riskScore}%` }}
                />
              </div>

              {/* Slider */}
              <input
                type="range"
                min="0"
                max="100"
                value={riskScore}
                onChange={(e) => setRiskScore(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none bg-navy-900 cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400
                  [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(6,182,212,0.5)] [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/20
                  [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-cyan-400 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white/20
                  [&::-moz-range-thumb]:cursor-pointer"
              />

              <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <span>Nominal</span>
                <span>Moderate</span>
                <span>High</span>
                <span>Critical</span>
              </div>
            </div>

            {/* Step 3: Symptoms Multi-Select */}
            <div className="glass-panel rounded-2xl border border-white/5 p-6 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Brain className="h-4 w-4 text-purple-400" />
                <span className="text-xs font-black uppercase tracking-widest text-slate-300">
                  Step 3 — Active Symptoms
                </span>
                <span className="text-[10px] text-slate-500 font-semibold ml-auto">Select all that apply</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {SYMPTOMS.map(symptom => {
                  const Icon = symptom.icon;
                  const isActive = selectedSymptoms.includes(symptom.id);
                  return (
                    <button
                      key={symptom.id}
                      type="button"
                      onClick={() => toggleSymptom(symptom.id)}
                      className={`rounded-xl border px-3 py-2.5 text-left transition-all duration-200 cursor-pointer flex items-center gap-2
                        ${isActive
                          ? `${symptom.bg} ${symptom.border} ${symptom.color} scale-[1.02]`
                          : 'bg-white/3 border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-300 opacity-70 hover:opacity-100'
                        }
                      `}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${isActive ? symptom.color : ''}`} />
                      <span className="text-[11px] font-bold leading-tight">{symptom.id}</span>
                      {isActive && <CheckCircle2 className="h-3.5 w-3.5 ml-auto shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Notes */}
            <div className="glass-panel rounded-2xl border border-white/5 p-6 space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-black uppercase tracking-widest text-slate-300">
                  Step 4 — Context Notes <span className="text-slate-500 font-semibold">(Optional)</span>
                </span>
              </div>
              <textarea
                rows="3"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What's contributing to your burnout? Any specific triggers or circumstances..."
                className="w-full rounded-xl bg-black/50 border border-white/5 px-4 py-3 text-sm text-white placeholder-slate-600
                  focus:outline-none focus:border-red-500/40 transition-colors resize-none"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/50
                text-red-400 text-xs font-black uppercase tracking-[0.2em]
                shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:shadow-[0_0_30px_rgba(239,68,68,0.3)]
                transition-all duration-300 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
                  Processing...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Log Burnout Assessment
                </>
              )}
            </button>
          </form>
        </div>

        {/* RIGHT: Stats Panel (1 col) */}
        <div className="space-y-4">
          {/* Stats Cards */}
          <div className="glass-panel rounded-2xl border border-white/5 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-300">Burnout Intelligence</span>
            </div>

            {stats && stats.totalLogs > 0 ? (
              <div className="space-y-3">
                {/* Total Logs */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Total Entries</span>
                  <span className="text-lg font-black text-white">{stats.totalLogs}</span>
                </div>

                {/* Avg Risk */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Avg Risk Score</span>
                  <span className={`text-lg font-black ${
                    stats.avgRiskScore >= 60 ? 'text-red-400' : stats.avgRiskScore >= 30 ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {stats.avgRiskScore}%
                  </span>
                </div>

                {/* Most Frequent Level */}
                {(() => {
                  const theme = getLevelTheme(stats.mostFrequentLevel);
                  return (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Most Frequent</span>
                      <span className={`text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded border border-white/5 ${theme.text}`}>
                        {stats.mostFrequentLevel}
                      </span>
                    </div>
                  );
                })()}

                {/* Top Symptom */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Top Symptom</span>
                  <span className="text-xs font-bold text-purple-400 text-right max-w-[120px] truncate">{stats.topSymptom}</span>
                </div>

                {/* Level Breakdown */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Level Distribution</span>
                  {stats.levelBreakdown && Object.entries(stats.levelBreakdown).map(([level, count]) => {
                    const theme = getLevelTheme(level);
                    const pct = stats.totalLogs > 0 ? Math.round((count / stats.totalLogs) * 100) : 0;
                    return (
                      <div key={level} className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className={theme.text}>{level.toUpperCase()}</span>
                          <span className="text-slate-500">{count} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-navy-950 overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-700 ${theme.bar}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <HeartPulse className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <p className="text-xs text-slate-500 font-semibold">No burnout logs yet.</p>
                <p className="text-[10px] text-slate-600 mt-1">Log your first self-assessment above.</p>
              </div>
            )}
          </div>

          {/* Symptom Breakdown */}
          {stats && stats.symptomBreakdown && stats.symptomBreakdown.length > 0 && (
            <div className="glass-panel rounded-2xl border border-white/5 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-rose-400" />
                <span className="text-xs font-black uppercase tracking-widest text-slate-300">Symptom Frequency</span>
              </div>
              <div className="space-y-2">
                {stats.symptomBreakdown.slice(0, 6).map(({ symptom, count }) => {
                  const maxCount = stats.symptomBreakdown[0]?.count || 1;
                  const pct = Math.round((count / maxCount) * 100);
                  const symptomDef = SYMPTOMS.find(s => s.id === symptom);
                  return (
                    <div key={symptom} className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className={symptomDef?.color || 'text-slate-400'}>{symptom}</span>
                        <span className="text-slate-500">×{count}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-navy-950 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${symptomDef?.color?.replace('text-', 'bg-') || 'bg-slate-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History Timeline */}
      <div className="glass-panel rounded-2xl border border-white/5 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-300">Assessment History</span>
          </div>
          {logs.length > 0 && (
            <span className="text-[10px] text-slate-500 font-bold">{logs.length} entries</span>
          )}
        </div>

        {logs.length > 0 ? (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {logs.map((log, idx) => {
              const theme = getLevelTheme(log.level);
              const Icon = theme.icon;
              return (
                <div
                  key={log._id || idx}
                  className={`rounded-xl border p-4 bg-gradient-to-r ${theme.bg} ${theme.border} transition-all hover:scale-[1.005]`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${theme.bg} border ${theme.border}`}>
                        <Icon className={`h-4 w-4 ${theme.text}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-black uppercase tracking-widest ${theme.text}`}>
                            {log.level}
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className={`text-sm font-black tabular-nums ${theme.text}`}>
                            {log.riskScore}%
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                          {formatDate(log.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Risk mini-bar */}
                    <div className="w-20 shrink-0">
                      <div className="h-2 w-full rounded-full bg-navy-950 overflow-hidden">
                        <div className={`h-full rounded-full ${theme.bar}`} style={{ width: `${log.riskScore}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Symptoms */}
                  {log.symptoms && log.symptoms.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {log.symptoms.map((s, sIdx) => {
                        const sDef = SYMPTOMS.find(sym => sym.id === s);
                        return (
                          <span
                            key={sIdx}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              sDef ? `${sDef.bg} ${sDef.border} ${sDef.color}` : 'bg-white/5 border-white/10 text-slate-400'
                            }`}
                          >
                            {s}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Notes */}
                  {log.notes && (
                    <p className="text-xs text-slate-400 mt-2.5 leading-relaxed border-t border-white/5 pt-2.5 italic">
                      "{log.notes}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10">
            <HeartPulse className="h-12 w-12 text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-bold">No assessments logged yet.</p>
            <p className="text-xs text-slate-600 mt-1">Complete the form above to record your first burnout self-report.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BurnoutLog;
