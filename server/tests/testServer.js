const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');

class TestServer {
  constructor() {
    this.mongoServer = null;
    this.app = null;
    this.server = null;
  }

  async start() {
    // Start in-memory MongoDB
    this.mongoServer = await MongoMemoryServer.create();
    const mongoUri = this.mongoServer.getUri();
    
    // Override MONGODB_URI sebelum app di-load
    process.env.MONGODB_URI = mongoUri;
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only-1234567890';
    process.env.NODE_ENV = 'test';
    
    // Load app (akan connect ke in-memory DB)
    this.app = require('../index');
    
    console.log('✅ Test server started');
  }

  async stop() {
    if (this.server) {
      this.server.close();
    }
    
    if (mongoose.connection) {
      await mongoose.disconnect();
    }
    
    if (this.mongoServer) {
      await this.mongoServer.stop();
    }
    
    console.log('✅ Test server stopped');
  }

  async cleanup() {
    // Drop semua collections
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      try {
        await collection.deleteMany({});
      } catch (err) {
        // Ignore errors
      }
    }
  }

  async createTestUser(userData = {}) {
    const bcrypt = require('bcryptjs');
    const User = require('../models/User');
    
    const user = await User.create({
      username: userData.username || 'testuser',
      password: await bcrypt.hash(userData.password || 'password123', 10),
      displayName: userData.displayName || 'Test User',
      role: userData.role || 'superuser',
      isApproved: userData.isApproved !== undefined ? userData.isApproved : true,
      ...userData
    });
    
    return user;
  }

  async getAuthToken(username = 'testuser') {
    const jwt = require('jsonwebtoken');
    const User = require('../models/User');
    const user = await User.findOne({ username });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
  }

  request() {
    return request(this.app);
  }
}

// Export singleton instance
const testServer = new TestServer();

module.exports = testServer;
