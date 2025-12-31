const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog');
const { auth } = require('../middleware/auth');

// Check if user is admin or superuser
const isAdminOrSuper = (user) => {
    return user && (user.role === 'admin' || user.role === 'superuser');
};

// Get all activity logs (admin/superuser only)
router.get('/', auth, async (req, res) => {
    try {
        // Only admin and superuser can view logs
        if (!isAdminOrSuper(req.user)) {
            return res.status(403).json({ message: 'Admin access required to view activity logs' });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const filter = {};

        // Filter by entity type if provided
        if (req.query.entityType) {
            filter.entityType = req.query.entityType;
        }

        // Filter by action if provided
        if (req.query.action) {
            filter.action = req.query.action;
        }

        const [logs, total] = await Promise.all([
            ActivityLog.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('userId', 'username displayName'),
            ActivityLog.countDocuments(filter)
        ]);

        res.json({
            logs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get recent activity (admin/superuser only)
router.get('/recent', auth, async (req, res) => {
    try {
        if (!isAdminOrSuper(req.user)) {
            return res.status(403).json({ message: 'Admin access required to view activity logs' });
        }

        const logs = await ActivityLog.find()
            .sort({ createdAt: -1 })
            .limit(20)
            .populate('userId', 'username displayName');

        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
