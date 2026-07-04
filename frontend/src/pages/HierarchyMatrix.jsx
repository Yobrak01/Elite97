import React, { useState, useEffect, useContext } from 'react';
import { Globe, Trophy, TrendingUp, TrendingDown, Minus, Target, Flame, User, UserCheck, Activity } from 'lucide-react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import GlobalFeed from '../components/GlobalFeed';

export const HierarchyMatrix = () => {
  const [hierarchy, setHierarchy] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchMatrix = async () => {
      try {
        const res = await api.analytics.getHierarchy();
        setHierarchy(res.data);
      } catch (err) {
        console.error('Error fetching hierarchy:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatrix();
  }, []);

  const getTrendIcon = (trend) => {
    switch(trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-emerald-400" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-slate-500" />;
    }
  };

  const getRankStyle = (rank) => {
    if (rank === 1) return 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]';
    if (rank === 2) return 'bg-slate-300/20 text-slate-300 border-slate-300/50 shadow-[0_0_15px_rgba(203,213,225,0.3)]';
    if (rank === 3) return 'bg-orange-700/20 text-orange-400 border-orange-700/50 shadow-[0_0_15px_rgba(194,65,12,0.3)]';
    if (rank <= 10) return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
    return 'bg-white/[0.02] text-slate-500 border-white/5';
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="relative flex flex-col items-center justify-center space-y-4">
          <Globe className="h-16 w-16 animate-pulse text-cyan-500/50" />
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400 animate-pulse">Loading Community Leaderboard...</div>
        </div>
      </div>
    );
  }

  const userRank = hierarchy.find(h => h.isUser)?.rank || 'Unranked';

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-cyan-600/10 blur-[150px] -z-10 rounded-full pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Globe className="h-6 w-6 text-cyan-400" />
            <h1 className="text-3xl md:text-4xl font-display font-light tracking-[0.5em] text-white uppercase text-glow-cyan">
              COMMUNITY LEADERBOARD
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest pl-9">
            See how you're growing alongside other engineering students.
          </p>
        </div>
        
        <div className="glass-panel p-4 rounded-2xl border border-cyan-500/30 flex items-center gap-6 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Your Current Rank</p>
            <p className="text-3xl font-black text-cyan-400 text-glow-cyan">
              <span className="text-sm text-cyan-600">#</span>{userRank}
            </p>
          </div>
          <div className="h-12 w-px bg-white/10" />
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Cohort Size</p>
            <p className="text-xl font-black text-white">100</p>
          </div>
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-4 mb-8 pt-4">
        {[1, 0, 2].map(idx => {
          const rival = hierarchy[idx];
          if (!rival) return null;
          const isFirst = idx === 0;
          return (
            <div key={rival.id} className={`glass-panel border rounded-2xl flex flex-col items-center justify-center p-6 transition-all ${
              isFirst ? 'scale-105 border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.15)] bg-amber-900/10 z-10' : 
              idx === 1 ? 'border-slate-300/20 bg-slate-800/20' : 'border-orange-700/20 bg-orange-900/10'
            }`}>
              <div className="mb-4">
                <Trophy className={`h-10 w-10 ${
                  isFirst ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : 'text-orange-400'
                }`} />
              </div>
              <div className="text-center space-y-1">
                <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${
                  isFirst ? 'text-amber-500/50' : 'text-slate-500'
                }`}>Rank 0{rival.rank}</p>
                <h3 className={`text-xl font-black tracking-wider ${rival.isUser ? 'text-cyan-400' : 'text-white'}`}>
                  {rival.alias}
                </h3>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Activity className="h-3 w-3 text-emerald-400" />
                  <p className="text-sm font-bold text-emerald-400">{rival.compositeScore} <span className="text-[10px] text-emerald-600">PTS</span></p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Container: Feed + Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* The Live Feed */}
        <div className="lg:col-span-1 glass-panel rounded-2xl border border-white/5 bg-black/40 p-4">
          <GlobalFeed />
        </div>

        {/* The Matrix Leaderboard */}
        <div className="lg:col-span-2 glass-panel rounded-2xl border border-white/5 overflow-hidden h-[600px] flex flex-col">
          <div className="overflow-x-auto flex-1 scrollbar-hide">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/40 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 border-b border-white/5">
                <th className="p-4 pl-6 text-center w-20">Rank</th>
                <th className="p-4 w-16 text-center">Trend</th>
                <th className="p-4">Student</th>
                <th className="p-4 text-center">Composite Score</th>
                <th className="p-4 text-center">Focus Rating</th>
                <th className="p-4 pr-6 text-right">Study Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {hierarchy.slice(3).map((player) => (
                <tr 
                  key={player.id} 
                  className={`transition-all ${
                    player.isUser 
                      ? 'bg-cyan-900/20 border-l-2 border-l-cyan-400 hover:bg-cyan-900/30' 
                      : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <td className="p-4 pl-6">
                    <div className={`mx-auto w-10 h-10 flex items-center justify-center rounded-xl border text-sm font-black ${getRankStyle(player.rank)}`}>
                      {player.rank}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center">
                      {getTrendIcon(player.trend)}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {player.isUser ? (
                        <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                          <UserCheck className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="p-1.5 rounded-lg bg-white/5 text-slate-500">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <div className={`text-sm font-black tracking-widest ${player.isUser ? 'text-cyan-400 text-glow-cyan' : 'text-slate-300'}`}>
                          {player.alias}
                        </div>
                        {player.isUser && (
                          <div className="text-[9px] font-bold text-cyan-600 uppercase tracking-widest mt-0.5">
                            Active User Identity
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`text-base font-black ${player.isUser ? 'text-emerald-400' : 'text-white'}`}>
                      {player.compositeScore.toFixed(1)}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Target className={`w-3 h-3 ${player.avgFocusScore >= 80 ? 'text-amber-400' : 'text-slate-500'}`} />
                      <span className="text-xs font-bold text-slate-400">{player.avgFocusScore}/100</span>
                    </div>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Flame className={`w-3 h-3 ${player.weeklyStudyHours >= 40 ? 'text-red-500' : 'text-slate-600'}`} />
                      <span className="text-sm font-black text-slate-300">{player.weeklyStudyHours}h</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      </div>
    </div>
  );
};
export default HierarchyMatrix;
