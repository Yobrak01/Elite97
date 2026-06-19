import React, { useState, useEffect } from 'react';
import { Anchor, ShieldAlert, ShieldCheck, Clock } from 'lucide-react';
import api from '../services/api';

import AuthContext from '../context/AuthContext';

const CircadianAnchor = ({ onAnchorUpdate }) => {
  const { user } = React.useContext(AuthContext);
  const [status, setStatus] = useState('loading'); // loading, pending, success, breached
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await api.life.getCircadianStatus();
      if (res.success && res.data) {
        setStatus(res.data.status);
      }
    } catch (err) {
      console.error('Failed to fetch circadian status', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleEstablish = async () => {
    try {
      setLoading(true);
      const res = await api.life.establishAnchor();
      if (res.success && res.data) {
        setStatus(res.data.status);
        if (onAnchorUpdate) onAnchorUpdate();
      }
    } catch (err) {
      console.error('Failed to establish anchor', err);
      // If server returns error, might be due to testing constraints, re-fetch
      fetchStatus();
    }
  };

  if (loading) {
    return (
      <div className="h-24 glass-panel rounded-2xl border border-white/5 animate-pulse flex items-center justify-center">
        <Clock className="w-6 h-6 text-slate-500 animate-spin" />
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="glass-panel rounded-2xl border border-cyan-500/50 bg-cyan-900/20 p-6 flex flex-col md:flex-row items-center justify-between shadow-[0_0_30px_rgba(6,182,212,0.15)] relative overflow-hidden group">
        <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <div className="flex items-center gap-4">
          <div className="p-3 bg-cyan-500/20 rounded-xl">
            <ShieldCheck className="h-8 w-8 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-cyan-400 tracking-widest uppercase text-glow-cyan">Alpha Anchor Established</h2>
            <p className="text-xs text-cyan-100/70 font-bold uppercase tracking-wider mt-1">+15% Focus & Productivity Multiplier Active</p>
          </div>
        </div>
        <div className="mt-4 md:mt-0 text-right">
          <div className="text-[10px] font-black uppercase tracking-widest text-cyan-600">Protocol Status</div>
          <div className="text-lg font-black text-white tracking-widest">LOCKED IN</div>
        </div>
      </div>
    );
  }

  if (status === 'breached') {
    return (
      <div className="glass-panel rounded-2xl border border-red-500/50 bg-red-900/20 p-6 flex flex-col md:flex-row items-center justify-between shadow-[0_0_30px_rgba(239,68,68,0.15)] relative overflow-hidden group">
        <div className="absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-500/20 rounded-xl relative">
            <ShieldAlert className="h-8 w-8 text-red-500" />
            <div className="absolute inset-0 border-2 border-red-500 rounded-xl animate-ping opacity-20" />
          </div>
          <div>
            <h2 className="text-xl font-black text-red-500 tracking-widest uppercase text-glow-red">Circadian Protocol Breached</h2>
            <p className="text-xs text-red-200/70 font-bold uppercase tracking-wider mt-1">-20% Sluggish Penalty Applied to Global Matrix</p>
          </div>
        </div>
        <div className="mt-4 md:mt-0 text-right">
          <div className="text-[10px] font-black uppercase tracking-widest text-red-700">Protocol Status</div>
          <div className="text-lg font-black text-white tracking-widest">FAILED</div>
        </div>
      </div>
    );
  }

  const anchorTimeStr = user?.settings?.circadianAnchorTime || '05:30';
  const anchorGrace = user?.settings?.circadianAnchorGraceMinutes || 30;

  // Pending
  return (
    <div className="glass-panel rounded-2xl border border-amber-500/30 bg-amber-900/10 p-6 flex flex-col md:flex-row items-center justify-between shadow-[0_0_30px_rgba(245,158,11,0.1)] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]" />
      <div className="flex items-center gap-4">
        <div className="p-3 bg-amber-500/20 rounded-xl animate-pulse">
          <Anchor className="h-8 w-8 text-amber-400" />
        </div>
        <div>
          <h2 className="text-xl font-black text-amber-400 tracking-widest uppercase">Circadian Anchor Pending</h2>
          <p className="text-xs text-amber-200/70 font-bold uppercase tracking-wider mt-1">Window starts at {anchorTimeStr} (Grace: {anchorGrace}m)</p>
        </div>
      </div>
      <div className="mt-4 md:mt-0">
        <button 
          onClick={handleEstablish}
          className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-black uppercase tracking-widest shadow-glow-cyan transition-all transform hover:scale-105 active:scale-95"
        >
          Establish Anchor
        </button>
      </div>
    </div>
  );
};

export default CircadianAnchor;
