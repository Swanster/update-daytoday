const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT Secret - MUST be set in .env file
// This is a CRITICAL security requirement - NO fallback for production safety
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error('❌ CRITICAL ERROR: JWT_SECRET is not set in environment variables!');
    console.error('   Please set JWT_SECRET in your .env file before running the server.');
    console.error('   Generate a secure secret using:');
    console.error('   node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
    process.exit(1); // Exit immediately - DO NOT run without JWT_SECRET
}

// Validate JWT_SECRET strength
if (JWT_SECRET.length < 32) {
    console.warn('⚠️  WARNING: JWT_SECRET is less than 32 characters.');
    console.warn('   For production use, generate a stronger secret using:');
    console.warn('   node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
}

const SECRET = JWT_SECRET;

// Authentication middleware
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const decoded = jwt.verify(token, SECRET);
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
            const decoded = jwt.verify(token, SECRET);
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

module.exports = { auth, optionalAuth, adminOnly, adminOrSuperuser, JWT_SECRET: SECRET };
