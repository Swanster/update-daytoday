const mongoose = require('mongoose');

const caseTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for ordering
caseTypeSchema.index({ order: 1, name: 1 });

module.exports = mongoose.model('CaseType', caseTypeSchema);
