const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
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

// Get all projects (optionally filtered by quarter)
router.get('/', async (req, res) => {
    try {
        const { quarter, year } = req.query;
        let query = {};

        if (quarter && year) {
            query = { quarter, year: parseInt(year) };
        }

        const projects = await Project.find(query).sort({ projectName: 1, createdAt: 1 });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get available quarters
router.get('/quarters', async (req, res) => {
    try {
        const quarters = await Project.aggregate([
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

// Get project name suggestions for autocomplete
router.get('/suggestions', async (req, res) => {
    try {
        const query = req.query.q || '';

        if (query.length < 1) {
            return res.json([]);
        }

        // Find distinct project names that match the query
        const projects = await Project.aggregate([
            {
                $match: {
                    projectName: { $regex: query, $options: 'i' }
                }
            },
            {
                $group: {
                    _id: '$projectName'
                }
            },
            {
                $limit: 10
            }
        ]);

        const suggestions = projects.map(p => p._id);

        // Also find similar names using basic similarity matching
        const allProjects = await Project.aggregate([
            {
                $group: {
                    _id: '$projectName'
                }
            }
        ]);

        const allNames = allProjects.map(p => p._id);
        const similarNames = findSimilarNames(query, allNames, suggestions);

        res.json({
            exact: suggestions,
            similar: similarNames
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Helper function to find similar project names
function findSimilarNames(query, allNames, excludeNames) {
    const queryLower = query.toLowerCase();
    const similar = [];

    for (const name of allNames) {
        if (excludeNames.includes(name)) continue;

        const nameLower = name.toLowerCase();
        const similarity = calculateSimilarity(queryLower, nameLower);

        if (similarity > 0.4 && similarity < 1) {
            similar.push({ name, similarity });
        }
    }

    return similar
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5)
        .map(s => s.name);
}

// Levenshtein distance based similarity
function calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2[i - 1] === str1[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[str2.length][str1.length];
}

// Get grouped projects for display
router.get('/grouped', async (req, res) => {
    try {
        const projects = await Project.find().sort({ projectName: 1, createdAt: 1 });

        // Group by project name
        const grouped = {};
        projects.forEach(project => {
            if (!grouped[project.projectName]) {
                grouped[project.projectName] = [];
            }
            grouped[project.projectName].push(project);
        });

        res.json(grouped);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new project entry
router.post('/', auth, async (req, res) => {
    // Auto-assign quarter based on date or current date
    const entryDate = req.body.date ? new Date(req.body.date) : new Date();
    const month = entryDate.getMonth();
    const year = entryDate.getFullYear();
    const quarterNum = Math.floor(month / 3) + 1;

    const project = new Project({
        projectName: req.body.projectName,
        services: req.body.services,
        reportSurvey: req.body.reportSurvey,
        wo: req.body.wo,
        material: req.body.material,
        dueDate: req.body.dueDate,
        date: req.body.date,
        picTeam: req.body.picTeam,
        progress: req.body.progress,
        status: req.body.status,
        quarter: `Q${quarterNum}-${year}`,
        year: year
    });

    try {
        const newProject = await project.save();

        // Log activity
        await ActivityLog.create({
            action: 'CREATE',
            entityType: 'PROJECT',
            entityId: newProject._id,
            entityName: newProject.projectName,
            userId: req.user._id,
            username: req.user.username,
            details: `Created project: ${newProject.projectName}`
        });

        res.status(201).json(newProject);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Carry forward unfinished projects to new quarter
// NOTE: This route MUST be before /:id routes!
router.post('/carry-forward', async (req, res) => {
    try {
        const { fromQuarter, fromYear, toQuarter, toYear } = req.body;

        if (!fromQuarter || !fromYear || !toQuarter || !toYear) {
            return res.status(400).json({ message: 'Missing required quarter information' });
        }

        // Find all unfinished projects from the source quarter (status != Done)
        const sourceProjects = await Project.find({
            quarter: fromQuarter,
            year: parseInt(fromYear),
            status: { $ne: 'Done' }
        }).sort({ createdAt: -1 });

        // Group by project name and get only the latest entry for each
        const projectGroups = {};
        sourceProjects.forEach(project => {
            if (!projectGroups[project.projectName]) {
                projectGroups[project.projectName] = project;
            }
        });

        const latestEntries = Object.values(projectGroups);

        if (latestEntries.length === 0) {
            return res.json({
                message: 'No unfinished projects to carry forward',
                copied: 0
            });
        }

        // Check which projects already exist in target quarter
        const existingProjects = await Project.find({
            quarter: toQuarter,
            year: parseInt(toYear)
        }).select('projectName');

        const existingProjectNames = new Set(existingProjects.map(p => p.projectName));

        // Get the max sequence number in target quarter
        const maxSeqEntry = await Project.findOne({
            quarter: toQuarter,
            year: parseInt(toYear)
        }).sort({ quarterSequence: -1 }).select('quarterSequence');

        let nextSequence = (maxSeqEntry?.quarterSequence || 0) + 1;

        // Copy projects that don't already exist in target quarter
        const copiedProjects = [];
        for (const project of latestEntries) {
            if (!existingProjectNames.has(project.projectName)) {
                const newProject = new Project({
                    projectName: project.projectName,
                    services: project.services,
                    reportSurvey: project.reportSurvey,
                    wo: project.wo,
                    material: project.material,
                    dueDate: project.dueDate,
                    date: new Date(), // Set to today
                    picTeam: project.picTeam,
                    progress: project.progress,
                    status: project.status,
                    quarter: toQuarter,
                    year: parseInt(toYear),
                    quarterSequence: nextSequence
                });

                await newProject.save();
                copiedProjects.push(project.projectName);
                nextSequence++;
            }
        }

        res.json({
            message: `Carried forward ${copiedProjects.length} project(s)`,
            copied: copiedProjects.length,
            projects: copiedProjects
        });
    } catch (error) {
        console.error('Carry forward error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Update a project entry
router.put('/:id', auth, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
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

        // Update fields
        Object.keys(req.body).forEach(key => {
            if (key !== '_id' && key !== '__v') {
                project[key] = req.body[key];
            }
        });

        const updatedProject = await project.save();

        // Log activity
        await ActivityLog.create({
            action: 'UPDATE',
            entityType: 'PROJECT',
            entityId: updatedProject._id,
            entityName: updatedProject.projectName,
            userId: req.user._id,
            username: req.user.username,
            details: `Updated project: ${updatedProject.projectName}`
        });

        res.json(updatedProject);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete a project entry
router.delete('/:id', auth, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const projectName = project.projectName;
        const projectId = project._id;

        await Project.findByIdAndDelete(req.params.id);

        // Log activity
        await ActivityLog.create({
            action: 'DELETE',
            entityType: 'PROJECT',
            entityId: projectId,
            entityName: projectName,
            userId: req.user._id,
            username: req.user.username,
            details: `Deleted project: ${projectName}`
        });

        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
