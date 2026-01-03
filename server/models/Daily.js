const mongoose = require('mongoose');

const dailySchema = new mongoose.Schema({
    clientName: {
        type: String,
        required: true,
        trim: true
    },
    services: {
        type: String,
        trim: true,
        default: ''
    },
    caseIssue: {
        type: String,
        trim: true,
        default: ''
    },
    action: {
        type: String,
        enum: ['Onsite', 'Remote', ''],
        default: ''
    },
    date: {
        type: Date,
        default: null
    },
    picTeam: {
        type: [String],
        default: []
    },
    detailAction: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['Progress', 'Done', 'Hold', ''],
        default: ''
    },
    // New fields from CSV import
    reportSurvey: {
        type: String,
        trim: true,
        default: ''
    },
    workOrder: {
        type: String,
        trim: true,
        default: ''
    },
    material: {
        type: String,
        trim: true,
        default: ''
    },
    dueDate: {
        type: Date,
        default: null
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
    },
    // File attachments
    attachments: [{
        filename: String,
        originalName: String,
        mimetype: String,
        size: Number,
        uploadedAt: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true
});

// Index for faster searches
dailySchema.index({ clientName: 1 });
dailySchema.index({ quarter: 1, year: 1 });
dailySchema.index({ quarter: 1, quarterSequence: 1 });

module.exports = mongoose.model('Daily', dailySchema);
