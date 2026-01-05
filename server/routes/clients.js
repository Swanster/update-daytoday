const express = require('express');
const router = express.Router();
const Daily = require('../models/Daily');
const Project = require('../models/Project');
const { auth, adminOrSuperuser } = require('../middleware/auth');

// GET /api/clients - Get all unique clients with summary counts
router.get('/', auth, adminOrSuperuser, async (req, res) => {
    try {
        // Aggregate from Daily entries
        const dailyClients = await Daily.aggregate([
            { $match: { clientName: { $exists: true, $ne: '' } } },
            {
                $group: {
                    _id: '$clientName',
                    totalDaily: { $sum: 1 },
                    openDaily: {
                        $sum: { $cond: [{ $ne: ['$status', 'Done'] }, 1, 0] }
                    },
                    lastDailyActivity: { $max: '$date' }
                }
            }
        ]);

        // Aggregate from Project entries (using projectName as client reference)
        const projectClients = await Project.aggregate([
            { $match: { projectName: { $exists: true, $ne: '' } } },
            {
                $group: {
                    _id: '$projectName',
                    totalProjects: { $sum: 1 },
                    openProjects: {
                        $sum: { $cond: [{ $ne: ['$status', 'Done'] }, 1, 0] }
                    },
                    lastProjectActivity: { $max: '$date' }
                }
            }
        ]);

        // Create a map to merge data
        const clientMap = new Map();

        // Add daily data
        dailyClients.forEach(d => {
            clientMap.set(d._id, {
                clientName: d._id,
                totalDaily: d.totalDaily,
                openDaily: d.openDaily,
                totalProjects: 0,
                openProjects: 0,
                lastActivity: d.lastDailyActivity
            });
        });

        // Merge project data
        projectClients.forEach(p => {
            if (clientMap.has(p._id)) {
                const existing = clientMap.get(p._id);
                existing.totalProjects = p.totalProjects;
                existing.openProjects = p.openProjects;
                if (p.lastProjectActivity > existing.lastActivity) {
                    existing.lastActivity = p.lastProjectActivity;
                }
            } else {
                clientMap.set(p._id, {
                    clientName: p._id,
                    totalDaily: 0,
                    openDaily: 0,
                    totalProjects: p.totalProjects,
                    openProjects: p.openProjects,
                    lastActivity: p.lastProjectActivity
                });
            }
        });

        // Convert to array and sort by total activity
        const clients = Array.from(clientMap.values())
            .map(c => ({
                ...c,
                totalEntries: c.totalDaily + c.totalProjects,
                openIssues: c.openDaily + c.openProjects
            }))
            .sort((a, b) => b.totalEntries - a.totalEntries);

        res.json(clients);
    } catch (error) {
        console.error('Get clients error:', error);
        res.status(500).json({ message: error.message });
    }
});

// GET /api/clients/:name - Get full history for a specific client
router.get('/:name', auth, adminOrSuperuser, async (req, res) => {
    try {
        const clientName = decodeURIComponent(req.params.name);

        // Get all Daily entries for this client
        const dailyEntries = await Daily.find({ clientName })
            .sort({ date: -1 })
            .lean();

        // Get all Project entries (using projectName)
        const projectEntries = await Project.find({ projectName: clientName })
            .sort({ date: -1 })
            .lean();

        // Calculate summary
        const summary = {
            totalDaily: dailyEntries.length,
            totalProjects: projectEntries.length,
            openDaily: dailyEntries.filter(d => d.status !== 'Done').length,
            openProjects: projectEntries.filter(p => p.status !== 'Done').length,
            doneDaily: dailyEntries.filter(d => d.status === 'Done').length,
            doneProjects: projectEntries.filter(p => p.status === 'Done').length,
            onsiteCount: dailyEntries.filter(d => d.action === 'Onsite').length,
            remoteCount: dailyEntries.filter(d => d.action === 'Remote').length
        };

        // Calculate case breakdown from caseIssue field
        const caseMap = new Map();
        dailyEntries.forEach(d => {
            if (d.caseIssue && d.caseIssue.trim()) {
                // Normalize case issue text (take first 50 chars, trim)
                const caseType = d.caseIssue.trim().substring(0, 50);
                caseMap.set(caseType, (caseMap.get(caseType) || 0) + 1);
            }
        });

        // Convert to array and sort by count
        const caseBreakdown = Array.from(caseMap.entries())
            .map(([caseType, count]) => ({ caseType, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10); // Top 10 cases

        // Services breakdown
        const servicesMap = new Map();
        dailyEntries.forEach(d => {
            if (d.services && Array.isArray(d.services)) {
                d.services.forEach(service => {
                    if (service && service.trim()) {
                        servicesMap.set(service, (servicesMap.get(service) || 0) + 1);
                    }
                });
            }
        });
        projectEntries.forEach(p => {
            if (p.services && Array.isArray(p.services)) {
                p.services.forEach(service => {
                    if (service && service.trim()) {
                        servicesMap.set(service, (servicesMap.get(service) || 0) + 1);
                    }
                });
            }
        });

        const servicesBreakdown = Array.from(servicesMap.entries())
            .map(([service, count]) => ({ service, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Activity by year
        const yearMap = new Map();
        dailyEntries.forEach(d => {
            if (d.date) {
                const year = new Date(d.date).getFullYear();
                if (!yearMap.has(year)) {
                    yearMap.set(year, { daily: 0, projects: 0 });
                }
                yearMap.get(year).daily++;
            }
        });
        projectEntries.forEach(p => {
            if (p.date) {
                const year = new Date(p.date).getFullYear();
                if (!yearMap.has(year)) {
                    yearMap.set(year, { daily: 0, projects: 0 });
                }
                yearMap.get(year).projects++;
            }
        });

        const activityByYear = Array.from(yearMap.entries())
            .map(([year, data]) => ({ year, ...data, total: data.daily + data.projects }))
            .sort((a, b) => b.year - a.year);

        res.json({
            clientName,
            summary,
            caseBreakdown,
            servicesBreakdown,
            activityByYear,
            dailyEntries,
            projectEntries
        });
    } catch (error) {
        console.error('Get client history error:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
