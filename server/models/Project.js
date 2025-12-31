const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  projectName: {
    type: String,
    required: true,
    trim: true
  },
  services: {
    type: String,
    trim: true,
    default: ''
  },
  reportSurvey: {
    type: String,
    enum: ['Done', 'Progress', ''],
    default: ''
  },
  wo: {
    type: String,
    enum: ['Done', 'Progress', ''],
    default: ''
  },
  material: {
    type: String,
    enum: ['Request', 'Done Installation', 'Hold', 'Progress', 'Logistic', ''],
    default: ''
  },
  dueDate: {
    type: Date,
    default: null
  },
  date: {
    type: Date,
    default: null
  },
  picTeam: {
    type: [String],
    default: []
  },
  progress: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Progress', 'Done', 'Hold', ''],
    default: ''
  },
  // Quarterly tracking
  quarter: {
    type: String,  // Format: "Q1-2025", "Q2-2025", etc.
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  // Auto-incrementing sequence number per quarter
  quarterSequence: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for faster project name searches
projectSchema.index({ projectName: 1 });

module.exports = mongoose.model('Project', projectSchema);
