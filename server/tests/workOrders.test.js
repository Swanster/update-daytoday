const request = require('supertest');
const mongoose = require('mongoose');
const WorkOrder = require('../models/WorkOrder');
const app = require('../index');

describe('🛠️ Work Orders API Tests', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    testUser = await getTestUser();
    authToken = await getAuthToken();
  });

  describe('GET /api/work-orders', () => {
    beforeEach(async () => {
      await WorkOrder.deleteMany({});
      await WorkOrder.insertMany([
        {
          clientName: 'Client A',
          clientStatus: 'New Client',
          services: 'Service A',
          detailRequest: 'Detail A',
          status: 'Progress',
          quarter: 'Q1-2025',
          year: 2025,
          quarterSequence: 1
        },
        {
          clientName: 'Client B',
          clientStatus: 'Existing',
          services: 'Service B',
          detailRequest: 'Detail B',
          status: 'Done',
          quarter: 'Q1-2025',
          year: 2025,
          quarterSequence: 2
        },
        {
          clientName: 'Client C',
          clientStatus: 'New Client',
          services: 'Service A',
          detailRequest: 'Detail C',
          status: 'Hold',
          quarter: 'Q2-2025',
          year: 2025,
          quarterSequence: 1
        }
      ]);
    });

    it('should get all work orders', async () => {
      const response = await request(app)
        .get('/api/work-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(3);
    });

    it('should filter work orders by quarter', async () => {
      const response = await request(app)
        .get('/api/work-orders?quarter=Q1-2025&year=2025')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.length).toBe(2);
      expect(response.body.every(wo => wo.quarter === 'Q1-2025')).toBe(true);
    });

    it('should filter work orders by year (yearly view)', async () => {
      const response = await request(app)
        .get('/api/work-orders?yearly=true&year=2025')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.length).toBe(3);
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/work-orders')
        .expect(401);

      expect(response.body.message).toContain('Authentication required');
    });
  });

  describe('GET /api/work-orders/quarters', () => {
    beforeEach(async () => {
      await WorkOrder.deleteMany({});
      await WorkOrder.create({
        clientName: 'Test Client',
        clientStatus: 'New Client',
        services: 'Service A',
        status: 'Progress',
        quarter: 'Q1-2025',
        year: 2025,
        quarterSequence: 1
      });
    });

    it('should get available quarters', async () => {
      const response = await request(app)
        .get('/api/work-orders/quarters')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/work-orders/quarters')
        .expect(401);
    });
  });

  describe('POST /api/work-orders', () => {
    beforeEach(async () => {
      await WorkOrder.deleteMany({});
    });

    it('should create a new work order', async () => {
      const woData = {
        clientName: 'New Client Test',
        clientStatus: 'New Client',
        sales: 'Sales Person',
        services: 'Service A',
        detailRequest: 'Detail Request',
        status: 'Progress'
      };

      const response = await request(app)
        .post('/api/work-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(woData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.clientName).toBe('New Client Test');
      expect(response.body).toHaveProperty('quarter');
      expect(response.body).toHaveProperty('quarterSequence');
    });

    it('should auto-assign quarter if not provided', async () => {
      const woData = {
        clientName: 'Auto Quarter Client',
        clientStatus: 'Existing',
        services: 'Service A'
      };

      const response = await request(app)
        .post('/api/work-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(woData)
        .expect(201);

      expect(response.body).toHaveProperty('quarter');
      expect(response.body.quarter).toMatch(/^Q[1-4]-\d{4}$/);
    });

    it('should reject unauthenticated request', async () => {
      const woData = {
        clientName: 'Test Client',
        clientStatus: 'New Client'
      };

      const response = await request(app)
        .post('/api/work-orders')
        .send(woData)
        .expect(401);
    });
  });

  describe('PUT /api/work-orders/:id', () => {
    let createdWO;

    beforeEach(async () => {
      await WorkOrder.deleteMany({});
      createdWO = await WorkOrder.create({
        clientName: 'Test Client',
        clientStatus: 'New Client',
        services: 'Service A',
        detailRequest: 'Original Detail',
        status: 'Progress',
        quarter: 'Q1-2025',
        year: 2025,
        quarterSequence: 1
      });
    });

    it('should update a work order', async () => {
      const updateData = {
        status: 'Done',
        detailRequest: 'Updated Detail'
      };

      const response = await request(app)
        .put(`/api/work-orders/${createdWO._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe('Done');
      expect(response.body.detailRequest).toBe('Updated Detail');
    });

    it('should update requestBarang field', async () => {
      const updateData = {
        requestBarang: 'Done'
      };

      const response = await request(app)
        .put(`/api/work-orders/${createdWO._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.requestBarang).toBe('Done');
    });

    it('should update requestJasa field', async () => {
      const updateData = {
        requestJasa: 'Progress'
      };

      const response = await request(app)
        .put(`/api/work-orders/${createdWO._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.requestJasa).toBe('Progress');
    });

    it('should reject update for non-existent WO', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const updateData = { status: 'Done' };

      const response = await request(app)
        .put(`/api/work-orders/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);
    });

    it('should reject unauthenticated update', async () => {
      const updateData = { status: 'Done' };

      const response = await request(app)
        .put(`/api/work-orders/${createdWO._id}`)
        .send(updateData)
        .expect(401);
    });
  });

  describe('DELETE /api/work-orders/:id', () => {
    let createdWO;

    beforeEach(async () => {
      await WorkOrder.deleteMany({});
      createdWO = await WorkOrder.create({
        clientName: 'Test Client',
        clientStatus: 'New Client',
        services: 'Service A',
        status: 'Progress',
        quarter: 'Q1-2025',
        year: 2025,
        quarterSequence: 1
      });
    });

    it('should delete a work order', async () => {
      const response = await request(app)
        .delete(`/api/work-orders/${createdWO._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toContain('deleted');

      const deleted = await WorkOrder.findById(createdWO._id);
      expect(deleted).toBeNull();
    });

    it('should reject unauthenticated delete', async () => {
      const response = await request(app)
        .delete(`/api/work-orders/${createdWO._id}`)
        .expect(401);
    });
  });

  describe('POST /api/work-orders/batch-status', () => {
    let woIds;

    beforeEach(async () => {
      await WorkOrder.deleteMany({});
      const wos = await WorkOrder.insertMany([
        {
          clientName: 'WO 1',
          clientStatus: 'New Client',
          services: 'Service A',
          status: 'Progress',
          quarter: 'Q1-2025',
          year: 2025,
          quarterSequence: 1
        },
        {
          clientName: 'WO 2',
          clientStatus: 'Existing',
          services: 'Service B',
          status: 'Progress',
          quarter: 'Q1-2025',
          year: 2025,
          quarterSequence: 2
        }
      ]);
      woIds = wos.map(wo => wo._id.toString());
    });

    it('should batch update status', async () => {
      const batchData = {
        ids: woIds,
        status: 'Done'
      };

      const response = await request(app)
        .post('/api/work-orders/batch-status')
        .set('Authorization', `Bearer ${authToken}`)
        .send(batchData)
        .expect(200);

      expect(response.body.count).toBe(2);

      const updatedWOs = await WorkOrder.find({ _id: { $in: woIds } });
      expect(updatedWOs.every(wo => wo.status === 'Done')).toBe(true);
    });

    it('should reject batch update without IDs', async () => {
      const batchData = {
        status: 'Done'
      };

      const response = await request(app)
        .post('/api/work-orders/batch-status')
        .set('Authorization', `Bearer ${authToken}`)
        .send(batchData)
        .expect(400);
    });

    it('should reject unauthenticated batch update', async () => {
      const batchData = {
        ids: woIds,
        status: 'Done'
      };

      const response = await request(app)
        .post('/api/work-orders/batch-status')
        .send(batchData)
        .expect(401);
    });
  });

  describe('GET /api/work-orders/report', () => {
    beforeEach(async () => {
      await WorkOrder.deleteMany({});
      await WorkOrder.insertMany([
        {
          clientName: 'Report Client 1',
          clientStatus: 'New Client',
          services: 'Service A',
          status: 'Done',
          quarter: 'Q1-2025',
          year: 2025,
          quarterSequence: 1
        },
        {
          clientName: 'Report Client 2',
          clientStatus: 'Existing',
          services: 'Service B',
          status: 'Progress',
          quarter: 'Q1-2025',
          year: 2025,
          quarterSequence: 2
        }
      ]);
    });

    it('should get quarterly report', async () => {
      const response = await request(app)
        .get('/api/work-orders/report?quarter=Q1-2025&year=2025')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('clientStatusStats');
      expect(response.body).toHaveProperty('serviceStats');
    });

    it('should get yearly report', async () => {
      const response = await request(app)
        .get('/api/work-orders/report?yearly=true&year=2025')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('quarterlyTrend');
    });

    it('should calculate correct client status stats', async () => {
      const response = await request(app)
        .get('/api/work-orders/report?quarter=Q1-2025&year=2025')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.clientStatusStats['New Client'].total).toBe(1);
      expect(response.body.clientStatusStats['Existing'].total).toBe(1);
    });

    it('should reject unauthenticated report request', async () => {
      const response = await request(app)
        .get('/api/work-orders/report?quarter=Q1-2025&year=2025')
        .expect(401);
    });
  });
});
