function getClassification(mark) {
  if (mark >= 70) return 'First Class Honours';
  if (mark >= 60) return 'Second Class Upper';
  if (mark >= 50) return 'Second Class Lower';
  if (mark >= 40) return 'Pass';
  return 'Fail';
}

function predictCurrentSemesterMark(courseUnits, tasks) {
  if (!courseUnits || courseUnits.length === 0) return 0;

  let totalCredits = 0;
  let totalMarks = 0;

  courseUnits.forEach(course => {
    // Base mark (D1=85, D3=75, D5=65)
    let baseMark = 75 - ((course.difficulty - 3) * 5); 

    const courseTasks = tasks.filter(t => t.title.includes(course.unitCode) || (t.description && t.description.includes(course.unitCode)));
    
    if (courseTasks.length > 0) {
      const completed = courseTasks.filter(t => t.status === 'completed').length;
      const completionRate = completed / courseTasks.length;
      baseMark += (completionRate * 30 - 15); // ranges from -15 to +15
    } else {
      baseMark -= 10; // Penalty for no tasks
    }

    let expectedMark = Math.max(0, Math.min(100, baseMark));

    totalCredits += course.credits;
    totalMarks += expectedMark * course.credits;
  });

  if (totalCredits === 0) return 0;
  return Number((totalMarks / totalCredits).toFixed(2));
}

function calculateHonoursScore(pastResults, currentSemesterPredictedMark, currentSemesterYear) {
  const weightings = { 1: 0.15, 2: 0.15, 3: 0.20, 4: 0.25, 5: 0.25 };
  let weightedSum = 0;
  let totalWeight = 0;

  const yearlyMarks = {};
  if (pastResults && pastResults.length > 0) {
    pastResults.forEach(r => {
      if (!yearlyMarks[r.year]) yearlyMarks[r.year] = { sum: 0, count: 0, override: false };
      
      // If the user specifically logged an entire year mark, it overrides individual semesters
      if (r.type === 'year') {
        yearlyMarks[r.year].sum = r.mark || r.gpa || 0;
        yearlyMarks[r.year].count = 1;
        yearlyMarks[r.year].override = true;
      } else if (!yearlyMarks[r.year].override) {
        yearlyMarks[r.year].sum += r.mark || r.gpa || 0;
        yearlyMarks[r.year].count += 1;
      }
    });
  }

  // Only include the current semester in the projection if there is an actual predicted mark (active courses exist)
  if (currentSemesterYear && currentSemesterPredictedMark > 0) {
    if (!yearlyMarks[currentSemesterYear]) yearlyMarks[currentSemesterYear] = { sum: 0, count: 0, override: false };
    if (!yearlyMarks[currentSemesterYear].override) {
      yearlyMarks[currentSemesterYear].sum += currentSemesterPredictedMark;
      yearlyMarks[currentSemesterYear].count += 1;
    }
  }

  Object.keys(yearlyMarks).forEach(year => {
    const y = Number(year);
    if (weightings[y]) {
      const avgMark = yearlyMarks[y].sum / yearlyMarks[y].count;
      weightedSum += avgMark * weightings[y];
      totalWeight += weightings[y];
    }
  });

  if (totalWeight === 0) return 0;
  
  // Extrapolate to 100% based on years completed
  const projectedScore = weightedSum / totalWeight;
  return Number(projectedScore.toFixed(2));
}

module.exports = {
  predictCurrentSemesterMark,
  calculateHonoursScore,
  getClassification
};
