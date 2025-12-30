/**
 * AI Routes
 * Handles AI-based question generation
 */

const express = require('express');
const Module = require('../models/Module');
const Question = require('../models/Question');
const { authenticate } = require('../middleware/auth');
const { generateQuestions } = require('../services/openaiService');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Generate questions for a learning outcome
 * POST /api/ai/generate-questions
 */
router.post('/generate-questions', async (req, res) => {
  try {
    const { moduleId, loId, mcqCount, structuredCount } = req.body;

    // Validate input
    if (!moduleId || !loId || !mcqCount || !structuredCount) {
      return res.status(400).json({
        success: false,
        message: 'Module ID, LO ID, MCQ count, and structured count are required'
      });
    }

    // Get module
    const module = await Module.findById(moduleId);
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Find the learning outcome
    const lo = module.learningOutcomes.find(l => l.loId === loId);
    if (!lo) {
      return res.status(404).json({
        success: false,
        message: 'Learning outcome not found'
      });
    }

    // Generate questions using Groq
    const generatedQuestions = await generateQuestions(
      lo.description,
      lo.bloomLevel,
      parseInt(mcqCount),
      parseInt(structuredCount)
    );

    // Save MCQs to database
    const savedMCQs = [];
    if (generatedQuestions.mcqs && Array.isArray(generatedQuestions.mcqs)) {
      for (const mcq of generatedQuestions.mcqs) {
        // Ensure exactly 4 options
        const options = (mcq.options || []).slice(0, 4);
        // Ensure we have exactly 4 options, pad if needed
        while (options.length < 4) {
          options.push(`Option ${String.fromCharCode(65 + options.length)}`);
        }
        
        const question = new Question({
          moduleId,
          questionText: mcq.question,
          questionType: 'MCQ',
          source: 'AI',
          options: options,
          correctAnswer: mcq.correctAnswer || options[0] || ''
        });
        await question.save();
        savedMCQs.push(question);
      }
    }

    // Save structured questions to database
    const savedStructured = [];
    if (generatedQuestions.structured && Array.isArray(generatedQuestions.structured)) {
      for (const structured of generatedQuestions.structured) {
        const question = new Question({
          moduleId,
          questionText: structured.question,
          questionType: 'Structured',
          source: 'AI',
          marks: structured.marks || 10,
          sampleAnswer: structured.sampleAnswer || ''
        });
        await question.save();
        savedStructured.push(question);
      }
    }

    res.json({
      success: true,
      message: `Successfully generated ${savedMCQs.length} MCQs and ${savedStructured.length} structured questions`,
      loId,
      loDescription: lo.description,
      bloomLevel: lo.bloomLevel,
      generated: {
        mcqs: savedMCQs,
        structured: savedStructured
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate questions: ' + error.message
    });
  }
});

/**
 * Generate questions for multiple learning outcomes
 * POST /api/ai/generate-batch
 */
router.post('/generate-batch', async (req, res) => {
  try {
    const { moduleId, loIds, mcqCount, structuredCount } = req.body;

    // Validate input
    if (!moduleId || !loIds || !Array.isArray(loIds) || loIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Module ID and array of LO IDs are required'
      });
    }

    // Get module
    const module = await Module.findById(moduleId);
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    const results = [];

    // Generate questions for each LO
    for (const loId of loIds) {
      const lo = module.learningOutcomes.find(l => l.loId === loId);
      if (!lo) {
        results.push({
          loId,
          success: false,
          message: 'Learning outcome not found'
        });
        continue;
      }

      try {
        const generatedQuestions = await generateQuestions(
          lo.description,
          lo.bloomLevel,
          parseInt(mcqCount) || 2,
          parseInt(structuredCount) || 1
        );

        // Save questions
        const savedMCQs = [];
        const savedStructured = [];

        if (generatedQuestions.mcqs && Array.isArray(generatedQuestions.mcqs)) {
          for (const mcq of generatedQuestions.mcqs) {
            // Ensure exactly 4 options
            const options = (mcq.options || []).slice(0, 4);
            // Ensure we have exactly 4 options, pad if needed
            while (options.length < 4) {
              options.push(`Option ${String.fromCharCode(65 + options.length)}`);
            }
            
            const question = new Question({
              moduleId,
              questionText: mcq.question,
              questionType: 'MCQ',
              source: 'AI',
              options: options,
              correctAnswer: mcq.correctAnswer || options[0] || ''
            });
            await question.save();
            savedMCQs.push(question._id);
          }
        }

        if (generatedQuestions.structured && Array.isArray(generatedQuestions.structured)) {
          for (const structured of generatedQuestions.structured) {
            const question = new Question({
              moduleId,
              questionText: structured.question,
              questionType: 'Structured',
              source: 'AI',
              marks: structured.marks || 10,
              sampleAnswer: structured.sampleAnswer || ''
            });
            await question.save();
            savedStructured.push(question._id);
          }
        }

        results.push({
          loId,
          success: true,
          mcqsGenerated: savedMCQs.length,
          structuredGenerated: savedStructured.length
        });
      } catch (error) {
        results.push({
          loId,
          success: false,
          message: error.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Batch question generation completed',
      results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate questions: ' + error.message
    });
  }
});

module.exports = router;

