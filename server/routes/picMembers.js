const express = require('express');
const router = express.Router();
const PicMember = require('../models/PicMember');
const { auth } = require('../middleware/auth');
const { categoryValidation, mongoIdParam } = require('../middleware/validation');

// Default PIC members to seed
const DEFAULT_PIC_MEMBERS = [
    { name: 'Jodi', order: 1 },
    { name: 'Beni', order: 2 },
    { name: 'Yogi', order: 3 },
    { name: 'Artak', order: 4 },
    { name: 'Wawan', order: 5 },
    { name: 'Joni', order: 6 },
    { name: 'Samudra', order: 7 },
    { name: 'Gilang Maulana', order: 8 }
];

// Seed default PIC members if none exist
const seedPicMembers = async () => {
    try {
        const count = await PicMember.countDocuments();
        if (count === 0) {
            await PicMember.insertMany(DEFAULT_PIC_MEMBERS);
            console.log('✅ Default PIC members seeded');
        }
    } catch (error) {
        console.error('Error seeding PIC members:', error.message);
    }
};

// Call seed on module load
seedPicMembers();

// Get all active PIC members (all authenticated users)
router.get('/', auth, async (req, res) => {
    try {
        const picMembers = await PicMember.find({ isActive: true }).sort({ order: 1, name: 1 });
        res.json(picMembers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new PIC member (superuser only)
router.post('/', auth, categoryValidation, async (req, res) => {
    try {
        // Check if user is superuser
        if (req.user.role !== 'superuser') {
            return res.status(403).json({ message: 'Only superusers can add PIC members' });
        }

        const { name, order } = req.body;

        // Check for duplicate name
        const existing = await PicMember.findOne({ name: name.trim() });
        if (existing) {
            return res.status(400).json({ message: 'PIC member already exists' });
        }

        // Get max order if not provided
        let picMemberOrder = order;
        if (picMemberOrder === undefined) {
            const maxOrder = await PicMember.findOne().sort({ order: -1 }).select('order');
            picMemberOrder = (maxOrder?.order || 0) + 1;
        }

        const picMember = new PicMember({
            name: name.trim(),
            order: picMemberOrder
        });

        const newPicMember = await picMember.save();
        res.status(201).json(newPicMember);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update a PIC member (superuser only)
router.put('/:id', auth, mongoIdParam, async (req, res) => {
    try {
        // Check if user is superuser
        if (req.user.role !== 'superuser') {
            return res.status(403).json({ message: 'Only superusers can update PIC members' });
        }

        const { name, order, isActive } = req.body;
        const picMember = await PicMember.findById(req.params.id);

        if (!picMember) {
            return res.status(404).json({ message: 'PIC member not found' });
        }

        if (name !== undefined) {
            // Check for duplicate name (excluding current PIC member)
            const existing = await PicMember.findOne({
                name: name.trim(),
                _id: { $ne: req.params.id }
            });
            if (existing) {
                return res.status(400).json({ message: 'PIC member name already exists' });
            }
            picMember.name = name.trim();
        }

        if (order !== undefined) picMember.order = order;
        if (isActive !== undefined) picMember.isActive = isActive;

        const updatedPicMember = await picMember.save();
        res.json(updatedPicMember);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete a PIC member (soft delete, superuser only)
router.delete('/:id', auth, mongoIdParam, async (req, res) => {
    try {
        // Check if user is superuser
        if (req.user.role !== 'superuser') {
            return res.status(403).json({ message: 'Only superusers can delete PIC members' });
        }

        const picMember = await PicMember.findById(req.params.id);

        if (!picMember) {
            return res.status(404).json({ message: 'PIC member not found' });
        }

        // Soft delete by setting isActive to false
        picMember.isActive = false;
        await picMember.save();

        res.json({ message: 'PIC member deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Reorder PIC members (superuser only)
router.post('/reorder', auth, async (req, res) => {
    try {
        // Check if user is superuser
        if (req.user.role !== 'superuser') {
            return res.status(403).json({ message: 'Only superusers can reorder PIC members' });
        }

        const { orderedIds } = req.body;

        if (!Array.isArray(orderedIds)) {
            return res.status(400).json({ message: 'orderedIds must be an array' });
        }

        // Update order for each PIC member
        const updates = orderedIds.map((id, index) =>
            PicMember.findByIdAndUpdate(id, { order: index + 1 })
        );

        await Promise.all(updates);

        const picMembers = await PicMember.find({ isActive: true }).sort({ order: 1 });
        res.json(picMembers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
