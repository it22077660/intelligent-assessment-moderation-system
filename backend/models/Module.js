/**
 * Module Model
 * Stores module information including topics, subtopics, and learning outcomes
 */

const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  topicName: {
    type: String,
    required: true
  },
  subtopics: [{
    type: String
  }]
});

const learningOutcomeSchema = new mongoose.Schema({
  loId: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  bloomLevel: {
    type: String,
    required: true,
    enum: ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']
  }
});

const moduleSchema = new mongoose.Schema({
  moduleCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  moduleName: {
    type: String,
    required: true
  },
  topics: [topicSchema],
  learningOutcomes: [learningOutcomeSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Module', moduleSchema);

