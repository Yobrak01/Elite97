// cohortFeed.js
const { generateMatrix } = require('./hierarchyMatrix');

// Pseudorandom number generator with seed
function mulberry32(a) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

const ACTION_TEMPLATES = [
  { text: "{alias} logged {hours} hours of Deep Focus.", type: "study", severity: "high" },
  { text: "{alias} completed a {count}-task sprint.", type: "task", severity: "medium" },
  { text: "{alias} breached the Circadian Anchor. Sliding down the Hierarchy.", type: "penalty", severity: "punitive" },
  { text: "{alias} locked in the Alpha Overdrive. Focus at 98%.", type: "achievement", severity: "elite" },
  { text: "{alias} submitted a major project 3 days early.", type: "task", severity: "high" },
  { text: "{alias}'s discipline streak reached {streak} days.", type: "streak", severity: "elite" },
  { text: "{alias} dropped 4 ranks due to low productivity.", type: "penalty", severity: "punitive" },
  { text: "{alias} engaged Neural Override mode.", type: "study", severity: "high" }
];

/**
 * Generates a synthetic activity feed of the elite cohort
 */
function generateSyntheticFeed(currentUserStats) {
  // Use today's date + current hour as seed so the feed shifts every hour
  const now = new Date();
  const seedStr = now.toISOString().split('T')[0] + '-' + now.getHours();
  
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed += seedStr.charCodeAt(i);
  }
  const rng = mulberry32(seed);

  // Grab the rivals (we only care about the top 20 or so for the feed to make it feel elite)
  const matrix = generateMatrix(currentUserStats);
  const topRivals = matrix.filter(r => !r.isUser).slice(0, 30);

  const events = [];

  // Generate ~15 events for the recent past
  for (let i = 0; i < 15; i++) {
    const rival = topRivals[Math.floor(rng() * topRivals.length)];
    const template = ACTION_TEMPLATES[Math.floor(rng() * ACTION_TEMPLATES.length)];
    
    let text = template.text.replace('{alias}', rival.alias);
    
    // Fill dynamic variables
    if (text.includes('{hours}')) {
      const hours = (rng() * 4 + 2).toFixed(1); // 2.0 to 6.0 hours
      text = text.replace('{hours}', hours);
    }
    if (text.includes('{count}')) {
      const count = Math.floor(rng() * 8) + 4; // 4 to 11 tasks
      text = text.replace('{count}', count);
    }
    if (text.includes('{streak}')) {
      const streak = Math.floor(rng() * 30) + 10; // 10 to 39 days
      text = text.replace('{streak}', streak);
    }

    // Distribute timestamps across the last 3 hours
    const minutesAgo = Math.floor(rng() * 180);
    const eventTime = new Date(now.getTime() - minutesAgo * 60000);

    events.push({
      id: `synthetic_${seed}_${i}`,
      alias: rival.alias,
      isUser: false,
      text,
      type: template.type,
      severity: template.severity,
      timestamp: eventTime,
      minutesAgo
    });
  }

  // Sort descending by timestamp (newest first)
  events.sort((a, b) => b.timestamp - a.timestamp);

  return events;
}

module.exports = {
  generateSyntheticFeed
};
