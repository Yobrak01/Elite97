import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const useTasks = (filters = {}) => {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, statsRes] = await Promise.all([
        api.tasks.getAll(filters),
        api.tasks.getStats()
      ]);
      setTasks(listRes.data);
      setStats(statsRes.stats);
    } catch (err) {
      console.error('Failed to load task records:', err);
      setError(err.message || 'Error occurred fetching tasks.');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = async (taskData) => {
    try {
      const res = await api.tasks.create(taskData);
      setTasks(prev => [res.data, ...prev]);
      // Refresher for statistics
      const statsRes = await api.tasks.getStats();
      setStats(statsRes.stats);
      return res.data;
    } catch (err) {
      console.error('Failed to create task:', err);
      throw err;
    }
  };

  const completeTask = async (id) => {
    try {
      const res = await api.tasks.complete(id);
      setTasks(prev => prev.map(t => t._id === id ? res.data : t));
      const statsRes = await api.tasks.getStats();
      setStats(statsRes.stats);
    } catch (err) {
      console.error('Failed to complete task:', err);
      throw err;
    }
  };

  const deleteTask = async (id) => {
    try {
      await api.tasks.delete(id);
      setTasks(prev => prev.filter(t => t._id !== id));
      const statsRes = await api.tasks.getStats();
      setStats(statsRes.stats);
    } catch (err) {
      console.error('Failed to delete task:', err);
      throw err;
    }
  };

  return {
    tasks,
    stats,
    loading,
    error,
    createTask,
    completeTask,
    deleteTask,
    refresh: fetchTasks
  };
};
export default useTasks;
