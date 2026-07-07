import React, { useState, useEffect, useCallback } from 'react';
import { Dumbbell, UtensilsCrossed, Home, ChevronRight, Check, RefreshCw, Clock, Sun, Moon, Sunrise, Sunset, Coffee, BookOpen, ShowerHead, Sparkles, Shirt, BedDouble, Circle } from 'lucide-react';

const ICON_MAP = {
  Dumbbell, UtensilsCrossed, Home, ChevronRight, Check, RefreshCw, Clock, Sun, Moon, Sunrise, Sunset, Coffee, BookOpen, ShowerHead, Sparkles, Shirt, BedDouble, Circle
};
import api from '../services/api';

// Constants
const TABS = [
  { key: 'gym', label: 'Gym Schedule', icon: Dumbbell, color: 'text-green-400', bg: 'bg-green-500/15', border: 'border-green-500/30' },
  { key: 'meal', label: 'Meal Plan', icon: UtensilsCrossed, color: 'text-indigo-400', bg: 'bg-indigo-600/15', border: 'border-indigo-600/30' },
  { key: 'pantry', label: 'My Pantry', icon: Coffee, color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30' },
  { key: 'routine', label: 'Daily Routine', icon: Home, color: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/30' }
];

const MUSCLE_COLORS = {
  chest: 'text-red-400 bg-red-500/10',
  back: 'text-yellow-400 bg-yellow-500/10',
  shoulders: 'text-purple-400 bg-purple-500/10',
  legs: 'text-green-400 bg-green-500/10',
  arms: 'text-indigo-400 bg-indigo-600/10',
  biceps: 'text-indigo-400 bg-indigo-600/10',
  triceps: 'text-yellow-400 bg-yellow-500/10',
  core: 'text-pink-400 bg-pink-500/10',
  abs: 'text-pink-400 bg-pink-500/10',
  glutes: 'text-emerald-400 bg-emerald-500/10',
  hamstrings: 'text-teal-400 bg-teal-500/10',
  quads: 'text-lime-400 bg-lime-500/10',
  calves: 'text-blue-400 bg-blue-600/10',
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
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualData, setManualData] = useState({
    splitType: 'full_body',
    durationMinutes: 60,
    exercises: []
  });

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

  const handleSaveManual = async () => {
    try {
      await api.life.setManualWorkout(manualData);
      setIsManualMode(false);
      await fetchWorkout();
    } catch (err) {
      console.error('Failed to save manual workout:', err);
    }
  };

  const addManualExercise = () => {
    setManualData(prev => ({
      ...prev,
      exercises: [...prev.exercises, { name: '', targetMuscle: 'default', sets: 3, reps: '10' }]
    }));
  };

  const updateManualExercise = (index, field, value) => {
    setManualData(prev => {
      const newExercises = [...prev.exercises];
      newExercises[index] = { ...newExercises[index], [field]: value };
      return { ...prev, exercises: newExercises };
    });
  };

  const removeManualExercise = (index) => {
    setManualData(prev => {
      const newExercises = prev.exercises.filter((_, i) => i !== index);
      return { ...prev, exercises: newExercises };
    });
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
            onClick={() => setIsManualMode(!isManualMode)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${
              isManualMode 
                ? 'bg-slate-800 border-slate-700 text-slate-300' 
                : 'bg-indigo-500/15 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white'
            }`}
          >
            {isManualMode ? 'Cancel Manual' : 'Manual Entry'}
          </button>
          <button
            onClick={handleGenerateWeekly}
            disabled={generating}
            className="flex items-center gap-2 rounded-xl bg-green-500/15 border border-green-500/20 text-green-400 hover:bg-green-500 hover:text-white px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${generating ? 'animate-spin' : ''}`} />
            {isManualMode ? 'AI Generate' : 'Generate Weekly'}
          </button>
        </div>
      </div>

      {/* Exercise List or Manual Form */}
      {isManualMode ? (
        <div className="glass-panel rounded-2xl border border-white/5 p-6 animate-fade-in space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Split Type</label>
              <select
                value={manualData.splitType}
                onChange={e => setManualData({...manualData, splitType: e.target.value})}
                className="w-full rounded-xl bg-navy-900 border border-white/5 py-3 pl-4 pr-8 text-sm text-white focus:border-green-500 focus:shadow-glow-cyan transition-all"
              >
                <option value="push">Push</option>
                <option value="pull">Pull</option>
                <option value="legs">Legs</option>
                <option value="upper">Upper Body</option>
                <option value="lower">Lower Body</option>
                <option value="full_body">Full Body</option>
                <option value="rest">Rest Day</option>
              </select>
            </div>
            <div className="w-full sm:w-32 space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Duration (min)</label>
              <input
                type="number"
                value={manualData.durationMinutes}
                onChange={e => setManualData({...manualData, durationMinutes: e.target.value})}
                className="w-full rounded-xl bg-navy-900 border border-white/5 py-3 px-4 text-sm text-white focus:border-green-500 focus:shadow-glow-cyan transition-all"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-white/5 pb-2">Exercises</h4>
            {manualData.exercises.map((ex, idx) => (
              <div key={idx} className="flex flex-wrap sm:flex-nowrap gap-3 items-end p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="w-full sm:flex-1 space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Exercise Name</label>
                  <input
                    type="text"
                    value={ex.name}
                    onChange={e => updateManualExercise(idx, 'name', e.target.value)}
                    placeholder="e.g. Bench Press"
                    className="w-full rounded-lg bg-navy-950 border border-white/5 p-2 text-sm text-white focus:border-green-500"
                  />
                </div>
                <div className="w-full sm:w-32 space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Target Muscle</label>
                  <select
                    value={ex.targetMuscle}
                    onChange={e => updateManualExercise(idx, 'targetMuscle', e.target.value)}
                    className="w-full rounded-lg bg-navy-950 border border-white/5 p-2 text-sm text-white focus:border-green-500"
                  >
                    <option value="chest">Chest</option>
                    <option value="back">Back</option>
                    <option value="shoulders">Shoulders</option>
                    <option value="legs">Legs</option>
                    <option value="arms">Arms</option>
                    <option value="core">Core</option>
                    <option value="default">Other</option>
                  </select>
                </div>
                <div className="w-24 space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Sets</label>
                  <input
                    type="number"
                    value={ex.sets}
                    onChange={e => updateManualExercise(idx, 'sets', e.target.value)}
                    className="w-full rounded-lg bg-navy-950 border border-white/5 p-2 text-sm text-white focus:border-green-500"
                  />
                </div>
                <div className="w-24 space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Reps</label>
                  <input
                    type="text"
                    value={ex.reps}
                    onChange={e => updateManualExercise(idx, 'reps', e.target.value)}
                    placeholder="8-12"
                    className="w-full rounded-lg bg-navy-950 border border-white/5 p-2 text-sm text-white focus:border-green-500"
                  />
                </div>
                <button
                  onClick={() => removeManualExercise(idx)}
                  className="p-2.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all border border-red-500/20"
                >
                  <Dumbbell className="h-4 w-4 rotate-45" />
                </button>
              </div>
            ))}
            
            <button
              onClick={addManualExercise}
              className="w-full py-3 rounded-xl border-2 border-dashed border-white/10 text-slate-400 hover:border-green-500/50 hover:text-green-400 transition-all text-xs font-bold uppercase tracking-wider"
            >
              + Add Exercise
            </button>
          </div>

          <div className="pt-4 border-t border-white/5">
            <button
              onClick={handleSaveManual}
              disabled={manualData.exercises.length === 0}
              className="w-full py-3 rounded-xl bg-green-500 text-white font-black uppercase tracking-widest hover:bg-green-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(34,197,94,0.3)]"
            >
              Save Manual Workout
            </button>
          </div>
        </div>
      ) : exercises.length === 0 ? (
        <div className="glass-panel rounded-2xl border border-white/5 p-12 text-center">
          <Dumbbell className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <p className="text-sm font-bold text-slate-400">Rest day or no workout scheduled.</p>
          <p className="text-xs text-slate-500 mt-1">Take time to recover, generate a new plan, or enter a manual workout.</p>
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
    { key: 'breakfast', label: 'Breakfast', icon: Sunrise, color: 'text-blue-400', gradient: 'from-amber-500/10 to-orange-500/10', border: 'border-blue-600/20' },
    { key: 'lunch', label: 'Lunch', icon: Sun, color: 'text-indigo-400', gradient: 'from-orange-500/10 to-red-500/10', border: 'border-indigo-600/20' },
    { key: 'dinner', label: 'Dinner', icon: Moon, color: 'text-rose-400', gradient: 'from-rose-500/10 to-purple-500/10', border: 'border-rose-500/20' }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/15 border border-indigo-600/20">
            <UtensilsCrossed className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-wider text-white uppercase">Today's Meals</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Balanced Nutrition Plan</p>
          </div>
        </div>
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="flex items-center gap-2 rounded-xl bg-indigo-600/15 border border-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
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

// ===================== PANTRY TAB =====================
const PantryTab = () => {
  const [pantry, setPantry] = useState({
    carbs: [],
    proteins: [],
    veg: [],
    fruits_fats: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [newInputs, setNewInputs] = useState({
    carbs: '', proteins: '', veg: '', fruits_fats: ''
  });

  const fetchUserPantry = useCallback(async () => {
    try {
      const res = await api.auth.getMe();
      if (res.user && res.user.pantry) {
        setPantry(res.user.pantry);
      } else {
        // Defaults
        setPantry({
          carbs: ['rice', 'ugali', 'chapati'],
          proteins: ['beans', 'eggs', 'meat', 'liver', 'milk'],
          veg: ['kales'],
          fruits_fats: ['avocado', 'oranges', 'bananas']
        });
      }
    } catch (err) {
      console.error('Failed to fetch pantry:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUserPantry(); }, [fetchUserPantry]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.auth.updateSettings({ pantry });
      // Also regenerate the meal plan automatically
      await api.life.regenerateMeal();
    } catch (err) {
      console.error('Failed to save pantry:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = (category) => {
    const item = newInputs[category].trim();
    if (item && !pantry[category].includes(item)) {
      setPantry({
        ...pantry,
        [category]: [...pantry[category], item]
      });
      setNewInputs({ ...newInputs, [category]: '' });
    }
  };

  const handleRemoveItem = (category, item) => {
    setPantry({
      ...pantry,
      [category]: pantry[category].filter(i => i !== item)
    });
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="relative h-10 w-10">
          <div className="absolute h-full w-full rounded-full border-4 border-navy-800"></div>
          <div className="absolute h-full w-full animate-spin rounded-full border-4 border-t-blue-400 border-r-transparent border-b-transparent border-l-transparent"></div>
        </div>
      </div>
    );
  }

  const PANTRY_SECTIONS = [
    { key: 'carbs', label: 'Carbohydrates', color: 'text-blue-400', bg: 'bg-blue-600/15', border: 'border-blue-600/30' },
    { key: 'proteins', label: 'Proteins', color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30' },
    { key: 'veg', label: 'Vegetables', color: 'text-green-400', bg: 'bg-green-500/15', border: 'border-green-500/30' },
    { key: 'fruits_fats', label: 'Fruits & Fats', color: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-purple-500/30' }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 border border-blue-500/20">
            <Coffee className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-wider text-white uppercase">My Pantry</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Manage your nourishment sources</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-blue-500/15 border border-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
        >
          <Check className={`h-3.5 w-3.5 ${saving ? 'animate-pulse' : ''}`} />
          {saving ? 'Saving...' : 'Save & Update Meals'}
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {PANTRY_SECTIONS.map((section) => (
          <div key={section.key} className={`glass-panel rounded-2xl border ${section.border} p-5 space-y-4`}>
            <div className="flex items-center justify-between">
              <h4 className={`text-sm font-bold uppercase tracking-widest ${section.color}`}>{section.label}</h4>
              <span className="text-xs font-bold text-white bg-white/10 px-2 py-0.5 rounded-full">{pantry[section.key].length} items</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {pantry[section.key].map(item => (
                <div key={item} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${section.bg} border ${section.border}`}>
                  <span className={`text-xs font-bold text-white`}>{item}</span>
                  <button onClick={() => handleRemoveItem(section.key, item)} className="text-white/50 hover:text-white">
                    &times;
                  </button>
                </div>
              ))}
              {pantry[section.key].length === 0 && <span className="text-xs text-slate-500 italic">No items</span>}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newInputs[section.key]}
                onChange={(e) => setNewInputs({...newInputs, [section.key]: e.target.value})}
                onKeyDown={(e) => e.key === 'Enter' && handleAddItem(section.key)}
                placeholder="Add food item..."
                className="flex-1 bg-navy-900/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30"
              />
              <button
                onClick={() => handleAddItem(section.key)}
                className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white ${section.bg} hover:brightness-125 transition-all`}
              >
                Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ===================== ROUTINE TAB =====================

const RoutineTab = () => {
  const [routine, setRoutine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loggedLectures, setLoggedLectures] = useState(new Set());
  const [loggingLecture, setLoggingLecture] = useState(null);

  const fetchTodayLogs = async () => {
    try {
      const res = await api.tracker.getTodayLogs();
      const logs = res.data || [];
      const loggedNames = new Set();
      logs.forEach(log => {
        if (log.activityType === 'lecture' && log.description) {
          loggedNames.add(log.description);
        }
      });
      setLoggedLectures(loggedNames);
    } catch (e) {
      console.error(e);
    }
  };

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

  useEffect(() => { 
    fetchRoutine(); 
    fetchTodayLogs(); 
  }, [fetchRoutine]);

  const handleLogLecture = async (item) => {
    setLoggingLecture(item.label);
    try {
      const duration = (item.endMinutes && item.minutes) ? (item.endMinutes - item.minutes) : 60;
      
      const now = new Date();
      // Calculate start time based on the routine item's expected minutes from midnight today
      const exactStartTime = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      exactStartTime.setMinutes(item.minutes);
      
      const exactEndTime = new Date(exactStartTime.getTime() + (duration * 60000));

      await api.tracker.manualLog({
        activityType: item.activityType || 'lecture',
        durationMinutes: duration,
        description: item.label,
        exactStartTime: exactStartTime.toISOString(),
        exactEndTime: exactEndTime.toISOString(),
        allowOverlap: true
      });
      setLoggedLectures(prev => new Set([...prev, item.label]));
    } catch (err) {
      console.error('Failed to log lecture:', err);
      alert(err.message || 'Failed to mark lecture as attended.');
    } finally {
      setLoggingLecture(null);
    }
  };

  const [currentTotalMinutes, setCurrentTotalMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTotalMinutes(now.getHours() * 60 + now.getMinutes());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-500/15 border border-yellow-500/20">
          <Home className="h-6 w-6 text-yellow-400" />
        </div>
        <div>
          <h3 className="text-lg font-black tracking-wider text-white uppercase">Daily Blueprint</h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Your personalized daily rhythm for balanced performance</p>
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
                    ? 'bg-cyan-500/5 border border-cyan-500/20 shadow-lg shadow-accent-gold/5'
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
                    ? 'bg-cyan-500 shadow-lg shadow-accent-gold/50'
                    : isPast
                    ? 'bg-slate-600'
                    : item.isLecture
                    ? 'bg-cyan-500 shadow-glow-cyan/50'
                    : 'bg-white/10 border border-white/20'
                }`}>
                  {isActive && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-500 opacity-40"></span>
                  )}
                </div>

                {/* Icon */}
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.bg} ${item.color}`}>
                  <Icon className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-cyan-400' : item.isLecture ? 'text-cyan-400' : 'text-slate-500'}`}>
                      {item.time}
                    </span>
                    {isActive && (
                      <span className="rounded-lg bg-cyan-500/20 border border-cyan-500/30 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-cyan-400">
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
                  
                  {/* Lecture Attendance Action */}
                  {item.isLecture && (
                    <div className="mt-3">
                      {loggedLectures.has(item.label) ? (
                        <div className="flex w-fit items-center gap-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-cyan-400">
                          <Check className="h-3.5 w-3.5" />
                          Attended & Logged
                        </div>
                      ) : (
                        <button
                          onClick={() => handleLogLecture(item)}
                          disabled={loggingLecture === item.label}
                          className="flex items-center gap-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/30 hover:bg-cyan-500 hover:text-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-cyan-400 transition-all disabled:opacity-50"
                        >
                          <Check className={`h-3.5 w-3.5 ${loggingLecture === item.label ? 'animate-pulse' : ''}`} />
                          {loggingLecture === item.label ? 'Logging...' : 'Mark Attended'}
                        </button>
                      )}
                    </div>
                  )}
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
          <h1 className="text-2xl md:text-3xl font-display font-light tracking-[0.5em] text-cyan-50 text-glow-cyan uppercase opacity-80">VITALITY HUB</h1>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mt-1">
            Fitness • Nutrition • Daily Rhythm
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
        {activeTab === 'pantry' && <PantryTab />}
        {activeTab === 'routine' && <RoutineTab />}
      </div>
    </div>
  );
};

export default Lifestyle;


