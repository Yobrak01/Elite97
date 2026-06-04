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

module.exports = {
  STUDY_METHODS,
  suggestStudyMethod
};
