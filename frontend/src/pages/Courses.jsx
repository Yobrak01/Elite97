import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import api from '../services/api';

export const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [unitCode, setUnitCode] = useState('');
  const [unitName, setUnitName] = useState('');
  const [semester, setSemester] = useState('1');
  const [year, setYear] = useState('1');
  const [credits, setCredits] = useState('3');
  const [difficulty, setDifficulty] = useState('0');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await api.courses.getAll();
      setCourses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setUnitCode('');
    setUnitName('');
    setSemester('1');
    setYear('1');
    setCredits('3');
    setDifficulty('0');
    setEditingId(null);
    setModalOpen(true);
  };

  const openEditModal = (course) => {
    setUnitCode(course.unitCode);
    setUnitName(course.unitName);
    setSemester(course.semester.toString());
    setYear(course.year.toString());
    setCredits(course.credits.toString());
    setDifficulty(course.difficulty.toString());
    setEditingId(course._id);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this course unit?')) {
      try {
        await api.courses.delete(id);
        setCourses(prev => prev.filter(c => c._id !== id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const data = {
      unitCode,
      unitName,
      semester: Number(semester),
      year: Number(year),
      credits: Number(credits),
      difficulty: Number(difficulty)
    };

    try {
      if (editingId) {
        const res = await api.courses.update(editingId, data);
        setCourses(prev => prev.map(c => c._id === editingId ? res.data : c));
      } else {
        const res = await api.courses.create(data);
        setCourses(prev => [res.data, ...prev]);
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error saving course');
    } finally {
      setSubmitting(false);
    }
  };

  const getTierBadgeClasses = (tier) => {
    switch (tier) {
      case 'tier1_critical': return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'tier2_high': return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
      case 'tier3_standard': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'tier4_low': return 'bg-green-500/20 text-green-400 border border-green-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-accent-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-wider text-white">COURSE UNITS</h1>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mt-1">
            Academic load matrix and priority weighting.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 rounded-xl bg-accent-gold hover:bg-accent-gold/90 border border-accent-gold/20 text-white px-3.5 py-2 text-xs font-black uppercase tracking-widest shadow-glow-gold transition-all"
        >
          <Plus className="h-4 w-4" />
          Add Course Unit
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="glass-panel rounded-2xl border border-white/5 p-12 text-center text-xs font-semibold text-slate-500">
          No course units registered in the system.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map(course => (
            <div key={course._id} className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col justify-between space-y-4 hover:border-white/10 transition-all">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <h4 className="text-lg font-bold tracking-wide text-white">{course.unitCode}</h4>
                  <div className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${getTierBadgeClasses(course.aiSuggestedTier)}`}>
                    {course.aiSuggestedTier.replace('_', ' ')}
                  </div>
                </div>
                <p className="text-sm font-semibold text-slate-300">{course.unitName}</p>
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-slate-400 border-t border-white/5 pt-3">
                <div className="flex flex-col gap-1">
                  <span>Year {course.year} • Sem {course.semester}</span>
                  <span>{course.credits} Credits • Diff: {course.difficulty}/5</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEditModal(course)} className="p-1.5 hover:text-white transition-colors">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(course._id)} className="p-1.5 hover:text-red-400 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 border border-white/10 shadow-2xl">
            <h3 className="text-lg font-black tracking-wide text-white mb-4 uppercase">{editingId ? 'Edit Course Unit' : 'Add Course Unit'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Unit Code</label>
                  <input type="text" required value={unitCode} onChange={e => setUnitCode(e.target.value)} className="w-full rounded-xl bg-navy-900 border border-white/5 py-2.5 px-4 text-sm text-white focus:outline-none" placeholder="ENG101" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Credits</label>
                  <input type="number" min="1" required value={credits} onChange={e => setCredits(e.target.value)} className="w-full rounded-xl bg-navy-900 border border-white/5 py-2.5 px-4 text-sm text-white focus:outline-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Unit Name</label>
                <input type="text" required value={unitName} onChange={e => setUnitName(e.target.value)} className="w-full rounded-xl bg-navy-900 border border-white/5 py-2.5 px-4 text-sm text-white focus:outline-none" placeholder="Engineering Mathematics I" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Year</label>
                  <input type="number" min="1" max="5" required value={year} onChange={e => setYear(e.target.value)} className="w-full rounded-xl bg-navy-900 border border-white/5 py-2.5 px-4 text-sm text-white focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Semester</label>
                  <input type="number" min="1" max="2" required value={semester} onChange={e => setSemester(e.target.value)} className="w-full rounded-xl bg-navy-900 border border-white/5 py-2.5 px-4 text-sm text-white focus:outline-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Difficulty Level</label>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full rounded-xl bg-navy-900 border border-white/5 py-2.5 px-4 text-sm text-white focus:outline-none">
                  <option value="0">✨ AI Auto-Rate</option>
                  <option value="5">5 - Brutal</option>
                  <option value="4">4 - Hard</option>
                  <option value="3">3 - Normal</option>
                  <option value="2">2 - Easy</option>
                  <option value="1">1 - Trivial</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl px-4 py-2 text-xs font-bold text-slate-400 hover:text-white">Cancel</button>
                <button type="submit" disabled={submitting} className="rounded-xl bg-accent-gold text-white px-4 py-2 text-xs font-black uppercase disabled:opacity-50 tracking-widest">{editingId ? 'Update' : 'Confirm'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Courses;
