import React, { useState, useContext } from 'react';
import { Sliders, Save, Award, Key, User, Bell } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import api from '../services/api';

export const Settings = () => {
  const { user, updateUser } = useContext(AuthContext);

  const [dailyGoalHours, setDailyGoalHours] = useState(user?.settings?.dailyGoalHours || 6);
  const [breakInterval, setBreakInterval] = useState(user?.settings?.breakInterval || 25);
  const [breakDuration, setBreakDuration] = useState(user?.settings?.breakDuration || 5);
  const [regenAfterSessions, setRegenAfterSessions] = useState(user?.settings?.regenAfterSessions || 4);
  const [notifications, setNotifications] = useState(user?.settings?.notifications ?? true);
  const [studyMode, setStudyMode] = useState(user?.studyMode || 'normal');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      const res = await api.auth.updateSettings({
        studyMode,
        settings: {
          dailyGoalHours: Number(dailyGoalHours),
          breakInterval: Number(breakInterval),
          breakDuration: Number(breakDuration),
          regenAfterSessions: Number(regenAfterSessions),
          notifications
        }
      });
      updateUser(res.user);
      setMessage('Settings matrix successfully compiled.');
    } catch (err) {
      console.error(err);
      setMessage(err.message || 'Error compiling settings configuration.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-b border-white/5 pb-4">
        <h1 className="text-2xl font-black tracking-wider text-white">SYSTEM SETTINGS</h1>
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mt-1">
          Configure academic performance limits and matrix variables.
        </p>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSave} className="glass-panel rounded-3xl p-6 border border-white/5 space-y-6">
          <div className="flex items-center gap-2 border-b border-white/5 pb-4">
            <Sliders className="h-5 w-5 text-accent-blue" />
            <h3 className="text-sm font-black uppercase tracking-wider text-white">Interval Configurations</h3>
          </div>

          {message && (
            <div className={`rounded-xl p-4 text-xs font-bold ${
              message.includes('compiled') ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
              {message}
            </div>
          )}

          {/* Daily study hours slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wide">
              <span>Target daily study goal</span>
              <span className="text-white">{dailyGoalHours} Hours</span>
            </div>
            <input
              type="range"
              min="2"
              max="16"
              step="1"
              value={dailyGoalHours}
              onChange={(e) => setDailyGoalHours(e.target.value)}
              className="w-full h-1.5 bg-navy-900 rounded-lg border border-white/5 appearance-none cursor-pointer accent-accent-blue"
            />
          </div>

          {/* Pomodoro interval slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wide">
              <span>Pomodoro focus block</span>
              <span className="text-white">{breakInterval} Minutes</span>
            </div>
            <input
              type="range"
              min="15"
              max="90"
              step="5"
              value={breakInterval}
              onChange={(e) => setBreakInterval(e.target.value)}
              className="w-full h-1.5 bg-navy-900 rounded-lg border border-white/5 appearance-none cursor-pointer accent-accent-blue"
            />
          </div>

          {/* Break Duration slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wide">
              <span>Short Break / Regeneration Duration</span>
              <span className="text-white">{breakDuration} Minutes</span>
            </div>
            <input
              type="range"
              min="5"
              max="30"
              step="5"
              value={breakDuration}
              onChange={(e) => setBreakDuration(e.target.value)}
              className="w-full h-1.5 bg-navy-900 rounded-lg border border-white/5 appearance-none cursor-pointer accent-accent-blue"
            />
          </div>

          {/* Regeneration after sessions select */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Long Regeneration Trigger</label>
            <select
              value={regenAfterSessions}
              onChange={(e) => setRegenAfterSessions(e.target.value)}
              className="w-full rounded-xl bg-navy-900 border border-white/5 py-2.5 px-4 text-xs text-white focus:outline-none"
            >
              <option value="2">After every 2 sessions</option>
              <option value="3">After every 3 sessions</option>
              <option value="4">After every 4 sessions</option>
              <option value="5">After every 5 sessions</option>
            </select>
          </div>

          {/* Global Study Presets */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Global Study Preset Mode</label>
            <select
              value={studyMode}
              onChange={(e) => setStudyMode(e.target.value)}
              className="w-full rounded-xl bg-navy-900 border border-white/5 py-2.5 px-4 text-xs text-white focus:outline-none"
            >
              <option value="normal">Normal Mode - standard balanced cycles</option>
              <option value="cat_prep">CAT Prep Mode - higher loads & formula tracking</option>
              <option value="exam_prep">Exam Prep Mode - maximal focus intervals</option>
              <option value="recovery">Recovery Mode - deep decompression rest</option>
              <option value="unexpected_event">Unexpected interruption adaptation</option>
            </select>
          </div>

          {/* Toggle notifications */}
          <div className="flex items-center justify-between border-t border-white/5 pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white tracking-wide">Decompression Alerts</p>
                <p className="text-[10px] text-slate-500 font-semibold">Enable desktop push notification reminders.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setNotifications(!notifications)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-all duration-200 border border-white/5 ${
                notifications ? 'bg-accent-blue' : 'bg-navy-900'
              }`}
            >
              <span className={`absolute left-0.5 top-0.5 h-4.5 w-4.5 rounded-full bg-white transition-all ${
                notifications ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-white/5">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 rounded-xl bg-accent-blue hover:bg-accent-blue/90 border border-accent-blue/20 text-white px-4 py-2.5 text-xs font-black uppercase tracking-widest shadow-glow-blue transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              Compile settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default Settings;
