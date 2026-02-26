const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('./models/User'); // Assuming this exists
const WorkOrder = require('./models/WorkOrder');

async function runTest() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/project-tracker');
        console.log('Connected to MongoDB');
        
        let user = await User.findOne({});
        if (!user) {
            console.log('No user found to impersonate');
            process.exit(1);
        }
        
        const SECRET = process.env.JWT_SECRET || 'dev-only-secret-do-not-use-in-production';
        const token = jwt.sign({ userId: user._id }, SECRET);
        
        console.log('Got token for user:', user.username || user.email);
        
        const response = await fetch('http://localhost:5000/api/work-orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                clientStatus: 'New Client',
                clientName: 'Test Server Client',
                sales: 'Test Sales',
                services: 'MANAGE SERVICES WAAS',
                requestBarang: 'Progress',
                requestJasa: 'No Need',
                status: 'Progress',
                quarter: 'Q1-2025',
                year: 2025
            })
        });
        
        const data = await response.json().catch(() => null);
        console.log('Response Status:', response.status);
        console.log('Response Data:', data);
        
    } catch (e) {
        console.error('FETCH ERROR:', e);
    } finally {
        await mongoose.disconnect();
    }
}

runTest();
