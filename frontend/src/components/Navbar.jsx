import React, { useContext, useState, useRef, useEffect } from 'react';
import { Menu, LogOut, ShieldAlert, Award, Palette } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const Navbar = ({ setSidebarOpen }) => {
  const { user, logout } = useContext(AuthContext);
  const { theme, setTheme, themes } = useTheme();
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setThemeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        return { label: 'NORMAL MODE', css: 'border-accent-gold/30 text-accent-gold bg-accent-gold/10 shadow-glow-cyan' };
    }
  };

  const modeConfig = getModeStyles(user?.studyMode);

  return (
    <header className="glass-panel sticky top-0 z-30 flex h-16 w-full items-center justify-between px-6 border-b border-panel-border">
      <div className="flex items-center gap-4">
        {/* Toggle mobile sidebar */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="rounded-lg p-2 text-textMuted hover:bg-white/5 hover:text-textMain lg:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Branding title */}
        <div className="hidden items-center gap-3 sm:flex">
          <img src="/logo.png" alt="ELITE97" className="h-8 w-8 rounded-full object-cover border border-amber-500/30 shadow-[0_0_10px_rgba(217,169,78,0.3)]" />
          <span className="text-lg font-black tracking-wider text-textMain">
            ELITE<span className="text-accent-gold">97</span>
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

        {/* Theme Switcher */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-gold/10 text-accent-gold hover:bg-accent-gold/20 transition-colors"
            title="Switch Theme"
          >
            <Palette className="h-4 w-4" />
          </button>
          
          {themeDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl border border-panel-border bg-panel shadow-glow-cyan overflow-hidden z-50 glass-panel">
              <div className="p-2">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id);
                      setThemeDropdownOpen(false);
                    }}
                    className={`flex w-full flex-col items-start rounded-lg px-3 py-2 text-sm transition-colors ${
                      theme === t.id ? 'bg-accent-gold/10 text-accent-gold' : 'text-textMuted hover:bg-white/5 hover:text-textMain'
                    }`}
                  >
                    <span className="font-bold">{t.name}</span>
                    <span className="text-[10px] opacity-70">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Card */}
        <div className="flex items-center gap-3">
          <div className="hidden text-right md:block">
            <p className="text-sm font-semibold text-textMain">{user?.name}</p>
            <p className="text-xs text-textMuted">Engineering Student</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-gold/20 text-sm font-bold text-accent-gold border border-accent-gold/30">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'ES'}
          </div>
          
          <button
            onClick={logout}
            title="Log Out"
            className="rounded-lg p-2 text-textMuted hover:bg-white/5 hover:text-red-400 transition-all"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
export default Navbar;

