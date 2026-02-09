const express = require('express');
const router = express.Router();
const WorkOrder = require('../models/WorkOrder');
const { auth } = require('../middleware/auth');

// Get all work orders (filtered by quarter/year if provided)
router.get('/', auth, async (req, res) => {
    try {
        const { quarter, year } = req.query;
        let query = {};
        
        if (quarter && year) {
            query.quarter = quarter;
            query.year = parseInt(year);
        }

        const workOrders = await WorkOrder.find(query).sort({ quarterSequence: 1 });
        res.json(workOrders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get quarters list
router.get('/quarters', auth, async (req, res) => {
    try {
        const quarters = await WorkOrder.aggregate([
            {
                $group: {
                    _id: { quarter: "$quarter", year: "$year" },
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    quarter: "$_id.quarter",
                    year: "$_id.year",
                    _id: 0
                }
            },
            { $sort: { year: -1, quarter: -1 } }
        ]);
        res.json(quarters);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get report data
router.get('/report', auth, async (req, res) => {
    try {
        const { quarter, year, isYearly } = req.query;
        let query = {};

        if (isYearly === 'true' && year) {
            query.year = parseInt(year);
        } else if (quarter && year) {
            query.quarter = quarter;
            query.year = parseInt(year);
        }

        const workOrders = await WorkOrder.find(query).sort({ quarterSequence: 1 });

        // Calculate summary stats
        const summary = {
            total: workOrders.length,
            done: workOrders.filter(w => w.status === 'Done' || w.status === 'Complete').length,
            progress: workOrders.filter(w => w.status === 'Progress' || w.status === 'On Progress').length,
            hold: workOrders.filter(w => w.status === 'Hold').length,
            noStatus: workOrders.filter(w => !w.status).length
        };

        // Calculate percentages
        summary.donePercent = summary.total > 0 ? Math.round((summary.done / summary.total) * 100) : 0;
        summary.progressPercent = summary.total > 0 ? Math.round((summary.progress / summary.total) * 100) : 0;
        summary.holdPercent = summary.total > 0 ? Math.round((summary.hold / summary.total) * 100) : 0;

        // Calculate Client Status stats (New vs Existing)
        const clientStatusStats = {
            'New Client': { total: 0, done: 0, progress: 0, hold: 0 },
            'Existing': { total: 0, done: 0, progress: 0, hold: 0 }
        };

        // Calculate Service stats
        const serviceStats = {};

        workOrders.forEach(wo => {
            // Client Status Stats
            const status = wo.clientStatus || 'Existing'; // Default to Existing if not set
            // Normalize status to handle potential variations if any, though select enforces specific values
            const normStatus = status === 'New Client' ? 'New Client' : 'Existing';
            
            if (!clientStatusStats[normStatus]) {
                 clientStatusStats[normStatus] = { total: 0, done: 0, progress: 0, hold: 0 };
            }
            
            clientStatusStats[normStatus].total++;
            if (wo.status === 'Done' || wo.status === 'Complete') clientStatusStats[normStatus].done++;
            else if (wo.status === 'Progress' || wo.status === 'On Progress') clientStatusStats[normStatus].progress++;
            else if (wo.status === 'Hold') clientStatusStats[normStatus].hold++;

            // Service Stats
            let service = wo.services || 'OTHER';
            if (!serviceStats[service]) {
                serviceStats[service] = { total: 0, done: 0, progress: 0, hold: 0 };
            }
            serviceStats[service].total++;
            if (wo.status === 'Done' || wo.status === 'Complete') serviceStats[service].done++;
            else if (wo.status === 'Progress' || wo.status === 'On Progress') serviceStats[service].progress++;
            else if (wo.status === 'Hold') serviceStats[service].hold++;
        });

        // Quarterly trend (if yearly)
        let quarterlyTrend = [];
        if (isYearly === 'true') {
            const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
            for (const q of quarters) {
                const qKey = `${q}-${year}`;
                const qWOs = workOrders.filter(w => w.quarter === qKey);
                quarterlyTrend.push({
                    quarter: qKey,
                    total: qWOs.length,
                    done: qWOs.filter(w => w.status === 'Done' || w.status === 'Complete').length,
                    progress: qWOs.filter(w => w.status === 'Progress' || w.status === 'On Progress').length,
                    hold: qWOs.filter(w => w.status === 'Hold').length
                });
            }
        }

        res.json({
            summary,
            clientStatusStats,
            serviceStats,
            workOrders,
            quarterlyTrend
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create new work order
router.post('/', auth, async (req, res) => {
    try {
        const { quarter, year, clientName } = req.body;
        
        // Generate sequence number
        const lastWO = await WorkOrder.findOne({ quarter, year }).sort({ quarterSequence: -1 });
        const quarterSequence = lastWO && lastWO.quarterSequence ? lastWO.quarterSequence + 1 : 1;

        // Auto-detect quarter if not provided
        let targetQuarter = quarter;
        let targetYear = year;

        if (!targetQuarter || !targetYear) {
            const now = new Date();
            const q = Math.floor(now.getMonth() / 3) + 1;
            targetQuarter = `Q${q}-${now.getFullYear()}`;
            targetYear = now.getFullYear();
        }

        const newWO = new WorkOrder({
            ...req.body,
            quarter: targetQuarter,
            year: targetYear,
            quarterSequence
        });

        const savedWO = await newWO.save();
        res.status(201).json(savedWO);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update work order
router.put('/:id', auth, async (req, res) => {
    try {
        const updatedWO = await WorkOrder.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(updatedWO);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete work order
router.delete('/:id', auth, async (req, res) => {
    try {
        await WorkOrder.findByIdAndDelete(req.params.id);
        res.json({ message: 'Work Order deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Batch update status
router.post('/batch-status', auth, async (req, res) => {
    const { ids, status } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'No IDs provided' });
    }
    
    if (!status) {
        return res.status(400).json({ message: 'No status provided' });
    }
    
    try {
        const result = await WorkOrder.updateMany(
            { _id: { $in: ids } },
            { $set: { status: status } }
        );
        
        res.json({ 
            message: `Successfully updated ${result.modifiedCount} work orders to ${status}`,
            count: result.modifiedCount
        });
    } catch (err) {
        console.error('Batch update error:', err);
        res.status(500).json({ message: 'Failed to update work orders' });
    }
});

module.exports = router;
