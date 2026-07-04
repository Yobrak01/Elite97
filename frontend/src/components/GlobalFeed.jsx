import React, { useState, useEffect } from 'react';
import { Activity, Clock, Zap, Target, ShieldAlert, Award, AlertTriangle } from 'lucide-react';
import api from '../services/api';

const GlobalFeed = () => {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFeed = async () => {
    try {
      const res = await api.analytics.getGlobalFeed();
      if (res.success && res.data) {
        setFeed(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch global feed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
    const interval = setInterval(fetchFeed, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center p-8">
        <Activity className="w-8 h-8 text-cyan-500 animate-spin opacity-50" />
      </div>
    );
  }

  const getEventStyles = (event) => {
    if (event.isUser) {
      if (event.severity === 'punitive') {
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          text: 'text-white',
          aliasColor: 'text-red-400',
          icon: <ShieldAlert className="w-4 h-4 text-red-500" />
        };
      }
      return {
        bg: 'bg-cyan-500/10',
        border: 'border-cyan-500/30',
        text: 'text-cyan-50',
        aliasColor: 'text-cyan-400',
        icon: <Target className="w-4 h-4 text-cyan-400" />
      };
    }

    switch (event.severity) {
      case 'elite':
        return {
          bg: 'bg-purple-500/5',
          border: 'border-purple-500/20',
          text: 'text-purple-100',
          aliasColor: 'text-purple-400',
          icon: <Award className="w-4 h-4 text-purple-400" />
        };
      case 'high':
        return {
          bg: 'bg-amber-500/5',
          border: 'border-amber-500/20',
          text: 'text-amber-100',
          aliasColor: 'text-amber-400',
          icon: <Zap className="w-4 h-4 text-amber-400" />
        };
      case 'punitive':
        return {
          bg: 'bg-red-900/10',
          border: 'border-red-500/10',
          text: 'text-slate-400',
          aliasColor: 'text-red-800',
          icon: <AlertTriangle className="w-4 h-4 text-red-800" />
        };
      default:
        return {
          bg: 'bg-white/5',
          border: 'border-white/5',
          text: 'text-slate-300',
          aliasColor: 'text-slate-500',
          icon: <Activity className="w-4 h-4 text-slate-500" />
        };
    }
  };

  const formatTime = (minutesAgo) => {
    if (minutesAgo < 1) return 'Just now';
    if (minutesAgo < 60) return `${minutesAgo}m ago`;
    const hours = Math.floor(minutesAgo / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="flex flex-col h-[600px]">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/10">
        <Activity className="w-5 h-5 text-cyan-400" />
        <h3 className="text-sm font-black text-cyan-50 tracking-widest uppercase">Community Activity Feed</h3>
        <span className="ml-auto flex items-center gap-1.5 text-[10px] font-bold text-cyan-500 uppercase tracking-widest bg-cyan-950/50 px-2 py-1 rounded-md border border-cyan-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
          Live Monitoring
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
        {feed.length === 0 ? (
          <div className="text-center text-xs text-slate-500 font-bold uppercase tracking-widest mt-10">No recent activity detected.</div>
        ) : (
          feed.map(event => {
            const styles = getEventStyles(event);
            return (
              <div 
                key={event.id}
                className={`flex gap-3 p-3 rounded-xl border ${styles.border} ${styles.bg} transition-all hover:scale-[1.02]`}
              >
                <div className="mt-0.5">{styles.icon}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-0.5">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${styles.aliasColor} ${event.isUser ? 'text-glow-cyan' : ''}`}>
                      {event.alias}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(event.minutesAgo)}
                    </span>
                  </div>
                  <p className={`text-xs font-semibold ${styles.text}`}>
                    {event.text.replace(event.alias, '').trim()}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default GlobalFeed;
