import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Tasks from './pages/Tasks';
import Planner from './pages/Planner';
import Schedule from './pages/Schedule';
import Settings from './pages/Settings';
import Courses from './pages/Courses';
import Lifestyle from './pages/Lifestyle';
import Diagnostic from './pages/Diagnostic';

export const App = () => {
  return (
    <Routes>
      {/* Public matrix paths */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected dashboard routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/lifestyle" element={<Lifestyle />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/diagnostic" element={<Diagnostic />} />
        </Route>
      </Route>
      
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
export default App;
