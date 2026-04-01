const request = require('supertest');
const mongoose = require('mongoose');
const Daily = require('../models/Daily');
const app = require('../index');

describe('📅 Daily Activities API Tests', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    testUser = await getTestUser();
    authToken = await getAuthToken();
  });

  describe('GET /api/dailies', () => {
    beforeEach(async () => {
      await Daily.deleteMany({});
      await Daily.insertMany([
        {
          clientName: 'Client A',
          services: ['Service A'],
          caseIssue: ['Issue 1'],
          action: 'Onsite',
          status: 'Done',
          quarter: 'Q1-2025',
          year: 2025,
          quarterSequence: 1
        },
        {
          clientName: 'Client B',
          services: ['Service B'],
          caseIssue: ['Issue 2'],
          action: 'Remote',
          status: 'Progress',
          quarter: 'Q1-2025',
          year: 2025,
          quarterSequence: 2
        },
        {
          clientName: 'Client C',
          services: ['Service A'],
          caseIssue: ['Issue 3'],
          action: 'Onsite',
          status: 'Hold',
          quarter: 'Q2-2025',
          year: 2025,
          quarterSequence: 1
        }
      ]);
    });

    it('should get all daily entries without filter', async () => {
      const response = await request(app)
        .get('/api/dailies')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(3);
    });

    it('should filter daily entries by quarter', async () => {
      const response = await request(app)
        .get('/api/dailies?quarter=Q1-2025&year=2025')
        .expect(200);

      expect(response.body.length).toBe(2);
      expect(response.body.every(d => d.quarter === 'Q1-2025')).toBe(true);
    });

    it('should filter daily entries by year (yearly view)', async () => {
      const response = await request(app)
        .get('/api/dailies?yearly=true&year=2025')
        .expect(200);

      expect(response.body.length).toBe(3);
    });

    it('should return empty array for non-existent quarter', async () => {
      const response = await request(app)
        .get('/api/dailies?quarter=Q4-2024&year=2024')
        .expect(200);

      expect(response.body.length).toBe(0);
    });
  });

  describe('GET /api/dailies/quarters', () => {
    beforeEach(async () => {
      await Daily.deleteMany({});
      await Daily.create({
        clientName: 'Test Client',
        services: ['Service A'],
        status: 'Progress',
        quarter: 'Q1-2025',
        year: 2025,
        quarterSequence: 1
      });
    });

    it('should get available quarters', async () => {
      const response = await request(app)
        .get('/api/dailies/quarters')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/dailies', () => {
    beforeEach(async () => {
      await Daily.deleteMany({});
    });

    it('should create a new daily entry', async () => {
      const dailyData = {
        clientName: 'New Client Daily',
        services: ['Service A', 'Service B'],
        caseIssue: ['Issue 1', 'Issue 2'],
        action: 'Onsite',
        detailAction: 'Detailed action description'
      };

      const response = await request(app)
        .post('/api/dailies')
        .set('Authorization', `Bearer ${authToken}`)
        .send(dailyData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.clientName).toBe('New Client Daily');
      expect(response.body).toHaveProperty('quarter');
      expect(response.body).toHaveProperty('quarterSequence');
    });

    it('should auto-assign quarter based on date', async () => {
      const dailyData = {
        clientName: 'Auto Quarter Daily',
        services: ['Service A'],
        date: '2025-07-15' // Q3
      };

      const response = await request(app)
        .post('/api/dailies')
        .set('Authorization', `Bearer ${authToken}`)
        .send(dailyData)
        .expect(201);

      expect(response.body.quarter).toBe('Q3-2025');
    });

    it('should reject daily entry without client name', async () => {
      const dailyData = {
        services: ['Service A'],
        action: 'Onsite'
      };

      const response = await request(app)
        .post('/api/dailies')
        .set('Authorization', `Bearer ${authToken}`)
        .send(dailyData)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Validation failed');
    });

    it('should reject unauthenticated request', async () => {
      const dailyData = {
        clientName: 'Test Client',
        services: ['Service A']
      };

      const response = await request(app)
        .post('/api/dailies')
        .send(dailyData)
        .expect(401);
    });
  });

  describe('PUT /api/dailies/:id', () => {
    let createdDaily;

    beforeEach(async () => {
      await Daily.deleteMany({});
      createdDaily = await Daily.create({
        clientName: 'Test Client',
        services: ['Service A'],
        caseIssue: ['Issue 1'],
        action: 'Onsite',
        status: 'Progress',
        quarter: 'Q1-2025',
        year: 2025,
        quarterSequence: 1
      });
    });

    it('should update a daily entry', async () => {
      const updateData = {
        status: 'Done',
        detailAction: 'Updated detail action'
      };

      const response = await request(app)
        .put(`/api/dailies/${createdDaily._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe('Done');
      expect(response.body.detailAction).toBe('Updated detail action');
    });

    it('should update daily quarter when date changes', async () => {
      const updateData = {
        date: '2025-10-15' // Q4
      };

      const response = await request(app)
        .put(`/api/dailies/${createdDaily._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.quarter).toBe('Q4-2025');
    });

    it('should reject update for non-existent daily', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const updateData = { status: 'Done' };

      const response = await request(app)
        .put(`/api/dailies/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);
    });

    it('should reject unauthenticated update', async () => {
      const updateData = { status: 'Done' };

      const response = await request(app)
        .put(`/api/dailies/${createdDaily._id}`)
        .send(updateData)
        .expect(401);
    });
  });

  describe('DELETE /api/dailies/:id', () => {
    let createdDaily;

    beforeEach(async () => {
      await Daily.deleteMany({});
      createdDaily = await Daily.create({
        clientName: 'Test Client',
        services: ['Service A'],
        status: 'Progress',
        quarter: 'Q1-2025',
        year: 2025,
        quarterSequence: 1
      });
    });

    it('should delete a daily entry', async () => {
      const response = await request(app)
        .delete(`/api/dailies/${createdDaily._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toContain('deleted successfully');

      const deleted = await Daily.findById(createdDaily._id);
      expect(deleted).toBeNull();
    });

    it('should reject delete for non-existent daily', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .delete(`/api/dailies/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should reject unauthenticated delete', async () => {
      const response = await request(app)
        .delete(`/api/dailies/${createdDaily._id}`)
        .expect(401);
    });
  });

  describe('PATCH /api/dailies/batch-status', () => {
    let dailyIds;

    beforeEach(async () => {
      await Daily.deleteMany({});
      const dailies = await Daily.insertMany([
        {
          clientName: 'Daily 1',
          services: ['Service A'],
          status: 'Progress',
          quarter: 'Q1-2025',
          year: 2025,
          quarterSequence: 1
        },
        {
          clientName: 'Daily 2',
          services: ['Service B'],
          status: 'Progress',
          quarter: 'Q1-2025',
          year: 2025,
          quarterSequence: 2
        }
      ]);
      dailyIds = dailies.map(d => d._id.toString());
    });

    it('should batch update status', async () => {
      const batchData = {
        ids: dailyIds,
        status: 'Done'
      };

      const response = await request(app)
        .patch('/api/dailies/batch-status')
        .set('Authorization', `Bearer ${authToken}`)
        .send(batchData)
        .expect(200);

      expect(response.body.modifiedCount).toBe(2);

      const updatedDailies = await Daily.find({ _id: { $in: dailyIds } });
      expect(updatedDailies.every(d => d.status === 'Done')).toBe(true);
    });

    it('should reject batch update without IDs', async () => {
      const batchData = {
        status: 'Done'
      };

      const response = await request(app)
        .patch('/api/dailies/batch-status')
        .set('Authorization', `Bearer ${authToken}`)
        .send(batchData)
        .expect(400);
    });

    it('should reject unauthenticated batch update', async () => {
      const batchData = {
        ids: dailyIds,
        status: 'Done'
      };

      const response = await request(app)
        .patch('/api/dailies/batch-status')
        .send(batchData)
        .expect(401);
    });
  });

  describe('GET /api/dailies/report', () => {
    beforeEach(async () => {
      await Daily.deleteMany({});
      await Daily.insertMany([
        {
          clientName: 'Report Client 1',
          services: ['Service A', 'Service B'],
          action: 'Onsite',
          status: 'Done',
          quarter: 'Q1-2025',
          year: 2025,
          quarterSequence: 1
        },
        {
          clientName: 'Report Client 2',
          services: ['Service A'],
          action: 'Remote',
          status: 'Progress',
          quarter: 'Q1-2025',
          year: 2025,
          quarterSequence: 2
        }
      ]);
    });

    it('should get quarterly report', async () => {
      const response = await request(app)
        .get('/api/dailies/report?quarter=Q1-2025&year=2025')
        .expect(200);

      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('serviceStats');
      expect(response.body).toHaveProperty('actionStats');
      expect(response.body.reportType).toBe('quarterly');
    });

    it('should get yearly report', async () => {
      const response = await request(app)
        .get('/api/dailies/report?yearly=true&year=2025')
        .expect(200);

      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('quarterlyTrend');
      expect(response.body.reportType).toBe('yearly');
    });

    it('should calculate correct action stats', async () => {
      const response = await request(app)
        .get('/api/dailies/report?quarter=Q1-2025&year=2025')
        .expect(200);

      expect(response.body.actionStats.onsite).toBe(1);
      expect(response.body.actionStats.remote).toBe(1);
    });

    it('should calculate correct summary statistics', async () => {
      const response = await request(app)
        .get('/api/dailies/report?quarter=Q1-2025&year=2025')
        .expect(200);

      expect(response.body.summary.total).toBe(2);
      expect(response.body.summary.done).toBe(1);
      expect(response.body.summary.progress).toBe(1);
    });
  });
});
