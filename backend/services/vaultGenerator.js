const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const { GoogleGenAI } = require('@google/genai');

exports.generateFromMaterial = async (fileBuffer, mimetype = '', originalname = '') => {
  try {
    const isPdf = mimetype.includes('pdf') || originalname.toLowerCase().endsWith('.pdf');
    const isWord = mimetype.includes('wordprocessingml') || mimetype.includes('msword') || originalname.toLowerCase().endsWith('.docx') || originalname.toLowerCase().endsWith('.doc');
    
    let text = '';
    
    if (isWord) {
      const result = await mammoth.convertToHtml({ buffer: fileBuffer });
      text = result.value;
    } else if (!isPdf) {
      text = fileBuffer.toString('utf8');
    }
    
    // For Word or text, if there is no text and it's not a PDF, we throw.
    if (!isPdf && (!text || text.trim().length === 0)) {
      throw new Error('Could not extract text from the provided file.');
    }

    // Fallback to mock data if no Gemini key is provided
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not set. Falling back to mock Neural Extraction.");
      return generateMockData(text || "Scanned PDF");
    }

    // Initialize Gemini
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `
      You are an elite academic tutor. I will provide you with the source material (either as text/HTML or as a direct file attachment).
      I need you to extract the core concepts and return a structured JSON object containing exactly two things:
      1. "note": A beautifully formatted markdown string summarizing the material. It should use headers, bullet points, and bold text for emphasis.
      2. "flashcards": An array of objects, each containing a "front" (Question) and "back" (Answer). Keep the answers concise and focused on high-yield testable information. Generate 5 flashcards.
      
      CRITICAL: The text provided may contain OCR errors or symbol-font transcription errors (like 'g' being used instead of the Greek letter 'gamma').
      Whenever you see an obvious symbol error that breaks the math/science context, intelligently fix it in the final output.
      
      Return ONLY a JSON object with the exact structure below. Do NOT use markdown blocks like \`\`\`json.
      {
        "note": "...",
        "flashcards": [
          { "front": "...", "back": "..." }
        ]
      }
    `;

    // Prepare contents payload
    const contents = [];
    
    if (isPdf) {
      contents.push({
        inlineData: {
          data: fileBuffer.toString('base64'),
          mimeType: 'application/pdf'
        }
      });
      contents.push(prompt);
    } else {
      contents.push(prompt + "\n\n=== SOURCE MATERIAL ===\n" + text);
    }

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: contents,
      });
    } catch (apiError) {
      if (apiError.status === 429 || apiError.message?.includes('429') || apiError.message?.includes('quota')) {
        console.warn('Gemini quota exceeded. Retrying...');
        response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: contents,
        });
      } else {
        throw apiError;
      }
    }

    const match = response.text.match(/\{[\s\S]*\}/);
    let resultText = match ? match[0] : response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Handle potential trailing commas or formatting errors
    let parsedData;
    try {
      parsedData = JSON.parse(resultText);
    } catch (parseError) {
      console.error("Failed to parse Gemini output as JSON:", resultText);
      throw new Error("AI returned malformed JSON.");
    }
    
    if (!parsedData.note || !parsedData.flashcards) {
      throw new Error("Invalid format returned by AI.");
    }
    
    return parsedData;
  } catch (error) {
    console.error('Error in vaultGenerator:', error);
    throw new Error('Failed to generate vault materials: ' + error.message);
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
