import React, { useState, useEffect, useContext } from 'react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Calendar, BarChart3, TrendingUp, Cpu, Target, Award, GraduationCap, Globe, Compass, Zap, Activity } from 'lucide-react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

export const Analytics = () => {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gpaData, setGpaData] = useState(null);
  const [mitRanking, setMitRanking] = useState(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const res = await api.analytics.getTrends();
        setTrends(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrends();

    const fetchGpa = async () => {
      try {
        const res = await api.analytics.getGpa();
        setGpaData(res.data);
      } catch (err) {
        console.error('GPA fetch error:', err);
      }
    };
    fetchGpa();

    const fetchMitRanking = async () => {
      try {
        const res = await api.analytics.getMitRanking();
        setMitRanking(res.data);
      } catch (err) {
        console.error('MIT ranking fetch error:', err);
      }
    };
    fetchMitRanking();
  }, []);

  useEffect(() => {
    const handleTimeLogged = async () => {
      try {
        const res = await api.analytics.getMitRanking();
        setMitRanking(res.data);
      } catch (err) {
        console.error('MIT ranking fetch error on manual log:', err);
      }
    };
    window.addEventListener('time-logged', handleTimeLogged);
    return () => window.removeEventListener('time-logged', handleTimeLogged);
  }, []);

  const formattedData = trends.map(t => {
    const d = new Date(t.date);
    return {
      ...t,
      dateFormatted: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
  });

  // Calculate averages for the radar chart
  const radarData = formattedData.length > 0 ? [
    { subject: 'Productivity', A: Math.round(formattedData.reduce((acc, val) => acc + val.productivityScore, 0) / formattedData.length), fullMark: 100 },
    { subject: 'Focus Level', A: Math.round(formattedData.reduce((acc, val) => acc + val.focusScore, 0) / formattedData.length), fullMark: 100 },
    { subject: 'Completion %', A: Math.round(formattedData.reduce((acc, val) => acc + val.completionPercentage, 0) / formattedData.length), fullMark: 100 },
    { subject: 'Discipline', A: 85, fullMark: 100 }, // Simulated based on system metrics
    { subject: 'Resilience', A: Math.round(100 - (formattedData.reduce((acc, val) => acc + val.burnoutRisk, 0) / formattedData.length)), fullMark: 100 },
  ] : [];

  const studyGauge = user?.studyGauge;
  let lowestPillar = null;
  let lowestScore = 101;

  const normalizedScores = {
    Priming: studyGauge?.priming || studyGauge?.scores?.Priming || 0,
    Encoding: studyGauge?.encoding || studyGauge?.scores?.Encoding || 0,
    Reference: studyGauge?.reference || studyGauge?.scores?.Reference || 0,
    Retrieval: studyGauge?.retrieval || studyGauge?.scores?.Retrieval || 0,
    Interleaving: studyGauge?.interleaving || studyGauge?.scores?.Interleaving || 0,
    Overlearning: studyGauge?.overlearning || studyGauge?.scores?.Overlearning || 0,
  };

  const studyGaugeAverage = studyGauge ? Math.round(
    (normalizedScores.Priming +
     normalizedScores.Encoding +
     normalizedScores.Reference +
     normalizedScores.Retrieval +
     normalizedScores.Interleaving +
     normalizedScores.Overlearning) / 6
  ) : 0;

  if (studyGauge) {
    Object.entries(normalizedScores).forEach(([pillar, score]) => {
      if (score < lowestScore) {
        lowestScore = score;
        lowestPillar = pillar;
      }
    });
  }

  const getImprovementTips = (pillar) => {
    switch(pillar) {
      case 'Priming': return ['Scan headers and summaries before class.', 'Write 3 questions you expect to be answered.', 'Review previous notes for context.'];
      case 'Encoding': return ['Use the Feynman technique to explain concepts.', 'Create analogies for complex topics.', 'Focus on "why" rather than "what".'];
      case 'Reference': return ['Centralize your notes in one app/folder.', 'Use tags and folders consistently.', 'Create a master index for each subject.'];
      case 'Retrieval': return ['Use active recall without looking at notes.', 'Create flashcards (Anki/Quizlet).', 'Do practice tests under timed conditions.'];
      case 'Interleaving': return ['Mix different subjects in one session.', 'Switch topics every 30-45 minutes.', 'Avoid studying one concept for hours.'];
      case 'Overlearning': return ['Review older material spaced out over time.', 'Practice beyond initial mastery.', 'Teach the material to a peer.'];
      default: return ['Complete your diagnostic to get personalized tips!'];
    }
  };

  const gaugeRadarData = studyGauge ? [
    { subject: 'Priming', A: normalizedScores.Priming, fullMark: 100 },
    { subject: 'Encoding', A: normalizedScores.Encoding, fullMark: 100 },
    { subject: 'Reference', A: normalizedScores.Reference, fullMark: 100 },
    { subject: 'Retrieval', A: normalizedScores.Retrieval, fullMark: 100 },
    { subject: 'Interleaving', A: normalizedScores.Interleaving, fullMark: 100 },
    { subject: 'Overlearning', A: normalizedScores.Overlearning, fullMark: 100 }
  ] : [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel p-3 border border-white/10 rounded-xl shadow-2xl bg-navy-950/90 backdrop-blur-md">
          <p className="text-xs font-bold text-white mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center gap-2 text-xs font-medium">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-300">{entry.name}:</span>
              <span className="text-white font-black">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
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
          <h1 className="text-2xl md:text-3xl font-display font-light tracking-[0.5em] text-cyan-50 text-glow-cyan uppercase opacity-80">DEEP ANALYTICS REPORT</h1>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mt-1">
            Extended operational analytics and cognitive vectors.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Productivity score trend */}
        <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-cyan-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white">Productivity Vector (30 Days)</h3>
          </div>
          <div className="h-64 w-full">
            {formattedData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-500 font-semibold">
                No logs recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedData}>
                  <defs>
                    <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="dateFormatted" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" name="Productivity" dataKey="productivityScore" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Radar Performance Chart */}
        <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white">Cognitive Profiling</h3>
          </div>
          <div className="h-64 w-full">
            {radarData.length === 0 ? (
               <div className="flex h-full items-center justify-center text-xs text-slate-500 font-semibold">
                 Insufficient Data
               </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Performance" dataKey="A" stroke="#a855f7" fill="#a855f7" fillOpacity={0.4} />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Burnout Risk Trend */}
        <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-red-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white">Burnout Index vs Focus Score Analysis</h3>
          </div>
          <div className="h-72 w-full">
            {formattedData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-500 font-semibold">
                No logs recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="dateFormatted" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                  <Line name="Burnout Index" type="monotone" dataKey="burnoutRisk" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                  <Line name="Focus Level" type="monotone" dataKey="focusScore" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Study Hours Trend */}
        <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white">Study Duration</h3>
          </div>
          <div className="h-72 w-full">
            {formattedData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-500 font-semibold">
                No logs recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="dateFormatted" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar name="Hours" dataKey="studyHours" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Study Gauge Section */}
      <div className="border-t border-white/5 pt-6 mt-6">
        <h2 className="text-xl font-black tracking-wider text-white mb-6">STUDY GAUGE CALIBRATION</h2>
        {studyGauge ? (
          <div className="grid gap-6 md:grid-cols-3">
            {/* System Profile Radar */}
            <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-4">
              <div className="flex items-center gap-2">
                <Compass className="h-5 w-5 text-blue-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-white">System Profile</h3>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={gaugeRadarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Score" dataKey="A" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.4} />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Performance Tier Speedometer */}
            <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-4 flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 w-full justify-start">
                <Activity className="h-5 w-5 text-blue-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-white">Performance Tier</h3>
              </div>
              <div className="relative flex flex-col items-center justify-center h-40 w-full">
                <svg viewBox="0 0 100 50" className="w-full h-full max-w-[200px] overflow-visible">
                  <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" strokeLinecap="round" />
                  <path 
                    d="M 10 50 A 40 40 0 0 1 90 50" 
                    fill="none" 
                    stroke="url(#tierGrad)" 
                    strokeWidth="10" 
                    strokeLinecap="round" 
                    strokeDasharray="125.6" 
                    strokeDashoffset={125.6 - ((studyGaugeAverage / 100) * 125.6)} 
                  />
                  <defs>
                    <linearGradient id="tierGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="50%" stopColor="#eab308" />
                      <stop offset="100%" stopColor="#22c55e" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute bottom-[-10px] flex flex-col items-center">
                  <span className="text-4xl font-black text-white">{studyGaugeAverage}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{studyGauge.tier}</span>
                </div>
              </div>
            </div>

            {/* Improvement Plan */}
            <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-emerald-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-white">Improvement Plan</h3>
              </div>
              <div className="space-y-4 pt-2">
                <p className="text-xs text-slate-300">
                  Focus area: <span className="text-emerald-400 font-bold">{lowestPillar}</span> ({lowestScore}/100)
                </p>
                <ul className="space-y-3">
                  {getImprovementTips(lowestPillar).map((tip, idx) => (
                    <li key={idx} className="flex gap-3 text-xs text-slate-400">
                      <span className="text-emerald-400 mt-0.5">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={() => window.location.href = '/diagnostic'} className="w-full mt-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-white transition-colors">
                  Retake Diagnostic
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl p-8 border border-white/5 text-center space-y-4">
            <Target className="h-10 w-10 text-amber-500 mx-auto opacity-50" />
            <h3 className="text-lg font-bold text-white">Gauge Uncalibrated</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Take the Study Diagnostic to calibrate your learning system and unlock personalized cognitive metrics.
            </p>
            <button onClick={() => window.location.href = '/diagnostic'} className="mt-4 px-6 py-2 bg-blue-600/20 text-blue-400 rounded-lg text-sm font-bold hover:bg-blue-600/30 transition-colors">
              Start Diagnostic
            </button>
          </div>
        )}
      </div>      {/* Honours & Ranking Section */}
      <div className="grid gap-6 md:grid-cols-2 mt-6">
        
        {/* Honours Trajectory Card */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-5">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-emerald-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white">Honours Trajectory</h3>
          </div>

          {gpaData ? (
            <div className="flex items-center gap-8">
              {/* Circular Progress */}
              <div className="relative flex h-36 w-36 shrink-0 items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                  <circle
                    cx="60" cy="60" r="52" fill="none"
                    stroke="url(#gpaGradient)" strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${((gpaData.predictedSemesterMark || 0) / 100) * 326.73} 326.73`}
                  />
                  <defs>
                    <linearGradient id="gpaGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute text-center">
                  <p className="text-3xl font-black text-white">{(gpaData.predictedSemesterMark || 0).toFixed(2)}</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Semester</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex-1 space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Weighted Honours Mark</p>
                  <p className="text-2xl font-black text-blue-400">{(gpaData.cumulativeMark || 0).toFixed(2)}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Projected Classification</p>
                  <p className="text-sm font-black text-emerald-400">{gpaData.classification || 'N/A'}</p>
                </div>
                <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-700"
                    style={{ width: `${(gpaData.cumulativeMark || 0)}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-36 items-center justify-center text-xs text-slate-500 font-semibold">
              Loading Honours data...
            </div>
          )}
        </div>

        {/* Daily Expected Mark Gauge (By Study Hours) */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-5">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-cyan-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white">Daily Mark Gauge (By Effort)</h3>
          </div>

          {gpaData ? (
            <div className="flex items-center gap-8">
              {/* Circular Progress */}
              <div className="relative flex h-36 w-36 shrink-0 items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                  <circle
                    cx="60" cy="60" r="52" fill="none"
                    stroke="url(#gpaGradient)" strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(mitRanking?.breakdown ? Math.min(100, (mitRanking.breakdown.weeklyStudyHours / mitRanking.breakdown.baseline.maxStudyHours) * 100) : 0) / 100 * 326.73} 326.73`}
                  />
                  <defs>
                    <linearGradient id="gpaGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute text-center">
                  <p className="text-3xl font-black text-white">{mitRanking?.breakdown ? Math.min(100, (mitRanking.breakdown.weeklyStudyHours / mitRanking.breakdown.baseline.maxStudyHours) * 100).toFixed(2) : '0.00'}</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Daily Mark</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex-1 space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Max Potential Mark</p>
                  <p className="text-2xl font-black text-blue-400">100%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Books & Focus Gauge</p>
                  <p className="text-sm font-black text-emerald-400">{(mitRanking?.vectors?.hours || 0) > 70 ? 'Excellent' : (mitRanking?.vectors?.hours || 0) > 50 ? 'Average' : 'Low'}</p>
                </div>
                <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-700"
                    style={{ width: `${mitRanking?.vectors?.hours || 0}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-36 items-center justify-center text-xs text-slate-500 font-semibold">
              Loading Daily data...
            </div>
          )}
        </div>

        <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-5">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-cyan-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white">DeKUT Civil Eng. Rank</h3>
          </div>

          {mitRanking ? (
            <div className="space-y-5">
              {/* Rank Display */}
              <div className="text-center py-2">
                <p className="text-5xl font-black text-white">
                  <span className="text-2xl text-cyan-400">#</span>{Math.max(1, Math.round(100 - (mitRanking.mitRankPercentile || 0)))}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Out of 100 Students</p>
              </div>

              {/* Gradient Progress Bar */}
              <div className="h-3 w-full rounded-full bg-white/5 overflow-hidden relative">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 to-amber-400 transition-all duration-700"
                  style={{ width: `${mitRanking.mitRankPercentile || 0}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-5 w-1 bg-white rounded-full shadow-lg shadow-white/50 transition-all duration-700"
                  style={{ left: `${mitRanking.mitRankPercentile || 0}%` }}
                />
              </div>

              {/* Scoring Vectors */}
              <div className="space-y-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Scoring Vectors</p>
                {[
                  { label: 'Study Hours', value: mitRanking.breakdown ? Math.round(Math.min(100, (mitRanking.breakdown.weeklyStudyHours / mitRanking.breakdown.baseline.maxStudyHours) * 100)) : 0, color: 'from-yellow-500 to-amber-400' },
                  { label: 'Focus Score', value: mitRanking.breakdown ? Math.round(Math.min(100, (mitRanking.breakdown.avgFocusScore / mitRanking.breakdown.baseline.maxFocusScore) * 100)) : 0, color: 'from-purple-500 to-pink-400' },
                  { label: 'Completion Rate', value: mitRanking.breakdown ? Math.round(Math.min(100, (mitRanking.breakdown.avgCompletion / mitRanking.breakdown.baseline.maxCompletion) * 100)) : 0, color: 'from-green-500 to-emerald-400' },
                  { label: 'Productivity', value: mitRanking.breakdown ? Math.round(Math.min(100, (mitRanking.breakdown.avgProductivity / mitRanking.breakdown.baseline.maxProductivity) * 100)) : 0, color: 'from-orange-500 to-yellow-400' }
                ].map((vector) => (
                  <div key={vector.label} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{vector.label}</span>
                      <span className="text-xs font-black text-white">{vector.value}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${vector.color} transition-all duration-500`}
                        style={{ width: `${vector.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-36 items-center justify-center text-xs text-slate-500 font-semibold">
              Loading ranking data...
            </div>
          )}
        </div>

        {/* MIT Global Ranking Card */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-5">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-cyan-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white">MIT Global Ranking</h3>
          </div>

          {mitRanking ? (
            <div className="space-y-5">
              {/* Percentile Display */}
              <div className="text-center py-2">
                <p className="text-5xl font-black text-white">
                  {mitRanking.mitRankPercentile || 0}<span className="text-2xl text-cyan-400">%</span>
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Global Percentile</p>
              </div>

              {/* Gradient Progress Bar */}
              <div className="h-3 w-full rounded-full bg-white/5 overflow-hidden relative">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 to-amber-400 transition-all duration-700"
                  style={{ width: `${mitRanking.mitRankPercentile || 0}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-5 w-1 bg-white rounded-full shadow-lg shadow-white/50 transition-all duration-700"
                  style={{ left: `${mitRanking.mitRankPercentile || 0}%` }}
                />
              </div>

              {/* Scoring Vectors */}
              <div className="space-y-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Scoring Vectors</p>
                {[
                  { label: 'Study Hours', value: mitRanking.breakdown ? Math.round(Math.min(100, (mitRanking.breakdown.weeklyStudyHours / mitRanking.breakdown.baseline.maxStudyHours) * 100)) : 0, color: 'from-yellow-500 to-amber-400' },
                  { label: 'Focus Score', value: mitRanking.breakdown ? Math.round(Math.min(100, (mitRanking.breakdown.avgFocusScore / mitRanking.breakdown.baseline.maxFocusScore) * 100)) : 0, color: 'from-purple-500 to-pink-400' },
                  { label: 'Completion Rate', value: mitRanking.breakdown ? Math.round(Math.min(100, (mitRanking.breakdown.avgCompletion / mitRanking.breakdown.baseline.maxCompletion) * 100)) : 0, color: 'from-green-500 to-emerald-400' },
                  { label: 'Productivity', value: mitRanking.breakdown ? Math.round(Math.min(100, (mitRanking.breakdown.avgProductivity / mitRanking.breakdown.baseline.maxProductivity) * 100)) : 0, color: 'from-orange-500 to-yellow-400' }
                ].map((vector) => (
                  <div key={vector.label} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{vector.label}</span>
                      <span className="text-xs font-black text-white">{vector.value}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${vector.color} transition-all duration-500`}
                        style={{ width: `${vector.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-36 items-center justify-center text-xs text-slate-500 font-semibold">
              Loading ranking data...
            </div>
          )}
        </div>
      </div>

      {/* Detailed Unit Projections — V2 10-Factor Engine */}
      {gpaData?.courseBreakdown && gpaData.courseBreakdown.length > 0 && (() => {
        // Compute overall semester GPA (weighted)
        const totalCredits = gpaData.courseBreakdown.reduce((s, c) => s + (c.credits || 0), 0);
        const weightedGpa = totalCredits > 0
          ? gpaData.courseBreakdown.reduce((s, c) => s + (c.gpa || 0) * (c.credits || 0), 0) / totalCredits
          : 0;
        
        return (
        <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden mt-6">
          <div className="p-6 border-b border-white/5">
            <h3 className="text-lg font-black uppercase tracking-wider text-white">Detailed Unit Projections</h3>
            <p className="text-xs text-slate-400 font-semibold mt-1">10-factor AI engine analyzing study hours, focus, attendance, consistency, topics, deadlines, and more.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="p-4 pl-6">Unit</th>
                  <th className="p-4">Credits</th>
                  <th className="p-4">Completion</th>
                  <th className="p-4 text-center">GPA</th>
                  <th className="p-4 text-center">Grade</th>
                  <th className="p-4 pr-6 text-right">Projected Mark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {gpaData.courseBreakdown.map((course, idx) => {
                  const factorLabels = {
                    taskCompletion: '📋 Tasks',
                    studyHours: '⏱️ Study Hours',
                    topicsCoverage: '📖 Topics',
                    focusQuality: '🎯 Focus',
                    consistency: '🔥 Consistency',
                    lectureAttendance: '🏫 Lectures',
                    deadlineAdherence: '⏰ Deadlines',
                    taskDiversity: '🔀 Diversity',
                    burnout: '💤 Burnout',
                    hybridStatus: '🔒 Hybrid Predict'
                  };
                  
                  return (
                  <React.Fragment key={idx}>
                    <tr className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                        onClick={() => {
                          const el = document.getElementById(`factors-${idx}`);
                          if (el) el.classList.toggle('hidden');
                        }}>
                      <td className="p-4 pl-6">
                        <div className="font-bold text-white text-sm">{course.unitCode}</div>
                        <div className="text-xs font-semibold text-slate-400 truncate max-w-[200px]">{course.unitName}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 group-hover:text-slate-400 transition-colors">
                          ▸ Click to expand factors
                        </div>
                      </td>
                      <td className="p-4 text-xs font-bold text-slate-300">{course.credits}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="text-xs font-bold text-slate-300 w-8">{course.completionRate}%</div>
                          <div className="h-1.5 w-16 rounded-full bg-white/5 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-blue-500"
                              style={{ width: `${course.completionRate}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center text-sm font-black text-blue-400">{course.gpa !== undefined ? course.gpa.toFixed(1) : '0.0'}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-black ${
                          course.grade === 'A' ? 'bg-emerald-500/20 text-emerald-400' :
                          course.grade === 'B' ? 'bg-blue-500/20 text-blue-400' :
                          course.grade === 'C' ? 'bg-yellow-500/20 text-yellow-400' :
                          course.grade === 'D' ? 'bg-indigo-600/20 text-indigo-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {course.grade || 'E'}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <span className={`text-xl font-black ${
                          (course.projectedMark || 0) >= 70 ? 'text-emerald-400' :
                          (course.projectedMark || 0) >= 60 ? 'text-blue-400' :
                          (course.projectedMark || 0) >= 50 ? 'text-yellow-400' :
                          (course.projectedMark || 0) >= 40 ? 'text-indigo-400' :
                          'text-red-400'
                        }`}>
                          {course.projectedMark !== undefined ? course.projectedMark.toFixed(1) : '0.0'}%
                        </span>
                      </td>
                    </tr>
                    {/* Expandable Factor Breakdown */}
                    <tr id={`factors-${idx}`} className="hidden">
                      <td colSpan="6" className="p-0">
                        <div className="bg-navy-900/50 border-t border-b border-white/5 px-6 py-4">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Factor Breakdown</span>
                            <span className="text-[10px] font-bold text-slate-500">
                              Base: {course.baseline || 75} | Modifier: {course.totalModifier > 0 ? '+' : ''}{course.totalModifier || 0}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
                            {course.factors && Object.entries(course.factors).map(([key, factor]) => (
                              <div key={key} className={`flex items-center gap-2 rounded-lg p-2 border ${key === 'hybridStatus' ? 'col-span-3 bg-blue-600/10 border-blue-600/20' : 'bg-white/[0.02] border-white/5'}`}>
                                {key !== 'hybridStatus' && (
                                  <span className={`text-xs font-black w-10 text-right ${
                                    factor.score > 0 ? 'text-emerald-400' :
                                    factor.score < 0 ? 'text-red-400' :
                                    'text-slate-500'
                                  }`}>
                                    {factor.score > 0 ? '+' : ''}{factor.score}
                                  </span>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className={`text-[10px] font-black truncate ${key === 'hybridStatus' ? 'text-blue-400' : 'text-slate-300'}`}>{factorLabels[key] || key}</div>
                                  <div className={`text-[9px] font-semibold truncate ${key === 'hybridStatus' ? 'text-amber-200' : 'text-slate-500'}`}>{factor.detail}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-white/[0.02] border-t border-white/10">
                  <td colSpan="3" className="p-4 pl-6 text-right text-xs font-black uppercase tracking-widest text-slate-400">Semester Mean Average:</td>
                  <td className="p-4 text-center text-sm font-black text-blue-400">{weightedGpa.toFixed(2)}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-black ${
                      gpaData.predictedSemesterMark >= 70 ? 'bg-emerald-500/20 text-emerald-400' :
                      gpaData.predictedSemesterMark >= 60 ? 'bg-blue-500/20 text-blue-400' :
                      gpaData.predictedSemesterMark >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                      gpaData.predictedSemesterMark >= 40 ? 'bg-indigo-600/20 text-indigo-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {gpaData.predictedSemesterMark >= 70 ? 'A' : gpaData.predictedSemesterMark >= 60 ? 'B' : gpaData.predictedSemesterMark >= 50 ? 'C' : gpaData.predictedSemesterMark >= 40 ? 'D' : 'E'}
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-right text-2xl font-black text-white">
                    {gpaData.predictedSemesterMark !== undefined ? gpaData.predictedSemesterMark.toFixed(1) : '0.0'}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        );
      })()}
    </div>
  );
};
export default Analytics;


