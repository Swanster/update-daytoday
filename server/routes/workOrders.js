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
