const mongoose = require('mongoose');

const briefingSchema = new mongoose.Schema({
  tanggal: {
    type: Date,
    required: true
  },
  lokasi: {
    type: String,
    trim: true,
    default: ''
  },
  pekerjaan: {
    type: String,
    trim: true,
    default: ''
  },
  pic: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['Progress', 'Done', 'Hold', 'Pending', ''],
    default: 'Pending'
  },
  checklist: {
    type: String,
    default: ''
  },
  catatan: {
    type: String,
    default: ''
  },
  // Google Sheets sync tracking
  googleSheetRowId: {
    type: Number,
    default: null
  },
  // Track sync status
  syncStatus: {
    type: String,
    enum: ['synced', 'pending', 'modified'],
    default: 'synced'
  },
  // User yang membuat (optional, untuk tracking)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // User yang terakhir update
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true, // createdAt, updatedAt otomatis
  // Index untuk query performa
  indexes: [
    { fields: { tanggal: 1 } },
    { fields: { status: 1 } },
    { fields: { syncStatus: 1 } }
  ]
});

// Helper untuk tahun dari tanggal
briefingSchema.virtual('year').get(function() {
  return this.tanggal ? this.tanggal.getFullYear() : null;
});

// Helper untuk quarter dari tanggal
briefingSchema.virtual('quarter').get(function() {
  if (!this.tanggal) return null;
  const month = this.tanggal.getMonth() + 1;
  if (month <= 3) return 'Q1';
  if (month <= 6) return 'Q2';
  if (month <= 9) return 'Q3';
  return 'Q4';
});

module.exports = mongoose.model('Briefing', briefingSchema);
