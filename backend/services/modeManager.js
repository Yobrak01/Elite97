function getModeConfig(studyMode) {
  const configs = {
    normal: {
      maxStudyHours: 8,
      breakEvery: 25,
      breakDuration: 5,
      revisionIntensity: 'moderate',
      workloadLevel: 'normal',
      description: 'Standard balanced study cycles with optimized resting patterns.'
    },
    cat_prep: {
      maxStudyHours: 10,
      breakEvery: 30,
      breakDuration: 5,
      revisionIntensity: 'high',
      workloadLevel: 'intense',
      description: 'Continuous Assessment Test prep focus. Expanded work blocks, target core formulas.'
    },
    exam_prep: {
      maxStudyHours: 12,
      breakEvery: 25,
      breakDuration: 10,
      revisionIntensity: 'very_high',
      workloadLevel: 'maximum',
      description: 'Pre-exam marathon state. Balanced high blocks with extended cognitive decompression breaks.'
    },
    recovery: {
      maxStudyHours: 4,
      breakEvery: 20,
      breakDuration: 10,
      revisionIntensity: 'light',
      workloadLevel: 'minimal',
      description: 'Cognitive rest condition. Focus on active restoration, sleep hygiene, and zero pressure.'
    },
    unexpected_event: {
      maxStudyHours: 3,
      breakEvery: 15,
      breakDuration: 10,
      revisionIntensity: 'light',
      workloadLevel: 'minimal',
      description: 'System interruption. Adapt schedule, micro-dose study, focus on essential maintenance.'
    }
  };

  return configs[studyMode] || configs.normal;
}

function getModeRecommendations(studyMode) {
  const recommendations = {
    normal: [
      'Maintain standard 6-8 daily hours.',
      'Ensure daily outdoor activity/gym block is executed.',
      'Stick to 25/5 pomodoro intervals.'
    ],
    cat_prep: [
      'Highlight assignment milestones.',
      'Conduct daily active recall formula runs.',
      'Increase hydration to preserve cognitive clarity during longer blocks.'
    ],
    exam_prep: [
      'Optimize sleep schedule: sleep at identical daily hours.',
      'Focus 80% on mock/past question procedural execution.',
      'De-escalate distractions: Full physical phone isolation.'
    ],
    recovery: [
      'Target maximum 4 hours total screen time.',
      'Practice non-sleep deep rest (NSDR).',
      'Hydrate with electrolytes and eat premium high-density meals.'
    ],
    unexpected_event: [
      'Run a micro-schedule: complete one high-priority task, then defer remainder.',
      'Preserve streak with a single 30-minute high-focus slot.',
      'Do not stress about deferred targets.'
    ]
  };

  return recommendations[studyMode] || recommendations.normal;
}

module.exports = {
  getModeConfig,
  getModeRecommendations
};
