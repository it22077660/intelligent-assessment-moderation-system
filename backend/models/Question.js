/**
 * Question Model
 * Stores questions linked to modules
 */

const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: true
  },
  questionText: {
    type: String,
    required: true
  },
  questionType: {
    type: String,
    required: true,
    enum: ['MCQ', 'Structured']
  },
  source: {
    type: String,
    required: true,
    enum: ['Uploaded', 'Manual', 'AI']
  },
  options: {
    type: [String],
    default: []
  },
  correctAnswer: {
    type: String,
    default: ''
  },
  marks: {
    type: Number,
    default: 0
  },
  sampleAnswer: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for faster queries
questionSchema.index({ moduleId: 1 });

module.exports = mongoose.model('Question', questionSchema);

