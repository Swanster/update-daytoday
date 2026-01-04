const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'project-tracker-secret-key-2024';

// Authentication middleware
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Optional auth - doesn't require token but sets user if present
const optionalAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (token) {
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await User.findById(decoded.userId);
            if (user) {
                req.user = user;
                req.token = token;
            }
        }
        next();
    } catch (error) {
        // Continue without user
        next();
    }
};

// Admin only middleware
const adminOnly = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

// Admin or Superuser middleware
const adminOrSuperuser = (req, res, next) => {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superuser')) {
        return res.status(403).json({ message: 'Admin or Superuser access required' });
    }
    next();
};

module.exports = { auth, optionalAuth, adminOnly, adminOrSuperuser, JWT_SECRET };
