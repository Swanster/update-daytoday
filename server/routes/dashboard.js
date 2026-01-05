const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Daily = require('../models/Daily');
const ActivityLog = require('../models/ActivityLog');
const { auth, adminOrSuperuser } = require('../middleware/auth');

// GET /api/dashboard/stats - Get aggregated dashboard statistics
router.get('/stats', auth, adminOrSuperuser, async (req, res) => {
    try {
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();
        const quarter = Math.floor(month / 3) + 1;
        const currentQuarter = `Q${quarter}-${year}`;

        // Get start of current month
        const startOfMonth = new Date(year, month, 1);
        const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

        // Active projects (status = Progress)
        const activeProjects = await Project.countDocuments({ status: 'Progress' });

        // Completed projects this quarter
        const completedThisQuarter = await Project.countDocuments({
            status: 'Done',
            quarter: currentQuarter
        });

        // Daily entries this month
        const dailiesThisMonth = await Daily.countDocuments({
            date: { $gte: startOfMonth, $lte: endOfMonth }
        });

        // Overdue projects (dueDate passed, status not Done)
        const overdueProjects = await Project.countDocuments({
            dueDate: { $lt: now, $ne: null },
            status: { $ne: 'Done' }
        });

        // Overdue dailies
        const overdueDailies = await Daily.countDocuments({
            dueDate: { $lt: now, $ne: null },
            status: { $ne: 'Done' }
        });

        // On hold count
        const onHoldProjects = await Project.countDocuments({ status: 'Hold' });
        const onHoldDailies = await Daily.countDocuments({ status: 'Hold' });

        // Pending users count
        const User = require('../models/User');
        const pendingUsers = await User.countDocuments({ isApproved: false });

        res.json({
            activeProjects,
            completedThisQuarter,
            dailiesThisMonth,
            overdueTotal: overdueProjects + overdueDailies,
            overdueProjects,
            overdueDailies,
            onHold: onHoldProjects + onHoldDailies,
            pendingUsers,
            currentQuarter
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ message: error.message });
    }
});

// GET /api/dashboard/overdue - Get overdue items
router.get('/overdue', auth, adminOrSuperuser, async (req, res) => {
    try {
        const now = new Date();

        // Get overdue projects
        const overdueProjects = await Project.find({
            dueDate: { $lt: now, $ne: null },
            status: { $ne: 'Done' }
        })
            .sort({ dueDate: 1 })
            .limit(20)
            .lean();

        // Get overdue dailies
        const overdueDailies = await Daily.find({
            dueDate: { $lt: now, $ne: null },
            status: { $ne: 'Done' }
        })
            .sort({ dueDate: 1 })
            .limit(20)
            .lean();

        // Calculate days overdue and add type
        const projectsWithDays = overdueProjects.map(p => ({
            ...p,
            type: 'project',
            name: p.projectName,
            daysOverdue: Math.floor((now - new Date(p.dueDate)) / (1000 * 60 * 60 * 24))
        }));

        const dailiesWithDays = overdueDailies.map(d => ({
            ...d,
            type: 'daily',
            name: d.clientName,
            daysOverdue: Math.floor((now - new Date(d.dueDate)) / (1000 * 60 * 60 * 24))
        }));

        // Combine and sort by days overdue (most urgent first)
        const allOverdue = [...projectsWithDays, ...dailiesWithDays]
            .sort((a, b) => b.daysOverdue - a.daysOverdue);

        res.json(allOverdue);
    } catch (error) {
        console.error('Dashboard overdue error:', error);
        res.status(500).json({ message: error.message });
    }
});

// GET /api/dashboard/activity - Get recent activity
router.get('/activity', auth, adminOrSuperuser, async (req, res) => {
    try {
        const recentActivity = await ActivityLog.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        res.json(recentActivity);
    } catch (error) {
        console.error('Dashboard activity error:', error);
        res.status(500).json({ message: error.message });
    }
});

// GET /api/dashboard/top-clients - Get clients with most troubleshooting activity
router.get('/top-clients', auth, adminOrSuperuser, async (req, res) => {
    try {
        // Aggregate Daily entries by clientName
        const topClients = await Daily.aggregate([
            // Match only entries with a clientName
            { $match: { clientName: { $exists: true, $ne: '' } } },
            // Group by client name
            {
                $group: {
                    _id: '$clientName',
                    totalEntries: { $sum: 1 },
                    openIssues: {
                        $sum: { $cond: [{ $ne: ['$status', 'Done'] }, 1, 0] }
                    },
                    resolvedIssues: {
                        $sum: { $cond: [{ $eq: ['$status', 'Done'] }, 1, 0] }
                    },
                    lastActivity: { $max: '$date' },
                    // Count by action type
                    onsiteCount: {
                        $sum: { $cond: [{ $eq: ['$action', 'Onsite'] }, 1, 0] }
                    },
                    remoteCount: {
                        $sum: { $cond: [{ $eq: ['$action', 'Remote'] }, 1, 0] }
                    }
                }
            },
            // Sort by total entries descending
            { $sort: { totalEntries: -1 } },
            // Limit to top 10
            { $limit: 10 },
            // Reshape the output
            {
                $project: {
                    _id: 0,
                    clientName: '$_id',
                    totalEntries: 1,
                    openIssues: 1,
                    resolvedIssues: 1,
                    lastActivity: 1,
                    onsiteCount: 1,
                    remoteCount: 1
                }
            }
        ]);

        res.json(topClients);
    } catch (error) {
        console.error('Dashboard top-clients error:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
