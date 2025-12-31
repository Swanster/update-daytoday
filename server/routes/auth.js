const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { auth, JWT_SECRET } = require('../middleware/auth');

// Check if user is admin or superuser
const isAdminOrSuper = (user) => {
    return user && (user.role === 'admin' || user.role === 'superuser');
};

// Register new user (pending approval)
router.post('/register', async (req, res) => {
    try {
        const { username, password, displayName } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already taken' });
        }

        // Check if this is the first user (make them superuser and auto-approve)
        const userCount = await User.countDocuments();
        const isFirstUser = userCount === 0;

        // Create user
        const user = new User({
            username,
            password,
            displayName: displayName || username,
            role: isFirstUser ? 'superuser' : 'user',
            isApproved: isFirstUser // First user auto-approved as superuser
        });

        await user.save();

        // Log activity
        await ActivityLog.create({
            action: 'REGISTER',
            entityType: 'USER',
            entityId: user._id,
            entityName: username,
            userId: user._id,
            username: username,
            details: isFirstUser ? `Superuser ${username} registered` : `User ${username} registered (pending approval)`
        });

        if (isFirstUser) {
            // First user gets token immediately
            const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
            return res.status(201).json({
                message: 'Registration successful! You are the first user and have been granted superuser access.',
                user: user.toJSON(),
                token
            });
        }

        res.status(201).json({
            message: 'Registration submitted! Please wait for admin approval.',
            pendingApproval: true
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if approved
        if (!user.isApproved) {
            return res.status(403).json({ message: 'Your account is pending approval. Please wait for an admin to approve your registration.' });
        }

        // Generate token
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

        // Log activity
        await ActivityLog.create({
            action: 'LOGIN',
            entityType: 'USER',
            entityId: user._id,
            entityName: username,
            userId: user._id,
            username: username,
            details: `User ${username} logged in`
        });

        res.json({
            message: 'Login successful',
            user: user.toJSON(),
            token
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get current user
router.get('/me', auth, async (req, res) => {
    res.json(req.user.toJSON());
});

// Get all users (admin/superuser only)
router.get('/users', auth, async (req, res) => {
    try {
        if (!isAdminOrSuper(req.user)) {
            return res.status(403).json({ message: 'Admin access required' });
        }
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get pending users (admin/superuser only)
router.get('/pending', auth, async (req, res) => {
    try {
        if (!isAdminOrSuper(req.user)) {
            return res.status(403).json({ message: 'Admin access required' });
        }
        const users = await User.find({ isApproved: false }).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Approve user (admin/superuser only)
router.post('/approve/:userId', auth, async (req, res) => {
    try {
        if (!isAdminOrSuper(req.user)) {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isApproved = true;
        await user.save();

        // Log activity
        await ActivityLog.create({
            action: 'UPDATE',
            entityType: 'USER',
            entityId: user._id,
            entityName: user.username,
            userId: req.user._id,
            username: req.user.username,
            details: `Approved user ${user.username}`
        });

        res.json({ message: `User ${user.username} has been approved`, user: user.toJSON() });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Reject user (admin/superuser only)
router.delete('/reject/:userId', auth, async (req, res) => {
    try {
        if (!isAdminOrSuper(req.user)) {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const username = user.username;
        await User.findByIdAndDelete(req.params.userId);

        // Log activity
        await ActivityLog.create({
            action: 'DELETE',
            entityType: 'USER',
            entityId: req.params.userId,
            entityName: username,
            userId: req.user._id,
            username: req.user.username,
            details: `Rejected user registration: ${username}`
        });

        res.json({ message: `User ${username} registration rejected` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update user role (superuser only)
router.patch('/role/:userId', auth, async (req, res) => {
    try {
        if (req.user.role !== 'superuser') {
            return res.status(403).json({ message: 'Superuser access required' });
        }

        const { role } = req.body;
        if (!['superuser', 'admin', 'user'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.role = role;
        await user.save();

        // Log activity
        await ActivityLog.create({
            action: 'UPDATE',
            entityType: 'USER',
            entityId: user._id,
            entityName: user.username,
            userId: req.user._id,
            username: req.user.username,
            details: `Changed ${user.username} role to ${role}`
        });

        res.json({ message: `User role updated to ${role}`, user: user.toJSON() });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete user (superuser only)
router.delete('/user/:userId', auth, async (req, res) => {
    try {
        if (req.user.role !== 'superuser') {
            return res.status(403).json({ message: 'Superuser access required' });
        }

        // Cannot delete yourself
        if (req.params.userId === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const username = user.username;
        await User.findByIdAndDelete(req.params.userId);

        // Log activity
        await ActivityLog.create({
            action: 'DELETE',
            entityType: 'USER',
            entityId: req.params.userId,
            entityName: username,
            userId: req.user._id,
            username: req.user.username,
            details: `Deleted user: ${username}`
        });

        res.json({ message: `User ${username} has been deleted` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Reset user password (superuser only)
router.post('/reset-password/:userId', auth, async (req, res) => {
    try {
        if (req.user.role !== 'superuser') {
            return res.status(403).json({ message: 'Superuser access required' });
        }

        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.password = newPassword;
        await user.save();

        // Log activity
        await ActivityLog.create({
            action: 'UPDATE',
            entityType: 'USER',
            entityId: user._id,
            entityName: user.username,
            userId: req.user._id,
            username: req.user.username,
            details: `Reset password for user: ${user.username}`
        });

        res.json({ message: `Password reset for ${user.username}` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
