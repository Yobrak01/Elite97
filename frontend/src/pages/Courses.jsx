import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit2, Trash2, Loader2, Target, UploadCloud, FileText, CheckCircle2 } from 'lucide-react';
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
  
  // Assessment Structure State
  const [assessmentStructure, setAssessmentStructure] = useState([]);
  
  const [submitting, setSubmitting] = useState(false);

  // Syllabus Parsing State
  const [parsingId, setParsingId] = useState(null);
  const [syllabusTasks, setSyllabusTasks] = useState(null);
  const [savingSyllabus, setSavingSyllabus] = useState(false);
  const fileInputRef = React.useRef(null);
  const [targetCourseId, setTargetCourseId] = useState(null);

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

  const applyPreset = (type) => {
    if (type === 'non-design') {
      setAssessmentStructure([
        { name: 'CAT 1', weight: 15, achievedScore: '' },
        { name: 'CAT 2', weight: 15, achievedScore: '' },
        { name: 'Final Exam', weight: 70, achievedScore: '' }
      ]);
    } else if (type === 'design') {
      setAssessmentStructure([
        { name: 'CATs', weight: 40, achievedScore: '' },
        { name: 'Design Project', weight: 60, achievedScore: '' }
      ]);
    }
  };

  const addAssessmentRow = () => {
    setAssessmentStructure([...assessmentStructure, { name: '', weight: 0, achievedScore: '' }]);
  };

  const updateAssessmentRow = (index, field, value) => {
    const newStruct = [...assessmentStructure];
    newStruct[index][field] = value;
    setAssessmentStructure(newStruct);
  };

  const removeAssessmentRow = (index) => {
    setAssessmentStructure(assessmentStructure.filter((_, i) => i !== index));
  };

  const openCreateModal = () => {
    setUnitCode('');
    setUnitName('');
    setSemester('1');
    setYear('1');
    setCredits('0'); 
    setDifficulty('0'); 
    setAssessmentStructure([]);
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
    
    // Map assessment structure, replacing null achievedScore with empty string for inputs
    setAssessmentStructure((course.assessmentStructure || []).map(a => ({
      name: a.name,
      weight: a.weight,
      achievedScore: a.achievedScore !== null && a.achievedScore !== undefined ? a.achievedScore : ''
    })));
    
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
    
    // Clean up assessment structure
    const cleanedStructure = assessmentStructure.map(a => ({
      name: a.name,
      weight: Number(a.weight) || 0,
      achievedScore: a.achievedScore !== '' ? Number(a.achievedScore) : null
    }));

    // Verify weights sum to 100
    const totalWeight = cleanedStructure.reduce((sum, a) => sum + a.weight, 0);
    if (cleanedStructure.length > 0 && totalWeight !== 100) {
      alert(`Assessment weights must sum to 100%. Currently: ${totalWeight}%`);
      setSubmitting(false);
      return;
    }

    const data = {
      unitCode,
      unitName,
      semester: Number(semester),
      year: Number(year),
      credits: Number(credits),
      difficulty: Number(difficulty),
      assessmentStructure: cleanedStructure
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
      case 'tier2_high': return 'bg-indigo-600/20 text-indigo-400 border border-indigo-600/30';
      case 'tier3_standard': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'tier4_low': return 'bg-green-500/20 text-green-400 border border-green-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
    }
  };

  const handleSyllabusUploadClick = (courseId) => {
    setTargetCourseId(courseId);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !targetCourseId) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a valid PDF file.');
      return;
    }

    setParsingId(targetCourseId);
    try {
      const res = await api.courses.uploadSyllabus(targetCourseId, file);
      if (res.data && res.data.length > 0) {
        setSyllabusTasks(res.data);
      } else {
        alert('No tasks or deadlines could be detected in this syllabus.');
      }
    } catch (error) {
      console.error(error);
      alert('Error parsing syllabus. Ensure it is a text-based PDF, not scanned images.');
    } finally {
      setParsingId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const saveSyllabusTasks = async () => {
    if (!syllabusTasks) return;
    setSavingSyllabus(true);
    try {
      const formattedTasks = syllabusTasks.map(task => ({
        title: task.title,
        description: `Auto-extracted from syllabus.\nOriginal text: "${task.sourceText}"`,
        type: 'academic',
        priority: task.priority,
        deadline: task.deadline,
        estimatedPomodoros: task.estimatedPomodoros,
        status: 'pending'
      }));

      await api.tasks.createBulk(formattedTasks);
      
      alert(`Successfully integrated ${syllabusTasks.length} tasks into your matrix!`);
      setSyllabusTasks(null);
    } catch (err) {
      console.error('Failed to save some syllabus tasks:', err);
      alert('Failed to save some tasks.');
    } finally {
      setSavingSyllabus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-light tracking-[0.5em] text-cyan-50 text-glow-cyan uppercase opacity-80">COURSE UNITS</h1>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mt-1">
            Academic load matrix and priority weighting.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-500/90 border border-cyan-500/20 text-white px-3.5 py-2 text-xs font-black uppercase tracking-widest shadow-glow-cyan transition-all"
        >
          <Plus className="h-4 w-4" />
          Add Course Unit
        </button>
      </div>

      <input 
        type="file" 
        accept="application/pdf" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />

      {courses.length === 0 ? (
        <div className="glass-panel rounded-2xl border border-white/5 p-12 text-center text-xs font-semibold text-slate-500">
          No course units registered in the system.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map(course => {
            const hasAssessments = course.assessmentStructure && course.assessmentStructure.length > 0;
            const completedWeight = hasAssessments ? course.assessmentStructure.filter(a => a.achievedScore !== null).reduce((s,a) => s + a.weight, 0) : 0;
            
            return (
              <div key={course._id} className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col justify-between space-y-4 hover:border-white/10 transition-all">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="text-lg font-bold tracking-wide text-white">{course.unitCode}</h4>
                    <div className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${getTierBadgeClasses(course.aiSuggestedTier)}`}>
                      {(course.aiSuggestedTier || 'unranked').replace('_', ' ')}
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-slate-300">{course.unitName}</p>
                </div>
                
                {hasAssessments && (
                  <div className="bg-navy-900/50 rounded-lg p-2 border border-white/5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                      <span>Assessment Structure</span>
                      <span className="text-cyan-400">{completedWeight}% Locked In</span>
                    </div>
                    <div className="flex gap-1 h-1.5 w-full rounded-full overflow-hidden">
                      {course.assessmentStructure.map((item, idx) => (
                        <div 
                          key={idx} 
                          title={`${item.name} (${item.weight}%)`}
                          className={`h-full ${item.achievedScore !== null ? 'bg-green-500' : 'bg-slate-600'}`} 
                          style={{ width: `${item.weight}%` }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs font-bold text-slate-400 border-t border-white/5 pt-3">
                  <div className="flex flex-col gap-1">
                    <span>Year {course.year} • Sem {course.semester}</span>
                    <span>{course.credits} Credits • Diff: {course.difficulty}/5</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEditModal(course)} className="p-1.5 hover:text-white transition-colors" title="Edit Course">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleSyllabusUploadClick(course._id)} 
                      disabled={parsingId === course._id}
                      className="p-1.5 text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50" 
                      title="Parse Syllabus PDF"
                    >
                      {parsingId === course._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                    </button>
                    <button onClick={() => handleDelete(course._id)} className="p-1.5 hover:text-red-400 transition-colors" title="Delete Course">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 border border-white/10 shadow-2xl my-auto">
            <h3 className="text-lg font-black tracking-wide text-white mb-4 uppercase">{editingId ? 'Edit Course Unit' : 'Add Course Unit'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Unit Code</label>
                  <input type="text" required value={unitCode} onChange={e => setUnitCode(e.target.value)} className="w-full rounded-xl bg-navy-900 border border-white/5 py-2 px-4 text-sm text-white focus:outline-none" placeholder="ENG101" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Credits</label>
                  <select value={credits} onChange={e => setCredits(e.target.value)} className="w-full rounded-xl bg-navy-900 border border-white/5 py-2 px-4 text-sm text-white focus:outline-none">
                    <option value="0">✨ AI Auto-Assign</option>
                    <option value="4">4 Credits (Heavy)</option>
                    <option value="3">3 Credits (Standard)</option>
                    <option value="2">2 Credits (Moderate)</option>
                    <option value="1">1 Credit (Light)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Unit Name</label>
                <input type="text" required value={unitName} onChange={e => setUnitName(e.target.value)} className="w-full rounded-xl bg-navy-900 border border-white/5 py-2 px-4 text-sm text-white focus:outline-none" placeholder="Engineering Mathematics I" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Year</label>
                  <input type="number" min="1" max="5" required value={year} onChange={e => setYear(e.target.value)} className="w-full rounded-xl bg-navy-900 border border-white/5 py-2 px-4 text-sm text-white focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Semester</label>
                  <input type="number" min="1" max="2" required value={semester} onChange={e => setSemester(e.target.value)} className="w-full rounded-xl bg-navy-900 border border-white/5 py-2 px-4 text-sm text-white focus:outline-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Difficulty Level</label>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full rounded-xl bg-navy-900 border border-white/5 py-2 px-4 text-sm text-white focus:outline-none">
                  <option value="0">✨ AI Auto-Rate</option>
                  <option value="5">5 - Brutal</option>
                  <option value="4">4 - Hard</option>
                  <option value="3">3 - Normal</option>
                  <option value="2">2 - Easy</option>
                  <option value="1">1 - Trivial</option>
                </select>
              </div>

              {/* Assessment Structure Builder */}
              <div className="border-t border-white/5 pt-4 mt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-blue-400 flex items-center gap-1">
                    <Target className="w-3 h-3" /> Assessment Structure
                  </label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => applyPreset('non-design')} className="text-[9px] font-bold uppercase tracking-wider bg-navy-900 border border-white/10 px-2 py-1 rounded text-slate-300 hover:text-white transition-colors">
                      Non-Design
                    </button>
                    <button type="button" onClick={() => applyPreset('design')} className="text-[9px] font-bold uppercase tracking-wider bg-navy-900 border border-white/10 px-2 py-1 rounded text-slate-300 hover:text-white transition-colors">
                      Design
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mb-3 max-h-40 overflow-y-auto custom-scrollbar">
                  {assessmentStructure.map((row, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-black/20 p-2 rounded-lg border border-white/5">
                      <input 
                        type="text" 
                        placeholder="Item (e.g. CAT 1)" 
                        value={row.name}
                        onChange={(e) => updateAssessmentRow(idx, 'name', e.target.value)}
                        className="flex-1 min-w-0 rounded bg-navy-900 border border-white/5 py-1.5 px-2 text-xs text-white focus:outline-none"
                      />
                      <div className="flex items-center gap-1 w-20">
                        <input 
                          type="number" 
                          placeholder="Wt%" 
                          value={row.weight}
                          onChange={(e) => updateAssessmentRow(idx, 'weight', e.target.value)}
                          className="w-full rounded bg-navy-900 border border-white/5 py-1.5 px-2 text-xs text-white focus:outline-none"
                        />
                        <span className="text-xs text-slate-500">%</span>
                      </div>
                      <div className="flex items-center gap-1 w-24">
                        <input 
                          type="number" 
                          placeholder="Score%" 
                          value={row.achievedScore}
                          onChange={(e) => updateAssessmentRow(idx, 'achievedScore', e.target.value)}
                          className="w-full rounded bg-green-900/20 border border-green-500/20 py-1.5 px-2 text-xs text-green-400 focus:outline-none placeholder:text-green-900/50"
                        />
                        <span className="text-xs text-slate-500">%</span>
                      </div>
                      <button type="button" onClick={() => removeAssessmentRow(idx)} className="text-red-400/50 hover:text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {assessmentStructure.length === 0 && (
                    <div className="text-center text-[10px] text-slate-500 py-2">
                      No assessments defined. Prediction will be 100% AI-generated.
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={addAssessmentRow}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-slate-300 px-4 py-1.5 text-[10px] font-bold uppercase transition-colors"
                >
                  <Plus className="h-3 w-3" /> Add Assessment Component
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl px-4 py-2 text-xs font-bold text-slate-400 hover:text-white">Cancel</button>
                <button type="submit" disabled={submitting} className="rounded-xl bg-cyan-500 text-white px-4 py-2 text-xs font-black uppercase disabled:opacity-50 tracking-widest">{editingId ? 'Update' : 'Confirm'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Syllabus Tasks Confirmation Modal */}
      {syllabusTasks && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.15)] my-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-cyan-500/20 rounded-xl">
                <FileText className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-widest text-white uppercase text-glow-cyan">Syllabus Extracted</h3>
                <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest mt-1">
                  {syllabusTasks.length} Potential Tasks Identified
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2 mb-6">
              {syllabusTasks.map((task, idx) => (
                <div key={idx} className="bg-navy-900/60 border border-white/10 rounded-xl p-4 hover:border-cyan-500/30 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-bold text-white">{task.title}</h4>
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-white/5 text-slate-300">
                      {task.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 mb-2">
                    <span className="text-cyan-400">Due: {new Date(task.deadline).toLocaleDateString()}</span>
                    <span className={task.priority === 'high' ? 'text-red-400' : 'text-yellow-400'}>
                      Priority: {task.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 italic bg-black/30 p-2 rounded line-clamp-2">
                    "...{task.sourceText}..."
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button 
                onClick={() => setSyllabusTasks(null)} 
                className="rounded-xl px-6 py-3 text-xs font-black tracking-widest text-slate-400 hover:text-white uppercase transition-colors"
                disabled={savingSyllabus}
              >
                Discard
              </button>
              <button 
                onClick={saveSyllabusTasks} 
                disabled={savingSyllabus} 
                className="flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black px-6 py-3 text-xs font-black uppercase disabled:opacity-50 tracking-widest shadow-glow-cyan transition-all"
              >
                {savingSyllabus ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {savingSyllabus ? 'Integrating...' : 'Integrate Tasks'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Courses;


