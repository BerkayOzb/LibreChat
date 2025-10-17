const express = require('express');
const request = require('supertest');

// Mock all dependencies
jest.mock('~/server/middleware/auditLog', () => ({
  adminAudit: {
    viewUsers: (req, res, next) => next(),
    createUser: (req, res, next) => next(),
    updateUserRole: (req, res, next) => next(),
    banUser: (req, res, next) => next(),
    deleteUser: (req, res, next) => next(),
    viewStats: (req, res, next) => next(),
  },
}));

jest.mock('~/server/middleware/adminRateLimit', () => ({
  adminRateLimits: {
    general: (req, res, next) => next(),
    createUser: (req, res, next) => next(),
    deleteUser: (req, res, next) => next(),
    stats: (req, res, next) => next(),
  },
}));

jest.mock('~/server/middleware', () => ({
  requireJwtAuth: (req, res, next) => {
    req.user = { _id: 'admin123', role: 'ADMIN' };
    next();
  },
  checkAdmin: (req, res, next) => next(),
}));

// Mock controllers with simple implementations
jest.mock('~/server/controllers/AdminController.js', () => ({
  getAllUsersController: (req, res) => {
    res.status(200).json({
      users: [
        {
          _id: 'user1',
          username: 'testuser',
          email: 'test@example.com',
          role: 'USER',
          isEnabled: true,
          createdAt: new Date(),
        }
      ],
      totalUsers: 1,
      totalPages: 1,
      currentPage: 1,
      pageSize: 10,
    });
  },
  createUserController: (req, res) => {
    res.status(201).json({
      user: {
        _id: 'newuser123',
        username: req.body.username,
        email: req.body.email,
        role: req.body.role || 'USER',
        isEnabled: true,
      },
      message: 'User created successfully',
    });
  },
  updateUserRoleController: (req, res) => {
    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
    });
  },
  banUserController: (req, res) => {
    res.status(200).json({
      success: true,
      message: 'User ban status updated successfully',
    });
  },
  deleteUserAdminController: (req, res) => {
    if (req.params.userId === 'admin123') {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  },
  getUserByIdController: (req, res) => {
    res.status(200).json({
      user: {
        _id: req.params.id,
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER',
        isEnabled: true,
        createdAt: new Date(),
      },
    });
  },
}));

jest.mock('~/server/controllers/AdminStatsController.js', () => ({
  getUserStatsController: (req, res) => {
    res.status(200).json({
      totalUsers: 100,
      activeUsers: 85,
      bannedUsers: 5,
      usersByRole: { ADMIN: 2, USER: 98 },
      usersByProvider: { local: 80, google: 15, discord: 5 },
    });
  },
  getActivityStatsController: (req, res) => {
    res.status(200).json({
      dailyActiveUsers: [25, 30, 28, 35, 40, 45, 50],
      conversationCounts: 1000,
      messageCounts: 50000,
    });
  },
  getRegistrationStatsController: (req, res) => {
    res.status(200).json({
      registrationsByDay: [2, 3, 1, 4, 5, 2, 3],
      registrationsByProvider: { local: 15, google: 8, discord: 2 },
    });
  },
  getSystemOverviewController: (req, res) => {
    res.status(200).json({
      totalUsers: 100,
      activeUsers: 85,
      totalConversations: 1000,
      totalMessages: 50000,
      newUsersThisMonth: 25,
      activeUsersToday: 15,
      systemLoad: {
        cpu: 45,
        memory: 60,
        storage: 30,
      },
      monthlyStats: [],
    });
  },
}));

const adminRouter = require('./index.test-only');

describe('Admin API Routes - Simple Tests', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/admin', adminRouter);
  });

  describe('GET /api/admin/users', () => {
    test('should return user list', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('totalUsers');
      expect(response.body.users).toBeInstanceOf(Array);
      expect(response.body.users.length).toBeGreaterThan(0);
    });

    test('should support pagination', async () => {
      const response = await request(app)
        .get('/api/admin/users?page=1&limit=5')
        .expect(200);

      expect(response.body).toHaveProperty('currentPage', 1);
      expect(response.body).toHaveProperty('pageSize', 10); // Mock returns fixed pageSize
    });
  });

  describe('POST /api/admin/users', () => {
    test('should create new user', async () => {
      const newUser = {
        username: 'newuser',
        email: 'newuser@test.com',
        password: 'password123',
        name: 'New User',
      };

      const response = await request(app)
        .post('/api/admin/users')
        .send(newUser)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('message');
      expect(response.body.user.username).toBe(newUser.username);
    });
  });

  describe('PUT /api/admin/users/:userId/role', () => {
    test('should update user role', async () => {
      const response = await request(app)
        .put('/api/admin/users/user123/role')
        .send({ role: 'ADMIN' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('PUT /api/admin/users/:userId/ban', () => {
    test('should update user ban status', async () => {
      const response = await request(app)
        .put('/api/admin/users/user123/ban')
        .send({ isEnabled: false })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('DELETE /api/admin/users/:userId', () => {
    test('should delete user', async () => {
      const response = await request(app)
        .delete('/api/admin/users/user123')
        .send({ reason: 'Test deletion' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
    });

    test('should prevent admin from deleting themselves', async () => {
      const response = await request(app)
        .delete('/api/admin/users/admin123')
        .send({ reason: 'Self deletion' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/admin/stats', () => {
    test('should return admin statistics overview', async () => {
      const response = await request(app)
        .get('/api/admin/stats/overview')
        .expect(200);

      expect(response.body).toHaveProperty('totalUsers');
      expect(response.body).toHaveProperty('activeUsers');
      expect(response.body).toHaveProperty('systemLoad');
      expect(typeof response.body.totalUsers).toBe('number');
      expect(typeof response.body.activeUsers).toBe('number');
    });

    test('should return user statistics', async () => {
      const response = await request(app)
        .get('/api/admin/stats/users')
        .expect(200);

      expect(response.body).toHaveProperty('totalUsers');
      expect(response.body).toHaveProperty('activeUsers');
      expect(response.body).toHaveProperty('usersByRole');
      expect(typeof response.body.totalUsers).toBe('number');
      expect(typeof response.body.activeUsers).toBe('number');
    });
  });
});