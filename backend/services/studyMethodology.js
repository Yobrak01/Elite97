// studyMethodology.js

/**
 * Suggest optimal study methods based on task type and unit attributes.
 * Borrows highly effective cognitive models.
 */

const STUDY_METHODS = {
  FEYNMAN: {
    name: 'Feynman Technique',
    description: 'Explain the concept simply as if teaching a child. Best for deep comprehension.'
  },
  POMODORO_INTENSE: {
    name: '50/10 Pomodoro',
    description: '50 mins deep work, 10 mins active recovery. Best for high-volume workload.'
  },
  ACTIVE_RECALL: {
    name: 'Active Recall & Spaced Repetition',
    description: 'Self-testing without looking at notes. Crucial for exam prep and memorization.'
  },
  INTERLEAVING: {
    name: 'Interleaved Practice',
    description: 'Mixing different topics or problem types in a single session. Best for math/engineering.'
  },
  BLURTING: {
    name: 'Blurting Method',
    description: 'Write down everything you know on a blank page, then check notes. Best for quick review.'
  },
  PROCEDURAL_CHUNKING: {
    name: 'Procedural Chunking',
    description: 'Break complex problems into smaller step-by-step algorithms. Best for coding/assignments.'
  }
};

function suggestStudyMethod(taskType, courseDifficulty) {
  if (taskType === 'theory') {
    if (courseDifficulty >= 4) return STUDY_METHODS.FEYNMAN;
    return STUDY_METHODS.BLURTING;
  }
  
  if (taskType === 'procedural' || taskType === 'project') {
    return STUDY_METHODS.PROCEDURAL_CHUNKING;
  }
  
  if (taskType === 'revision') {
    return STUDY_METHODS.ACTIVE_RECALL;
  }
  
  if (taskType === 'assignment') {
    if (courseDifficulty >= 4) return STUDY_METHODS.INTERLEAVING;
    return STUDY_METHODS.POMODORO_INTENSE;
  }

  return STUDY_METHODS.POMODORO_INTENSE;
}

/**
 * Automatically predict course difficulty out of 5 based on keyword analysis of the unit name.
 * FALLBACK ONLY — Used when Gemini AI is unavailable.
 */
function predictCourseDifficultyFallback(unitName) {
  if (!unitName) return 3;
  const name = unitName.toLowerCase();
  
  // Difficulty 5: Heavy STEM / Abstract Math
  if (name.match(/(calculus|thermodynamics|mechanics|fluid|electromagnetics|quantum|structures|advanced math|differential|machine learning|artificial intelligence)/)) {
    return 5;
  }
  // Difficulty 4: Applied Sciences / Complex Logic
  if (name.match(/(physics|chemistry|programming|algorithms|data structures|materials|kinematics|electronics|statistics|networking)/)) {
    return 4;
  }
  // Difficulty 2: Soft Skills / General
  if (name.match(/(communication|ethics|society|intro to|basics of|workshop|seminar|writing)/)) {
    return 2;
  }
  // Difficulty 3: Standard Business / Humanities / Default
  return 3;
}

/**
 * Automatically predict course credits out of 4 based on keyword analysis of the unit name.
 * FALLBACK ONLY — Used when Gemini AI is unavailable.
 */
function predictCourseCreditsFallback(unitName) {
  if (!unitName) return 3;
  const name = unitName.toLowerCase();
  
  // 1-2 Credits: Labs, Workshops, Practicals, Seminar, Basic Soft Skills
  if (name.match(/(lab|laboratory|workshop|practical|seminar|attachment|project|ethics|communication skills|hiv|development studies)/)) {
    return 2;
  }
  
  // 4 Credits: Heavy Math / Core Engineering / Abstract Sciences
  if (name.match(/(calculus|thermodynamics|mechanics|fluid|electromagnetics|quantum|structures|engineering mathematics|machine learning|artificial intelligence)/)) {
    return 4;
  }
  
  // 3 Credits: Default / Standard / Applied
  return 3;
}

const { GoogleGenAI } = require('@google/genai');

/**
 * AI-Powered Course Unit Research & Classification.
 * Uses Gemini to deeply research the course unit based on academic consensus
 * from institutions like MIT, Harvard, Stanford, and popular engineering programs.
 * 
 * @param {string} unitName - The full name of the course unit (e.g., "Engineering Mathematics II")
 * @param {string} unitCode - The course code (e.g., "ENG201")
 * @returns {Object} { difficulty, credits, tier, reasoning }
 */
