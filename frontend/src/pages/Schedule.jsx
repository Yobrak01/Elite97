import React, { useState, useEffect } from 'react';
import { Landmark, Dumbbell, Calendar, BookOpen, Coffee, Award, Play, AlertCircle, Plus, Edit2, Trash2 } from 'lucide-react';
import api from '../services/api';
import ScheduleBlock from '../components/ScheduleBlock';
import ScheduleBuilderModal from '../components/ScheduleBuilderModal';

export const Schedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [activeSchedule, setActiveSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

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
    setErrorMsg(null);
    try {
      await api.schedule.generateTemplate(dayType);
      await fetchSchedules();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to generate template.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBlueprint = async (data) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (editingSchedule) {
        await api.schedule.update(editingSchedule._id, data);
      } else {
        await api.schedule.create(data);
      }
      await fetchSchedules();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save blueprint.');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingSchedule(null);
    setIsModalOpen(true);
  };

  const openEditModal = (schedule) => {
    setEditingSchedule(schedule);
    setIsModalOpen(true);
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
      case 'church': return Coffee;
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
        <h1 className="text-2xl md:text-3xl font-display font-light tracking-[0.5em] text-cyan-50 text-glow-cyan uppercase opacity-80">SCHEDULE PRESETS</h1>
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mt-1">
          Preset blueprints for specific structural days.
        </p>
      </div>

      {/* Error message */}
      {errorMsg && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3 text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-xs font-semibold">{errorMsg}</p>
        </div>
      )}

      {/* Preset generators */}
      <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-4">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Choose a Blueprint</h3>
          <p className="text-[10px] text-slate-500 font-semibold mt-1">Select a template below to add it to your catalog and start planning your days.</p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 rounded-xl border border-cyan-500/50 bg-cyan-500/20 hover:bg-cyan-500 hover:text-white text-cyan-400 px-4 py-2.5 text-xs font-bold transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/20 cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.2)]"
          >
            <Plus className="h-4 w-4" />
            Create Custom
          </button>
          
          <button
            onClick={() => handleGenerateTemplate('lecture')}
            className="flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500 hover:text-white text-purple-400 px-4 py-2.5 text-xs font-bold transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/20 cursor-pointer"
          >
            <Landmark className="h-4 w-4" />
            Lecture Day
          </button>
          <button
            onClick={() => handleGenerateTemplate('gym')}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-600/30 bg-indigo-600/10 hover:bg-indigo-600 hover:text-white text-indigo-400 px-4 py-2.5 text-xs font-bold transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-600/20 cursor-pointer"
          >
            <Dumbbell className="h-4 w-4" />
            Gym Conditioning Day
          </button>
          <button
            onClick={() => handleGenerateTemplate('exam_week')}
            className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 px-4 py-2.5 text-xs font-bold transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-red-500/20 cursor-pointer"
          >
            <AlertCircle className="h-4 w-4" />
            Exam Prep Marathon
          </button>
          <button
            onClick={() => handleGenerateTemplate('church')}
            className="flex items-center gap-1.5 rounded-xl border border-blue-600/30 bg-blue-600/10 hover:bg-blue-600 hover:text-white text-blue-400 px-4 py-2.5 text-xs font-bold transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-600/20 cursor-pointer"
          >
            <Coffee className="h-4 w-4" />
            Sunday Reset Day
          </button>
        </div>
      </div>

      {/* Main core presets layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Presets List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-white">Your Saved Blueprints</h3>
            
            <div className="space-y-3">
              {schedules.map((s) => {
                const Icon = getDayTypeIcon(s.dayType);
                const isActive = activeSchedule?._id === s._id;

                return (
                  <div
                    key={s._id}
                    className={`rounded-2xl p-4 border transition-all duration-300 flex items-center justify-between gap-4 hover:-translate-y-1 hover:shadow-lg ${
                      isActive
                        ? 'border-cyan-500/50 bg-cyan-500/10 text-glow-gold shadow-cyan-500/10'
                        : 'border-white/5 bg-navy-900/60 text-slate-400 hover:border-white/20'
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
                          className="rounded-lg bg-cyan-500/10 hover:bg-cyan-500 border border-cyan-500/20 hover:border-transparent text-cyan-400 hover:text-white p-2 transition-all cursor-pointer"
                          title="Activate schedule"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => openEditModal(s)}
                        className="rounded-lg border border-white/5 hover:border-blue-500/20 text-slate-500 hover:text-blue-400 p-2 hover:bg-blue-500/10 transition-all cursor-pointer"
                        title="Edit schedule"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(s._id)}
                        className="rounded-lg border border-white/5 hover:border-red-500/20 text-slate-500 hover:text-red-400 p-2 hover:bg-red-500/10 transition-all cursor-pointer"
                        title="Delete schedule"
                      >
                        <Trash2 className="h-4 w-4" />
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
              <h3 className="text-xs font-black uppercase tracking-wider text-white">Today's Itinerary</h3>
              <p className="text-[10px] text-slate-500 font-semibold mt-1">This is the blueprint that will structure your day when activated.</p>
            </div>

            <div className="space-y-4 pt-2">
              {activeSchedule?.blocks && activeSchedule.blocks.length > 0 ? (
                activeSchedule.blocks.map((block, idx) => (
                  <ScheduleBlock key={idx} block={block} />
                ))
              ) : (
                <div className="text-center py-16 px-4">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
                    <Calendar className="h-8 w-8 text-cyan-400 opacity-80" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-2">No active schedule</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    You haven't selected a daily blueprint yet. Generate one from the options above or activate an existing one to see your day!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <ScheduleBuilderModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingSchedule(null); }}
        onSave={handleSaveBlueprint}
        initialData={editingSchedule}
      />
    </div>
  );
};
export default Schedule;


