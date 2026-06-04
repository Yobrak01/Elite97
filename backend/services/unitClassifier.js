exports.classifyUnit = (course, unitName) => {
  if (!unitName) return 3;

  const lowerUnit = unitName.toLowerCase();

  const criticalKeywords = ['math', 'calculus', 'engineering', 'mechanics', 'thermo', 'physics', 'structures'];
  const importantKeywords = ['programming', 'code', 'software', 'data', 'network'];

  const isCritical = criticalKeywords.some(keyword => lowerUnit.includes(keyword));
  if (isCritical) {
    return 1;
  }

  const isImportant = importantKeywords.some(keyword => lowerUnit.includes(keyword));
  if (isImportant) {
    return 2;
  }

  return 3;
};
