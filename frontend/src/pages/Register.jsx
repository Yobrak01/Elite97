import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Award, Loader2, Eye, EyeOff, Globe, BookOpen, GraduationCap, ChevronRight, ChevronLeft, ShieldCheck } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import api from '../services/api';
import { COUNTRIES } from '../utils/countries';

import { UNIVERSITIES } from '../utils/universities';

const MAJORS = [
  "Accounting", "Aerospace Engineering", "Agriculture", "Architecture", 
  "Biology", "Biomedical Engineering", "Business Administration", 
  "Chemical Engineering", "Chemistry", "Civil Engineering", 
  "Computer Engineering", "Computer Science", "Data Science", 
  "Economics", "Electrical Engineering", "English", "Environmental Science", 
  "Finance", "History", "Information Technology", "Law", "Mathematics", 
  "Mechanical Engineering", "Medicine", "Nursing", "Pharmacy", 
  "Philosophy", "Physics", "Political Science", "Psychology", 
  "Sociology", "Software Engineering", "Other"
];

export const Register = () => {
  const { register, verifyEmail: verifyEmailContext, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [country, setCountry] = useState('');
  const [university, setUniversity] = useState('');
  const [customUniversity, setCustomUniversity] = useState('');
  const [major, setMajor] = useState('');
  const [customMajor, setCustomMajor] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [currentSemester, setCurrentSemester] = useState('');

  const [otp, setOtp] = useState('');
  const [resending, setResending] = useState(false);

  const [countries, setCountries] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [fetchingUnis, setFetchingUnis] = useState(false);
  const [apiError, setApiError] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (token) navigate('/', { replace: true });
  }, [token, navigate]);

  // Load hardcoded countries on mount
  useEffect(() => {
    setCountries(COUNTRIES);
  }, []);

  // Load universities from built-in database when country changes
  useEffect(() => {
    if (!country) return;
    setFetchingUnis(true);
    setApiError(false);
    setUniversities([]);
    setUniversity('');

    // Use the built-in database as primary source
    const localUnis = UNIVERSITIES[country];
    if (localUnis && localUnis.length > 0) {
      setUniversities([...localUnis].sort());
      setFetchingUnis(false);
      return;
    }

    // Fallback: try external API for countries not in our local database
    const fetchFromApi = async () => {
      try {
        const countryMap = {
          "United States of America": "United States",
          "South Korea": "Korea, Republic of",
          "North Korea": "Democratic People's Republic of Korea",
          "Russia": "Russian Federation",
          "Vietnam": "Viet Nam",
          "Syria": "Syrian Arab Republic",
          "Iran": "Iran, Islamic Republic of",
          "Czechia (Czech Republic)": "Czech Republic",
          "Myanmar (formerly Burma)": "Myanmar",
          "Congo (Congo-Brazzaville)": "Congo"
        };
        const queryCountry = countryMap[country] || country;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(`https://universities.hipolabs.com/search?country=${encodeURIComponent(queryCountry)}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!res.ok) throw new Error('API failed');
        
        const data = await res.json();
        if (!data || data.length === 0) {
          throw new Error('No universities found for this country');
        }
        const sorted = [...new Set(data.map(u => u.name))].sort();
        setUniversities(sorted);
      } catch (err) {
        console.warn("External university API unavailable, using manual entry.", err.message);
        setApiError(true);
      } finally {
        setFetchingUnis(false);
      }
    };
    fetchFromApi();
  }, [country]);

  const handleNextStep = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!country || !university || !major) {
      return setError('Please complete your academic profile.');
    }

    const finalUniversity = university === 'Other' ? customUniversity : university;
    if (university === 'Other' && !finalUniversity.trim()) {
      return setError('Please specify your university.');
    }

    const finalMajor = major === 'Other' ? customMajor : major;
    if (major === 'Other' && !finalMajor.trim()) {
      return setError('Please specify your major.');
    }

    setSubmitting(true);
    try {
      await register(name, email, password, country, finalUniversity, finalMajor, Number(yearOfStudy) || undefined, Number(currentSemester) || undefined);
      navigate('/', { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Registration failed. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!otp || otp.length !== 6) {
      return setError('Please enter a valid 6-digit code.');
    }

    setSubmitting(true);
    try {
      await verifyEmailContext(email, otp);
      navigate('/', { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Verification failed. Please check your code.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (resending) return;
    setResending(true);
    setError('');
    setSuccess('');
    
    try {
      await api.auth.resendOtp(email);
      setSuccess('A new verification code has been sent to your email.');
    } catch (err) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Global Watermark */}
      <div className="elite-watermark-container"></div>
      
      {/* Glow backgrounds */}
      <div className="absolute top-[-20%] left-[-20%] h-[60%] w-[60%] rounded-full bg-cyan-500/10 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-20%] h-[60%] w-[60%] rounded-full bg-blue-600/10 blur-[120px]" />

      <div className="glass-panel w-full max-w-md rounded-3xl p-8 border border-white/5 shadow-2xl relative z-10 transition-all duration-500">
        <div className="flex flex-col items-center text-center space-y-2 mb-8">
          <img src="/logo.png" alt="ELITE97" className="h-20 w-20 rounded-full object-cover border-2 border-amber-500/40 shadow-[0_0_30px_rgba(217,169,78,0.4)]" />
          <h2 className="text-4xl md:text-5xl font-display font-black tracking-[0.2em] text-white mt-6 text-glow-gold">
            ELITE<span className="text-accent-gold">97</span>
          </h2>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-2">
            {step === 1 ? 'Step 1: Node Credentials' : step === 2 ? 'Step 2: Academic Matrix' : 'Step 3: Identity Verification'}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-xs font-bold text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-2xl bg-green-500/10 border border-green-500/20 p-4 text-xs font-bold text-green-400">
            {success}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleNextStep} className="space-y-4 animate-fade-in">
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
                  autoComplete="off"
                  className="w-full rounded-2xl bg-navy-900/60 border border-white/5 py-3.5 pl-12 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:shadow-glow-cyan transition-all"
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
                  autoComplete="new-password"
                  className="w-full rounded-2xl bg-navy-900/60 border border-white/5 py-3.5 pl-12 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:shadow-glow-cyan transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Secure Keycode</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  autoComplete="new-password"
                  className="w-full rounded-2xl bg-navy-900/60 border border-white/5 py-3.5 pl-12 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:shadow-glow-cyan transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-slate-500 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Verify Keycode</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full rounded-2xl bg-navy-900/60 border border-white/5 py-3.5 pl-12 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:shadow-glow-cyan transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-3.5 text-slate-500 hover:text-white transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-cyan-500 hover:bg-cyan-500/90 border border-cyan-500/20 py-3.5 text-sm font-black uppercase tracking-widest text-white shadow-glow-cyan hover:shadow-glow-cyan/80 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              Continue to Academic Profile
              <ChevronRight className="h-5 w-5" />
            </button>
          </form>
        ) : step === 2 ? (
          <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Nation of Operation</label>
              <div className="relative">
                <Globe className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                <select
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-2xl bg-navy-900/60 border border-white/5 py-3.5 pl-12 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:shadow-glow-cyan transition-all cursor-pointer"
                >
                  <option value="" disabled className="bg-navy-950">Select your country</option>
                  {countries.map((c) => (
                    <option key={c} value={c} className="bg-navy-950">{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Institution</label>
              <div className="relative">
                <GraduationCap className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                {fetchingUnis ? (
                  <div className="w-full rounded-2xl bg-navy-900/60 border border-white/5 py-3.5 pl-12 pr-4 text-sm text-slate-500 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Fetching grid...
                  </div>
                ) : (
                  <select
                    required
                    disabled={!country}
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="w-full rounded-2xl bg-navy-900/60 border border-white/5 py-3.5 pl-12 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:shadow-glow-cyan transition-all cursor-pointer disabled:opacity-50"
                  >
                    <option value="" disabled className="bg-navy-950">
                      {apiError ? 'No universities listed / Database offline' : country ? 'Select your university' : 'Select a country first'}
                    </option>
                    {universities.map((u) => (
                      <option key={u} value={u} className="bg-navy-950">{u}</option>
                    ))}
                    {country && <option value="Other" className="bg-navy-950 text-cyan-400 font-bold">
                      {apiError ? 'Click here to manually enter university' : 'My university is not listed'}
                    </option>}
                  </select>
                )}
              </div>
            </div>

            {university === 'Other' && (
              <div className="space-y-1 animate-fade-in">
                <input
                  type="text"
                  required
                  value={customUniversity}
                  onChange={(e) => setCustomUniversity(e.target.value)}
                  placeholder="Enter university name"
                  className="w-full rounded-2xl bg-navy-900/60 border border-white/5 py-3.5 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:shadow-glow-cyan transition-all"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Academic Program / Course</label>
              <div className="relative">
                <BookOpen className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                <select
                  required
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  className="w-full rounded-2xl bg-navy-900/60 border border-white/5 py-3.5 pl-12 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:shadow-glow-cyan transition-all cursor-pointer"
                >
                  <option value="" disabled className="bg-navy-950">Select your major</option>
                  {MAJORS.map((m) => (
                    <option key={m} value={m} className="bg-navy-950">{m}</option>
                  ))}
                </select>
              </div>
            </div>

            {major === 'Other' && (
              <div className="space-y-1 animate-fade-in">
                <input
                  type="text"
                  required
                  value={customMajor}
                  onChange={(e) => setCustomMajor(e.target.value)}
                  placeholder="Specify your program / course"
                  className="w-full rounded-2xl bg-navy-900/60 border border-white/5 py-3.5 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:shadow-glow-cyan transition-all"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Year of Study</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={yearOfStudy}
                  onChange={(e) => setYearOfStudy(e.target.value)}
                  placeholder="e.g. 2"
                  className="w-full rounded-2xl bg-navy-900/60 border border-white/5 py-3.5 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:shadow-glow-cyan transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Current Semester</label>
                <input
                  type="number"
                  min="1"
                  max="3"
                  value={currentSemester}
                  onChange={(e) => setCurrentSemester(e.target.value)}
                  placeholder="e.g. 1"
                  className="w-full rounded-2xl bg-navy-900/60 border border-white/5 py-3.5 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:shadow-glow-cyan transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-2xl border border-white/10 hover:bg-white/5 text-white px-4 py-3.5 transition-all cursor-pointer flex items-center justify-center"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-cyan-500 hover:bg-cyan-500/90 border border-cyan-500/20 py-3.5 text-sm font-black uppercase tracking-widest text-white shadow-glow-cyan hover:shadow-glow-cyan/80 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'INITIALIZE MATRIX'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyEmail} className="space-y-4 animate-fade-in">
            <p className="text-sm text-slate-300 text-center mb-6">
              We've sent a 6-digit verification code to <span className="text-cyan-400 font-bold">{email}</span>.
            </p>
            
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Verification Code</label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                <input
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  className="w-full rounded-2xl bg-navy-900/60 border border-white/5 py-3.5 pl-12 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:shadow-glow-cyan transition-all text-center tracking-[0.5em] font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || otp.length !== 6}
              className="w-full rounded-2xl bg-cyan-500 hover:bg-cyan-500/90 border border-cyan-500/20 py-3.5 text-sm font-black uppercase tracking-widest text-white shadow-glow-cyan hover:shadow-glow-cyan/80 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'VERIFY & ACCESS'}
            </button>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resending}
                className="text-xs text-slate-400 hover:text-cyan-400 transition-colors font-bold uppercase tracking-wider disabled:opacity-50"
              >
                {resending ? 'Resending...' : 'Resend Code'}
              </button>
            </div>
          </form>
        )}

        <p className="mt-8 text-center text-xs text-slate-400 font-semibold">
          Already have a matrix system profile?{' '}
          <Link to="/login" className="text-cyan-400 hover:text-cyan-400/80 font-bold transition-all">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};
export default Register;

