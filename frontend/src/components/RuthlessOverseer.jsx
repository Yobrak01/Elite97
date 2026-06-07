import React, { useState, useEffect } from 'react';
import { Terminal, ShieldAlert, CheckCircle2, AlertTriangle, Activity } from 'lucide-react';

const RuthlessOverseer = ({ critique, severity }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!critique) return;
    
    setDisplayedText('');
    setIsTyping(true);
    let i = 0;
    
    const typingInterval = setInterval(() => {
      setDisplayedText(critique.substring(0, i + 1));
      i++;
      if (i >= critique.length) {
        clearInterval(typingInterval);
        setIsTyping(false);
      }
    }, 30); // Typing speed

    return () => clearInterval(typingInterval);
  }, [critique]);

  if (!critique) return null;

  const getSeverityStyles = () => {
    switch (severity) {
      case 'punitive':
        return {
          border: 'border-red-500/50',
          bg: 'bg-red-950/30',
          icon: <ShieldAlert className="w-5 h-5 text-red-500" />,
          titleColor: 'text-red-500',
          textColor: 'text-red-400',
          shadow: 'shadow-[0_0_30px_rgba(239,68,68,0.15)]',
          glow: 'text-glow-red'
        };
      case 'warning':
        return {
          border: 'border-amber-500/50',
          bg: 'bg-amber-950/30',
          icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
          titleColor: 'text-amber-500',
          textColor: 'text-amber-400',
          shadow: 'shadow-[0_0_20px_rgba(245,158,11,0.1)]',
          glow: 'text-glow-gold'
        };
      case 'approval':
        return {
          border: 'border-cyan-500/50',
          bg: 'bg-cyan-950/30',
          icon: <CheckCircle2 className="w-5 h-5 text-cyan-400" />,
          titleColor: 'text-cyan-400',
          textColor: 'text-cyan-300',
          shadow: 'shadow-[0_0_20px_rgba(6,182,212,0.15)]',
          glow: 'text-glow-cyan'
        };
      default:
        return {
          border: 'border-white/10',
          bg: 'bg-black/40',
          icon: <Activity className="w-5 h-5 text-slate-400" />,
          titleColor: 'text-slate-400',
          textColor: 'text-slate-300',
          shadow: 'shadow-none',
          glow: ''
        };
    }
  };

  const styles = getSeverityStyles();

  return (
    <div className={`glass-panel rounded-2xl border ${styles.border} ${styles.bg} ${styles.shadow} p-5 relative overflow-hidden`}>
      {/* Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-20" />
      
      <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
        <div className="flex items-center gap-2">
          {styles.icon}
          <span className={`text-xs font-black uppercase tracking-widest ${styles.titleColor} ${styles.glow}`}>
            RUTHLESS OVERSEER
          </span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-slate-600"></div>
          <div className="w-2 h-2 rounded-full bg-slate-600"></div>
          <div className={`w-2 h-2 rounded-full ${isTyping ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`}></div>
        </div>
      </div>
      
      <div className="font-mono text-sm leading-relaxed min-h-[40px] flex items-start gap-3">
        <Terminal className={`w-4 h-4 mt-0.5 opacity-50 ${styles.textColor}`} />
        <p className={`${styles.textColor}`}>
          {displayedText}
          {isTyping && <span className={`inline-block w-2 h-4 ml-1 bg-current animate-pulse align-middle`}></span>}
        </p>
      </div>
    </div>
  );
};

export default RuthlessOverseer;
