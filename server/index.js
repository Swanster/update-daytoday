require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
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

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/project-tracker';

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin for uploads
    contentSecurityPolicy: false // Disable CSP for API (frontend handles this)
}));

// CORS middleware
app.use(cors());

// Body parser
app.use(express.json({ limit: '10mb' })); // Limit payload size

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
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

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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

// Handle graceful shutdown
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
});
