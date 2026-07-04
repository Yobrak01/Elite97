import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Calendar, Clock, BarChart } from 'lucide-react';
import useTasks from '../hooks/useTasks';
import TaskCard from '../components/TaskCard';
import api from '../services/api';

export const Tasks = () => {
  const [filterType, setFilterType] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');

  const activeFilters = {};
  if (filterType) activeFilters.type = filterType;
  if (filterPriority) activeFilters.priority = filterPriority;
  if (filterStatus) activeFilters.status = filterStatus;

  const [completingTaskId, setCompletingTaskId] = useState(null);
  const [taskFocusScore, setTaskFocusScore] = useState(70);

  const { tasks, stats, loading, createTask, updateTask, completeTask, startTask, deleteTask } = useTasks(activeFilters);

  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('3');
  const [estimatedHours, setEstimatedHours] = useState('1');
  const [type, setType] = useState('theory');
  const [deadline, setDeadline] = useState('');
  const [fixedDate, setFixedDate] = useState('');
  const [fixedStartTime, setFixedStartTime] = useState('');
  const [fixedEndTime, setFixedEndTime] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [courses, setCourses] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    api.courses.getAll().then(res => setCourses(res.data)).catch(console.error);
  }, []);

  const [editingId, setEditingId] = useState(null);

  const openEditModal = (task) => {
    setTitle(task.title);
    setDescription(task.description || '');
    setPriority(task.priority.toString());
    setEstimatedHours(task.estimatedHours.toString());
    setType(task.type);
    setDeadline(task.deadline ? task.deadline.split('T')[0] : '');
    setFixedDate(task.fixedDate ? task.fixedDate.split('T')[0] : '');
    setFixedStartTime(task.fixedStartTime || '');
    setFixedEndTime(task.fixedEndTime || '');
    setSelectedCourse(task.courseUnit?._id || task.courseUnit || '');
    setEditingId(task._id);
    setSubmitError('');
    setModalOpen(true);
  };

  const openCreateModal = () => {
    setTitle('');
    setDescription('');
    setPriority('3');
    setEstimatedHours('1');
    setType('theory');
    setDeadline('');
    setFixedDate('');
    setFixedStartTime('');
    setFixedEndTime('');
    setSelectedCourse('');
    setEditingId(null);
    setSubmitError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    try {
      if (editingId) {
        await updateTask(editingId, {
          title,
          description,
          priority: Number(priority),
          estimatedHours: Number(estimatedHours),
          type,
          deadline: deadline || undefined,
          fixedDate: (type === 'lecture' || type === 'group_discussion') ? (fixedDate || undefined) : undefined,
          fixedStartTime: (type === 'lecture' || type === 'group_discussion') ? (fixedStartTime || undefined) : undefined,
          fixedEndTime: (type === 'lecture' || type === 'group_discussion') ? (fixedEndTime || undefined) : undefined,
          courseUnit: selectedCourse || undefined
        });
      } else {
        await createTask({
          title,
          description,
          priority: Number(priority),
          estimatedHours: Number(estimatedHours),
          type,
          deadline: deadline || undefined,
          fixedDate: (type === 'lecture' || type === 'group_discussion') ? (fixedDate || undefined) : undefined,
          fixedStartTime: (type === 'lecture' || type === 'group_discussion') ? (fixedStartTime || undefined) : undefined,
          fixedEndTime: (type === 'lecture' || type === 'group_discussion') ? (fixedEndTime || undefined) : undefined,
          courseUnit: selectedCourse || undefined
        });
      }
      setModalOpen(false);
      setTitle('');
      setDescription('');
      setPriority('3');
      setEstimatedHours('1');
      setType('theory');
      setDeadline('');
      setFixedDate('');
      setFixedStartTime('');
      setFixedEndTime('');
      setSelectedCourse('');
      setEditingId(null);
    } catch (err) {
      console.error(err);
      setSubmitError(err.message || 'Error saving task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Opens the focus-score modal before marking a task complete
  const handleCompleteClick = (id) => {
    setCompletingTaskId(id);
    setTaskFocusScore(70);
  };

  // Actually completes the task with the user-entered focus score
  const submitCompleteTask = async () => {
    if (!completingTaskId) return;
    try {
      await completeTask(completingTaskId, { focusScore: Number(taskFocusScore) });
      setCompletingTaskId(null);
      // Propagate to dashboard so analytics refresh immediately
      window.dispatchEvent(new CustomEvent('time-logged'));
    } catch (err) {
      console.error(err);
      alert('Error completing task. Please try again.');
    }
  };

  const filteredTasks = tasks.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading && tasks.length === 0) {
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
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-light tracking-[0.5em] text-cyan-50 text-glow-cyan uppercase opacity-80">MISSION CONTROL</h1>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mt-1">
            Tackle your tasks, conquer your goals. Let's do this.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-500/90 border border-cyan-500/20 text-white px-3.5 py-2 text-xs font-black uppercase tracking-widest shadow-glow-cyan transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Create Task
        </button>
      </div>

      {/* Task aggregates */}
      {stats && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <div className="glass-panel rounded-2xl p-4 border border-white/5 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Backlog</span>
            <p className="text-2xl font-black text-white mt-1">{stats.total}</p>
          </div>
          <div className="glass-panel rounded-2xl p-4 border border-white/5 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completed</span>
            <p className="text-2xl font-black text-green-400 mt-1">{stats.completed}</p>
          </div>
          <div className="glass-panel rounded-2xl p-4 border border-white/5 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Execution</span>
            <p className="text-2xl font-black text-yellow-400 mt-1">{stats.pending}</p>
          </div>
          <div className="glass-panel rounded-2xl p-4 border border-white/5 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">In Progress</span>
            <p className="text-2xl font-black text-cyan-400 mt-1">{stats.inProgress}</p>
          </div>
        </div>
      )}

      {/* Filters & search row */}
      <div className="glass-panel rounded-2xl p-4 border border-white/5 flex flex-col gap-3 md:flex-row md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search backlog by keyword..."
            className="w-full rounded-xl bg-navy-900 border border-white/5 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl bg-navy-900 border border-white/5 px-3 py-2.5 text-xs text-slate-300 font-bold focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl bg-navy-900 border border-white/5 px-3 py-2.5 text-xs text-slate-300 font-bold focus:outline-none"
          >
            <option value="">All Types</option>
            <option value="theory">Theory Focus</option>
            <option value="procedural">Procedural / Solving</option>
            <option value="assignment">Assignment</option>
            <option value="revision">Retrieval / Revision</option>
            <option value="project">Project Work</option>
            <option value="group_discussion">Group Discussion</option>
            <option value="lecture">Lecture / Class</option>
            <option value="personal_study">Personal Study</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="rounded-xl bg-navy-900 border border-white/5 px-3 py-2.5 text-xs text-slate-300 font-bold focus:outline-none"
          >
            <option value="">All Priorities</option>
            <option value="5">P5 Critical</option>
            <option value="4">P4 High</option>
            <option value="3">P3 Standard</option>
            <option value="2">P2 Low</option>
            <option value="1">P1 Minor</option>
          </select>
        </div>
      </div>

      {/* Task Cards Grid */}
      {filteredTasks.length === 0 ? (
        <div className="glass-panel rounded-2xl border border-white/5 p-12 text-center text-xs font-semibold text-slate-500">
          All caught up! Time to recharge or plan your next move.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onComplete={handleCompleteClick}
              onStart={startTask}
              onEdit={openEditModal}
              onDelete={deleteTask}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Task Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 border border-white/10 shadow-2xl relative overflow-y-auto max-h-[90vh]">
            <h3 className="text-lg font-black tracking-wide text-white mb-4 uppercase">{editingId ? 'Edit Task' : 'Create New Task'}</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Task Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Derive Electromagnetics Wave Vector"
                  className="w-full rounded-xl bg-navy-900 border border-white/5 py-2.5 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/30"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Task Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Review lecture proofs page 34-40 before solver cycle."
                  rows="3"
                  className="w-full rounded-xl bg-navy-900 border border-white/5 py-2.5 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Priority (1-5)</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full rounded-xl bg-navy-900 border border-white/5 py-2.5 px-4 text-sm text-white focus:outline-none"
                  >
                    <option value="5">5 - Critical</option>
                    <option value="4">4 - High</option>
                    <option value="3">3 - Standard</option>
                    <option value="2">2 - Low</option>
                    <option value="1">1 - Minor</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Est. Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    required
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value)}
                    className="w-full rounded-xl bg-navy-900 border border-white/5 py-2.5 px-4 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Classification</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full rounded-xl bg-navy-900 border border-white/5 py-2.5 px-4 text-sm text-white focus:outline-none"
                  >
                    <option value="theory">Theory Focus</option>
                    <option value="procedural">Procedural / Solving</option>
                    <option value="assignment">Assignment</option>
                    <option value="revision">Retrieval / Revision</option>
                    <option value="project">Project Work</option>
                    <option value="group_discussion">Group Discussion</option>
                    <option value="lecture">Lecture / Class</option>
                    <option value="personal_study">Personal Study</option>
                  </select>
                </div>

                {(type !== 'lecture' && type !== 'group_discussion') && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Course Unit</label>
                    <select
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className="w-full rounded-xl bg-navy-900 border border-white/5 py-2.5 px-4 text-sm text-white focus:outline-none"
                    >
                      <option value="">-- None --</option>
                      {courses.map(c => (
                        <option key={c._id} value={c._id}>{c.unitCode} - {c.unitName}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {(type === 'lecture' || type === 'group_discussion') ? (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Scheduled Date</label>
                    <input
                      type="date"
                      required
                      value={fixedDate}
                      onChange={(e) => setFixedDate(e.target.value)}
                      className="w-full rounded-xl bg-navy-900 border border-white/5 py-2.5 px-4 text-sm text-white focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Start Time</label>
                      <input
                        type="time"
                        required
                        value={fixedStartTime}
                        onChange={(e) => setFixedStartTime(e.target.value)}
                        className="w-full rounded-xl bg-navy-900 border border-white/5 py-2.5 px-4 text-sm text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">End Time</label>
                      <input
                        type="time"
                        required
                        value={fixedEndTime}
                        onChange={(e) => setFixedEndTime(e.target.value)}
                        className="w-full rounded-xl bg-navy-900 border border-white/5 py-2.5 px-4 text-sm text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Deadline Date</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full rounded-xl bg-navy-900 border border-white/5 py-2.5 px-4 text-sm text-white focus:outline-none"
                  />
                </div>
              )}

              {submitError && (
                <p className="text-xs font-bold text-red-400 text-center bg-red-500/10 rounded-xl px-4 py-2 border border-red-500/20">
                  {submitError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-white/5 hover:bg-white/5 text-slate-400 hover:text-white text-xs font-bold px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-cyan-500 hover:bg-cyan-500/90 border border-cyan-500/20 text-white text-xs font-black uppercase tracking-widest px-4 py-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingId ? 'Update Task' : 'Confirm Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Task — Focus Score Modal */}
      {completingTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setCompletingTaskId(null)} />
          <div className="relative w-full max-w-sm rounded-3xl bg-navy-800 border border-white/10 p-6 shadow-2xl animate-fade-in">
            <h3 className="text-lg font-black text-white mb-1 tracking-wide uppercase">Mission Complete!</h3>
            <p className="text-xs text-slate-400 mb-5">Great job! How focused were you during this session? Your feedback helps the AI personalize your schedule.</p>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Focus Score</label>
                <span className="text-2xl font-black text-cyan-400">{taskFocusScore}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={taskFocusScore}
                onChange={(e) => setTaskFocusScore(e.target.value)}
                className="w-full accent-cyan-400"
              />
              <div className="flex justify-between text-[9px] text-slate-600 font-bold uppercase tracking-widest">
                <span>Distracted</span>
                <span>Moderate</span>
                <span>Flow State</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setCompletingTaskId(null)}
                className="rounded-xl border border-white/5 hover:bg-white/5 text-slate-400 hover:text-white text-xs font-bold px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={submitCompleteTask}
                className="rounded-xl bg-cyan-500 hover:bg-cyan-500/90 text-white text-xs font-black uppercase tracking-widest px-4 py-2 cursor-pointer"
              >
                Complete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Tasks;
