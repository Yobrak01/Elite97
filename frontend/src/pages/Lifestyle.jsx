import React, { useState, useEffect, useCallback } from 'react';
import { Dumbbell, UtensilsCrossed, Home, ChevronRight, Check, RefreshCw, Clock, Sun, Moon, Sunrise, Sunset, Coffee, BookOpen, ShowerHead, Sparkles, Shirt, BedDouble, Circle } from 'lucide-react';

const ICON_MAP = {
  Dumbbell, UtensilsCrossed, Home, ChevronRight, Check, RefreshCw, Clock, Sun, Moon, Sunrise, Sunset, Coffee, BookOpen, ShowerHead, Sparkles, Shirt, BedDouble, Circle
};
import api from '../services/api';

// Constants
const TABS = [
  { key: 'gym', label: 'Gym Schedule', icon: Dumbbell, color: 'text-green-400', bg: 'bg-green-500/15', border: 'border-green-500/30' },
  { key: 'meal', label: 'Meal Plan', icon: UtensilsCrossed, color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30' },
  { key: 'routine', label: 'Daily Routine', icon: Home, color: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/30' }
];

const MUSCLE_COLORS = {
  chest: 'text-red-400 bg-red-500/10',
  back: 'text-yellow-400 bg-yellow-500/10',
  shoulders: 'text-purple-400 bg-purple-500/10',
  legs: 'text-green-400 bg-green-500/10',
  arms: 'text-orange-400 bg-orange-500/10',
  biceps: 'text-orange-400 bg-orange-500/10',
  triceps: 'text-yellow-400 bg-yellow-500/10',
  core: 'text-pink-400 bg-pink-500/10',
  abs: 'text-pink-400 bg-pink-500/10',
  glutes: 'text-emerald-400 bg-emerald-500/10',
  hamstrings: 'text-teal-400 bg-teal-500/10',
  quads: 'text-lime-400 bg-lime-500/10',
  calves: 'text-amber-400 bg-amber-500/10',
  default: 'text-slate-400 bg-slate-500/10'
};

const getMuscleColor = (muscle) => {
  if (!muscle) return MUSCLE_COLORS.default;
  const key = muscle.toLowerCase();
  return MUSCLE_COLORS[key] || MUSCLE_COLORS.default;
};

// ===================== GYM TAB =====================
const GymTab = () => {
  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [completedExercises, setCompletedExercises] = useState(new Set());

  const fetchWorkout = useCallback(async () => {
    try {
      const res = await api.life.getTodayWorkout();
      setWorkout(res.data);
      // Set completed exercises
      const completed = new Set();
      (res.data?.exercises || []).forEach((ex, i) => {
        if (ex.completed) completed.add(i);
      });
      setCompletedExercises(completed);
    } catch (err) {
      console.error('Failed to fetch workout:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWorkout(); }, [fetchWorkout]);

  const handleGenerateWeekly = async () => {
    setGenerating(true);
    try {
      await api.life.regenerateWeeklyWorkout();
      await fetchWorkout();
    } catch (err) {
      console.error('Failed to generate weekly plan:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleExercise = async (index) => {
    if (!workout?._id) return;
    try {
      await api.life.completeExercise(workout._id, index);
      setCompletedExercises(prev => {
        const next = new Set(prev);
        if (next.has(index)) next.delete(index);
        else next.add(index);
        return next;
      });
    } catch (err) {
      console.error('Failed to toggle exercise:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="relative h-10 w-10">
          <div className="absolute h-full w-full rounded-full border-4 border-navy-800"></div>
          <div className="absolute h-full w-full animate-spin rounded-full border-4 border-t-green-400 border-r-transparent border-b-transparent border-l-transparent"></div>
        </div>
      </div>
    );
  }

  const exercises = workout?.exercises || [];
  const splitType = workout?.splitType || workout?.split || 'Rest Day';
  const completedCount = completedExercises.size;
  const totalCount = exercises.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Split Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/15 border border-green-500/20">
              <Dumbbell className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-wider text-white uppercase">{splitType}</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Today's Split</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Progress */}
          {totalCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="h-2 w-24 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs font-black text-green-400">{completedCount}/{totalCount}</span>
            </div>
          )}
          <button
            onClick={handleGenerateWeekly}
            disabled={generating}
            className="flex items-center gap-2 rounded-xl bg-green-500/15 border border-green-500/20 text-green-400 hover:bg-green-500 hover:text-white px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${generating ? 'animate-spin' : ''}`} />
            Generate Weekly Plan
          </button>
        </div>
      </div>

      {/* Exercise List */}
      {exercises.length === 0 ? (
        <div className="glass-panel rounded-2xl border border-white/5 p-12 text-center">
          <Dumbbell className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <p className="text-sm font-bold text-slate-400">No workout scheduled for today.</p>
          <p className="text-xs text-slate-500 mt-1">Generate a weekly plan to get started.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {exercises.map((exercise, index) => {
            const isCompleted = completedExercises.has(index);
            return (
              <div
                key={index}
                className={`glass-panel rounded-2xl border p-4 flex items-center gap-4 transition-all duration-200 ${
                  isCompleted
                    ? 'border-green-500/20 bg-green-500/5 opacity-70'
                    : 'border-white/5 hover:border-white/10'
                }`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => handleToggleExercise(index)}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 transition-all ${
                    isCompleted
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-white/10 hover:border-green-500/50 text-transparent hover:text-green-500/30'
                  }`}
                >
                  <Check className="h-4 w-4" />
                </button>

                {/* Exercise Info */}
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-bold tracking-wide text-white ${isCompleted ? 'line-through' : ''}`}>
                    {exercise.name || exercise.exercise}
                  </h4>
                  {exercise.targetMuscle && (
                    <span className={`inline-block mt-1 rounded-lg px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${getMuscleColor(exercise.targetMuscle)}`}>
                      {exercise.targetMuscle}
                    </span>
                  )}
                </div>

                {/* Sets & Reps */}
                <div className="flex items-center gap-3 shrink-0">
                  {exercise.sets && (
                    <div className="text-center">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Sets</p>
                      <p className="text-lg font-black text-white">{exercise.sets}</p>
                    </div>
                  )}
                  {exercise.reps && (
                    <div className="text-center">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Reps</p>
                      <p className="text-lg font-black text-white">{exercise.reps}</p>
                    </div>
                  )}
                  {exercise.duration && (
                    <div className="text-center">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Duration</p>
                      <p className="text-lg font-black text-white">{exercise.duration}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ===================== MEAL TAB =====================
const MealTab = () => {
  const [mealPlan, setMealPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const fetchMeal = useCallback(async () => {
    try {
      const res = await api.life.getTodayMeal();
      setMealPlan(res.data);
    } catch (err) {
      console.error('Failed to fetch meal:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMeal(); }, [fetchMeal]);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await api.life.regenerateMeal();
      await fetchMeal();
    } catch (err) {
      console.error('Failed to regenerate meal:', err);
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="relative h-10 w-10">
          <div className="absolute h-full w-full rounded-full border-4 border-navy-800"></div>
          <div className="absolute h-full w-full animate-spin rounded-full border-4 border-t-orange-400 border-r-transparent border-b-transparent border-l-transparent"></div>
        </div>
      </div>
    );
  }

  const MEAL_SECTIONS = [
    { key: 'breakfast', label: 'Breakfast', icon: Sunrise, color: 'text-amber-400', gradient: 'from-amber-500/10 to-orange-500/10', border: 'border-amber-500/20' },
    { key: 'lunch', label: 'Lunch', icon: Sun, color: 'text-orange-400', gradient: 'from-orange-500/10 to-red-500/10', border: 'border-orange-500/20' },
    { key: 'dinner', label: 'Dinner', icon: Moon, color: 'text-rose-400', gradient: 'from-rose-500/10 to-purple-500/10', border: 'border-rose-500/20' }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/15 border border-orange-500/20">
            <UtensilsCrossed className="h-6 w-6 text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-wider text-white uppercase">Today's Meals</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Balanced Nutrition Plan</p>
          </div>
        </div>
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="flex items-center gap-2 rounded-xl bg-orange-500/15 border border-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-white px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${regenerating ? 'animate-spin' : ''}`} />
          Regenerate Menu
        </button>
      </div>

      {/* Meal Cards */}
      <div className="grid gap-5 md:grid-cols-3">
        {MEAL_SECTIONS.map((section) => {
          const MealIcon = section.icon;
          const meal = mealPlan?.[section.key];
          const mealName = meal?.name || meal?.dish || 'Not planned';
          const ingredients = meal?.ingredients || [];

          return (
            <div
              key={section.key}
              className={`glass-panel rounded-2xl border ${section.border} p-5 space-y-4 bg-gradient-to-br ${section.gradient}`}
            >
              {/* Meal Header */}
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${section.color} bg-white/5`}>
                  <MealIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${section.color}`}>{section.label}</p>
                  <h4 className="text-sm font-bold text-white tracking-wide">{mealName}</h4>
                </div>
              </div>

              {/* Ingredients */}
              {ingredients.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Ingredients</p>
                  <div className="space-y-1.5">
                    {ingredients.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <ChevronRight className={`h-3 w-3 shrink-0 ${section.color}`} />
                        <span className="text-slate-300 font-medium">
                          {typeof item === 'string' ? item : `${item.name || item.item}${item.amount ? ` — ${item.amount}` : ''}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 font-medium italic">No details available</p>
              )}

              {/* Calories if available */}
              {meal?.calories && (
                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Calories</span>
                  <span className={`text-sm font-black ${section.color}`}>{meal.calories} kcal</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ===================== ROUTINE TAB =====================

const RoutineTab = () => {
  const [routine, setRoutine] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRoutine = useCallback(async () => {
    try {
      const res = await api.life.getTodayRoutine();
      setRoutine(res.data);
    } catch (err) {
      console.error('Failed to fetch routine:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRoutine(); }, [fetchRoutine]);

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const parseTime = (timeStr) => {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 0;
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3].toUpperCase();
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const currentTotalMinutes = currentHour * 60 + currentMinute;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-500/15 border border-yellow-500/20">
          <Home className="h-6 w-6 text-yellow-400" />
        </div>
        <div>
          <h3 className="text-lg font-black tracking-wider text-white uppercase">Daily Blueprint</h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Optimized routine for peak performance</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-[2.15rem] top-0 bottom-0 w-px bg-gradient-to-b from-accent-gold/30 via-white/10 to-transparent"></div>
        <div className="space-y-1">
          {loading ? (
            <div className="py-10 text-center text-xs font-bold text-slate-500">Loading dynamic routine...</div>
          ) : routine.map((item, index) => {
            const Icon = ICON_MAP[item.icon] || Circle;
            const itemMinutes = item.minutes;
            const nextItem = routine[index + 1];
            const nextMinutes = nextItem ? nextItem.minutes : itemMinutes + 30;
            const isActive = currentTotalMinutes >= itemMinutes && currentTotalMinutes < nextMinutes;
            const isPast = currentTotalMinutes >= nextMinutes;

            return (
              <div
                key={index}
                className={`relative flex items-start gap-4 rounded-2xl p-4 transition-all ${
                  isActive
                    ? 'bg-accent-gold/5 border border-accent-gold/20 shadow-lg shadow-accent-gold/5'
                    : item.isLecture
                    ? 'bg-cyan-500/5 border border-cyan-500/10'
                    : isPast
                    ? 'opacity-50'
                    : ''
                }`}
              >
                {/* Timeline Dot */}
                <div className={`relative z-10 flex h-[1.1rem] w-[1.1rem] shrink-0 items-center justify-center rounded-full mt-1 ${
                  isActive
                    ? 'bg-accent-gold shadow-lg shadow-accent-gold/50'
                    : isPast
                    ? 'bg-slate-600'
                    : item.isLecture
                    ? 'bg-cyan-500 shadow-glow-cyan/50'
                    : 'bg-white/10 border border-white/20'
                }`}>
                  {isActive && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-gold opacity-40"></span>
                  )}
                </div>

                {/* Icon */}
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.bg} ${item.color}`}>
                  <Icon className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-accent-gold' : item.isLecture ? 'text-cyan-400' : 'text-slate-500'}`}>
                      {item.time}
                    </span>
                    {isActive && (
                      <span className="rounded-lg bg-accent-gold/20 border border-accent-gold/30 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-accent-gold">
                        Now
                      </span>
                    )}
                    {item.isLecture && !isActive && (
                      <span className="rounded-lg bg-cyan-500/20 border border-cyan-500/30 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-cyan-400">
                        Class
                      </span>
                    )}
                  </div>
                  <h4 className={`text-sm font-bold tracking-wide mt-0.5 ${isActive ? 'text-white' : item.isLecture ? 'text-cyan-100' : 'text-slate-200'}`}>
                    {item.label}
                  </h4>
                  <p className="mt-1 text-xs font-semibold text-slate-400">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ===================== MAIN PAGE =====================
export const Lifestyle = () => {
  const [activeTab, setActiveTab] = useState('gym');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-wider text-white">LIFESTYLE COMMAND</h1>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mt-1">
            Gym • Nutrition • Daily Operations
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                isActive
                  ? `${tab.bg} ${tab.color} border ${tab.border} shadow-lg`
                  : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              <TabIcon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'gym' && <GymTab />}
        {activeTab === 'meal' && <MealTab />}
        {activeTab === 'routine' && <RoutineTab />}
      </div>
    </div>
  );
};

export default Lifestyle;
