const express = require('express');
const router = express.Router();
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const Project = require('../models/Project');
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
                    date: project.date, // Keep original date
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

        // Find header row (contains "No", "SURVEY PROJECT", etc.)
        let headerIndex = -1;
        for (let i = 0; i < Math.min(records.length, 15); i++) {
            const row = records[i];
            if (row && row[0]?.trim() === 'No' && row[1]?.trim()?.includes('SURVEY PROJECT')) {
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

            const monthMap = {
                'januari': 0, 'februari': 1, 'maret': 2, 'april': 3,
                'mei': 4, 'juni': 5, 'juli': 6, 'agustus': 7,
                'september': 8, 'oktober': 9, 'november': 10, 'desember': 11,
                'january': 0, 'february': 1, 'march': 2, 'may': 4,
                'june': 5, 'july': 6, 'august': 7, 'october': 9,
                'december': 11
            };

            const match = dateStr.trim().match(/(\d{1,2})\s+(\w+)\s+(\d{4})/i);
            if (match) {
                const day = parseInt(match[1]);
                const month = monthMap[match[2].toLowerCase()];
                const year = parseInt(match[3]);
                if (month !== undefined) {
                    return new Date(year, month, day);
                }
            }

            const d = new Date(dateStr);
            return isNaN(d.getTime()) ? null : d;
        };

        // Map status values (for REPORT SURVEY, WO columns)
        const mapDoneProgress = (status) => {
            if (!status) return '';
            const s = status.trim().toLowerCase();
            if (s === 'done') return 'Done';
            if (s === 'progress') return 'Progress';
            return '';
        };

        // Map material status
        const mapMaterial = (status) => {
            if (!status) return '';
            const s = status.trim().toLowerCase();
            if (s === 'request') return 'Request';
            if (s === 'done installation' || s === 'done install') return 'Done Installation';
            if (s === 'hold') return 'Hold';
            if (s === 'progress') return 'Progress';
            if (s === 'logistic' || s === 'logistik') return 'Logistic';
            return '';
        };

        // Map final status
        const mapStatus = (status) => {
            if (!status) return '';
            const s = status.trim().toLowerCase();
            if (s === 'done' || s === 'done install') return 'Done';
            if (s === 'progress' || s === 'request') return 'Progress';
            if (s === 'hold' || s === 'logistik') return 'Hold';
            return '';
        };

        // Parse PIC Team
        const parsePicTeam = (picStr) => {
            if (!picStr || picStr.trim() === '') return [];
            return picStr.split(/[,&]/).map(p => p.trim()).filter(p => p.length > 0);
        };

        // Track sequence numbers per quarter per project
        const sequenceMap = {};
        const getSequenceNumber = async (quarter, projectName) => {
            const key = `${quarter}:${projectName}`;
            if (sequenceMap[key]) {
                return sequenceMap[key];
            }

            const existing = await Project.findOne({ quarter, projectName }).select('quarterSequence');
            if (existing) {
                sequenceMap[key] = existing.quarterSequence;
                return existing.quarterSequence;
            }

            if (!sequenceMap[quarter]) {
                const max = await Project.findOne({ quarter }).sort({ quarterSequence: -1 }).select('quarterSequence');
                sequenceMap[quarter] = (max?.quarterSequence || 0);
            }
            sequenceMap[quarter]++;
            sequenceMap[key] = sequenceMap[quarter];
            return sequenceMap[quarter];
        };

        const entries = [];
        let currentProjectName = '';
        let currentServices = '';

        // Process data rows (skip header and the row after it with "(Name Client)")
        for (let i = headerIndex + 2; i < records.length; i++) {
            const row = records[i];
            if (!row || row.length < 7) continue;

            // Column mapping based on TSV structure:
            // 0: No, 1: SURVEY PROJECT, 2: SERVICE, 3: REPORT SURVEY, 4: WO
            // 5: MATERIAL, 6: DUE DATE, 7: DATE, 8: PIC TIM, 9: PROGRESS, 10: STATUS

            const rowNo = row[0]?.trim();
            const projectName = row[1]?.trim();
            const services = row[2]?.trim();
            const reportSurvey = row[3]?.trim() || '';
            const wo = row[4]?.trim() || '';
            const material = row[5]?.trim() || '';
            const dueDateStr = row[6]?.trim() || '';
            const dateStr = row[7]?.trim() || '';
            const picTeam = row[8]?.trim() || '';
            const progress = row[9]?.trim() || '';
            const status = row[10]?.trim() || '';

            // Update current project if this row has a project name
            if (projectName && projectName.length > 0) {
                currentProjectName = projectName;
            }
            if (services && services.length > 0) {
                currentServices = services;
            }

            // Skip if no project name and no progress/date (empty row)
            if (!currentProjectName || (!dateStr && !progress)) continue;

            // Skip summary rows
            if (rowNo && !projectName && !services && !dateStr && !progress) continue;

            const date = parseDate(dateStr);
            const dueDate = parseDate(dueDateStr);

            // Determine quarter from date
            let quarter, year;
            if (date) {
                const month = date.getMonth();
                year = date.getFullYear();
                const quarterNum = Math.floor(month / 3) + 1;
                quarter = `Q${quarterNum}-${year}`;
            } else {
                quarter = 'Q4-2025';
                year = 2025;
            }

            const sequenceNumber = await getSequenceNumber(quarter, currentProjectName);

            entries.push({
                projectName: currentProjectName,
                services: currentServices,
                reportSurvey: mapDoneProgress(reportSurvey),
                wo: mapDoneProgress(wo),
                material: mapMaterial(material),
                dueDate,
                date,
                picTeam: parsePicTeam(picTeam),
                progress: progress,
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
        const inserted = await Project.insertMany(entries);

        // Log activity
        await ActivityLog.create({
            action: 'IMPORT',
            entityType: 'PROJECT',
            entityId: null,
            entityName: `TSV Import (${inserted.length} entries)`,
            userId: req.user._id,
            username: req.user.username,
            details: `Imported ${inserted.length} project entries from TSV`
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
