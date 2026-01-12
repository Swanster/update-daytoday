const express = require('express');
const router = express.Router();
const CaseType = require('../models/CaseType');
const { auth } = require('../middleware/auth');
const { categoryValidation, mongoIdParam } = require('../middleware/validation');

// Default case types to seed
const DEFAULT_CASE_TYPES = [
    { name: 'Instalasi', order: 1 },
    { name: 'Troubleshoot', order: 2 },
    { name: 'Maintenance', order: 3 },
    { name: 'Visit', order: 4 },
    { name: 'Drop Barang', order: 5 },
    { name: 'Survey', order: 6 }
];

// Seed default case types if none exist
const seedCaseTypes = async () => {
    try {
        const count = await CaseType.countDocuments();
        if (count === 0) {
            await CaseType.insertMany(DEFAULT_CASE_TYPES);
            console.log('✅ Default case types seeded');
        }
    } catch (error) {
        console.error('Error seeding case types:', error.message);
    }
};

// Call seed on module load
seedCaseTypes();

// Get all active case types (all authenticated users)
router.get('/', auth, async (req, res) => {
    try {
        const caseTypes = await CaseType.find({ isActive: true }).sort({ order: 1, name: 1 });
        res.json(caseTypes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new case type (superuser and admin only)
router.post('/', auth, categoryValidation, async (req, res) => {
    try {
        // Check if user is superuser or admin
        if (req.user.role !== 'superuser' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only superusers and admins can add case types' });
        }

        const { name, order } = req.body;

        // Check for duplicate name
        const existing = await CaseType.findOne({ name: name.trim() });
        if (existing) {
            return res.status(400).json({ message: 'Case type already exists' });
        }

        // Get max order if not provided
        let caseTypeOrder = order;
        if (caseTypeOrder === undefined) {
            const maxOrder = await CaseType.findOne().sort({ order: -1 }).select('order');
            caseTypeOrder = (maxOrder?.order || 0) + 1;
        }

        const caseType = new CaseType({
            name: name.trim(),
            order: caseTypeOrder
        });

        const newCaseType = await caseType.save();
        res.status(201).json(newCaseType);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update a case type (superuser and admin only)
router.put('/:id', auth, mongoIdParam, async (req, res) => {
    try {
        // Check if user is superuser or admin
        if (req.user.role !== 'superuser' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only superusers and admins can update case types' });
        }

        const { name, order, isActive } = req.body;
        const caseType = await CaseType.findById(req.params.id);

        if (!caseType) {
            return res.status(404).json({ message: 'Case type not found' });
        }

        if (name !== undefined) {
            // Check for duplicate name (excluding current case type)
            const existing = await CaseType.findOne({
                name: name.trim(),
                _id: { $ne: req.params.id }
            });
            if (existing) {
                return res.status(400).json({ message: 'Case type name already exists' });
            }
            caseType.name = name.trim();
        }

        if (order !== undefined) caseType.order = order;
        if (isActive !== undefined) caseType.isActive = isActive;

        const updatedCaseType = await caseType.save();
        res.json(updatedCaseType);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete a case type (soft delete, superuser and admin only)
router.delete('/:id', auth, mongoIdParam, async (req, res) => {
    try {
        // Check if user is superuser or admin
        if (req.user.role !== 'superuser' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only superusers and admins can delete case types' });
        }

        const caseType = await CaseType.findById(req.params.id);

        if (!caseType) {
            return res.status(404).json({ message: 'Case type not found' });
        }

        // Soft delete by setting isActive to false
        caseType.isActive = false;
        await caseType.save();

        res.json({ message: 'Case type deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Reorder case types (superuser and admin only)
router.post('/reorder', auth, async (req, res) => {
    try {
        // Check if user is superuser or admin
        if (req.user.role !== 'superuser' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only superusers and admins can reorder case types' });
        }

        const { orderedIds } = req.body;

        if (!Array.isArray(orderedIds)) {
            return res.status(400).json({ message: 'orderedIds must be an array' });
        }

        // Update order for each case type
        const updates = orderedIds.map((id, index) =>
            CaseType.findByIdAndUpdate(id, { order: index + 1 })
        );

        await Promise.all(updates);

        const caseTypes = await CaseType.find({ isActive: true }).sort({ order: 1 });
        res.json(caseTypes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
