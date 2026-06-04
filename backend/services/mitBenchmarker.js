// mitBenchmarker.js

/**
 * Calculates a global rank percentile against a simulated top 100 MIT Engineering cohort.
 * Metrics for the top MIT engineering student baseline:
 * - Weekly Study Hours: 50
 * - Average Focus Score: 85
 * - Completion Percentage: 95
 * - Productivity Score: 90
 */

const MIT_BASELINE = {
  maxStudyHours: 50,
  maxFocusScore: 90,
  maxCompletion: 95,
  maxProductivity: 90
};

function calculateMitPercentile(weeklyStudyHours, avgFocusScore, avgCompletion, avgProductivity) {
  // Score individual vectors (0 to 100 max points per vector)
  const hoursScore = Math.min(100, (weeklyStudyHours / MIT_BASELINE.maxStudyHours) * 100);
  const focusScore = Math.min(100, (avgFocusScore / MIT_BASELINE.maxFocusScore) * 100);
  const completionScore = Math.min(100, (avgCompletion / MIT_BASELINE.maxCompletion) * 100);
  const prodScore = Math.min(100, (avgProductivity / MIT_BASELINE.maxProductivity) * 100);

  // Composite user performance index
  const compositeScore = (hoursScore * 0.4) + (focusScore * 0.3) + (prodScore * 0.2) + (completionScore * 0.1);

  // Convert composite score to a global percentile among elite peers
  // If compositeScore is 100, you are 99th percentile
  // We use a slight curve so standard effort maps to lower percentiles
  
  let percentile = 0;
  if (compositeScore < 40) {
    percentile = (compositeScore / 40) * 20; // Bottom 20%
  } else if (compositeScore < 70) {
    percentile = 20 + ((compositeScore - 40) / 30) * 40; // 20th to 60th %
  } else if (compositeScore < 90) {
    percentile = 60 + ((compositeScore - 70) / 20) * 30; // 60th to 90th %
  } else {
    percentile = 90 + ((compositeScore - 90) / 10) * 9.9; // 90th to 99.9th %
  }

  return Number(percentile.toFixed(1));
}

module.exports = {
  calculateMitPercentile,
  MIT_BASELINE
};
