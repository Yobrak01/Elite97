import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const ALL_QUESTIONS = [
  // Priming
  { id: 1, pillar: 'Priming', text: 'Before a lecture, do you scan the material to build a mental map?' },
  { id: 2, pillar: 'Priming', text: 'Do you try to predict what the topic will be about before diving in?' },
  { id: 3, pillar: 'Priming', text: 'Do you review the syllabus or module outline before starting a new chapter?' },
  { id: 4, pillar: 'Priming', text: 'Do you formulate questions about a subject before reading the textbook?' },
  { id: 5, pillar: 'Priming', text: 'Do you look at headings, summaries, and bold terms before reading deeply?' },
  { id: 6, pillar: 'Priming', text: 'Do you try to recall what you already know about a topic before learning new details?' },
  // Encoding
  { id: 7, pillar: 'Encoding', text: 'Do you break down complex concepts into simpler terms and analogies?' },
  { id: 8, pillar: 'Encoding', text: 'Do you focus on understanding the "why" rather than just memorizing the "what"?' },
  { id: 9, pillar: 'Encoding', text: 'Do you try to explain what you just learned to an imaginary person (Feynman technique)?' },
  { id: 10, pillar: 'Encoding', text: 'Do you create visual mind maps or diagrams to connect concepts?' },
  { id: 11, pillar: 'Encoding', text: 'Do you relate new information to things you are already interested in?' },
  { id: 12, pillar: 'Encoding', text: 'Do you summarize paragraphs in your own words instead of just highlighting?' },
  // Reference
  { id: 13, pillar: 'Reference', text: 'Do you organize your notes so you can find information quickly?' },
  { id: 14, pillar: 'Reference', text: 'Are your study materials centralized and easily accessible?' },
  { id: 15, pillar: 'Reference', text: 'Do you maintain an index or table of contents for your study folders?' },
  { id: 16, pillar: 'Reference', text: 'Do you clearly label lecture slides with dates and topics?' },
  { id: 17, pillar: 'Reference', text: 'Do you digitize physical handouts to ensure they are never lost?' },
  { id: 18, pillar: 'Reference', text: 'Do you have a consistent naming convention for your computer files?' },
  // Retrieval
  { id: 19, pillar: 'Retrieval', text: 'Do you test yourself without looking at the material?' },
  { id: 20, pillar: 'Retrieval', text: 'Do you use flashcards or practice tests to actively recall information?' },
  { id: 21, pillar: 'Retrieval', text: 'Do you close your book and try to write down everything you remember?' },
  { id: 22, pillar: 'Retrieval', text: 'Do you do practice exams under timed, realistic conditions?' },
  { id: 23, pillar: 'Retrieval', text: 'Do you try to solve a problem before looking at the provided solution?' },
  { id: 24, pillar: 'Retrieval', text: 'Do you prioritize doing practice problems over re-reading notes?' },
  // Interleaving
  { id: 25, pillar: 'Interleaving', text: 'Do you mix different topics or subjects during a single study session?' },
  { id: 26, pillar: 'Interleaving', text: 'Do you avoid studying the exact same concept for hours on end?' },
  { id: 27, pillar: 'Interleaving', text: 'Do you switch between different types of math problems instead of doing one type in a block?' },
  { id: 28, pillar: 'Interleaving', text: 'Do you review previous weeks\' material alongside the current week\'s material?' },
  { id: 29, pillar: 'Interleaving', text: 'Do you consciously break up your study sessions into multiple different subjects?' },
  { id: 30, pillar: 'Interleaving', text: 'Do you try to find connections between two entirely different classes?' },
  // Overlearning
  { id: 31, pillar: 'Overlearning', text: 'Do you continue to practice a skill even after you\'ve mastered it?' },
  { id: 32, pillar: 'Overlearning', text: 'Do you review older material periodically to ensure it stays fresh?' },
  { id: 33, pillar: 'Overlearning', text: 'Do you aim to be able to solve a problem faster, not just correctly?' },
  { id: 34, pillar: 'Overlearning', text: 'Do you drill core formulas until they are completely second nature?' },
  { id: 35, pillar: 'Overlearning', text: 'Do you over-prepare for exams just to eliminate testing anxiety?' },
  { id: 36, pillar: 'Overlearning', text: 'Do you occasionally revisit fundamentals from previous semesters?' }
];

const OPTIONS = [
  { label: 'Yes', value: 10 },
  { label: 'Sometimes', value: 5 },
  { label: 'No', value: 0 }
];

export const Diagnostic = () => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Pick 3 random questions per pillar on mount
    const pillars = ['Priming', 'Encoding', 'Reference', 'Retrieval', 'Interleaving', 'Overlearning'];
    let selected = [];
    
    pillars.forEach(p => {
      const pQs = ALL_QUESTIONS.filter(q => q.pillar === p);
      // Shuffle
      const shuffled = [...pQs].sort(() => 0.5 - Math.random());
      selected = [...selected, ...shuffled.slice(0, 3)];
    });
    
    // Shuffle the final list so pillars are mixed
    selected.sort(() => 0.5 - Math.random());
    setQuestions(selected);
  }, []);

  const handleSelect = (value) => {
    setAnswers(prev => ({ ...prev, [currentQuestion]: value }));
    if (currentQuestion < questions.length - 1) {
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

    questions.forEach((q, index) => {
      const answerVal = answers[index] || 0;
      scores[q.pillar] += answerVal;
    });

    // Scale to 100. Max per pillar is 3 questions * 10 = 30. (30 / 30) * 100
    let totalScore = 0;
    Object.keys(scores).forEach(key => {
      scores[key] = Math.round((scores[key] / 30) * 100); 
      totalScore += scores[key];
    });

    const average = Math.round(totalScore / 6);
    let tier = 'Novice';
    if (average >= 90) tier = 'Elite';
    else if (average >= 70) tier = 'Advanced';
    else if (average >= 40) tier = 'Intermediate';

    return { scores, average, tier };
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const results = calculateResults();
    
    // Map to Mongoose schema exact fields
    const payload = {
      priming: results.scores.Priming,
      encoding: results.scores.Encoding,
      reference: results.scores.Reference,
      retrieval: results.scores.Retrieval,
      interleaving: results.scores.Interleaving,
      overlearning: results.scores.Overlearning,
      tier: results.tier
    };

    try {
      const res = await api.auth.updateSettings({ studyGauge: payload });
      if (res?.user) {
        updateUser(res.user);
      }
      navigate('/analytics');
    } catch (err) {
      console.error(err);
      alert('Failed to submit diagnostic. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (questions.length === 0) return null;

  const isLastQuestion = currentQuestion === questions.length - 1;
  const q = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

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
          Question {currentQuestion + 1} of {questions.length}
        </div>
      </div>
    </div>
  );
};

export default Diagnostic;
