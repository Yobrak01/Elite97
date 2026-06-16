import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Award, Loader2, Eye, EyeOff, Globe, BookOpen, GraduationCap, ChevronRight, ChevronLeft } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import { COUNTRIES } from '../utils/countries';

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
  const { register, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [country, setCountry] = useState('');
  const [university, setUniversity] = useState('');
  const [major, setMajor] = useState('');
  const [customMajor, setCustomMajor] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [currentSemester, setCurrentSemester] = useState('');

  const [countries, setCountries] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [fetchingUnis, setFetchingUnis] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (token) navigate('/', { replace: true });
  }, [token, navigate]);

  // Load hardcoded countries on mount
  useEffect(() => {
    setCountries(COUNTRIES);
  }, []);

  // Fetch universities when country changes
  useEffect(() => {
    if (!country) return;
    const fetchUniversities = async () => {
      setFetchingUnis(true);
      setUniversities([]);
      setUniversity('');
      try {
        const res = await fetch(`https://universities.hipolabs.com/search?country=${encodeURIComponent(country)}`);
        const data = await res.json();
        const sorted = [...new Set(data.map(u => u.name))].sort();
        setUniversities(sorted);
      } catch (err) {
        console.error("Failed to fetch universities", err);
      } finally {
        setFetchingUnis(false);
      }
    };
    fetchUniversities();
  }, [country]);

  const handleNextStep = (e) => {
    e.preventDefault();
    setError('');
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 p-4 relative overflow-hidden">
      {/* Global Watermark */}
      <div className="elite-watermark-container"></div>
      
      {/* Glow backgrounds */}
      <div className="absolute top-[-20%] left-[-20%] h-[60%] w-[60%] rounded-full bg-cyan-500/10 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-20%] h-[60%] w-[60%] rounded-full bg-blue-600/10 blur-[120px]" />

      <div className="glass-panel w-full max-w-md rounded-3xl p-8 border border-white/5 shadow-2xl relative z-10 transition-all duration-500">
        <div className="flex flex-col items-center text-center space-y-2 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-glow-cyan">
            <Award className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-display font-black tracking-widest text-white mt-4 text-glow-gold">
            ELITE<span className="text-cyan-400">97</span> REGISTRY
          </h2>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            {step === 1 ? 'Step 1: Node Credentials' : 'Step 2: Academic Matrix'}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-xs font-bold text-red-400">
            {error}
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
        ) : (
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
                    <option value="" disabled className="bg-navy-950">{country ? 'Select your university' : 'Select a country first'}</option>
                    {universities.map((u) => (
                      <option key={u} value={u} className="bg-navy-950">{u}</option>
                    ))}
                    {country && <option value="Other" className="bg-navy-950 text-cyan-400 font-bold">My university is not listed</option>}
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
                className="flex-1 rounded-2xl bg-cyan-500 hover:bg-cyan-500/90 border border-cyan-500/20 py-3.5 text-sm font-black uppercase tracking-widest text-white shadow-glow-cyan hover:shadow-glow-cyan/80 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  'Establish Link'
                )}
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

