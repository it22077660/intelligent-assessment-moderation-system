/**
 * Coverage Routes
 * Handles Learning Outcome Coverage analysis
 */

const express = require('express');
const Module = require('../models/Module');
const Question = require('../models/Question');
const Coverage = require('../models/Coverage');
const { authenticate } = require('../middleware/auth');
const { calculateSimilarity } = require('../services/openaiService');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Helper function to run coverage analysis for a module
 * Can be called asynchronously without blocking
 * @param {string} moduleId - The module ID
 * @param {Array<string>} questionIds - Optional array of question IDs to analyze (if not provided, analyzes all questions)
 * @param {string} analysisTag - Optional tag to identify this analysis run
 */
async function runCoverageAnalysis(moduleId, questionIds = null, analysisTag = null) {
  try {
    // Get module with learning outcomes
    const module = await Module.findById(moduleId);
    if (!module || !module.learningOutcomes || module.learningOutcomes.length === 0) {
      console.log(`Skipping analysis for module ${moduleId}: No learning outcomes found`);
      return;
    }

    // Get questions - either selected ones or all
    let questions;
    if (questionIds && questionIds.length > 0) {
      questions = await Question.find({ 
        moduleId, 
        _id: { $in: questionIds } 
      });
    } else {
      questions = await Question.find({ moduleId });
    }
    
    if (questions.length === 0) {
      console.log(`Skipping analysis for module ${moduleId}: No questions found`);
      return;
    }

    // If analysisTag is provided, delete only reports with that tag, otherwise delete all untagged reports for module
    if (analysisTag) {
      await Coverage.deleteMany({ moduleId, analysisTag });
    } else {
      // Delete existing untagged coverage reports for this module
      await Coverage.deleteMany({ 
        moduleId, 
        $or: [
          { analysisTag: { $exists: false } },
          { analysisTag: null }
        ]
      });
    }

    const coverageResults = [];

    // Analyze each learning outcome
    for (const lo of module.learningOutcomes) {
      const questionsCovered = [];
      let totalSimilarity = 0;
      let questionCount = 0;

      // Compare each question with the learning outcome
      for (const question of questions) {
        try {
          // Calculate similarity using Groq
          const similarityScore = await calculateSimilarity(
            lo.description,
            question.questionText
          );

          // Consider questions with similarity > 0.3 as relevant
          if (similarityScore > 0.3) {
            questionsCovered.push({
              questionId: question._id,
              similarityScore: similarityScore
            });
            totalSimilarity += similarityScore;
            questionCount++;
          }
        } catch (error) {
          console.error(`Error calculating similarity for question ${question._id}:`, error);
          // Continue with next question
        }
      }

      // Calculate coverage percentage
      const averageSimilarity = questionCount > 0 ? totalSimilarity / questionCount : 0;
      const coveragePercentage = Math.min(100, Math.round(averageSimilarity * 100));

      // Determine status
      let status;
      if (coveragePercentage >= 70) {
        status = 'Covered';
      } else if (coveragePercentage >= 30) {
        status = 'Partially Covered';
      } else {
        status = 'Not Covered';
      }

      // Save coverage result
      const coverage = new Coverage({
        moduleId,
        loId: lo.loId,
        coveragePercentage,
        status,
        questionsCovered,
        analysisTag: analysisTag || null,
        questionCount: questions.length,
        analyzedQuestions: questionIds || null
      });

      await coverage.save();
    }

    console.log(`Coverage analysis completed for module ${moduleId}`);
  } catch (error) {
    console.error(`Error running coverage analysis for module ${moduleId}:`, error);
  }
}


/**
 * Analyze coverage for a module
 * POST /api/coverage/analyze/:moduleId
 * Body: { questionIds: [string], analysisTag: string }
 */
router.post('/analyze/:moduleId', async (req, res) => {
  try {
    const moduleId = req.params.moduleId;
    const { questionIds, analysisTag } = req.body;

    // Get module with learning outcomes
    const module = await Module.findById(moduleId);
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Get questions - either selected ones or all
    let questions;
    if (questionIds && questionIds.length > 0) {
      questions = await Question.find({ 
        moduleId, 
        _id: { $in: questionIds } 
      });
    } else {
      questions = await Question.find({ moduleId });
    }

    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No questions found for this module'
      });
    }

    // Run the analysis
    await runCoverageAnalysis(moduleId, questionIds, analysisTag);

    // Get the results to return (filter by analysisTag if provided)
    const query = { moduleId };
    if (analysisTag) {
      query.analysisTag = analysisTag;
    } else {
      query.$or = [
        { analysisTag: { $exists: false } },
        { analysisTag: null }
      ];
    }
    
    const coverageReports = await Coverage.find(query);
    const coverageResults = coverageReports.map(report => {
      const lo = module.learningOutcomes.find(lo => lo.loId === report.loId);
      return {
        loId: report.loId,
        description: lo ? lo.description : 'Unknown',
        bloomLevel: lo ? lo.bloomLevel : 'Unknown',
        coveragePercentage: report.coveragePercentage,
        status: report.status,
        questionsCovered: report.questionsCovered ? report.questionsCovered.length : 0,
        analysisTag: report.analysisTag || null,
        questionCount: report.questionCount || questions.length
      };
    });

    res.json({
      success: true,
      message: 'Coverage analysis completed',
      moduleId,
      totalLOs: module.learningOutcomes.length,
      totalQuestions: questions.length,
      analysisTag: analysisTag || null,
      results: coverageResults
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to analyze coverage: ' + error.message
    });
  }
});

