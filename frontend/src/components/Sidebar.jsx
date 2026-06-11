import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BarChart3, CheckSquare, Calendar, Sliders, X, Flame, BookOpen, Dumbbell, Globe, Eye, Brain, Activity } from 'lucide-react';
import AuthContext from '../context/AuthContext';

export const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user } = useContext(AuthContext);

  const links = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'Course Units', path: '/courses', icon: BookOpen },
    { name: 'AI Planner', path: '/planner', icon: Calendar },
    { name: 'Schedule Presets', path: '/schedule', icon: Calendar },
    { name: 'Global Hierarchy', path: '/hierarchy', icon: Globe },
    { name: 'The Oracle', path: '/oracle', icon: Eye },
    { name: 'Neural Vault', path: '/vault', icon: Brain },
    { name: 'Lifestyle', path: '/lifestyle', icon: Dumbbell },
    { name: 'Streaks', path: '/streaks', icon: Flame },
    { name: 'Notes', path: '/notes', icon: BookOpen },
    { name: 'Cognitive Profile', path: '/weakness', icon: Activity },
    { name: 'Settings', path: '/settings', icon: Sliders },
  ];

  return (
    <>
      {/* Mobile Drawer Overlay Background */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        ></div>
      )}

      {/* Sidebar panel */}
      <aside
        className={`glass-panel fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/5 transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-display font-light tracking-[0.5em] text-cyan-50 text-glow-cyan uppercase opacity-80">
              ELITE<span className="text-cyan-400">97</span>
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Links Navigation */}
        <nav className="flex-1 space-y-1 px-4 py-6">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 shadow-glow-cyan'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                {link.name}
              </NavLink>
            );
          })}
        </nav>

        {/* Streak Counter footer panel */}
        {user?.streak !== undefined && (
          <div className="mx-4 my-6 rounded-2xl bg-gradient-to-r from-orange-500/10 to-red-500/10 p-4 border border-indigo-600/20 shadow-glow-red/10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400">
              <Flame className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <p className="text-xs text-orange-300 font-bold uppercase tracking-wider">Discipline Streak</p>
              <p className="text-lg font-black text-indigo-400">{user.streak} Days Active</p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
export default Sidebar;

