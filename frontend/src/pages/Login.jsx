import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Award, Loader2, Eye, EyeOff } from 'lucide-react';
import AuthContext from '../context/AuthContext';

export const Login = () => {
  const { login, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (token) navigate('/', { replace: true });
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 p-4 relative overflow-hidden">
      {/* Background radial overlays for modern glowing aura */}
      <div className="absolute top-[-20%] left-[-20%] h-[60%] w-[60%] rounded-full bg-accent-gold/10 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-20%] h-[60%] w-[60%] rounded-full bg-amber-500/10 blur-[120px]" />

      <div className="glass-panel w-full max-w-md rounded-3xl p-8 border border-white/5 shadow-2xl relative z-10">
        <div className="flex flex-col items-center text-center space-y-2 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-gold/10 text-accent-gold border border-accent-gold/20 shadow-glow-gold">
            <Award className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-black tracking-widest text-white mt-4">
            ELITE<span className="text-accent-gold">97</span> SYSTEM
          </h2>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Academic Performance Operating System
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-xs font-bold text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="engineering.student@elite97.com"
                className="w-full rounded-2xl bg-navy-900/60 border border-white/5 py-3.5 pl-12 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-gold focus:shadow-glow-gold transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Secure Keycode (Password)</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl bg-navy-900/60 border border-white/5 py-3.5 pl-12 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-gold focus:shadow-glow-gold transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-slate-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-accent-gold hover:bg-accent-gold/90 border border-accent-gold/20 py-3.5 text-sm font-black uppercase tracking-widest text-white shadow-glow-gold hover:shadow-glow-gold/80 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Validating Matrix...
              </>
            ) : (
              'Initiate Session'
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-slate-400 font-semibold">
          Don't have an operating system profile?{' '}
          <Link to="/register" className="text-accent-gold hover:text-accent-gold/80 font-bold transition-all">
            Create Profile
          </Link>
        </p>
      </div>
    </div>
  );
};
export default Login;

