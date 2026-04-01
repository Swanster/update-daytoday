const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = require('../index');
const User = require('../models/User');

describe('🔐 Authentication API Tests', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    // Get test user and token
    testUser = await getTestUser();
    authToken = await getAuthToken();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'newuser123',
        password: 'password123',
        displayName: 'New User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.username).toBe('newuser123');
      expect(response.body.displayName).toBe('New User');
      expect(response.body.isApproved).toBe(false); // New users need approval
    });

    it('should reject registration with short username', async () => {
      const userData = {
        username: 'ab', // Too short (min 3 chars)
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Validation failed');
    });

    it('should reject registration with short password', async () => {
      const userData = {
        username: 'validusername',
        password: '12345' // Too short (min 6 chars)
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Validation failed');
    });

    it('should reject registration with invalid username characters', async () => {
      const userData = {
        username: 'invalid@username!', // Contains special chars
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Validation failed');
    });

    it('should reject duplicate username', async () => {
      const userData = {
        username: 'testadmin', // Already exists
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toContain('already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // First create a user with known password
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      await User.create({
        username: 'loginuser',
        password: hashedPassword,
        displayName: 'Login User',
        role: 'user',
        isApproved: true
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'loginuser',
          password: 'password123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe('loginuser');
    });

    it('should reject login with invalid username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistentuser',
          password: 'password123'
        })
        .expect(401);

      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testadmin',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should reject login for pending user', async () => {
      // Create pending user
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      await User.create({
        username: 'pendinguser',
        password: hashedPassword,
        displayName: 'Pending User',
        role: 'user',
        isApproved: false
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'pendinguser',
          password: 'password123'
        })
        .expect(401);

      expect(response.body.message).toContain('pending approval');
    });

    it('should reject login without username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123'
        })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Validation failed');
    });

    it('should reject login without password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testadmin'
        })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Validation failed');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get current user info with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.username).toBe('testadmin');
      expect(response.body.role).toBe('superuser');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.message).toContain('Authentication required');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.message).toContain('Invalid token');
    });
  });

  describe('PUT /api/auth/password', () => {
    it('should change password successfully', async () => {
      const response = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword123'
        })
        .expect(200);

      expect(response.body.message).toContain('Password changed');

      // Verify new password works
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testadmin',
          password: 'newpassword123'
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('token');
    });

    it('should reject password change with wrong current password', async () => {
      const response = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123'
        })
        .expect(401);

      expect(response.body.message).toContain('Current password is incorrect');
    });

    it('should reject password change with short new password', async () => {
      const response = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: '12345' // Too short
        })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Validation failed');
    });

    it('should reject password change without token', async () => {
      const response = await request(app)
        .put('/api/auth/password')
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword123'
        })
        .expect(401);

      expect(response.body.message).toContain('Authentication required');
    });
  });

  describe('GET /api/auth/pending', () => {
    it('should get pending users (superuser only)', async () => {
      // Create some pending users
      await User.create({
        username: 'pendinguser1',
        password: 'hashedpassword',
        displayName: 'Pending User 1',
        role: 'user',
        isApproved: false
      });

      const response = await request(app)
        .get('/api/auth/pending')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should reject non-superuser from viewing pending users', async () => {
      // Create admin user
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const adminUser = await User.create({
        username: 'adminuser',
        password: hashedPassword,
        displayName: 'Admin User',
        role: 'admin',
        isApproved: true
      });

      const adminToken = jwt.sign(
        { userId: adminUser._id },
        process.env.JWT_SECRET
      );

      const response = await request(app)
        .get('/api/auth/pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);

      expect(response.body.message).toContain('Superuser access required');
    });
  });
});
