import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const QUESTIONS = [
  { id: 1, pillar: 'Priming', text: 'Before a lecture, do you scan the material to build a mental map?' },
  { id: 2, pillar: 'Priming', text: 'Do you try to predict what the topic will be about before diving in?' },
  { id: 3, pillar: 'Encoding', text: 'Do you break down complex concepts into simpler terms and analogies?' },
  { id: 4, pillar: 'Encoding', text: 'Do you focus on understanding the "why" rather than just memorizing the "what"?' },
  { id: 5, pillar: 'Reference', text: 'Do you organize your notes so you can find information quickly?' },
  { id: 6, pillar: 'Reference', text: 'Are your study materials centralized and easily accessible?' },
  { id: 7, pillar: 'Retrieval', text: 'Do you test yourself without looking at the material?' },
  { id: 8, pillar: 'Retrieval', text: 'Do you use flashcards or practice tests to actively recall information?' },
  { id: 9, pillar: 'Interleaving', text: 'Do you mix different topics or subjects during a single study session?' },
  { id: 10, pillar: 'Interleaving', text: 'Do you avoid studying the exact same concept for hours on end?' },
  { id: 11, pillar: 'Overlearning', text: 'Do you continue to practice a skill even after you\'ve mastered it?' },
  { id: 12, pillar: 'Overlearning', text: 'Do you review older material periodically to ensure it stays fresh?' }
];

const OPTIONS = [
  { label: 'Yes', value: 10 },
  { label: 'Sometimes', value: 5 },
  { label: 'No', value: 0 }
];

export const Diagnostic = () => {
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSelect = (value) => {
    setAnswers(prev => ({ ...prev, [currentQuestion]: value }));
    if (currentQuestion < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQuestion(prev => prev + 1), 300);
    }
  };

  const calculateResults = () => {
    const scores = {
      Priming: 0,
      Encoding: 0,
      Reference: 0,
      Retrieval: 0,
      Interleaving: 0,
      Overlearning: 0
    };

    QUESTIONS.forEach((q, index) => {
      const answerVal = answers[index] || 0;
      scores[q.pillar] += answerVal;
    });

    // Scale to 100
    let totalScore = 0;
    Object.keys(scores).forEach(key => {
      scores[key] *= 5; // 20 max * 5 = 100
      totalScore += scores[key];
    });

    const average = totalScore / 6;
    let tier = 'Novice';
    if (average >= 90) tier = 'Elite';
    else if (average >= 70) tier = 'Advanced';
    else if (average >= 40) tier = 'Intermediate';

    return { scores, average, tier };
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const results = calculateResults();
    try {
      const res = await api.auth.updateSettings({ studyGauge: results });
      // Update local context
      updateUser({ ...user, studyGauge: results, settings: res.settings || user.settings });
      navigate('/analytics');
    } catch (err) {
      console.error(err);
      alert('Failed to submit diagnostic. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLastQuestion = currentQuestion === QUESTIONS.length - 1;
  const q = QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-[#0f172a] rounded-2xl p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-amber-500/10 blur-[100px] pointer-events-none"></div>

        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500 mb-2 text-center">
          Diagnostic Assessment
        </h1>
        <p className="text-slate-400 text-center mb-8">
          Let's calibrate your learning systems. Answer honestly to get accurate recommendations.
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 rounded-full h-2 mb-8 overflow-hidden">
          <div 
            className="bg-amber-500 h-2 rounded-full transition-all duration-500" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Question Area */}
        <div className="mb-10 min-h-[120px] flex items-center justify-center">
          <h2 className="text-2xl font-semibold text-center leading-relaxed">
            {q.text}
          </h2>
        </div>

        {/* Options */}
        <div className="space-y-4">
          {OPTIONS.map(opt => (
            <button
              key={opt.label}
              onClick={() => handleSelect(opt.value)}
              className={`w-full p-4 rounded-xl border text-left text-lg font-medium transition-all duration-200 ${
                answers[currentQuestion] === opt.value
                  ? 'bg-amber-500/20 border-amber-500 text-cyan-300'
                  : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-500'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-between items-center">
          <button
            disabled={currentQuestion === 0}
            onClick={() => setCurrentQuestion(prev => prev - 1)}
            className="px-6 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Previous
          </button>
          
          {isLastQuestion && answers[currentQuestion] !== undefined && (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-3 bg-gradient-to-r from-amber-500 to-blue-600 hover:from-amber-400 hover:to-yellow-500 text-white rounded-xl font-bold shadow-lg shadow-amber-500/25 transition-all disabled:opacity-75"
            >
              {isSubmitting ? 'Analyzing...' : 'Submit & Analyze'}
            </button>
          )}
        </div>
        
        <div className="mt-4 text-center text-sm text-slate-500">
          Question {currentQuestion + 1} of {QUESTIONS.length}
        </div>
      </div>
    </div>
  );
};

export default Diagnostic;
