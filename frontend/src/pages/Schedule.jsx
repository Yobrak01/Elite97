import React, { useState, useEffect } from 'react';
import { Landmark, Dumbbell, Calendar, BookOpen, Coffee, Award, Play, AlertCircle } from 'lucide-react';
import api from '../services/api';
import ScheduleBlock from '../components/ScheduleBlock';

export const Schedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [activeSchedule, setActiveSchedule] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = async () => {
    try {
      const [listRes, activeRes] = await Promise.all([
        api.schedule.getAll(),
        api.schedule.getActive()
      ]);
      setSchedules(listRes.data);
      setActiveSchedule(activeRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleGenerateTemplate = async (dayType) => {
    setLoading(true);
    try {
      await api.schedule.generateTemplate(dayType);
      await fetchSchedules();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (id) => {
    setLoading(true);
    try {
      await api.schedule.activate(id);
      await fetchSchedules();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Confirm delete schedule preset?')) return;
    setLoading(true);
    try {
      await api.schedule.delete(id);
      await fetchSchedules();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getDayTypeIcon = (type) => {
    switch (type) {
      case 'lecture': return Landmark;
      case 'gym': return Dumbbell;
      case 'exam_week': return AlertCircle;
      default: return Calendar;
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
      <div className="border-b border-white/5 pb-4">
        <h1 className="text-2xl font-black tracking-wider text-white">SCHEDULE PRESETS</h1>
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mt-1">
          Preset blueprints for specific structural days.
        </p>
      </div>

      {/* Preset generators */}
      <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-4">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Generate Preset Day Blueprints</h3>
          <p className="text-[10px] text-slate-500 font-semibold mt-1">Commit structured presets into your schedule backlog.</p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => handleGenerateTemplate('lecture')}
            className="flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 px-4 py-2.5 text-xs font-bold transition-all cursor-pointer"
          >
            <Landmark className="h-4 w-4" />
            Lecture Day
          </button>
          <button
            onClick={() => handleGenerateTemplate('gym')}
            className="flex items-center gap-1.5 rounded-xl border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 px-4 py-2.5 text-xs font-bold transition-all cursor-pointer"
          >
            <Dumbbell className="h-4 w-4" />
            Gym Conditioning Day
          </button>
          <button
            onClick={() => handleGenerateTemplate('exam_week')}
            className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2.5 text-xs font-bold transition-all cursor-pointer"
          >
            <AlertCircle className="h-4 w-4" />
            Exam Prep Marathon
          </button>
          <button
            onClick={() => handleGenerateTemplate('church')}
            className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 px-4 py-2.5 text-xs font-bold transition-all cursor-pointer"
          >
            <Calendar className="h-4 w-4" />
            Sunday Reset Day
          </button>
        </div>
      </div>

      {/* Main core presets layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Presets List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-white">Preset Day Catalog</h3>
            
            <div className="space-y-3">
              {schedules.map((s) => {
                const Icon = getDayTypeIcon(s.dayType);
                const isActive = activeSchedule?._id === s._id;

                return (
                  <div
                    key={s._id}
                    className={`rounded-2xl p-4 border transition-all duration-200 flex items-center justify-between gap-4 ${
                      isActive
                        ? 'border-accent-gold/30 bg-accent-gold/10 text-glow-gold'
                        : 'border-white/5 bg-navy-900/60 text-slate-400 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-950 border border-white/5 text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white leading-tight">{s.templateName}</h4>
                        <p className="text-[9px] uppercase tracking-widest text-slate-500 mt-1 font-bold">
                          {s.dayType} • {s.blocks.length} blocks
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!isActive && (
                        <button
                          onClick={() => handleActivate(s._id)}
                          className="rounded-lg bg-accent-gold/10 hover:bg-accent-gold border border-accent-gold/20 hover:border-transparent text-accent-gold hover:text-white p-2 transition-all cursor-pointer"
                          title="Activate schedule"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(s._id)}
                        className="rounded-lg border border-white/5 hover:border-red-500/20 text-slate-500 hover:text-red-400 p-2 hover:bg-red-500/10 transition-all cursor-pointer"
                        title="Delete schedule"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Blueprint Detail Timeline */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white">Active Timeline Preview</h3>
              <p className="text-[10px] text-slate-500 font-semibold mt-1">This blueprint will structure active study days when activated.</p>
            </div>

            <div className="space-y-4 pt-2">
              {activeSchedule?.blocks && activeSchedule.blocks.length > 0 ? (
                activeSchedule.blocks.map((block, idx) => (
                  <ScheduleBlock key={idx} block={block} />
                ))
              ) : (
                <div className="text-center py-12 text-xs text-slate-500 font-semibold">
                  No active schedule preset selected. Choose or generate a catalog entry.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Schedule;
