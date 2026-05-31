import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const useAnalytics = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [burnoutData, setBurnoutData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dash, week, burn] = await Promise.all([
        api.analytics.getDashboard(),
        api.analytics.getWeekly(),
        api.analytics.getBurnout()
      ]);
      setDashboardData(dash.data);
      setWeeklyData(week.data);
      setBurnoutData(burn.data);
    } catch (err) {
      console.error('Failed to fetch analytics metrics:', err);
      setError(err.message || 'Error occurred loading data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    dashboardData,
    weeklyData,
    burnoutData,
    loading,
    error,
    refresh: fetchAnalytics
  };
};
export default useAnalytics;
