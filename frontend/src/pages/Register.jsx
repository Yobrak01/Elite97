import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Award, Loader2 } from 'lucide-react';
import AuthContext from '../context/AuthContext';

export const Register = () => {
  const { register, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (token) navigate('/', { replace: true });
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setSubmitting(true);
    try {
      await register(name, email, password);
      navigate('/', { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Registration failed. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 p-4 relative overflow-hidden">
      {/* Glow backgrounds */}
      <div className="absolute top-[-20%] left-[-20%] h-[60%] w-[60%] rounded-full bg-accent-blue/10 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-20%] h-[60%] w-[60%] rounded-full bg-cyan-500/10 blur-[120px]" />

      <div className="glass-panel w-full max-w-md rounded-3xl p-8 border border-white/5 shadow-2xl relative z-10">
        <div className="flex flex-col items-center text-center space-y-2 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-blue/10 text-accent-blue border border-accent-blue/20 shadow-glow-blue">
            <Award className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-black tracking-widest text-white mt-4">
            ELITE<span className="text-accent-blue">97</span> REGISTRY
          </h2>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Establish student node parameters
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-xs font-bold text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tesla Maxwell"
                className="w-full rounded-2xl bg-navy-900/60 border border-white/5 py-3.5 pl-12 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-blue focus:shadow-glow-blue transition-all"
              />
            </div>
          </div>

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
                className="w-full rounded-2xl bg-navy-900/60 border border-white/5 py-3.5 pl-12 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-blue focus:shadow-glow-blue transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Secure Keycode</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full rounded-2xl bg-navy-900/60 border border-white/5 py-3.5 pl-12 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-blue focus:shadow-glow-blue transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Verify Keycode</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl bg-navy-900/60 border border-white/5 py-3.5 pl-12 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-blue focus:shadow-glow-blue transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-accent-blue hover:bg-accent-blue/90 border border-accent-blue/20 py-3.5 text-sm font-black uppercase tracking-widest text-white shadow-glow-blue hover:shadow-glow-blue/80 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Configuring Node...
              </>
            ) : (
              'Initiate Matrix Profile'
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-slate-400 font-semibold">
          Already have a matrix system profile?{' '}
          <Link to="/login" className="text-accent-blue hover:text-accent-blue/80 font-bold transition-all">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};
export default Register;
