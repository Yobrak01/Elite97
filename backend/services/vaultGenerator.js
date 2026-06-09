const pdf = require('pdf-parse');
const { GoogleGenAI } = require('@google/genai');

exports.generateFromMaterial = async (fileBuffer) => {
  try {
    // 1. Extract text from PDF
    const data = await pdf(fileBuffer);
    const text = data.text;
    
    if (!text || text.trim().length === 0) {
      throw new Error('Could not extract text from the provided file.');
    }

    // 2. Fallback to mock data if no Gemini key is provided
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not set. Falling back to mock Neural Extraction.");
      return generateMockData(text);
    }

    // 3. Initialize Gemini
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `
      You are an elite academic tutor. I will provide you with the text of a lecture or syllabus.
      I need you to extract the core concepts and return a structured JSON object containing exactly two things:
      1. "note": A beautifully formatted markdown string summarizing the material. It should use headers, bullet points, and bold text for emphasis.
      2. "flashcards": An array of objects, each containing a "front" (Question) and "back" (Answer). Keep the answers concise and focused on high-yield testable information. Generate 5 flashcards.
      
      Respond ONLY with valid JSON. Do not include markdown code block syntax like \`\`\`json.
      
      Material Text (first 10000 chars):
      ${text.substring(0, 10000)}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let resultText = response.text;
    
    // Clean up potential markdown formatting from Gemini's response
    resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsedData = JSON.parse(resultText);
    
    if (!parsedData.note || !parsedData.flashcards) {
      throw new Error("Invalid format returned by AI.");
    }
    
    return parsedData;
  } catch (error) {
    console.error('Error in vaultGenerator:', error);
    throw new Error('Failed to generate vault materials from document.');
  }
};

const generateMockData = (text) => {
  // A sophisticated mock response to demonstrate the feature working
  return {
    note: `# Neural Extraction Summary\n\n## Core Concepts Identified\n- **Foundational Theory**: The document appears to cover critical academic concepts.\n- **Primary Objectives**: Focus on mastering the key definitions and formulas.\n\n## Automated Action Items\n- [ ] Review extracted flashcards.\n- [ ] Synthesize this note with your existing knowledge base.\n\n> *Note: This is an automated mock summary because GEMINI_API_KEY was not found in the environment variables.*`,
    flashcards: [
      {
        front: "What is the primary concept discussed in the first section of this document?",
        back: "It introduces the foundational theories required for advanced understanding of the subject."
      },
      {
        front: "What does this material suggest is the most critical metric for success?",
        back: "Consistent active recall and spaced repetition."
      },
      {
        front: "Define 'Neural Extraction' as utilized in the Elite97 system.",
        back: "The automated process of converting raw syllabus or lecture PDFs into structured notes and SM-2 flashcards."
      }
    ]
  };
};
