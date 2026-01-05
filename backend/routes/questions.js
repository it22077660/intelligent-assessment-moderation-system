/**
 * Question Routes
 * Handles question management (upload, manual entry, retrieval)
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const Question = require('../models/Question');
const Module = require('../models/Module');
const { authenticate } = require('../middleware/auth');
const { extractTextFromFile, splitIntoQuestions } = require('../utils/fileParser');
const coverageRouter = require('./coverage');
const runCoverageAnalysis = coverageRouter.runCoverageAnalysis;

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and TXT files are allowed.'));
    }
  }
});

/**
 * Get all questions for a module
 * GET /api/questions/module/:moduleId
 */
router.get('/module/:moduleId', async (req, res) => {
  try {
    const { source, sortBy } = req.query;
    
    // Build query
    let query = { moduleId: req.params.moduleId };
    if (source && source !== 'All') {
      query.source = source;
    }
    
    // Build sort
    let sort = {};
    if (sortBy === 'type') {
      // Sort by question type: MCQ first, then Structured, then by date
      sort = { questionType: 1, createdAt: -1 };
    } else {
      // Default: sort by creation date (newest first)
      sort = { createdAt: -1 };
    }
    
    const questions = await Question.find(query).sort(sort);
    
    res.json({
      success: true,
      count: questions.length,
      questions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch questions: ' + error.message
    });
  }
});

/**
 * Get single question by ID
 * GET /api/questions/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    res.json({
      success: true,
      question
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch question: ' + error.message
    });
  }
});

/**
 * Upload question paper file
 * POST /api/questions/upload
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { moduleId } = req.body;

    if (!moduleId) {
      // Clean up uploaded file
      await fs.unlink(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Module ID is required'
      });
    }

    // Verify module exists
    const module = await Module.findById(moduleId);
    if (!module) {
      await fs.unlink(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Extract text from file
    const text = await extractTextFromFile(req.file.path, req.file.mimetype);
    
    // Split text into questions
    const questionTexts = splitIntoQuestions(text);

    // Save questions to database
    const savedQuestions = [];
    for (const questionText of questionTexts) {
      const question = new Question({
        moduleId,
        questionText: questionText.trim(),
        questionType: 'Structured', // Default, can be updated later
        source: 'Uploaded'
      });
      await question.save();
      savedQuestions.push(question);
    }

    // Clean up uploaded file
    await fs.unlink(req.file.path);

    // Trigger automatic coverage analysis in the background (non-blocking)
    runCoverageAnalysis(moduleId).catch(err => {
      console.error('Background coverage analysis failed:', err);
    });

    res.status(201).json({
      success: true,
      message: `Successfully extracted ${savedQuestions.length} questions from file`,
      count: savedQuestions.length,
      questions: savedQuestions
    });
  } catch (error) {
    // Clean up file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Failed to delete file:', unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to process file: ' + error.message
    });
  }
});

/**
 * Create question manually
 * POST /api/questions
 */
router.post('/', async (req, res) => {
  try {
    const { moduleId, questionText, questionType, options, correctAnswer, marks, sampleAnswer } = req.body;

    // Validate required fields
    if (!moduleId || !questionText || !questionType) {
      return res.status(400).json({
        success: false,
        message: 'Module ID, question text, and question type are required'
      });
    }

    // Validate question type
    if (!['MCQ', 'Structured'].includes(questionType)) {
      return res.status(400).json({
        success: false,
        message: 'Question type must be either "MCQ" or "Structured"'
      });
    }

    // Validate MCQ-specific fields
    if (questionType === 'MCQ') {
      if (!options || !Array.isArray(options) || options.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'MCQ questions require at least 2 options'
        });
      }
      const validOptions = options.filter(opt => opt && opt.trim().length > 0);
      if (validOptions.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'MCQ questions require at least 2 valid (non-empty) options'
        });
      }
    }

    // Verify module exists
    const module = await Module.findById(moduleId);
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Create question
    const question = new Question({
      moduleId,
      questionText: questionText.trim(),
      questionType,
      source: 'Manual',
      options: questionType === 'MCQ' ? (options || []).filter(opt => opt && opt.trim().length > 0) : [],
      correctAnswer: questionType === 'MCQ' ? (correctAnswer || '').trim() : '',
      marks: marks || 0,
      sampleAnswer: questionType === 'Structured' ? (sampleAnswer || '').trim() : ''
    });

    await question.save();

    // Trigger automatic coverage analysis in the background (non-blocking)
    runCoverageAnalysis(moduleId).catch(err => {
      console.error('Background coverage analysis failed:', err);
    });

    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      question
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create question: ' + error.message
    });
  }
});

/**
 * Update question
 * PUT /api/questions/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const { questionText, questionType, options, correctAnswer, marks, sampleAnswer } = req.body;

    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Update fields
    if (questionText !== undefined) question.questionText = questionText.trim();
    if (questionType) {
      if (!['MCQ', 'Structured'].includes(questionType)) {
        return res.status(400).json({
          success: false,
          message: 'Question type must be either "MCQ" or "Structured"'
        });
      }
      question.questionType = questionType;
    }
    if (options !== undefined) {
      if (question.questionType === 'MCQ' && (!Array.isArray(options) || options.filter(opt => opt && opt.trim()).length < 2)) {
        return res.status(400).json({
          success: false,
          message: 'MCQ questions require at least 2 valid options'
        });
      }
      question.options = Array.isArray(options) ? options.filter(opt => opt && opt.trim().length > 0) : [];
    }
    if (correctAnswer !== undefined) question.correctAnswer = correctAnswer.trim();
    if (marks !== undefined) question.marks = marks;
    if (sampleAnswer !== undefined) question.sampleAnswer = sampleAnswer.trim();

    await question.save();

    res.json({
      success: true,
      message: 'Question updated successfully',
      question
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update question: ' + error.message
    });
  }
});

/**
 * Delete question
 * DELETE /api/questions/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    await Question.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete question: ' + error.message
    });
  }
});

module.exports = router;

