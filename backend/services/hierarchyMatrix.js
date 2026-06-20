// hierarchyMatrix.js

const { MIT_BASELINE } = require('./mitBenchmarker');

// Pseudorandom number generator with seed
function mulberry32(a) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

// Generate a random number from a normal distribution
function randomNormal(rng, mean, stdDev) {
  let u = 0, v = 0;
  while(u === 0) u = rng(); // Converting [0,1) to (0,1)
  while(v === 0) v = rng();
  let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return num * stdDev + mean;
}

const ALIAS_PREFIXES = [
  'Phantom', 'Alpha', 'Ghost', 'Spectre', 'Null', 'Void', 'Cipher', 
  'Apex', 'Echo', 'Neon', 'DeKUT', 'MIT', 'Stanford', 'Oxford',
  'Omega', 'Zenith', 'Titan', 'Vanguard', 'Rogue', 'Onyx'
];

const ALIAS_SUFFIXES = [
  'Protocol', 'Prime', '99', 'Actual', 'X', 'Zero', 'Matrix',
  'Code', 'Mind', 'Overdrive', 'Elite', 'Engine', 'Unit', 'Node'
];

function generateAlias(rng) {
  const prefix = ALIAS_PREFIXES[Math.floor(rng() * ALIAS_PREFIXES.length)];
  const suffix = ALIAS_SUFFIXES[Math.floor(rng() * ALIAS_SUFFIXES.length)];
  const number = Math.floor(rng() * 999);
  
  if (rng() > 0.5) {
    return `${prefix}-${suffix}`;
  } else {
    return `${prefix}_${number}`;
  }
}

const { getLocalDateString } = require('../utils/dateUtils');

/**
 * Generates the live leaderboard matrix.
 * @param {Object} currentUserStats - The real user's actual stats to inject into the matrix.
 */
function generateMatrix(currentUserStats, realPeers = []) {
  // Use today's date string as the seed so the matrix is stable per day, but shifts daily.
  const todayStr = getLocalDateString(currentUserStats.timezone || 'UTC');
  let seed = 0;
  for (let i = 0; i < todayStr.length; i++) {
    seed += todayStr.charCodeAt(i);
  }
  const rng = mulberry32(seed);

  const rivals = [];
  
  // Decide how many simulated rivals to generate. 
  // We want a robust matrix of ~100 people total.
  const simulatedCount = Math.max(0, 99 - realPeers.length);

  for (let i = 0; i < simulatedCount; i++) {
    const isTopTier = i < 20;
    
    const studyHoursMean = isTopTier ? 45 : 30;
    const focusScoreMean = isTopTier ? 85 : 65;
    const completionMean = isTopTier ? 92 : 70;
    const prodScoreMean = isTopTier ? 88 : 65;

    let weeklyStudyHours = randomNormal(rng, studyHoursMean, 8);
    let avgFocusScore = randomNormal(rng, focusScoreMean, 10);
    let avgCompletion = randomNormal(rng, completionMean, 15);
    let avgProductivity = randomNormal(rng, prodScoreMean, 15);

    weeklyStudyHours = Math.max(0, Math.min(100, weeklyStudyHours));
    avgFocusScore = Math.max(0, Math.min(100, avgFocusScore));
    avgCompletion = Math.max(0, Math.min(100, avgCompletion));
    avgProductivity = Math.max(0, Math.min(100, avgProductivity));

    const hoursScore = Math.min(100, (weeklyStudyHours / MIT_BASELINE.maxStudyHours) * 100);
    const fScore = Math.min(100, (avgFocusScore / MIT_BASELINE.maxFocusScore) * 100);
    const cScore = Math.min(100, (avgCompletion / MIT_BASELINE.maxCompletion) * 100);
    const pScore = Math.min(100, (avgProductivity / MIT_BASELINE.maxProductivity) * 100);

    const compositeScore = (hoursScore * 0.4) + (fScore * 0.3) + (pScore * 0.2) + (cScore * 0.1);
    
    const trendValue = rng();
    let trend = 'stable';
    if (trendValue > 0.66) trend = 'up';
    else if (trendValue < 0.33) trend = 'down';

    rivals.push({
      id: `sim_${i}`,
      alias: generateAlias(rng),
      isUser: false,
      weeklyStudyHours: Number(weeklyStudyHours.toFixed(1)),
      avgFocusScore: Number(avgFocusScore.toFixed(0)),
      compositeScore: Number(compositeScore.toFixed(2)),
      trend
    });
  }

  // Inject the real peers
  realPeers.forEach(peer => {
    const hoursScore = Math.min(100, ((peer.weeklyStudyHours || 0) / MIT_BASELINE.maxStudyHours) * 100);
    const fScore = Math.min(100, ((peer.avgFocusScore || 0) / MIT_BASELINE.maxFocusScore) * 100);
    const cScore = Math.min(100, ((peer.avgCompletion || 0) / MIT_BASELINE.maxCompletion) * 100);
    const pScore = Math.min(100, ((peer.avgProductivity || 0) / MIT_BASELINE.maxProductivity) * 100);
    
    const compositeScore = (hoursScore * 0.4) + (fScore * 0.3) + (pScore * 0.2) + (cScore * 0.1);

    rivals.push({
      id: peer.id,
      alias: peer.alias || 'Peer',
      isUser: false, // Don't highlight them in UI as the current user
      isRealPeer: true,
      weeklyStudyHours: Number((peer.weeklyStudyHours || 0).toFixed(1)),
      avgFocusScore: Number((peer.avgFocusScore || 0).toFixed(0)),
      compositeScore: Number(compositeScore.toFixed(2)),
      trend: 'up' // default trend for peers
    });
  });

  // Inject the real user
  const userHoursScore = Math.min(100, ((currentUserStats.weeklyStudyHours || 0) / MIT_BASELINE.maxStudyHours) * 100);
  const userFScore = Math.min(100, ((currentUserStats.avgFocusScore || 0) / MIT_BASELINE.maxFocusScore) * 100);
  const userCScore = Math.min(100, ((currentUserStats.avgCompletion || 0) / MIT_BASELINE.maxCompletion) * 100);
  const userPScore = Math.min(100, ((currentUserStats.avgProductivity || 0) / MIT_BASELINE.maxProductivity) * 100);
  
  const userCompositeScore = (userHoursScore * 0.4) + (userFScore * 0.3) + (userPScore * 0.2) + (userCScore * 0.1);

  rivals.push({
    id: currentUserStats.id || 'real_user',
    alias: currentUserStats.alias || 'YOU',
    isUser: true,
    weeklyStudyHours: Number((currentUserStats.weeklyStudyHours || 0).toFixed(1)),
    avgFocusScore: Number((currentUserStats.avgFocusScore || 0).toFixed(0)),
    compositeScore: Number(userCompositeScore.toFixed(2)),
    trend: 'up' // User is always visually pushing upward
  });

  // Sort by composite score descending
  rivals.sort((a, b) => b.compositeScore - a.compositeScore);

  // Assign ranks
  rivals.forEach((rival, index) => {
    rival.rank = index + 1;
  });

  return rivals;
}

module.exports = { generateMatrix };
