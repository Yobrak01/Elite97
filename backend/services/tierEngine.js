function computeAiTier(task, courseTier = null) {
  // task = { title, priority, estimatedHours, type, deadline, ... }
  let score = 0;

  // Base priority score
  score += task.priority * 10; // priority 1-5 -> 10-50

  // Type modifier
  if (task.type === 'assignment' || task.type === 'project') score += 15;
  if (task.type === 'theory' || task.type === 'procedural') score += 10;
  if (task.type === 'revision') score += 5;

  // Course Tier Synchronization
  if (courseTier) {
    if (courseTier === 'tier1_critical') score += 25;
    else if (courseTier === 'tier2_high') score += 15;
    else if (courseTier === 'tier3_standard') score += 5;
    else if (courseTier === 'tier4_low') score -= 5;
    else if (courseTier === 'tier5_minimal') score -= 10;
  }

  // Deadline modifier
  if (task.deadline) {
    const daysUntilDeadline = (new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24);
    if (daysUntilDeadline < 0) score += 30; // Overdue
    else if (daysUntilDeadline <= 1) score += 25; // Due today/tomorrow
    else if (daysUntilDeadline <= 3) score += 15;
    else if (daysUntilDeadline <= 7) score += 5;
  }

  // Estimated hours modifier
  if (task.estimatedHours > 4) score += 10;
  else if (task.estimatedHours >= 2) score += 5;

  let tier = 'tier3_standard';
  if (score >= 80) tier = 'tier1_critical';
  else if (score >= 60) tier = 'tier2_high';
  else if (score >= 40) tier = 'tier3_standard';
  else if (score >= 20) tier = 'tier4_low';
  else tier = 'tier5_minimal';

  return { tier, score };
}

module.exports = { computeAiTier };
