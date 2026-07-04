import React, { useState, useEffect } from 'react';
import { Flame, Plus, Check, Trash2 } from 'lucide-react';
import api from '../services/api';

export const Streaks = () => {
  const [streaks, setStreaks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newStreakTitle, setNewStreakTitle] = useState('');

  const fetchStreaks = async () => {
    try {
      const res = await api.streaks.getAll();
      setStreaks(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreaks();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newStreakTitle.trim()) return;
    try {
      await api.streaks.create(newStreakTitle);
      setNewStreakTitle('');
      fetchStreaks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleComplete = async (id) => {
    try {
      await api.streaks.complete(id);
      fetchStreaks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.streaks.delete(id);
      fetchStreaks();
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

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg blur opacity-20 animate-pulse"></div>
        <div className="relative flex flex-col md:flex-row items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.3)]">
            <Flame className="h-8 w-8 text-orange-400 drop-shadow-[0_0_10px_rgba(249,115,22,0.8)] animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl md:text-5xl font-display font-black tracking-widest text-white drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]">Discipline Streaks</h1>
            <p className="text-xs text-orange-400 font-bold uppercase tracking-widest mt-2">
              Build Consistency, One Day at a Time
            </p>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:border-orange-500/30 transition-all duration-500">
        <div className="absolute -right-20 -top-20 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-all duration-700"></div>
        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-4 relative z-10">
          <input
            type="text"
            value={newStreakTitle}
            onChange={(e) => setNewStreakTitle(e.target.value)}
            placeholder="E.g. 1 Hour Algorithm Practice..."
            className="flex-1 bg-navy-950/50 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all text-sm font-semibold tracking-wide"
          />
          <button
            type="submit"
            disabled={!newStreakTitle.trim()}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-xl font-bold tracking-wider text-sm disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)]"
          >
            <Plus className="h-4 w-4" />
            Start New Streak
          </button>
        </form>
      </div>

      {/* Streaks Grid */}
      {streaks.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-orange-500/5 opacity-50"></div>
          <Flame className="h-16 w-16 text-slate-700 mx-auto mb-4 relative z-10" />
          <h3 className="text-xl font-black text-slate-400 relative z-10">No Active Streaks</h3>
          <p className="text-slate-500 mt-2 font-medium relative z-10">Add your first discipline streak above to start building unbreakable habits!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {streaks.map(streak => {
            const isCompletedToday = streak.lastCompletedDate && new Date(streak.lastCompletedDate).toDateString() === new Date().toDateString();
            const currentStreak = streak.currentStreak || 0;
            return (
            <div key={streak._id} className="bg-navy-900/60 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:border-orange-500/30 hover:shadow-[0_0_40px_rgba(249,115,22,0.15)] transition-all duration-500 space-y-5 relative group overflow-hidden flex flex-col">
              <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-all duration-700"></div>
              
              <div className="flex justify-between items-start z-10 relative">
                <div className="flex-1">
                  <h3 className="text-lg font-black text-white leading-tight">{streak.title}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Flame className="h-4 w-4 text-orange-400" />
                    <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
                      {currentStreak} Day{currentStreak !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(streak._id)}
                  className="text-slate-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-400/10 transition-colors"
                  title="Delete Streak"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-auto pt-4 border-t border-white/5 z-10 relative">
                {isCompletedToday ? (
                  <div className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-bold uppercase tracking-wider">
                    <Check className="h-4 w-4" />
                    Completed Today
                  </div>
                ) : (
                  <button
                    onClick={() => handleComplete(streak._id)}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-orange-500/20 border border-white/10 hover:border-orange-500/50 rounded-xl text-white hover:text-orange-400 text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    <Check className="h-4 w-4" />
                    Mark Completed Today
                  </button>
                )}
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  );
};

export default Streaks;
