import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Clock, Activity, Tag, Type } from 'lucide-react';

const CATEGORIES = ['study', 'break', 'exercise', 'lecture', 'personal', 'revision'];

export const ScheduleBuilderModal = ({ isOpen, onClose, onSave, initialData = null }) => {
  const [templateName, setTemplateName] = useState('');
  const [dayType, setDayType] = useState('custom');
  const [blocks, setBlocks] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTemplateName(initialData.templateName || '');
        setDayType(initialData.dayType || 'custom');
        setBlocks(initialData.blocks || []);
      } else {
        setTemplateName('');
        setDayType('custom');
        setBlocks([{ startTime: '08:00', endTime: '09:00', activity: 'Morning Focus', category: 'study', duration: 60 }]);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleAddBlock = () => {
    const lastBlock = blocks[blocks.length - 1];
    let newStartTime = '09:00';
    let newEndTime = '10:00';
    
    if (lastBlock) {
      newStartTime = lastBlock.endTime;
      // Simple logic to add 1 hour to newEndTime for default
      const [h, m] = newStartTime.split(':').map(Number);
      newEndTime = `${String((h + 1) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    setBlocks([...blocks, { startTime: newStartTime, endTime: newEndTime, activity: '', category: 'study', duration: 60 }]);
  };

  const handleRemoveBlock = (index) => {
    setBlocks(blocks.filter((_, i) => i !== index));
  };

  const updateBlock = (index, field, value) => {
    const updated = [...blocks];
    updated[index][field] = value;
    
    if (field === 'startTime' || field === 'endTime') {
      const start = updated[index].startTime;
      const end = updated[index].endTime;
      if (start && end) {
        const [h1, m1] = start.split(':').map(Number);
        const [h2, m2] = end.split(':').map(Number);
        let duration = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (duration < 0) duration += 24 * 60; // handle overnight
        updated[index].duration = duration;
      }
    }
    
    setBlocks(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!templateName.trim() || blocks.length === 0) return;
    
    setIsSubmitting(true);
    try {
      await onSave({
        templateName,
        dayType,
        blocks
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-navy-900 border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h2 className="text-lg font-bold text-white">{initialData ? 'Edit Blueprint' : 'Create Custom Blueprint'}</h2>
            <p className="text-xs text-slate-400 mt-1">Design your structural day block by block.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 flex-1 custom-scrollbar">
          <form id="blueprint-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5" /> Template Name
                </label>
                <input
                  type="text"
                  required
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g. Deep Focus Hackathon"
                  className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> Day Type Tag
                </label>
                <select
                  value={dayType}
                  onChange={(e) => setDayType(e.target.value)}
                  className="w-full bg-navy-950 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                >
                  <option value="custom">Custom</option>
                  <option value="lecture">Lecture</option>
                  <option value="gym">Gym / Exercise</option>
                  <option value="exam_week">Exam Week</option>
                  <option value="church">Rest / Reset</option>
                  <option value="free">Free / Unstructured</option>
                </select>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Schedule Blocks
                </label>
                <button
                  type="button"
                  onClick={handleAddBlock}
                  className="flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1.5 rounded-lg border border-cyan-500/20 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Block
                </button>
              </div>

              {blocks.map((block, idx) => (
                <div key={idx} className="flex flex-col md:flex-row items-start md:items-center gap-3 bg-navy-950/50 border border-white/5 p-3 rounded-xl hover:border-white/20 transition-colors">
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <input
                      type="time"
                      required
                      value={block.startTime}
                      onChange={(e) => updateBlock(idx, 'startTime', e.target.value)}
                      className="bg-navy-900 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50 w-full md:w-28 text-center"
                    />
                    <span className="text-slate-500 font-bold">-</span>
                    <input
                      type="time"
                      required
                      value={block.endTime}
                      onChange={(e) => updateBlock(idx, 'endTime', e.target.value)}
                      className="bg-navy-900 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50 w-full md:w-28 text-center"
                    />
                  </div>

                  <div className="flex-1 w-full">
                    <input
                      type="text"
                      required
                      placeholder="Activity Description"
                      value={block.activity}
                      onChange={(e) => updateBlock(idx, 'activity', e.target.value)}
                      className="w-full bg-navy-900 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <select
                      value={block.category}
                      onChange={(e) => updateBlock(idx, 'category', e.target.value)}
                      className="bg-navy-900 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50 w-full md:w-32"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRemoveBlock(idx)}
                      className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg border border-transparent hover:border-red-500/20 transition-all shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              {blocks.length === 0 && (
                <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                  <p className="text-xs text-slate-500 font-semibold">No blocks added. Add a block to build your schedule.</p>
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="p-5 border-t border-white/10 flex justify-end gap-3 bg-navy-950/50 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition-all"
          >
            Cancel
          </button>
          <button
            form="blueprint-form"
            type="submit"
            disabled={isSubmitting || blocks.length === 0}
            className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-white bg-cyan-500 hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save Blueprint'}
          </button>
        </div>
      </div>
    </div>
  );
};
export default ScheduleBuilderModal;
