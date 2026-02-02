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

// GET /api/dashboard/overdue - Get projects in progress (grouped by project name)
router.get('/overdue', auth, adminOrSuperuser, async (req, res) => {
    try {
        const now = new Date();
        
        // Aggregate projects in progress, grouped by projectName
        // Shows only one entry per client/project with latest status
        const groupedProjects = await Project.aggregate([
            // Match only projects in progress
            { $match: { status: 'Progress' } },
            // Sort by updatedAt descending to get latest first
            { $sort: { updatedAt: -1 } },
            // Group by projectName, keeping the latest entry's data
            {
                $group: {
                    _id: '$projectName',
                    latestId: { $first: '$_id' },
                    projectName: { $first: '$projectName' },
                    dueDate: { $first: '$dueDate' },
                    services: { $first: '$services' },
                    material: { $first: '$material' },
                    wo: { $first: '$wo' },
                    progress: { $first: '$progress' },
                    status: { $first: '$status' },
                    updatedAt: { $first: '$updatedAt' },
                    createdAt: { $first: '$createdAt' },
                    // Count total entries for this project name
                    entryCount: { $sum: 1 }
                }
            },
            // Sort by due date (nulls last), then by createdAt
            { $sort: { dueDate: 1, createdAt: -1 } },
            // Limit results
            { $limit: 30 }
        ]);

        // Calculate days until due (or days overdue if past due)
        const projectsWithDays = groupedProjects.map(p => {
            let daysInfo = null;
            let isOverdue = false;
            
            if (p.dueDate) {
                const diffMs = new Date(p.dueDate) - now;
                const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                if (diffDays < 0) {
                    daysInfo = Math.abs(diffDays);
                    isOverdue = true;
                } else {
                    daysInfo = diffDays;
                    isOverdue = false;
                }
            }
            
            return {
                _id: p.latestId,
                type: 'project',
                name: p.projectName,
                services: p.services || [],
                material: p.material || '',
                wo: p.wo || '',
                progress: p.progress || '',
                dueDate: p.dueDate,
                daysUntilDue: daysInfo,
                isOverdue: isOverdue,
                entryCount: p.entryCount
            };
        });

        res.json(projectsWithDays);
    } catch (error) {
        console.error('Dashboard progress error:', error);
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

// PATCH /api/dashboard/update-field - Update a specific field on a project
router.patch('/update-field', auth, async (req, res) => {
    try {
        const { id, field, value } = req.body;

        if (!id || !field) {
            return res.status(400).json({ message: 'ID and field are required' });
        }

        // Only allow specific fields to be updated
        const allowedFields = ['material', 'wo'];
        if (!allowedFields.includes(field)) {
            return res.status(400).json({ message: 'Invalid field' });
        }

        const updateData = {};
        updateData[field] = value;

        const project = await Project.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        );

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Log activity
        await ActivityLog.create({
            action: 'UPDATE',
            entityType: 'PROJECT',
            entityId: project._id,
            entityName: project.projectName,
            userId: req.user._id,
            username: req.user.username,
            details: `Updated ${field} to "${value}" for project: ${project.projectName}`
        });

        res.json({ message: `${field} updated`, project });
    } catch (error) {
        console.error('Update field error:', error);
        res.status(500).json({ message: error.message });
    }
});

// PATCH /api/dashboard/mark-done - Mark an item as Done
router.patch('/mark-done', auth, async (req, res) => {
    try {
        const { id, type } = req.body;

        if (!id || !type) {
            return res.status(400).json({ message: 'ID and type are required' });
        }

        if (!['project', 'daily'].includes(type)) {
            return res.status(400).json({ message: 'Type must be "project" or "daily"' });
        }

        let item;
        let Model;
        let entityType;
        let itemName;

        if (type === 'project') {
            Model = Project;
            entityType = 'PROJECT';
            item = await Project.findByIdAndUpdate(
                id,
                { $set: { status: 'Done' } },
                { new: true }
            );
            itemName = item?.projectName;
        } else {
            Model = Daily;
            entityType = 'DAILY';
            item = await Daily.findByIdAndUpdate(
                id,
                { $set: { status: 'Done' } },
                { new: true }
            );
            itemName = item?.clientName;
        }

        if (!item) {
            return res.status(404).json({ message: `${type} not found` });
        }

        // Log activity
        await ActivityLog.create({
            action: 'UPDATE',
            entityType: entityType,
            entityId: item._id,
            entityName: itemName,
            userId: req.user._id,
            username: req.user.username,
            details: `Marked ${type} as Done from dashboard: ${itemName}`
        });

        res.json({ message: `${type} marked as Done`, item });
    } catch (error) {
        console.error('Mark done error:', error);
        res.status(500).json({ message: error.message });
    }
});

// POST /api/dashboard/quick-project - Create a quick project entry
router.post('/quick-project', auth, async (req, res) => {
    try {
        const { projectName, services, dueDate, picTeam, status } = req.body;

        if (!projectName || !projectName.trim()) {
            return res.status(400).json({ message: 'Project name is required' });
        }

        // Auto-assign quarter based on current date
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();
        const quarterNum = Math.floor(month / 3) + 1;
        const quarter = `Q${quarterNum}-${year}`;

        // Get the next sequence number for this quarter
        const maxSeqEntry = await Project.findOne({ quarter, year })
            .sort({ quarterSequence: -1 })
            .select('quarterSequence');
        const nextSequence = (maxSeqEntry?.quarterSequence || 0) + 1;

        const project = new Project({
            projectName: projectName.trim(),
            services: services || [],
            dueDate: dueDate || null,
            date: now,
            picTeam: picTeam || [],
            progress: '',
            status: status || 'Progress',
            quarter: quarter,
            year: year,
            quarterSequence: nextSequence
        });

        const newProject = await project.save();

        // Log activity
        await ActivityLog.create({
            action: 'CREATE',
            entityType: 'PROJECT',
            entityId: newProject._id,
            entityName: newProject.projectName,
            userId: req.user._id,
            username: req.user.username,
            details: `Created project from dashboard: ${newProject.projectName}`
        });

        res.status(201).json(newProject);
    } catch (error) {
        console.error('Quick project error:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
