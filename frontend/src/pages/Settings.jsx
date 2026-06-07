import React, { useState, useContext, useEffect } from 'react';
import { Sliders, Save, Award, Key, User, Bell, BookOpen, Calendar, Plus, Trash2, Edit2, FileText, Clock } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import api from '../services/api';

export const Settings = () => {
  const { user, updateUser } = useContext(AuthContext);

  const [dailyGoalHours, setDailyGoalHours] = useState(user?.settings?.dailyGoalHours || 6);
  const [breakInterval, setBreakInterval] = useState(user?.settings?.breakInterval || 25);
  const [breakDuration, setBreakDuration] = useState(user?.settings?.breakDuration || 5);
  const [regenAfterSessions, setRegenAfterSessions] = useState(user?.settings?.regenAfterSessions || 4);
  const [taskGenerationMode, setTaskGenerationMode] = useState(user?.settings?.taskGenerationMode || 'daily');
  const [notifications, setNotifications] = useState(user?.settings?.notifications ?? true);
  const [studyMode, setStudyMode] = useState(user?.studyMode || 'normal');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const [yearOfStudy, setYearOfStudy] = useState(user?.yearOfStudy || '');
  const [semester, setSemester] = useState(user?.currentSemester || '');
  const [country, setCountry] = useState(user?.country || '');
  const [university, setUniversity] = useState(user?.university || '');
  const [major, setMajor] = useState(user?.major || '');

  const [timetable, setTimetable] = useState(user?.timetable || []);
  const [newTimetableRow, setNewTimetableRow] = useState({ dayOfWeek: 'Monday', startTime: '', endTime: '', unitName: '' });

  const [pastResults, setPastResults] = useState(user?.pastResults || []);
  const [newResultRow, setNewResultRow] = useState({ year: '', semester: '', type: 'semester', mark: '' });

  const [semesterSchedule, setSemesterSchedule] = useState(user?.semesterSchedule || {
    startDate: '', endDate: '', cat1Date: '', cat2Date: '', cat3Date: '', assignment1Date: '', assignment2Date: '', assignment3Date: '', examsStartDate: '', examsEndDate: ''
  });

  const [courses, setCourses] = useState([]);
  
  useEffect(() => {
    api.courses.getAll().then(res => setCourses(res.data)).catch(console.error);
  }, []);

  const handleAddResultRow = () => {
    if (newResultRow.year && newResultRow.mark) {
      setPastResults([...pastResults, { 
        year: Number(newResultRow.year), 
        semester: newResultRow.type === 'semester' ? Number(newResultRow.semester) : undefined, 
        type: newResultRow.type,
        mark: Number(newResultRow.mark) 
      }]);
      setNewResultRow({ year: '', semester: '', type: 'semester', mark: '' });
    }
  };

  const handleRemoveResultRow = (index) => {
    setPastResults(pastResults.filter((_, i) => i !== index));
  };

  const handleAddTimetableRow = () => {
    if (newTimetableRow.startTime && newTimetableRow.endTime && newTimetableRow.unitName) {
      setTimetable([...timetable, newTimetableRow]);
      setNewTimetableRow({ dayOfWeek: 'Monday', startTime: '', endTime: '', unitName: '' });
    }
  };

  const handleRemoveTimetableRow = (index) => {
    setTimetable(timetable.filter((_, i) => i !== index));
  };

  const handleEditTimetableRow = (index) => {
    const row = timetable[index];
    setNewTimetableRow({ dayOfWeek: row.dayOfWeek || row.day, startTime: row.startTime, endTime: row.endTime, unitName: row.unitName });
    handleRemoveTimetableRow(index);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      const res = await api.auth.updateSettings({
        studyMode,
        yearOfStudy: Number(yearOfStudy) || undefined,
        country,
        university,
        major,
        currentSemester: Number(semester) || undefined,
        timetable,
        pastResults,
        semesterSchedule,
        settings: {
          dailyGoalHours: Number(dailyGoalHours),
          breakInterval: Number(breakInterval),
          breakDuration: Number(breakDuration),
          regenAfterSessions: Number(regenAfterSessions),
          taskGenerationMode,
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
        <h1 className="text-2xl md:text-3xl font-display font-light tracking-[0.5em] text-cyan-50 text-glow-cyan uppercase opacity-80">SYSTEM SETTINGS</h1>
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mt-1">
          Configure academic performance limits and matrix variables.
        </p>
      </div>

      {message && (
        <div className={`rounded-xl p-4 text-xs font-bold ${
          message.includes('compiled') ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>
          {message}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <form onSubmit={handleSave} className="glass-panel rounded-3xl p-6 border border-white/5 space-y-6">
          <div className="flex items-center gap-2 border-b border-white/5 pb-4">
            <Sliders className="h-5 w-5 text-cyan-400" />
            <h3 className="text-sm font-black uppercase tracking-wider text-white">Interval Configurations</h3>
          </div>

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
              className="w-full h-1.5 bg-navy-900 rounded-lg border border-white/5 appearance-none cursor-pointer accent-accent-gold"
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
              className="w-full h-1.5 bg-navy-900 rounded-lg border border-white/5 appearance-none cursor-pointer accent-accent-gold"
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
              className="w-full h-1.5 bg-navy-900 rounded-lg border border-white/5 appearance-none cursor-pointer accent-accent-gold"
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

          {/* Task Generation Engine */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Task Generation Engine</label>
            <select
              value={taskGenerationMode}
              onChange={(e) => setTaskGenerationMode(e.target.value)}
              className="w-full rounded-xl bg-navy-900 border border-white/5 py-2.5 px-4 text-xs text-white focus:outline-none"
            >
              <option value="daily">Daily Mode - Generate once per day based on timetable</option>
              <option value="infinite">Infinite Mode - Constantly auto-generate new tasks</option>
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
                notifications ? 'bg-cyan-500' : 'bg-navy-900'
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
              className="flex items-center gap-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-500/90 border border-cyan-500/20 text-white px-4 py-2.5 text-xs font-black uppercase tracking-widest shadow-glow-cyan transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              Compile settings
            </button>
          </div>
        </form>

        <div className="space-y-6">
          {/* Academic Profile */}
          <div className="glass-panel rounded-3xl p-6 border border-white/5 space-y-6">
            <div className="flex items-center gap-2 border-b border-white/5 pb-4">
              <BookOpen className="h-5 w-5 text-blue-400" />
              <h3 className="text-sm font-black uppercase tracking-wider text-white">Academic Profile</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Nation of Operation</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. United States"
                  className="w-full rounded-xl bg-navy-900 border border-white/5 py-2.5 px-4 text-xs text-white focus:outline-none focus:border-blue-600/50"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Institution / University</label>
                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="e.g. MIT"
                  className="w-full rounded-xl bg-navy-900 border border-white/5 py-2.5 px-4 text-xs text-white focus:outline-none focus:border-blue-600/50"
                />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Academic Program / Course</label>
                  <input
                    type="text"
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    placeholder="e.g. BSc Computer Science"
                    className="w-full rounded-xl bg-navy-900 border border-white/5 py-2.5 px-4 text-xs text-white focus:outline-none focus:border-blue-600/50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Year of Study</label>
                  <input
                    type="text"
                    value={yearOfStudy}
                    onChange={(e) => setYearOfStudy(e.target.value)}
                    placeholder="e.g. Year 2"
                    className="w-full rounded-xl bg-navy-900 border border-white/5 py-2.5 px-4 text-xs text-white focus:outline-none focus:border-blue-600/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Semester</label>
                  <input
                    type="text"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    placeholder="e.g. Semester 1"
                    className="w-full rounded-xl bg-navy-900 border border-white/5 py-2.5 px-4 text-xs text-white focus:outline-none focus:border-blue-600/50"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50 mt-2"
              >
                Save Profile
              </button>
            </div>
          </div>

          {/* Timetable Manager */}
          <div className="glass-panel rounded-3xl p-6 border border-white/5 space-y-6">
            <div className="flex items-center gap-2 border-b border-white/5 pb-4">
              <Calendar className="h-5 w-5 text-purple-400" />
              <h3 className="text-sm font-black uppercase tracking-wider text-white">Timetable Manager</h3>
            </div>

            <div className="space-y-4">
              {/* Add new row form */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <select
                  value={newTimetableRow.dayOfWeek}
                  onChange={(e) => setNewTimetableRow({...newTimetableRow, dayOfWeek: e.target.value})}
                  className="rounded-lg bg-navy-900 border border-white/5 py-2 px-2 text-xs text-white focus:outline-none"
                >
                  {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <input
                  type="time"
                  value={newTimetableRow.startTime}
                  onChange={(e) => setNewTimetableRow({...newTimetableRow, startTime: e.target.value})}
                  className="rounded-lg bg-navy-900 border border-white/5 py-2 px-2 text-xs text-white focus:outline-none"
                />
                <input
                  type="time"
                  value={newTimetableRow.endTime}
                  onChange={(e) => setNewTimetableRow({...newTimetableRow, endTime: e.target.value})}
                  className="rounded-lg bg-navy-900 border border-white/5 py-2 px-2 text-xs text-white focus:outline-none"
                />
                <select
                  value={newTimetableRow.unitName}
                  onChange={(e) => setNewTimetableRow({...newTimetableRow, unitName: e.target.value})}
                  className="rounded-lg bg-navy-900 border border-white/5 py-2 px-2 text-xs text-white focus:outline-none"
                >
                  <option value="">Select Unit...</option>
                  {courses.map(c => (
                    <option key={c._id} value={c.unitCode}>{c.unitCode}</option>
                  ))}
                  <option value="Personal Study">Personal Study</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <button
                type="button"
                onClick={handleAddTimetableRow}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-purple-500/30 hover:bg-purple-500/10 text-purple-400 px-4 py-2 text-xs font-bold transition-colors"
              >
                <Plus className="h-4 w-4" /> Add Slot
              </button>

              {/* List of current rows */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {timetable.length === 0 ? (
                  <div className="text-center text-xs text-slate-500 py-4">No slots configured.</div>
                ) : (
                  timetable.map((row, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-navy-900/50 border border-white/5 rounded-lg p-2.5">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase text-purple-400 w-16">{(row.dayOfWeek || row.day || '').substring(0,3)}</span>
                        <span className="text-xs text-slate-300">{row.startTime} - {row.endTime}</span>
                        <span className="text-xs font-bold text-white truncate max-w-[100px]">{row.unitName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEditTimetableRow(idx)} className="text-blue-400/50 hover:text-blue-400 transition-colors">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleRemoveTimetableRow(idx)} className="text-red-400/50 hover:text-red-400 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {timetable.length > 0 && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={submitting}
                  className="w-full mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50"
                >
                  Save Timetable
                </button>
              )}
            </div>
          </div>

          {/* Semester Timelines & Milestones Manager */}
          <div className="glass-panel rounded-3xl p-6 border border-white/5 space-y-6">
            <div className="flex items-center gap-2 border-b border-white/5 pb-4">
              <Clock className="h-5 w-5 text-cyan-400" />
              <h3 className="text-sm font-black uppercase tracking-wider text-white">Semester Timelines</h3>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Semester Start</label>
                  <input
                    type="date"
                    value={semesterSchedule.startDate ? semesterSchedule.startDate.split('T')[0] : ''}
                    onChange={(e) => setSemesterSchedule({...semesterSchedule, startDate: e.target.value})}
                    className="w-full rounded-xl bg-navy-900 border border-white/5 py-2.5 px-4 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Semester End</label>
                  <input
                    type="date"
                    value={semesterSchedule.endDate ? semesterSchedule.endDate.split('T')[0] : ''}
                    onChange={(e) => setSemesterSchedule({...semesterSchedule, endDate: e.target.value})}
                    className="w-full rounded-xl bg-navy-900 border border-white/5 py-2.5 px-4 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map(num => (
                  <div key={`cat${num}`}>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">CAT {num}</label>
                    <input
                      type="date"
                      value={semesterSchedule[`cat${num}Date`] ? semesterSchedule[`cat${num}Date`].split('T')[0] : ''}
                      onChange={(e) => setSemesterSchedule({...semesterSchedule, [`cat${num}Date`]: e.target.value})}
                      className="w-full rounded-xl bg-navy-900 border border-white/5 py-2 px-2 text-[10px] text-white focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map(num => (
                  <div key={`assgn${num}`}>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Assignment {num}</label>
                    <input
                      type="date"
                      value={semesterSchedule[`assignment${num}Date`] ? semesterSchedule[`assignment${num}Date`].split('T')[0] : ''}
                      onChange={(e) => setSemesterSchedule({...semesterSchedule, [`assignment${num}Date`]: e.target.value})}
                      className="w-full rounded-xl bg-navy-900 border border-white/5 py-2 px-2 text-[10px] text-white focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Exams Start</label>
                  <input
                    type="date"
                    value={semesterSchedule.examsStartDate ? semesterSchedule.examsStartDate.split('T')[0] : ''}
                    onChange={(e) => setSemesterSchedule({...semesterSchedule, examsStartDate: e.target.value})}
                    className="w-full rounded-xl bg-navy-900 border border-white/5 py-2.5 px-4 text-xs text-white focus:outline-none focus:border-red-500/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Exams End</label>
                  <input
                    type="date"
                    value={semesterSchedule.examsEndDate ? semesterSchedule.examsEndDate.split('T')[0] : ''}
                    onChange={(e) => setSemesterSchedule({...semesterSchedule, examsEndDate: e.target.value})}
                    className="w-full rounded-xl bg-navy-900 border border-white/5 py-2.5 px-4 text-xs text-white focus:outline-none focus:border-red-500/50"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={submitting}
                className="w-full mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50"
              >
                Save Timelines
              </button>
            </div>
          </div>

          {/* Past Academic Results Manager */}
          <div className="glass-panel rounded-3xl p-6 border border-white/5 space-y-6">
            <div className="flex items-center gap-2 border-b border-white/5 pb-4">
              <FileText className="h-5 w-5 text-emerald-400" />
              <h3 className="text-sm font-black uppercase tracking-wider text-white">Past Academic Results</h3>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <select 
                  value={newResultRow.type}
                  onChange={(e) => setNewResultRow({...newResultRow, type: e.target.value})}
                  className="rounded-lg bg-navy-900 border border-white/5 py-2 px-2 text-xs text-white focus:outline-none"
                >
                  <option value="semester">Single Semester</option>
                  <option value="year">Entire Year</option>
                </select>
                <input
                  type="number"
                  placeholder="Year (e.g. 1)"
                  value={newResultRow.year}
                  onChange={(e) => setNewResultRow({...newResultRow, year: e.target.value})}
                  className="flex-1 rounded-lg bg-navy-900 border border-white/5 py-2 px-2 text-xs text-white focus:outline-none"
                />
                {newResultRow.type === 'semester' && (
                  <input
                    type="number"
                    placeholder="Sem (1 or 2)"
                    value={newResultRow.semester}
                    onChange={(e) => setNewResultRow({...newResultRow, semester: e.target.value})}
                    className="flex-1 rounded-lg bg-navy-900 border border-white/5 py-2 px-2 text-xs text-white focus:outline-none"
                  />
                )}
                <input
                  type="number"
                  step="0.01"
                  placeholder="Mark (e.g. 75)"
                  value={newResultRow.mark}
                  onChange={(e) => setNewResultRow({...newResultRow, mark: e.target.value})}
                  className="rounded-lg bg-navy-900 border border-white/5 py-2 px-2 text-xs text-white focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleAddResultRow}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400 px-4 py-2 text-xs font-bold transition-colors"
              >
                <Plus className="h-4 w-4" /> Add Result
              </button>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {pastResults.length === 0 ? (
                  <div className="text-center text-xs text-slate-500 py-4">No past results logged.</div>
                ) : (
                  pastResults.map((row, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-navy-900/50 border border-white/5 rounded-lg p-2.5">
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black uppercase text-emerald-400 w-16">Year {row.year}</span>
                        <span className="text-xs text-slate-300 w-16">
                          {row.type === 'year' ? 'All Sems' : `Sem ${row.semester}`}
                        </span>
                        <span className="text-xs font-bold text-white">Mark: {row.mark?.toFixed(2)}</span>
                      </div>
                      <button onClick={() => handleRemoveResultRow(idx)} className="text-red-400/50 hover:text-red-400 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
              
              {pastResults.length > 0 && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={submitting}
                  className="w-full mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50"
                >
                  Save Results
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Settings;


