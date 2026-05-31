import React, { useContext } from 'react';
import { Menu, LogOut, ShieldAlert, Award } from 'lucide-react';
import AuthContext from '../context/AuthContext';

export const Navbar = ({ setSidebarOpen }) => {
  const { user, logout } = useContext(AuthContext);

  const getModeStyles = (mode) => {
    switch (mode) {
      case 'cat_prep':
        return { label: 'CAT Prep', css: 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10' };
      case 'exam_prep':
        return { label: 'EXAM PREP', css: 'border-red-500/30 text-red-400 bg-red-500/10 shadow-glow-red animate-pulse' };
      case 'recovery':
        return { label: 'RECOVERY', css: 'border-green-500/30 text-green-400 bg-green-500/10' };
      case 'unexpected_event':
        return { label: 'Interruption', css: 'border-purple-500/30 text-purple-400 bg-purple-500/10' };
      default:
        return { label: 'NORMAL MODE', css: 'border-accent-blue/30 text-accent-blue bg-accent-blue/10 shadow-glow-blue' };
    }
  };

  const modeConfig = getModeStyles(user?.studyMode);

  return (
    <header className="glass-panel sticky top-0 z-30 flex h-16 w-full items-center justify-between px-6 border-b border-white/5">
      <div className="flex items-center gap-4">
        {/* Toggle mobile sidebar */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Branding title */}
        <div className="hidden items-center gap-2 sm:flex">
          <Award className="h-6 w-6 text-accent-blue" />
          <span className="text-lg font-black tracking-wider text-white">
            ELITE<span className="text-accent-blue">97</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Mode Indicator Badge */}
        {user?.studyMode && (
          <div className={`rounded-full border px-3 py-1 text-xs font-black tracking-widest uppercase ${modeConfig.css}`}>
            {modeConfig.label}
          </div>
        )}

        {/* User Card */}
        <div className="flex items-center gap-3">
          <div className="hidden text-right md:block">
            <p className="text-sm font-semibold text-white">{user?.name}</p>
            <p className="text-xs text-slate-400">Engineering Student</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-blue/20 text-sm font-bold text-accent-blue border border-accent-blue/30">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'ES'}
          </div>
          
          <button
            onClick={logout}
            title="Log Out"
            className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-red-400 transition-all"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
export default Navbar;
