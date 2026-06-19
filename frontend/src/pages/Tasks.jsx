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
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    let finalDesc = description;

    try {
      if (editingId) {
        await updateTask(editingId, {
          title,
          description: finalDesc,
          priority: Number(priority),
          estimatedHours: Number(estimatedHours),
          type,
          deadline: deadline || undefined,
          fixedDate: type === 'event' ? (fixedDate || undefined) : undefined,
          fixedStartTime: type === 'event' ? (fixedStartTime || undefined) : undefined,
          fixedEndTime: type === 'event' ? (fixedEndTime || undefined) : undefined,
          courseUnit: selectedCourse || undefined
        });
      } else {
        await createTask({
          title,
          description: finalDesc,
          priority: Number(priority),
          estimatedHours: Number(estimatedHours),
          type,
          deadline: deadline || undefined,
          fixedDate: type === 'event' ? (fixedDate || undefined) : undefined,
          fixedStartTime: type === 'event' ? (fixedStartTime || undefined) : undefined,
          fixedEndTime: type === 'event' ? (fixedEndTime || undefined) : undefined,
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
      alert(err.message || 'Error occurred saving task.');
    } finally {
      setSubmitting(false);
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
          <h1 className="text-2xl md:text-3xl font-display font-light tracking-[0.5em] text-cyan-50 text-glow-cyan uppercase opacity-80">TASK BACKLOG</h1>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mt-1">
            Prioritize conceptual derivations and technical challenges.
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
            <option value="theory">Theory</option>
            <option value="procedural">Procedural</option>
            <option value="assignment">Assignment</option>
            <option value="revision">Revision</option>
            <option value="project">Project</option>
            <option value="event">Event / Personal</option>
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
          No tasks found matching current filters.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onComplete={completeTask}
              onStart={startTask}
              onEdit={openEditModal}
              onDelete={deleteTask}
            />
          ))}
        </div>
      )}

      {/* Create Task Modal Overlay */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 border border-white/10 shadow-2xl relative">
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
                  className="w-full rounded-xl bg-navy-900 border border-white/5 py-2.5 px-4 text-sm text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Task Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Review lecture proofs page 34-40 before solver cycle."
                  rows="3"
                  className="w-full rounded-xl bg-navy-900 border border-white/5 py-2.5 px-4 text-sm text-white placeholder-slate-500 focus:outline-none"
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
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Estimated Duration</label>
                  <input
                    type="number"
                    step="0.5"
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
                    <option value="event">Event / Non-Educational</option>
                  </select>
                </div>

                {type !== 'event' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Course Unit (Optional)</label>
                    <select
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className="w-full rounded-xl bg-navy-900 border border-white/5 py-2.5 px-4 text-sm text-white focus:outline-none"
                    >
                      <option value="">-- No specific unit --</option>
                      {courses.map(c => (
                        <option key={c._id} value={c._id}>{c.unitCode} - {c.unitName}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {type === 'event' ? (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Event Date</label>
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
                  {editingId ? 'Update Task' : 'Confirm Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Tasks;


