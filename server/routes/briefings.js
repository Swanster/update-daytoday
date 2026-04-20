const express = require('express');
const router = express.Router();
const Briefing = require('../models/Briefing');
const googleSheetsService = require('../utils/googleSheets');
const { auth } = require('../middleware/auth');

// Get spreadsheet ID from environment
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID || '1q6sJ419VFrkVQSFGlqypEFHvjTQPMBjqouIUriF571o';
const SHEET_RANGE = 'Briefing Master!A:G'; // Sheet name: "Briefing Master"

/**
 * GET /api/briefings
 * Get all briefings, optionally filtered by year/status
 */
router.get('/', auth, async (req, res) => {
  try {
    const { year, status, syncStatus } = req.query;
    let query = {};

    if (year) {
      const startOfYear = new Date(parseInt(year), 0, 1);
      const endOfYear = new Date(parseInt(year) + 1, 0, 1);
      query.tanggal = { $gte: startOfYear, $lt: endOfYear };
    }

    if (status) {
      query.status = status;
    }

    if (syncStatus) {
      query.syncStatus = syncStatus;
    }

    const briefings = await Briefing.find(query)
      .sort({ tanggal: -1, createdAt: -1 })
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    res.json(briefings);
  } catch (error) {
    console.error('Error fetching briefings:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/briefings/:id
 * Get single briefing by ID
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const briefing = await Briefing.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!briefing) {
      return res.status(404).json({ message: 'Briefing not found' });
    }

    res.json(briefing);
  } catch (error) {
    console.error('Error fetching briefing:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * POST /api/briefings
 * Create new briefing
 */
router.post('/', auth, async (req, res) => {
  try {
    const { tanggal, lokasi, pekerjaan, pic, status, checklist, catatan } = req.body;

    // Validate required fields
    if (!tanggal) {
      return res.status(400).json({ 
        message: 'Field tanggal wajib diisi' 
      });
    }

    const briefing = new Briefing({
      tanggal: new Date(tanggal),
      lokasi: lokasi || '',
      pekerjaan: pekerjaan || '',
      pic: pic || '',
      status: status || 'Pending',
      checklist: checklist || '',
      catatan: catatan || '',
      createdBy: req.user._id,
      updatedBy: req.user._id,
      syncStatus: 'pending'
    });

    await briefing.save();

    res.status(201).json(briefing);
  } catch (error) {
    console.error('Error creating briefing:', error);
    res.status(400).json({ message: error.message });
  }
});

/**
 * PATCH /api/briefings/:id
 * Update briefing
 */
router.patch('/:id', auth, async (req, res) => {
  try {
    const { tanggal, lokasi, pekerjaan, pic, status, checklist, catatan } = req.body;

    const briefing = await Briefing.findById(req.params.id);

    if (!briefing) {
      return res.status(404).json({ message: 'Briefing not found' });
    }

    // Update fields
    if (tanggal) briefing.tanggal = new Date(tanggal);
    if (lokasi !== undefined) briefing.lokasi = lokasi;
    if (pekerjaan !== undefined) briefing.pekerjaan = pekerjaan;
    if (pic !== undefined) briefing.pic = pic;
    if (status !== undefined) briefing.status = status;
    if (checklist !== undefined) briefing.checklist = checklist;
    if (catatan !== undefined) briefing.catatan = catatan;

    // Mark as modified if synced before
    if (briefing.syncStatus === 'synced') {
      briefing.syncStatus = 'modified';
    }

    briefing.updatedBy = req.user._id;

    await briefing.save();

    res.json(briefing);
  } catch (error) {
    console.error('Error updating briefing:', error);
    res.status(400).json({ message: error.message });
  }
});

/**
 * DELETE /api/briefings/:id
 * Delete briefing
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const briefing = await Briefing.findById(req.params.id);

    if (!briefing) {
      return res.status(404).json({ message: 'Briefing not found' });
    }

    await Briefing.findByIdAndDelete(req.params.id);

    res.json({ message: 'Briefing deleted successfully' });
  } catch (error) {
    console.error('Error deleting briefing:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * PATCH /api/briefings/batch-status
 * Update status for multiple briefings
 */
router.patch('/batch-status', auth, async (req, res) => {
  try {
    const { ids, status } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'IDs are required' });
    }

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const result = await Briefing.updateMany(
      { _id: { $in: ids } },
      { 
        status,
        syncStatus: 'modified',
        updatedAt: new Date()
      }
    );

    res.json({ 
      message: `Successfully updated ${result.modifiedCount} briefings`,
      modifiedCount: result.modifiedCount 
    });
  } catch (error) {
    console.error('Error batch updating briefings:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * POST /api/briefings/sync-from-sheet
 * Sync data from Google Sheets to MongoDB (FULL REPLACE)
 */
router.post('/sync-from-sheet', auth, async (req, res) => {
  try {
    // Initialize Google Sheets if not already
    if (!googleSheetsService.initialized) {
      await googleSheetsService.initialize();
    }

    if (!googleSheetsService.sheets) {
      return res.status(503).json({ 
        message: 'Google Sheets API not configured. Please add google-credentials.json to server/config/' 
      });
    }

    // Read from Google Sheet
    const sheetData = await googleSheetsService.readSheet(SPREADSHEET_ID, SHEET_RANGE);

    // DELETE ALL existing briefings first
    const deleteResult = await Briefing.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing briefings`);

    let created = 0;
    let skipped = 0;

    // Process each row
    for (const row of sheetData) {
      // Debug: Log raw row data
      console.log('Processing row:', JSON.stringify(row));

      const { Tanggal, 'Lokasi / Site': Lokasi, Pekerjaan, PIC, Status, Checklist, Catatan, _rowIndex } = row;

      // Debug: Log parsed values
      console.log(`Row ${_rowIndex}:`, { Tanggal, Lokasi, Pekerjaan, PIC, Status });

      // Skip empty rows
      if (!Tanggal && !Lokasi && !Pekerjaan) {
        skipped++;
        continue;
      }

      // Parse date
      const parsedDate = googleSheetsService.parseSheetDate(Tanggal);
      if (!parsedDate) {
        console.warn(`Invalid date at row ${_rowIndex}: ${Tanggal}`);
        skipped++;
        continue;
      }

      // Map Indonesian status to English for consistency
      let normalizedStatus = Status || 'Pending';
      const statusMap = {
        'selesai': 'Done',
        'proses': 'Progress',
        'antrian': 'Pending',
        'tunda': 'Hold'
      };
      
      const lowerStatus = (Status || '').toLowerCase().trim();
      if (statusMap[lowerStatus]) {
        normalizedStatus = statusMap[lowerStatus];
      }

      // Create new briefing (full replace mode)
      const briefingData = {
        tanggal: new Date(parsedDate),
        lokasi: Lokasi || '',
        pekerjaan: Pekerjaan || '',
        pic: PIC || '',
        status: normalizedStatus,
        checklist: Checklist || '',
        catatan: Catatan || '',
        googleSheetRowId: _rowIndex,
        syncStatus: 'synced'
      };

      await Briefing.create(briefingData);
      created++;
    }

    res.json({
      message: `Sync completed: ${deleteResult.deletedCount} old records cleared, ${created} created, ${skipped} skipped`,
      stats: { deleted: deleteResult.deletedCount, created, skipped }
    });
  } catch (error) {
    console.error('❌ Error syncing from Google Sheet:', error);
    res.status(500).json({ 
      message: `Failed to sync from Google Sheet: ${error.message}`,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /api/briefings/sync-to-sheet
 * Sync modified data from MongoDB to Google Sheets
 */
router.post('/sync-to-sheet', auth, async (req, res) => {
  try {
    // Initialize Google Sheets if not already
    if (!googleSheetsService.initialized) {
      await googleSheetsService.initialize();
    }

    if (!googleSheetsService.sheets) {
      return res.status(503).json({ 
        message: 'Google Sheets API not configured. Please add google-credentials.json to server/config/' 
      });
    }

    // Get all briefings sorted by date
    const briefings = await Briefing.find({})
      .sort({ tanggal: 1 })
      .lean();

    // Prepare data for sheet (skip header row)
    const headers = [['Tanggal', 'Lokasi / Site', 'Pekerjaan', 'PIC', 'Status', 'Checklist', 'Catatan']];
    const rows = briefings.map(b => [
      googleSheetsService.formatDateForSheet(b.tanggal),
      b.lokasi,
      b.pekerjaan,
      b.pic,
      b.status,
      b.checklist,
      b.catatan
    ]);

    const allData = [...headers, ...rows];

    // Clear and write (simpler than trying to match rows)
    await googleSheetsService.clearSheet(SPREADSHEET_ID, SHEET_RANGE);
    await googleSheetsService.writeToSheet(SPREADSHEET_ID, SHEET_RANGE, allData);

    // Mark all as synced
    await Briefing.updateMany(
      { syncStatus: { $in: ['modified', 'pending'] } },
      { syncStatus: 'synced' }
    );

    res.json({
      message: `Sync completed: ${briefings.length} briefings synced to Google Sheet`,
      stats: { synced: briefings.length }
    });
  } catch (error) {
    console.error('Error syncing to Google Sheet:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/briefings/stats
 * Get briefing statistics
 */
router.get('/stats', auth, async (req, res) => {
  try {
    const { year } = req.query;
    let query = {};

    if (year) {
      const startOfYear = new Date(parseInt(year), 0, 1);
      const endOfYear = new Date(parseInt(year) + 1, 0, 1);
      query.tanggal = { $gte: startOfYear, $lt: endOfYear };
    }

    const stats = await Briefing.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const total = await Briefing.countDocuments(query);
    const syncedCount = await Briefing.countDocuments({ ...query, syncStatus: 'synced' });
    const modifiedCount = await Briefing.countDocuments({ ...query, syncStatus: 'modified' });

    const statusMap = {};
    stats.forEach(s => {
      statusMap[s._id || 'Unknown'] = s.count;
    });

    res.json({
      total,
      byStatus: statusMap,
      syncStatus: {
        synced: syncedCount,
        modified: modifiedCount
      }
    });
  } catch (error) {
    console.error('Error getting briefing stats:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
