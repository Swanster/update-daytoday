const request = require('supertest');
const mongoose = require('mongoose');
const Project = require('../models/Project');
const app = require('../index');

describe('📋 Projects API Tests', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    testUser = await getTestUser();
    authToken = await getAuthToken();
  });

  describe('GET /api/projects', () => {
    beforeEach(async () => {
      await Project.deleteMany({});
      // Create test projects
      await Project.insertMany([
        {
          projectName: 'Test Project 1',
          services: ['Service A', 'Service B'],
          status: 'Progress',
          quarter: 'Q1-2025',
          year: 2025,
          quarterSequence: 1
        },
        {
          projectName: 'Test Project 2',
          services: ['Service C'],
          status: 'Done',
          quarter: 'Q1-2025',
          year: 2025,
          quarterSequence: 2
        },
        {
          projectName: 'Test Project 3',
          services: ['Service A'],
          status: 'Hold',
          quarter: 'Q2-2025',
          year: 2025,
          quarterSequence: 1
        }
      ]);
    });

    it('should get all projects without filter', async () => {
      const response = await request(app)
        .get('/api/projects')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(3);
    });

    it('should filter projects by quarter', async () => {
      const response = await request(app)
        .get('/api/projects?quarter=Q1-2025&year=2025')
        .expect(200);

      expect(response.body.length).toBe(2);
      expect(response.body.every(p => p.quarter === 'Q1-2025')).toBe(true);
    });

    it('should filter projects by year (yearly view)', async () => {
      const response = await request(app)
        .get('/api/projects?yearly=true&year=2025')
        .expect(200);

      expect(response.body.length).toBe(3);
    });

    it('should return empty array for non-existent quarter', async () => {
      const response = await request(app)
        .get('/api/projects?quarter=Q4-2024&year=2024')
        .expect(200);

      expect(response.body.length).toBe(0);
    });
  });

  describe('GET /api/projects/quarters', () => {
    beforeEach(async () => {
      await Project.deleteMany({});
      await Project.insertMany([
        {
          projectName: 'Test Project',
          status: 'Progress',
          quarter: 'Q1-2025',
          year: 2025,
          quarterSequence: 1
        }
      ]);
    });

    it('should get available quarters', async () => {
      const response = await request(app)
        .get('/api/projects/quarters')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/projects', () => {
    beforeEach(async () => {
      await Project.deleteMany({});
    });

    it('should create a new project', async () => {
      const projectData = {
        projectName: 'New Test Project',
        services: ['Service A', 'Service B'],
        status: 'Progress',
        dueDate: '2025-12-31'
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.projectName).toBe('New Test Project');
      expect(response.body).toHaveProperty('quarter');
      expect(response.body).toHaveProperty('quarterSequence');
    });

    it('should reject project without name', async () => {
      const projectData = {
        services: ['Service A'],
        status: 'Progress'
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Validation failed');
    });

    it('should reject unauthenticated request', async () => {
      const projectData = {
        projectName: 'New Test Project',
        services: ['Service A']
      };

      const response = await request(app)
        .post('/api/projects')
        .send(projectData)
        .expect(401);

      expect(response.body.message).toContain('Authentication required');
    });
  });

  describe('PUT /api/projects/:id', () => {
    let createdProject;

    beforeEach(async () => {
      await Project.deleteMany({});
      createdProject = await Project.create({
        projectName: 'Test Project',
        services: ['Service A'],
        status: 'Progress',
        quarter: 'Q1-2025',
        year: 2025,
        quarterSequence: 1
      });
    });

    it('should update a project', async () => {
      const updateData = {
        status: 'Done',
        progress: 'Project completed successfully'
      };

      const response = await request(app)
        .put(`/api/projects/${createdProject._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe('Done');
      expect(response.body.progress).toBe('Project completed successfully');
    });

    it('should update project quarter when date changes', async () => {
      const updateData = {
        date: '2025-07-15' // Q3
      };

      const response = await request(app)
        .put(`/api/projects/${createdProject._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.quarter).toBe('Q3-2025');
    });

    it('should reject update for non-existent project', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const updateData = { status: 'Done' };

      const response = await request(app)
        .put(`/api/projects/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('should reject unauthenticated update', async () => {
      const updateData = { status: 'Done' };

      const response = await request(app)
        .put(`/api/projects/${createdProject._id}`)
        .send(updateData)
        .expect(401);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    let createdProject;

    beforeEach(async () => {
      await Project.deleteMany({});
      createdProject = await Project.create({
        projectName: 'Test Project',
        services: ['Service A'],
        status: 'Progress',
        quarter: 'Q1-2025',
        year: 2025,
        quarterSequence: 1
      });
    });

    it('should delete a project', async () => {
      const response = await request(app)
        .delete(`/api/projects/${createdProject._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toContain('deleted successfully');

      // Verify deletion
      const deleted = await Project.findById(createdProject._id);
      expect(deleted).toBeNull();
    });

    it('should reject delete for non-existent project', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .delete(`/api/projects/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should reject unauthenticated delete', async () => {
      const response = await request(app)
        .delete(`/api/projects/${createdProject._id}`)
        .expect(401);
    });
  });

  describe('POST /api/projects/carry-forward', () => {
    beforeEach(async () => {
      await Project.deleteMany({});
      // Create projects in Q1-2025
      await Project.insertMany([
        {
          projectName: 'Project To Carry',
          services: ['Service A'],
          status: 'Progress', // Not done, should carry forward
          quarter: 'Q1-2025',
          year: 2025,
          quarterSequence: 1
        },
        {
          projectName: 'Project Done',
          services: ['Service A'],
          status: 'Done', // Done, should NOT carry forward
          quarter: 'Q1-2025',
          year: 2025,
          quarterSequence: 2
        }
      ]);
    });

    it('should carry forward unfinished projects', async () => {
      const carryData = {
        fromQuarter: 'Q1-2025',
        fromYear: 2025,
        toQuarter: 'Q2-2025',
        toYear: 2025
      };

      const response = await request(app)
        .post('/api/projects/carry-forward')
        .send(carryData)
        .expect(200);

      expect(response.body.copied).toBe(1);
      expect(response.body.projects).toContain('Project To Carry');

      // Verify new project exists in Q2
      const carriedProject = await Project.findOne({
        quarter: 'Q2-2025',
        projectName: 'Project To Carry'
      });
      expect(carriedProject).not.toBeNull();
    });

    it('should not carry forward already done projects', async () => {
      const carryData = {
        fromQuarter: 'Q1-2025',
        fromYear: 2025,
        toQuarter: 'Q2-2025',
        toYear: 2025
      };

      await request(app)
        .post('/api/projects/carry-forward')
        .send(carryData);

      // Verify done project was not copied
      const doneInQ2 = await Project.findOne({
        quarter: 'Q2-2025',
        projectName: 'Project Done'
      });
      expect(doneInQ2).toBeNull();
    });

    it('should not duplicate projects that already exist in target quarter', async () => {
      // Create project in target quarter
      await Project.create({
        projectName: 'Project To Carry',
        services: ['Service A'],
        status: 'Progress',
        quarter: 'Q2-2025',
        year: 2025,
        quarterSequence: 1
      });

      const carryData = {
        fromQuarter: 'Q1-2025',
        fromYear: 2025,
        toQuarter: 'Q2-2025',
        toYear: 2025
      };

      const response = await request(app)
        .post('/api/projects/carry-forward')
        .send(carryData)
        .expect(200);

      expect(response.body.copied).toBe(0);
    });
  });

  describe('PATCH /api/projects/batch-status', () => {
    let projectIds;

    beforeEach(async () => {
      await Project.deleteMany({});
      const projects = await Project.insertMany([
        {
          projectName: 'Project 1',
          services: ['Service A'],
          status: 'Progress',
          quarter: 'Q1-2025',
          year: 2025,
          quarterSequence: 1
        },
        {
          projectName: 'Project 2',
          services: ['Service A'],
          status: 'Progress',
          quarter: 'Q1-2025',
          year: 2025,
          quarterSequence: 2
        }
      ]);
      projectIds = projects.map(p => p._id.toString());
    });

    it('should batch update status', async () => {
      const batchData = {
        ids: projectIds,
        status: 'Done'
      };

      const response = await request(app)
        .patch('/api/projects/batch-status')
        .set('Authorization', `Bearer ${authToken}`)
        .send(batchData)
        .expect(200);

      expect(response.body.modifiedCount).toBe(2);

      // Verify updates
      const updatedProjects = await Project.find({ _id: { $in: projectIds } });
      expect(updatedProjects.every(p => p.status === 'Done')).toBe(true);
    });

    it('should reject batch update without IDs', async () => {
      const batchData = {
        status: 'Done'
      };

      const response = await request(app)
        .patch('/api/projects/batch-status')
        .set('Authorization', `Bearer ${authToken}`)
        .send(batchData)
        .expect(400);
    });

    it('should reject batch update without status', async () => {
      const batchData = {
        ids: projectIds
      };

      const response = await request(app)
        .patch('/api/projects/batch-status')
        .set('Authorization', `Bearer ${authToken}`)
        .send(batchData)
        .expect(400);
    });

    it('should reject unauthenticated batch update', async () => {
      const batchData = {
        ids: projectIds,
        status: 'Done'
      };

      const response = await request(app)
        .patch('/api/projects/batch-status')
        .send(batchData)
        .expect(401);
    });
  });

  describe('GET /api/projects/report', () => {
    beforeEach(async () => {
      await Project.deleteMany({});
      await Project.insertMany([
        {
          projectName: 'Report Test 1',
          services: ['Service A', 'Service B'],
          status: 'Done',
          quarter: 'Q1-2025',
          year: 2025,
          quarterSequence: 1
        },
        {
          projectName: 'Report Test 2',
          services: ['Service A'],
          status: 'Progress',
          quarter: 'Q1-2025',
          year: 2025,
          quarterSequence: 2
        }
      ]);
    });

    it('should get quarterly report', async () => {
      const response = await request(app)
        .get('/api/projects/report?quarter=Q1-2025&year=2025')
        .expect(200);

      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('serviceStats');
      expect(response.body.reportType).toBe('quarterly');
    });

    it('should get yearly report', async () => {
      const response = await request(app)
        .get('/api/projects/report?yearly=true&year=2025')
        .expect(200);

      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('quarterlyTrend');
      expect(response.body.reportType).toBe('yearly');
    });

    it('should calculate correct summary statistics', async () => {
      const response = await request(app)
        .get('/api/projects/report?quarter=Q1-2025&year=2025')
        .expect(200);

      expect(response.body.summary.total).toBe(2);
      expect(response.body.summary.done).toBe(1);
      expect(response.body.summary.progress).toBe(1);
    });
  });
});
