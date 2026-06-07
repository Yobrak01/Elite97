const pdf = require('pdf-parse');

// Keywords to look for
const KEYWORDS = {
  exam: ['exam', 'midterm', 'final', 'test'],
  quiz: ['quiz', 'assessment'],
  assignment: ['assignment', 'homework', 'hw', 'problem set', 'pset'],
  project: ['project', 'paper', 'essay', 'presentation', 'report'],
  reading: ['reading', 'chapter', 'ch.']
};

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MONTH_REGEX = new RegExp(`(?:${MONTHS.join('|')})[a-z]*\\s+\\d{1,2}`, 'i');
const SLASH_DATE_REGEX = /\d{1,2}\/\d{1,2}(?:\/\d{2,4})?/;

const classifyLine = (line) => {
  const lowerLine = line.toLowerCase();
  for (const [type, words] of Object.entries(KEYWORDS)) {
    if (words.some(w => lowerLine.includes(w))) {
      return type;
    }
  }
  return null;
};

const extractDate = (line) => {
  const monthMatch = line.match(MONTH_REGEX);
  if (monthMatch) {
    const d = new Date(monthMatch[0] + ` ${new Date().getFullYear()}`);
    if (!isNaN(d.getTime())) return d;
  }
  
  const slashMatch = line.match(SLASH_DATE_REGEX);
  if (slashMatch) {
    const parts = slashMatch[0].split('/');
    let m = parseInt(parts[0]);
    let d = parseInt(parts[1]);
    let y = parts[2] ? parseInt(parts[2]) : new Date().getFullYear();
    
    // Simple heuristic for US format MM/DD
    if (m > 12 && d <= 12) {
      // Swapped DD/MM
      const temp = m;
      m = d;
      d = temp;
    }
    const parsedDate = new Date(y, m - 1, d);
    if (!isNaN(parsedDate.getTime())) return parsedDate;
  }
  return null;
};

exports.parseSyllabus = async (pdfBuffer, courseName = 'Unknown Course') => {
  try {
    const data = await pdf(pdfBuffer);
    const text = data.text;
    
    // Split text into reasonable chunks (lines or double newlines)
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 5);
    
    const extractedTasks = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      const foundDate = extractDate(line);
      
      if (foundDate) {
        // Look at current line, previous line, and next line to classify context
        const context = [
          lines[i - 1] || '',
          line,
          lines[i + 1] || ''
        ].join(' ');
        
        const classification = classifyLine(context);
        
        if (classification) {
          // Attempt to extract a title, stripping out the date part
          let titleStr = line.replace(MONTH_REGEX, '').replace(SLASH_DATE_REGEX, '').trim();
          
          // If the line is mostly just the date, pull title from previous or next line
          if (titleStr.length < 5) {
             const prevClass = classifyLine(lines[i-1] || '');
             const nextClass = classifyLine(lines[i+1] || '');
             if (prevClass) titleStr = lines[i-1].replace(MONTH_REGEX, '').replace(SLASH_DATE_REGEX, '').trim();
             else if (nextClass) titleStr = lines[i+1].replace(MONTH_REGEX, '').replace(SLASH_DATE_REGEX, '').trim();
          }

          if (titleStr.length > 50) {
             titleStr = titleStr.substring(0, 50) + '...';
          }
          if (titleStr.length < 3) {
             titleStr = `${classification.charAt(0).toUpperCase() + classification.slice(1)}`;
          }

          // Capitalize first letter
          titleStr = titleStr.charAt(0).toUpperCase() + titleStr.slice(1);

          extractedTasks.push({
            title: `[${courseName}] ${titleStr}`,
            type: classification,
            deadline: foundDate,
            priority: classification === 'exam' ? 'high' : classification === 'project' ? 'high' : 'medium',
            estimatedPomodoros: classification === 'exam' ? 8 : classification === 'project' ? 6 : 2,
            sourceText: line
          });
        }
      }
    }

    // Deduplicate tasks that might have triggered multiple times on the same date
    const uniqueTasks = [];
    const seen = new Set();
    for (const t of extractedTasks) {
      const key = `${t.type}-${t.deadline.toISOString().split('T')[0]}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueTasks.push(t);
      }
    }

    return uniqueTasks;

  } catch (error) {
    console.error('Error parsing syllabus:', error);
    throw new Error('Failed to parse syllabus PDF');
  }
};
