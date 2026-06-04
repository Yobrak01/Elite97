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
 */
function predictCourseDifficulty(unitName) {
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
 */
function predictCourseCredits(unitName) {
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

module.exports = {
  STUDY_METHODS,
  suggestStudyMethod,
  predictCourseDifficulty,
  predictCourseCredits
};
