const mongoose = require('mongoose');

// ============================================
// TEST SETUP - CHOOSE ONE OPTION
// ============================================
// OPTION 1: Use MongoDB in-memory (slower, no MongoDB needed)
// OPTION 2: Use local MongoDB instance (faster, requires MongoDB running)
// ============================================

const USE_IN_MEMORY = process.env.TEST_DB === 'memory';

let mongoServer = null;

beforeAll(async () => {
  // Set JWT_SECRET untuk testing
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only-1234567890';
  process.env.NODE_ENV = 'test';
  
  if (USE_IN_MEMORY) {
    // OPTION 1: MongoDB in-memory
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    process.env.MONGODB_URI = mongoUri;
    console.log('✅ Using MongoDB in-memory server');
  } else {
    // OPTION 2: Local MongoDB instance (faster)
    process.env.MONGODB_URI = 'mongodb://localhost:27017/project-tracker-test';
    console.log('✅ Using local MongoDB instance');
  }
  
  // Connect to MongoDB
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Test environment setup complete');
}, 90000);

afterAll(async () => {
  await mongoose.disconnect();
  
  if (mongoServer) {
    await mongoServer.stop();
  }
  
  console.log('✅ Test environment cleanup complete');
});

beforeEach(async () => {
  // Drop semua collections untuk clean state
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    try {
      await collection.deleteMany({});
    } catch (err) {
      // Ignore errors
    }
  }
  
  // Create default test user
  const bcrypt = require('bcryptjs');
  const User = require('../models/User');
  
  try {
    const hashedPassword = await bcrypt.hash('password123', 10);
    await User.create({
      username: 'testadmin',
      password: hashedPassword,
      displayName: 'Test Admin',
      role: 'superuser',
      isApproved: true
    });
  } catch (err) {
    // User might already exist
  }
});

// Global helpers
global.getTestUser = async () => {
  const User = require('../models/User');
  return await User.findOne({ username: 'testadmin' });
};

global.getAuthToken = async (username = 'testadmin') => {
  const jwt = require('jsonwebtoken');
  const User = require('../models/User');
  const user = await User.findOne({ username });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  return jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
};
