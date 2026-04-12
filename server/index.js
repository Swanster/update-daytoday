require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const projectRoutes = require('./routes/projects');
const dailyRoutes = require('./routes/dailies');
const authRoutes = require('./routes/auth');
const activityLogRoutes = require('./routes/activityLogs');
const uploadRoutes = require('./routes/uploads');
const categoryRoutes = require('./routes/categories');
const caseTypeRoutes = require('./routes/caseTypes');
const picMemberRoutes = require('./routes/picMembers');
const dashboardRoutes = require('./routes/dashboard');
const clientRoutes = require('./routes/clients');
const workOrderRoutes = require('./routes/workOrders');
const briefingRoutes = require('./routes/briefings');
const { sanitizeInput } = require('./middleware/sanitize');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/project-tracker';

// ============================================
// RATE LIMITING CONFIGURATION
// ============================================

// General API rate limiter - 100 requests per 15 minutes
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        message: 'Too many requests from this IP, please try again after 15 minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limiter for authentication routes - 5 requests per minute
const authLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // Limit each IP to 5 login attempts per minute
    message: {
        message: 'Too many login attempts from this IP, please try again after 1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for successful requests (only count failures)
    skipSuccessfulRequests: false,
});

// Even stricter limiter for registration - 3 requests per minute
const registerLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 3, // Limit each IP to 3 registration attempts per minute
    message: {
        message: 'Too many registration attempts from this IP, please try again after 1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// File upload rate limiter - 10 requests per minute
const uploadLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // Limit each IP to 10 upload requests per minute
    message: {
        message: 'Too many upload requests from this IP, please try again after 1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Security headers with Helmet
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin for uploads
    contentSecurityPolicy: false, // Disable CSP for API (frontend handles this)
    xssFilter: true, // Enable XSS filter
    noSniff: true, // Prevent MIME type sniffing
    ieNoOpen: true, // Prevent IE from executing downloads
}));

// CORS middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || '*', // Restrict in production
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser with size limits
app.use(express.json({ 
    limit: '10mb', // Limit payload size to prevent DoS
    strict: true // Only accept arrays and objects
}));

// URL encoded parser with limit
app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb' 
}));

// ============================================
// APPLY RATE LIMITERS & SANITIZATION
// ============================================

// Apply general rate limiter to all API routes
app.use('/api', generalLimiter);

// Apply input sanitization to all routes
app.use(sanitizeInput);

// Apply strict rate limiters to auth routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', registerLimiter);

// Apply upload rate limiter
app.use('/api/uploads', uploadLimiter);

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// API ROUTES
// ============================================

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/dailies', dailyRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/case-types', caseTypeRoutes);
app.use('/api/pic-members', picMemberRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/work-orders', workOrderRoutes);
app.use('/api/briefings', briefingRoutes);

// Health check (no rate limiting for health checks)
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// SERVER STARTUP
// ============================================

// Only auto-start server if not in test mode
// In test mode, the test framework will handle server lifecycle
if (process.env.NODE_ENV !== 'test') {
    // Connect to MongoDB and start server
    mongoose.connect(MONGODB_URI)
        .then(() => {
            console.log('✅ Connected to MongoDB');
            app.listen(PORT, () => {
                console.log(`🚀 Server running on http://localhost:${PORT}`);
            });
        })
        .catch((error) => {
            console.error('❌ MongoDB connection error:', error.message);
            process.exit(1);
        });
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
});

// Export app for testing
module.exports = app;
