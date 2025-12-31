const express = require('express');
const router = express.Router();
const Daily = require('../models/Daily');
const ActivityLog = require('../models/ActivityLog');
const { auth } = require('../middleware/auth');

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

module.exports = router;
