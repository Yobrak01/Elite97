import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Register from './pages/Register';

// Code-split all dashboard pages — only loaded when navigated to
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Planner = lazy(() => import('./pages/Planner'));
const Schedule = lazy(() => import('./pages/Schedule'));
const Settings = lazy(() => import('./pages/Settings'));
const Courses = lazy(() => import('./pages/Courses'));
const Lifestyle = lazy(() => import('./pages/Lifestyle'));
const Diagnostic = lazy(() => import('./pages/Diagnostic'));
const NeuralOverride = lazy(() => import('./pages/NeuralOverride'));
const HierarchyMatrix = lazy(() => import('./pages/HierarchyMatrix'));
const PredictiveOracle = lazy(() => import('./pages/PredictiveOracle'));
const NeuralVault = lazy(() => import('./pages/NeuralVault'));
const Streaks = lazy(() => import('./pages/Streaks'));
const Notes = lazy(() => import('./pages/Notes'));
const CognitiveWeakness = lazy(() => import('./pages/CognitiveWeakness'));

// Suspense fallback spinner matching the app's design
const PageLoader = () => (
  <div className="flex h-96 items-center justify-center">
    <div className="relative h-10 w-10">
      <div className="absolute h-full w-full rounded-full border-4 border-navy-800"></div>
      <div className="absolute h-full w-full animate-spin rounded-full border-4 border-t-accent-blue border-r-transparent border-b-transparent border-l-transparent"></div>
    </div>
  </div>
);

export const App = () => {
  return (
    <>
      {/* The Global Elite97 Watermark */}
      <div className="elite-watermark-container"></div>
      
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public matrix paths */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected dashboard routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/override" element={<NeuralOverride />} />
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
                <Route path="/hierarchy" element={<HierarchyMatrix />} />
                <Route path="/oracle" element={<PredictiveOracle />} />
                <Route path="/vault" element={<NeuralVault />} />
                <Route path="/streaks" element={<Streaks />} />
                <Route path="/notes" element={<Notes />} />
                <Route path="/weakness" element={<CognitiveWeakness />} />
              </Route>
            </Route>

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </>
  );
};
export default App;
