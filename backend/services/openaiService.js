/**
 * Groq Service
 * Handles all Groq API interactions for LOC analysis and question generation
 */

const Groq = require('groq-sdk');

// Lazy initialization of Groq client
let groq = null;

// Get Groq model from environment variable, with fallback to commonly available models
function getGroqModel() {
  // Try environment variable first
  if (process.env.GROQ_MODEL) {
    return process.env.GROQ_MODEL;
  }
  // Fallback to commonly available models (try 3.3 first, then 3.1-8b-instant as backup)
  return 'llama-3.3-70b-versatile';
}

function getGroqClient() {
  if (!groq) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY environment variable is required. Please add it to your .env file.');
    }
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
  }
  return groq;
}

/**
 * Calculate similarity score between a question and a learning outcome
 * @param {string} eloText - Expected Learning Outcome text
 * @param {string} questionText - Question text
 * @returns {Promise<number>} - Similarity score between 0 and 1
 */
async function calculateSimilarity(eloText, questionText) {
  try {
    const client = getGroqClient();
    const prompt = `You are an education assessment expert.

Expected Learning Outcome:
"${eloText}"

Question:
"${questionText}"

Return ONLY a similarity score between 0 and 1 indicating how well the question covers the learning outcome. 
Return only the number, no explanation, no text, just the number between 0 and 1.`;

    const response = await client.chat.completions.create({
      model: getGroqModel(),
      messages: [
        {
          role: 'system',
          content: 'You are an expert in educational assessment. Return only numerical scores between 0 and 1.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 10
    });

    // Extract score from response
    const scoreText = response.choices[0].message.content.trim();
    const score = parseFloat(scoreText);

    // Validate and clamp score between 0 and 1
    if (isNaN(score)) {
      console.warn('Invalid score returned, defaulting to 0');
      return 0;
    }

    return Math.max(0, Math.min(1, score));
  } catch (error) {
    console.error('Groq API error in calculateSimilarity:', error);
    throw new Error('Failed to calculate similarity: ' + error.message);
  }
}

/**
 * Generate questions based on learning outcome and Bloom's taxonomy level
 * @param {string} eloText - Expected Learning Outcome text
 * @param {string} bloomLevel - Bloom's taxonomy level
 * @param {number} mcqCount - Number of MCQs to generate
 * @param {number} structuredCount - Number of structured questions to generate
 * @returns {Promise<Object>} - Generated questions object
 */
async function generateQuestions(eloText, bloomLevel, mcqCount, structuredCount) {
  try {
    const client = getGroqClient();
    const prompt = `You are a university-level examiner.

Generate:
- ${mcqCount} multiple-choice questions (MUST have exactly 4 options each)
- ${structuredCount} structured questions (with sample answers)

Learning Outcome:
"${eloText}"

Bloom's Taxonomy Level:
"${bloomLevel}"

Ensure academic correctness and alignment with the learning outcome.

IMPORTANT REQUIREMENTS:
- For MCQs: Each question MUST have exactly 4 options. The correctAnswer must be one of the 4 options (use the exact text from options array).
- For Structured questions: Include a comprehensive sample answer that demonstrates the expected response quality.

Return the questions in the following JSON format:
{
  "mcqs": [
    {
      "question": "question text",
      "options": ["option A text", "option B text", "option C text", "option D text"],
      "correctAnswer": "option A text"
    }
  ],
  "structured": [
    {
      "question": "question text",
      "marks": 10,
      "sampleAnswer": "A detailed sample answer showing what a good response should include..."
    }
  ]
}`;

    const response = await client.chat.completions.create({
      model: getGroqModel(),
      messages: [
        {
          role: 'system',
          content: 'You are an expert university examiner. Generate high-quality academic questions aligned with learning outcomes and Bloom\'s taxonomy.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });

    // Parse JSON response
    const content = response.choices[0].message.content.trim();
    
    // Try to extract JSON from markdown code blocks if present
    let jsonText = content;
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    const questions = JSON.parse(jsonText);
    
    return questions;
  } catch (error) {
    console.error('Groq API error in generateQuestions:', error);
    throw new Error('Failed to generate questions: ' + error.message);
  }
}

module.exports = {
  calculateSimilarity,
  generateQuestions
};

