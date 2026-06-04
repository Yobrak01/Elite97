// gpaPredictor.js

/**
 * Calculate expected GPA based on course difficulty, credits, and completion rate.
 * Assumes a 4.0 scale by default.
 */
function predictCurrentSemesterGpa(courseUnits, tasks) {
  if (!courseUnits || courseUnits.length === 0) return 0;

  let totalCredits = 0;
  let totalGradePoints = 0;

  courseUnits.forEach(course => {
    // Find tasks for this course. 
    // In a real scenario, tasks would be linked via a courseId. We'll simulate by checking if task belongs to course topics.
    // For this simulation, we'll assign a base expected grade depending on difficulty, then adjust by task completion.
    
    // Base grade out of 4.0 (easier = higher base)
    let expectedGrade = 4.0 - ((course.difficulty - 1) * 0.4); 

    // Simulate task completion adjustment (simplified)
    // If the user has high completion rate, grade approaches 4.0
    const courseTasks = tasks.filter(t => t.title.includes(course.unitCode) || (t.description && t.description.includes(course.unitCode)));
    
    if (courseTasks.length > 0) {
      const completed = courseTasks.filter(t => t.status === 'completed').length;
      const completionRate = completed / courseTasks.length;
      expectedGrade = expectedGrade * 0.5 + (4.0 * completionRate * 0.5); // 50% base difficulty, 50% effort
    } else {
      expectedGrade -= 0.5; // Penalty for no tasks registered for this course
    }

    // Bound between 0 and 4.0
    expectedGrade = Math.max(0, Math.min(4.0, expectedGrade));

    totalCredits += course.credits;
    totalGradePoints += expectedGrade * course.credits;
  });

  if (totalCredits === 0) return 0;
  return Number((totalGradePoints / totalCredits).toFixed(2));
}

/**
 * Calculate cumulative GPA including past results
 */
function calculateCumulativeGpa(pastResults, currentSemesterPredictedGpa, currentSemesterCredits) {
  let totalCredits = currentSemesterCredits || 0;
  let totalGradePoints = (currentSemesterPredictedGpa * currentSemesterCredits) || 0;

  if (pastResults && pastResults.length > 0) {
    pastResults.forEach(result => {
      // Assuming each past semester was 15 credits average for simplification if not provided
      const pastCredits = 15; 
      totalCredits += pastCredits;
      totalGradePoints += result.gpa * pastCredits;
    });
  }

  if (totalCredits === 0) return 0;
  return Number((totalGradePoints / totalCredits).toFixed(2));
}

module.exports = {
  predictCurrentSemesterGpa,
  calculateCumulativeGpa
};