async function aiResearchCourseUnit(unitName, unitCode = '') {
  // Fallback values from regex heuristic
  const fallbackDifficulty = predictCourseDifficultyFallback(unitName);
  const fallbackCredits = predictCourseCreditsFallback(unitName);

  if (!process.env.GEMINI_API_KEY) {
    console.warn('[aiResearchCourseUnit] No GEMINI_API_KEY — using regex fallback.');
    return {
      difficulty: fallbackDifficulty,
      credits: fallbackCredits,
      tier: null, // Let the controller compute from difficulty + credits
      reasoning: 'Fallback heuristic (no AI key configured)'
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `You are an elite academic analyst specializing in university course classification.

TASK: Research and classify this university course unit with precision.

COURSE:
- Unit Name: "${unitName}"
- Unit Code: "${unitCode || 'Not specified'}"

INSTRUCTIONS:
1. RESEARCH this exact course topic thoroughly. Consider how this subject is taught and evaluated at top-tier institutions (MIT OpenCourseWare, Harvard, Stanford, Carnegie Mellon, Oxford, etc.).
2. Consider the ACTUAL academic rigor of this subject: mathematical depth, conceptual complexity, lab/practical requirements, typical failure rates, prerequisite chains, and cognitive load.
3. Assess difficulty based on POPULAR CONSENSUS among engineering and science students worldwide — not just keyword matching.
4. Consider the unit code prefix for context (e.g., ENG = Engineering, MAT = Mathematics, PHY = Physics, CSC = Computer Science, HUM = Humanities).

CLASSIFICATION CRITERIA:

DIFFICULTY (1-5):
- 5 = Extremely Challenging: Courses known to have high failure/withdrawal rates (e.g., Thermodynamics II, Quantum Mechanics, Advanced Calculus, Electromagnetic Theory, Compiler Design, Real Analysis). Requires deep mathematical reasoning or abstract thinking.
- 4 = Hard: Courses requiring significant effort and strong prerequisites (e.g., Data Structures & Algorithms, Organic Chemistry, Circuit Analysis, Differential Equations, Fluid Mechanics).
- 3 = Moderate: Standard core courses with manageable difficulty (e.g., Introduction to Programming, Technical Writing, Engineering Drawing, Linear Algebra, General Physics I).
- 2 = Manageable: Courses that most students handle comfortably (e.g., Communication Skills, Introduction to Business, Environmental Science, Development Studies).
- 1 = Light: Minimal academic intensity (e.g., University Life Skills, HIV/AIDS Awareness, Physical Education, Workshop Practice).

CREDITS (1-4):
- 4 = Heavy lecture + tutorial + lab load (typically 4+ contact hours/week)
- 3 = Standard lecture-based course (typically 3 contact hours/week)
- 2 = Lighter courses, labs, practicals, or seminars
- 1 = Minimal contact hour courses

TIER ASSIGNMENT (based on how critical this course is to an engineering student's academic success):
- "tier1_critical" = Core gatekeeping course. Failing this derails the entire degree. High credit weight, high difficulty, heavy prerequisite for future courses.
- "tier2_high" = Important course requiring significant focus. Usually a core course but slightly less gatekeeping than tier 1.
- "tier3_standard" = Standard course. Important but manageable with consistent effort.
- "tier4_low" = Lower-priority course. Usually electives or general education requirements.
- "tier5_minimal" = Minimal impact course. Typically pass/fail or very low-stakes.

Return ONLY a valid JSON object with this exact structure:
{
  "difficulty": <number 1-5>,
  "credits": <number 1-4>,
  "tier": "<tier1_critical|tier2_high|tier3_standard|tier4_low|tier5_minimal>",
  "reasoning": "<A concise 2-sentence explanation of WHY you assigned this tier and difficulty, referencing how this subject is perceived at top institutions.>"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    const match = response.text.match(/\{[\s\S]*\}/);
    let text = match ? match[0] : response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(text);

    // Validate the response
    const difficulty = Math.min(5, Math.max(1, Math.round(Number(result.difficulty) || fallbackDifficulty)));
    const credits = Math.min(4, Math.max(1, Math.round(Number(result.credits) || fallbackCredits)));
    const validTiers = ['tier1_critical', 'tier2_high', 'tier3_standard', 'tier4_low', 'tier5_minimal'];
    const tier = validTiers.includes(result.tier) ? result.tier : null;

    console.log(`[aiResearchCourseUnit] "${unitName}" → Difficulty: ${difficulty}, Credits: ${credits}, Tier: ${tier}, Reasoning: ${result.reasoning || 'N/A'}`);

    return {
      difficulty,
      credits,
      tier,
      reasoning: result.reasoning || 'AI classification complete.'
    };

  } catch (error) {
    console.error('[aiResearchCourseUnit] Gemini research failed:', error.message);
    return {
      difficulty: fallbackDifficulty,
      credits: fallbackCredits,
      tier: null,
      reasoning: 'AI research failed — using fallback heuristic.'
    };
  }
}

// Legacy synchronous wrappers (still exported for backward compatibility)
function predictCourseDifficulty(unitName) {
  return predictCourseDifficultyFallback(unitName);
}
function predictCourseCredits(unitName) {
  return predictCourseCreditsFallback(unitName);
}

module.exports = {
  STUDY_METHODS,
  suggestStudyMethod,
  predictCourseDifficulty,
  predictCourseCredits,
  aiResearchCourseUnit
};
