const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'REGISTER', 'IMPORT', 'BATCH_UPDATE']
    },
    entityType: {
        type: String,
        required: true,
        enum: ['PROJECT', 'DAILY', 'USER']
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    entityName: {
        type: String,
        default: ''
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    username: {
        type: String,
        required: true
    },
    details: {
        type: String,
        default: ''
    },
    changes: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    }
}, {
    timestamps: true
});

// Index for faster queries
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ userId: 1 });
activityLogSchema.index({ entityType: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