/**
 * Get coverage results for a module
 * GET /api/coverage/module/:moduleId
 */
router.get('/module/:moduleId', async (req, res) => {
  try {
    const moduleId = req.params.moduleId;
    const { analysisTag } = req.query;
    
    const module = await Module.findById(moduleId);
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Build query - if analysisTag provided, filter by it, otherwise get untagged analyses
    const query = { moduleId };
    if (analysisTag) {
      query.analysisTag = analysisTag;
    } else {
      query.$or = [
        { analysisTag: { $exists: false } },
        { analysisTag: null }
      ];
    }

    const coverageReports = await Coverage.find(query)
      .populate('questionsCovered.questionId')
      .populate('analyzedQuestions')
      .sort({ analyzedAt: -1 }); // Sort by most recent first

    // Deduplicate by loId - keep only the most recent report for each LO
    const uniqueReports = new Map();
    for (const report of coverageReports) {
      if (!uniqueReports.has(report.loId)) {
        uniqueReports.set(report.loId, report);
      }
    }
    const deduplicatedReports = Array.from(uniqueReports.values());

    // Get analyzed questions from the first report (all reports for same analysis have same questions)
    let analyzedQuestions = [];
    let analysisTagValue = null;
    let questionCount = null;
    if (deduplicatedReports.length > 0) {
      const firstReport = deduplicatedReports[0];
      analysisTagValue = firstReport.analysisTag;
      questionCount = firstReport.questionCount;
      if (firstReport.analyzedQuestions && firstReport.analyzedQuestions.length > 0) {
        analyzedQuestions = firstReport.analyzedQuestions;
      } else {
        // If no analyzedQuestions stored, get all questions for the module
        analyzedQuestions = await Question.find({ moduleId });
      }
    }

    // Enrich with learning outcome details
    const results = deduplicatedReports.map(report => {
      const lo = module.learningOutcomes.find(lo => lo.loId === report.loId);
      return {
        loId: report.loId,
        description: lo ? lo.description : 'Unknown',
        bloomLevel: lo ? lo.bloomLevel : 'Unknown',
        coveragePercentage: report.coveragePercentage,
        status: report.status,
        questionsCovered: report.questionsCovered || [],
        questionsCoveredCount: report.questionsCovered ? report.questionsCovered.length : 0,
        analyzedAt: report.analyzedAt
      };
    });

    res.json({
      success: true,
      moduleId,
      moduleCode: module.moduleCode,
      moduleName: module.moduleName,
      count: results.length,
      analysisTag: analysisTagValue,
      questionCount: questionCount || analyzedQuestions.length,
      analyzedQuestions: analyzedQuestions.map(q => ({
        _id: q._id,
        questionText: q.questionText,
        questionType: q.questionType,
        source: q.source
      })),
      results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coverage results: ' + error.message
    });
  }
});

/**
 * Get coverage statistics for a module
 * GET /api/coverage/stats/:moduleId
 */
/**
 * Get list of analysis tags for a module
 * GET /api/coverage/analysis-tags/:moduleId
 */
router.get('/analysis-tags/:moduleId', async (req, res) => {
  try {
    const moduleId = req.params.moduleId;
    
    const tags = await Coverage.distinct('analysisTag', { 
      moduleId, 
      analysisTag: { $ne: null } 
    });
    
    res.json({
      success: true,
      tags: tags.filter(tag => tag !== null)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analysis tags: ' + error.message
    });
  }
});

router.get('/stats/:moduleId', async (req, res) => {
  try {
    const moduleId = req.params.moduleId;
    const { analysisTag } = req.query;
    
    const module = await Module.findById(moduleId);
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Build query - if analysisTag provided, filter by it, otherwise get untagged analyses
    const query = { moduleId };
    if (analysisTag) {
      query.analysisTag = analysisTag;
    } else {
      query.$or = [
        { analysisTag: { $exists: false } },
        { analysisTag: null }
      ];
    }

    const coverageReports = await Coverage.find(query);

    const stats = {
      totalLOs: module.learningOutcomes.length,
      covered: coverageReports.filter(r => r.status === 'Covered').length,
      partiallyCovered: coverageReports.filter(r => r.status === 'Partially Covered').length,
      notCovered: coverageReports.filter(r => r.status === 'Not Covered').length,
      averageCoverage: coverageReports.length > 0
        ? Math.round(coverageReports.reduce((sum, r) => sum + r.coveragePercentage, 0) / coverageReports.length)
        : 0
    };

    res.json({
      success: true,
      moduleId,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coverage statistics: ' + error.message
    });
  }
});

// Attach helper function to router and export
router.runCoverageAnalysis = runCoverageAnalysis;
module.exports = router;

