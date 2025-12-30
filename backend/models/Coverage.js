/**
 * Coverage Model
 * Stores learning outcome coverage analysis results
 */

const mongoose = require('mongoose');

const coverageSchema = new mongoose.Schema({
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: true
  },
  loId: {
    type: String,
    required: true
  },
  coveragePercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    required: true,
    enum: ['Covered', 'Partially Covered', 'Not Covered']
  },
  questionsCovered: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    },
    similarityScore: {
      type: Number,
      min: 0,
      max: 1
    }
  }],
  analyzedAt: {
    type: Date,
    default: Date.now
  },
  analysisTag: {
    type: String,
    default: null
  },
  questionCount: {
    type: Number,
    default: null
  },
  analyzedQuestions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }]
}, {
  timestamps: true
});

// Index for faster queries
coverageSchema.index({ moduleId: 1, loId: 1 });
coverageSchema.index({ moduleId: 1, analysisTag: 1 });
coverageSchema.index({ moduleId: 1, loId: 1, analyzedAt: -1 }); // For sorting and deduplication

module.exports = mongoose.model('Coverage', coverageSchema);

