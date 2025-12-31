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
    // Quarterly tracking
    quarter: {
        type: String,  // Format: "Q1-2025", "Q2-2025", etc.
        required: true
    },
    year: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

// Index for faster searches
dailySchema.index({ clientName: 1 });
dailySchema.index({ quarter: 1, year: 1 });

module.exports = mongoose.model('Daily', dailySchema);
