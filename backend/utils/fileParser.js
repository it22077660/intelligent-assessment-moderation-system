/**
 * File Parser Utility
 * Extracts text from PDF, DOCX, and TXT files
 */

const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs').promises;

/**
 * Parse PDF file and extract text
 * @param {string} filePath - Path to PDF file
 * @returns {Promise<string>} - Extracted text
 */
async function parsePDF(filePath) {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    throw new Error('Failed to parse PDF: ' + error.message);
  }
}

/**
 * Parse DOCX file and extract text
 * @param {string} filePath - Path to DOCX file
 * @returns {Promise<string>} - Extracted text
 */
async function parseDOCX(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    throw new Error('Failed to parse DOCX: ' + error.message);
  }
}

/**
 * Parse TXT file and extract text
 * @param {string} filePath - Path to TXT file
 * @returns {Promise<string>} - Extracted text
 */
async function parseTXT(filePath) {
  try {
    const text = await fs.readFile(filePath, 'utf-8');
    return text;
  } catch (error) {
    throw new Error('Failed to parse TXT: ' + error.message);
  }
}

/**
 * Extract text from file based on extension
 * @param {string} filePath - Path to file
 * @param {string} mimeType - MIME type of file
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromFile(filePath, mimeType) {
  if (mimeType === 'application/pdf') {
    return await parsePDF(filePath);
  } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
             mimeType === 'application/msword') {
    return await parseDOCX(filePath);
  } else if (mimeType === 'text/plain') {
    return await parseTXT(filePath);
  } else {
    throw new Error('Unsupported file type: ' + mimeType);
  }
}

/**
 * Split text into individual questions
 * Uses common question patterns to identify questions
 * @param {string} text - Full text content
 * @returns {Array<string>} - Array of question texts
 */
function splitIntoQuestions(text) {
  // Common patterns for question identification
  const questionPatterns = [
    /(?:^|\n)\s*(\d+[\.\)])\s*(.+?)(?=\n\s*\d+[\.\)]|$)/g,  // Numbered questions (1. or 1))
    /(?:^|\n)\s*([A-Z][\.\)])\s*(.+?)(?=\n\s*[A-Z][\.\)]|$)/g,  // Lettered questions (A. or A))
    /(?:^|\n)\s*(Question\s*\d+[:\-]?)\s*(.+?)(?=\n\s*Question\s*\d+|$)/gi,  // "Question 1:" format
  ];

  const questions = [];
  let foundQuestions = false;

  // Try each pattern
  for (const pattern of questionPatterns) {
    const matches = [...text.matchAll(pattern)];
    if (matches.length > 0) {
      matches.forEach(match => {
        const questionText = match[2] || match[0];
        if (questionText.trim().length > 10) {  // Minimum question length
          questions.push(questionText.trim());
        }
      });
      foundQuestions = true;
      break;
    }
  }

  // If no pattern matched, try splitting by double newlines or question marks
  if (!foundQuestions) {
    const splits = text.split(/\n\s*\n/);
    splits.forEach(split => {
      if (split.trim().length > 10 && (split.includes('?') || split.match(/\d+[\.\)]/))) {
        questions.push(split.trim());
      }
    });
  }

  // If still no questions found, return the whole text as one question
  if (questions.length === 0 && text.trim().length > 10) {
    questions.push(text.trim());
  }

  return questions;
}

module.exports = {
  extractTextFromFile,
  splitIntoQuestions
};

