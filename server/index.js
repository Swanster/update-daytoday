const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const projectRoutes = require('./routes/projects');
const dailyRoutes = require('./routes/dailies');
const authRoutes = require('./routes/auth');
const activityLogRoutes = require('./routes/activityLogs');
const uploadRoutes = require('./routes/uploads');
const categoryRoutes = require('./routes/categories');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/project-tracker';

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/dailies', dailyRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/categories', categoryRoutes);

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
