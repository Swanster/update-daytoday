const mongoose = require('mongoose');

const picMemberSchema = new mongoose.Schema({
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
picMemberSchema.index({ order: 1, name: 1 });

module.exports = mongoose.model('PicMember', picMemberSchema);
