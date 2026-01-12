const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { auth } = require('../middleware/auth');
const { categoryValidation, mongoIdParam } = require('../middleware/validation');

// Default categories to seed
const DEFAULT_CATEGORIES = [
    { name: 'Internet', order: 1 },
    { name: 'Manage Service WAAS', order: 2 },
    { name: 'Manage Service FTTR', order: 3 },
    { name: 'Vlepo', order: 4 },
    { name: 'Keponet', order: 5 }
];

// Seed default categories if none exist
const seedCategories = async () => {
    try {
        const count = await Category.countDocuments();
        if (count === 0) {
            await Category.insertMany(DEFAULT_CATEGORIES);
            console.log('✅ Default categories seeded');
        }
    } catch (error) {
        console.error('Error seeding categories:', error.message);
    }
};

// Call seed on module load
seedCategories();

// Get all active categories (public route, all authenticated users)
router.get('/', auth, async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true }).sort({ order: 1, name: 1 });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new category (superuser only)
router.post('/', auth, categoryValidation, async (req, res) => {
    try {
        // Check if user is superuser
        if (req.user.role !== 'superuser') {
            return res.status(403).json({ message: 'Only superusers can add categories' });
        }

        const { name, order } = req.body;

        // Check for duplicate name
        const existing = await Category.findOne({ name: name.trim() });
        if (existing) {
            return res.status(400).json({ message: 'Category already exists' });
        }

        // Get max order if not provided
        let categoryOrder = order;
        if (categoryOrder === undefined) {
            const maxOrder = await Category.findOne().sort({ order: -1 }).select('order');
            categoryOrder = (maxOrder?.order || 0) + 1;
        }

        const category = new Category({
            name: name.trim(),
            order: categoryOrder
        });

        const newCategory = await category.save();
        res.status(201).json(newCategory);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update a category (superuser only)
router.put('/:id', auth, mongoIdParam, async (req, res) => {
    try {
        // Check if user is superuser
        if (req.user.role !== 'superuser') {
            return res.status(403).json({ message: 'Only superusers can update categories' });
        }

        const { name, order, isActive } = req.body;
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        if (name !== undefined) {
            // Check for duplicate name (excluding current category)
            const existing = await Category.findOne({
                name: name.trim(),
                _id: { $ne: req.params.id }
            });
            if (existing) {
                return res.status(400).json({ message: 'Category name already exists' });
            }
            category.name = name.trim();
        }

        if (order !== undefined) category.order = order;
        if (isActive !== undefined) category.isActive = isActive;

        const updatedCategory = await category.save();
        res.json(updatedCategory);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete a category (soft delete, superuser only)
router.delete('/:id', auth, mongoIdParam, async (req, res) => {
    try {
        // Check if user is superuser
        if (req.user.role !== 'superuser') {
            return res.status(403).json({ message: 'Only superusers can delete categories' });
        }

        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Soft delete by setting isActive to false
        category.isActive = false;
        await category.save();

        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Reorder categories (superuser only)
router.post('/reorder', auth, async (req, res) => {
    try {
        // Check if user is superuser
        if (req.user.role !== 'superuser') {
            return res.status(403).json({ message: 'Only superusers can reorder categories' });
        }

        const { orderedIds } = req.body;

        if (!Array.isArray(orderedIds)) {
            return res.status(400).json({ message: 'orderedIds must be an array' });
        }

        // Update order for each category
        const updates = orderedIds.map((id, index) =>
            Category.findByIdAndUpdate(id, { order: index + 1 })
        );

        await Promise.all(updates);

        const categories = await Category.find({ isActive: true }).sort({ order: 1 });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
