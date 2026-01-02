const express = require('express');
const router = express.Router();
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const Daily = require('../models/Daily');
const ActivityLog = require('../models/ActivityLog');
const { auth } = require('../middleware/auth');

// Configure multer for file upload
const upload = multer({ storage: multer.memoryStorage() });

// Helper function to get current quarter
function getCurrentQuarter() {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const quarter = Math.floor(month / 3) + 1;
    return { quarter: `Q${quarter}-${year}`, year, quarterNum: quarter };
}

// Get all daily entries (optionally filtered by quarter)
router.get('/', async (req, res) => {
    try {
        const { quarter, year } = req.query;
        let query = {};

        if (quarter && year) {
            query = { quarter, year: parseInt(year) };
        }

        const dailies = await Daily.find(query).sort({ quarterSequence: 1, createdAt: 1 });
        res.json(dailies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get available quarters
router.get('/quarters', async (req, res) => {
    try {
        const quarters = await Daily.aggregate([
            {
                $group: {
                    _id: { quarter: '$quarter', year: '$year' }
                }
            },
            {
                $sort: { '_id.year': -1, '_id.quarter': -1 }
            }
        ]);

        const result = quarters.map(q => ({
            quarter: q._id.quarter,
            year: q._id.year
        }));

        // Always include current quarter
        const current = getCurrentQuarter();
        if (!result.find(q => q.quarter === current.quarter)) {
            result.unshift({ quarter: current.quarter, year: current.year });
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get report data (quarterly or yearly)
router.get('/report', async (req, res) => {
    try {
        const { quarter, year, yearly } = req.query;
        let query = {};

        if (yearly === 'true' && year) {
            // Get all data for the year
            query = { year: parseInt(year) };
        } else if (quarter && year) {
            query = { quarter, year: parseInt(year) };
        }

        const dailies = await Daily.find(query).sort({ quarterSequence: 1, date: 1 });

        // Calculate summary stats
        const summary = {
            total: dailies.length,
            done: dailies.filter(d => d.status === 'Done').length,
            progress: dailies.filter(d => d.status === 'Progress').length,
            hold: dailies.filter(d => d.status === 'Hold').length,
            noStatus: dailies.filter(d => !d.status || d.status === '').length
        };

        // Group by client name for cleaner report
        const grouped = {};
        dailies.forEach(d => {
            if (!grouped[d.clientName]) {
                grouped[d.clientName] = [];
            }
            grouped[d.clientName].push(d);
        });

        res.json({
            reportType: yearly === 'true' ? 'yearly' : 'quarterly',
            period: yearly === 'true' ? year : quarter,
            year: parseInt(year),
            summary,
            dailies,
            grouped
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get client name suggestions
router.get('/suggestions', async (req, res) => {
    try {
        const query = req.query.q || '';

        if (query.length < 1) {
            return res.json({ exact: [], similar: [] });
        }

        const dailies = await Daily.aggregate([
            {
                $match: {
                    clientName: { $regex: query, $options: 'i' }
                }
            },
            {
                $group: {
                    _id: '$clientName'
                }
            },
            {
                $limit: 10
            }
        ]);

        res.json({
            exact: dailies.map(d => d._id),
            similar: []
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new daily entry
router.post('/', auth, async (req, res) => {
    // Auto-assign quarter based on date or current date
    const entryDate = req.body.date ? new Date(req.body.date) : new Date();
    const month = entryDate.getMonth();
    const year = entryDate.getFullYear();
    const quarterNum = Math.floor(month / 3) + 1;
    const quarter = `Q${quarterNum}-${year}`;

    try {
        let sequenceNumber;

        // Check if this client already exists in this quarter
        const existingClientEntry = await Daily.findOne({
            quarter,
            clientName: req.body.clientName
        }).select('quarterSequence');

        if (existingClientEntry) {
            // Reuse the same sequence number for existing client
            sequenceNumber = existingClientEntry.quarterSequence;
        } else {
            // New client - get the next sequence number
            const maxSeqEntry = await Daily.findOne({ quarter })
                .sort({ quarterSequence: -1 })
                .select('quarterSequence');
            sequenceNumber = (maxSeqEntry?.quarterSequence || 0) + 1;
        }

        const daily = new Daily({
            clientName: req.body.clientName,
            services: req.body.services,
            caseIssue: req.body.caseIssue,
            action: req.body.action,
            date: req.body.date,
            picTeam: req.body.picTeam,
            detailAction: req.body.detailAction,
            status: req.body.status,
            quarter: quarter,
            year: year,
            quarterSequence: sequenceNumber
        });

        const newDaily = await daily.save();

        // Log activity
        await ActivityLog.create({
            action: 'CREATE',
            entityType: 'DAILY',
            entityId: newDaily._id,
            entityName: newDaily.clientName,
            userId: req.user._id,
            username: req.user.username,
            details: `Created daily entry for client: ${newDaily.clientName}`
        });

        res.status(201).json(newDaily);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Batch update status for multiple daily entries
router.patch('/batch-status', auth, async (req, res) => {
    try {
        const { ids, status } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No daily entry IDs provided' });
        }

        if (!['Done', 'Progress', 'Hold'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value. Must be Done, Progress, or Hold.' });
        }

        // Update all dailies with the given IDs
        const result = await Daily.updateMany(
            { _id: { $in: ids } },
            { $set: { status: status } }
        );

        // Get client names for logging
        const updatedDailies = await Daily.find({ _id: { $in: ids } }).select('clientName');
        const clientNames = [...new Set(updatedDailies.map(d => d.clientName))];

        // Log activity
        await ActivityLog.create({
            action: 'BATCH_UPDATE',
            entityType: 'DAILY',
            entityId: null,
            entityName: `Batch Status Update (${ids.length} entries)`,
            userId: req.user._id,
            username: req.user.username,
            details: `Updated ${result.modifiedCount} daily entry(s) to status "${status}": ${clientNames.join(', ')}`
        });

        res.json({
            message: `Successfully updated ${result.modifiedCount} entry(s) to ${status}`,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Batch status update error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Update a daily entry
router.put('/:id', auth, async (req, res) => {
    try {
        const daily = await Daily.findById(req.params.id);

        if (!daily) {
            return res.status(404).json({ message: 'Daily entry not found' });
        }

        // Update quarter if date changed
        if (req.body.date) {
            const entryDate = new Date(req.body.date);
            const month = entryDate.getMonth();
            const year = entryDate.getFullYear();
            const quarterNum = Math.floor(month / 3) + 1;
            req.body.quarter = `Q${quarterNum}-${year}`;
            req.body.year = year;
        }

        Object.keys(req.body).forEach(key => {
            if (key !== '_id' && key !== '__v') {
                daily[key] = req.body[key];
            }
        });

        const updatedDaily = await daily.save();

        // Log activity
        await ActivityLog.create({
            action: 'UPDATE',
            entityType: 'DAILY',
            entityId: updatedDaily._id,
            entityName: updatedDaily.clientName,
            userId: req.user._id,
            username: req.user.username,
            details: `Updated daily entry for client: ${updatedDaily.clientName}`
        });

        res.json(updatedDaily);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete a daily entry
router.delete('/:id', auth, async (req, res) => {
    try {
        const daily = await Daily.findById(req.params.id);

        if (!daily) {
            return res.status(404).json({ message: 'Daily entry not found' });
        }

        const clientName = daily.clientName;
        const dailyId = daily._id;

        await Daily.findByIdAndDelete(req.params.id);

        // Log activity
        await ActivityLog.create({
            action: 'DELETE',
            entityType: 'DAILY',
            entityId: dailyId,
            entityName: clientName,
            userId: req.user._id,
            username: req.user.username,
            details: `Deleted daily entry for client: ${clientName}`
        });

        res.json({ message: 'Daily entry deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// TSV Import endpoint
router.post('/import', auth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const tsvContent = req.file.buffer.toString('utf-8');

        // Parse TSV manually (simple tab split to avoid quote issues)
        const lines = tsvContent.replace(/\r\n/g, '\n').split('\n');
        const records = lines.map(line => line.split('\t'));

        // Find header row (contains "No", "CLIENT", "SERVICE", etc.)
        let headerIndex = -1;
        for (let i = 0; i < Math.min(records.length, 15); i++) {
            const row = records[i];
            if (row && row[1]?.trim() === 'No' && row[2]?.trim()?.includes('CLIENT')) {
                headerIndex = i;
                break;
            }
        }

        if (headerIndex === -1) {
            return res.status(400).json({ message: 'Could not find header row in TSV' });
        }

        // Parse date helper
        const parseDate = (dateStr) => {
            if (!dateStr || dateStr.trim() === '') return null;

            // Handle formats like "13 Oktober 2025", "16-17 Oktober 2025"
            const monthMap = {
                'januari': 0, 'februari': 1, 'maret': 2, 'april': 3,
                'mei': 4, 'juni': 5, 'juli': 6, 'agustus': 7,
                'september': 8, 'oktober': 9, 'november': 10, 'desember': 11,
                'january': 0, 'february': 1, 'march': 2, 'may': 4,
                'june': 5, 'july': 6, 'august': 7, 'october': 9,
                'december': 11
            };

            // Handle date ranges like "16-17 Oktober 2025" - take the first date
            const rangeMatch = dateStr.trim().match(/(\d{1,2})[-–]\d{1,2}\s+(\w+)\s+(\d{4})/i);
            if (rangeMatch) {
                const day = parseInt(rangeMatch[1]);
                const month = monthMap[rangeMatch[2].toLowerCase()];
                const year = parseInt(rangeMatch[3]);
                if (month !== undefined) {
                    return new Date(year, month, day);
                }
            }

            const match = dateStr.trim().match(/(\d{1,2})\s+(\w+)\s+(\d{4})/i);
            if (match) {
                const day = parseInt(match[1]);
                const month = monthMap[match[2].toLowerCase()];
                const year = parseInt(match[3]);
                if (month !== undefined) {
                    return new Date(year, month, day);
                }
            }

            // Try standard date parsing
            const d = new Date(dateStr);
            return isNaN(d.getTime()) ? null : d;
        };

        // Map status values
        const mapStatus = (status) => {
            if (!status) return '';
            const s = status.trim().toLowerCase();
            if (s === 'done') return 'Done';
            if (s === 'progress') return 'Progress';
            if (s === 'hold') return 'Hold';
            return '';
        };

        // Parse PIC Team
        const parsePicTeam = (picStr) => {
            if (!picStr || picStr.trim() === '') return [];
            return picStr.split(/[,&]/).map(p => p.trim()).filter(p => p.length > 0);
        };

        // Track sequence numbers per quarter per client
        const sequenceMap = {};
        const getSequenceNumber = async (quarter, clientName) => {
            const key = `${quarter}:${clientName}`;
            if (sequenceMap[key]) {
                return sequenceMap[key];
            }

            // Check if client exists in DB
            const existing = await Daily.findOne({ quarter, clientName }).select('quarterSequence');
            if (existing) {
                sequenceMap[key] = existing.quarterSequence;
                return existing.quarterSequence;
            }

            // Get next sequence
            if (!sequenceMap[quarter]) {
                const max = await Daily.findOne({ quarter }).sort({ quarterSequence: -1 }).select('quarterSequence');
                sequenceMap[quarter] = (max?.quarterSequence || 0);
            }
            sequenceMap[quarter]++;
            sequenceMap[key] = sequenceMap[quarter];
            return sequenceMap[quarter];
        };

        const entries = [];
        let currentClientName = '';
        let currentServices = '';

        // Process data rows (skip header and empty rows after it)
        for (let i = headerIndex + 1; i < records.length; i++) {
            const row = records[i];
            if (!row || row.length < 7) continue;

            // Column mapping based on Daily Activity TSV structure:
            // 0: (empty/ACTIVITY), 1: No, 2: CLIENT, 3: SERVICE, 4: CASE & ISSUE
            // 5: ACTION, 6: DATE, 7: PIC TIM, 8: DETAIL ACTION, 9: STATUS

            const rowNo = row[1]?.trim();
            const clientName = row[2]?.trim();
            const services = row[3]?.trim();
            const caseIssue = row[4]?.trim() || '';
            const action = row[5]?.trim() || '';
            const dateStr = row[6]?.trim() || '';
            const picTeam = row[7]?.trim() || '';
            const detailAction = row[8]?.trim() || '';
            const status = row[9]?.trim() || '';

            // Update current client if this row has a client name
            if (clientName && clientName.length > 0) {
                currentClientName = clientName;
            }
            if (services && services.length > 0) {
                currentServices = services;
            }

            // Skip if no client name and no detail action/date (empty row)
            if (!currentClientName || (!dateStr && !detailAction)) continue;

            // Skip summary rows (rows that start with numbers like "20", "21", "22" with empty data)
            if (rowNo && !clientName && !services && !dateStr && !detailAction) continue;

            const date = parseDate(dateStr);

            // Determine quarter from date
            let quarter, year;
            if (date) {
                const month = date.getMonth();
                year = date.getFullYear();
                const quarterNum = Math.floor(month / 3) + 1;
                quarter = `Q${quarterNum}-${year}`;
            } else {
                // Default to Q4-2025 based on TSV name
                quarter = 'Q4-2025';
                year = 2025;
            }

            const sequenceNumber = await getSequenceNumber(quarter, currentClientName);

            entries.push({
                clientName: currentClientName,
                services: currentServices,
                caseIssue,
                action,
                date,
                picTeam: parsePicTeam(picTeam),
                detailAction,
                status: mapStatus(status),
                quarter,
                year,
                quarterSequence: sequenceNumber
            });
        }

        if (entries.length === 0) {
            return res.status(400).json({ message: 'No valid entries found in TSV' });
        }

        // Insert all entries
        const inserted = await Daily.insertMany(entries);

        // Log activity
        await ActivityLog.create({
            action: 'IMPORT',
            entityType: 'DAILY',
            entityId: null,
            entityName: `TSV Import (${inserted.length} entries)`,
            userId: req.user._id,
            username: req.user.username,
            details: `Imported ${inserted.length} daily entries from TSV`
        });

        res.json({
            message: `Successfully imported ${inserted.length} entries`,
            count: inserted.length
        });
    } catch (error) {
        console.error('TSV import error:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
