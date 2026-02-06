const mongoose = require('mongoose');

const WorkOrderSchema = new mongoose.Schema({
    clientName: {
        type: String,
        required: true
    },
    sales: {
        type: String,
        default: ''
    },
    clientStatus: {
        type: String,
        enum: ['Existing', 'New Client'],
        default: 'New Client'
    },
    services: {
        type: String,
        enum: ['KEPONET', 'MEGALOS', 'VLEPO', 'TAAS', 'FIBERZONE APPS', 'WAS', 'FTTR', 'INTERNET BANDWITH', 'OTHER'],
        default: 'OTHER'
    },
    detailRequest: {
        type: String,
        default: ''
    },
    dueDate: {
        type: Date
    },
    requestBarang: {
        type: String,
        enum: ['Progress', 'Done'],
        default: 'Progress'
    },
    requestJasa: {
        type: String,
        enum: ['No Need', 'Progress', 'Done'],
        default: 'No Need'
    },
    keterangan: {
        type: String,
        default: ''
    },
    quarter: {
        type: String,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    quarterSequence: {
        type: Number
    },
    status: {
        type: String,
        default: 'Progress'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('WorkOrder', WorkOrderSchema);
