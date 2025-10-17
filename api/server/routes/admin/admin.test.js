const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { SystemRoles } = require('librechat-data-provider');
const { createMethods } = require('@librechat/data-schemas');

// Mock dependencies
jest.mock('~/server/middleware/auditLog', () => ({
  adminAudit: {
    viewUsers: (req, res, next) => next(),
    createUser: (req, res, next) => next(),
    updateUserRole: (req, res, next) => next(),
    banUser: (req, res, next) => next(),
    deleteUser: (req, res, next) => next(),
    viewUserDetails: (req, res, next) => next(),
    viewStats: (req, res, next) => next(),
  },
}));

jest.mock('~/server/middleware/adminRateLimit', () => ({
  createAdminRateLimit: () => (req, res, next) => next(),
  adminRateLimits: {
    general: (req, res, next) => next(),
    createUser: (req, res, next) => next(),
    deleteUser: (req, res, next) => next(),
    stats: (req, res, next) => next(),
  },
}));

jest.mock('~/server/middleware', () => ({
  requireJwtAuth: (req, res, next) => next(),
  checkAdmin: (req, res, next) => next(),
}));

// Mock the admin controllers
jest.mock('~/server/controllers/AdminController.js', () => ({
  getAllUsersController: jest.fn(),
  createUserController: jest.fn(),
  updateUserRoleController: jest.fn(),
  banUserController: jest.fn(),
  deleteUserAdminController: jest.fn(),
  getUserByIdController: jest.fn(),
}));

jest.mock('~/server/controllers/AdminStatsController.js', () => ({
  getAdminStatsController: jest.fn(),
}));

const {
  getAllUsersController,
  createUserController,
  updateUserRoleController,
  banUserController,
  deleteUserAdminController,
  getUserByIdController,
} = require('~/server/controllers/AdminController.js');

const { getAdminStatsController } = require('~/server/controllers/AdminStatsController.js');

const adminRouter = require('./users');

describe('Admin Users API', () => {
  let app;
  let mongoServer;
  let adminUser;
  let regularUser;
  let authToken;
  let User;
  let methods;

  beforeAll(async () => {
    // Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Initialize all models using createModels
    const { createModels } = require('@librechat/data-schemas');
    const models = createModels(mongoose);
    
    // Register models on mongoose.models so methods can access them
    Object.assign(mongoose.models, models);
    
    // Create methods with our test mongoose instance
    methods = createMethods(mongoose);
    
    // Now we can access User model
    User = models.User;
    
    // Seed default roles using our methods
    await methods.seedDefaultRoles();

    // Setup Express app
    app = express();
    app.use(express.json());
    
    // Mock authentication middleware
    app.use('/api/admin', (req, res, next) => {
      if (req.headers.authorization !== 'Bearer valid-admin-token') {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      req.user = adminUser;
      next();
    });
    
    app.use('/api/admin', adminRouter);

    // Create test users
    adminUser = await User.create({
      username: 'admin-test',
      email: 'admin@test.com', 
      name: 'Admin User',
      role: SystemRoles.ADMIN,
      isEnabled: true,
      password: 'hashedpassword123',
    });

    regularUser = await User.create({
      username: 'user-test',
      email: 'user@test.com',
      name: 'Regular User', 
      role: SystemRoles.USER,
      isEnabled: true,
      password: 'hashedpassword123',
    });

    authToken = 'Bearer valid-admin-token';

    // Setup controller mocks
    getAllUsersController.mockImplementation(async (req, res) => {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search;
      const sortBy = req.query.sortBy || 'createdAt';
      const sortOrder = req.query.sortOrder || 'desc';

      let users = [adminUser, regularUser];
      
      // Apply search filter
      if (search) {
        users = users.filter(user => 
          user.username.includes(search) || 
          user.email.includes(search) || 
          user.name.includes(search)
        );
      }

      // Apply sorting
      users.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        const multiplier = sortOrder === 'asc' ? 1 : -1;
        return aVal > bVal ? multiplier : -multiplier;
      });

      // Apply pagination
      const totalUsers = users.length;
      const totalPages = Math.ceil(totalUsers / limit);
      const startIndex = (page - 1) * limit;
      const paginatedUsers = users.slice(startIndex, startIndex + limit);

      res.status(200).json({
        users: paginatedUsers.map(user => ({
          _id: user._id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role,
          isEnabled: user.isEnabled,
          createdAt: user.createdAt,
          lastActivity: user.lastActivity,
        })),
        totalUsers,
        totalPages,
        currentPage: page,
        pageSize: limit,
      });
    });

    createUserController.mockImplementation(async (req, res) => {
      const { username, email, password, name, role } = req.body;

      // Validate required fields
      if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email, and password are required' });
      }

      // Check for duplicates
      const existingUser = await User.findOne({
        $or: [{ username }, { email }]
      });

      if (existingUser) {
        return res.status(400).json({ 
          error: existingUser.username === username ? 'Username already exists' : 'Email already exists'
        });
      }

      // Create new user
      const newUser = await User.create({
        username,
        email,
        password,
        name,
        role: role || SystemRoles.USER,
        isEnabled: true,
      });

      res.status(201).json({
        user: {
          _id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          isEnabled: newUser.isEnabled,
        },
        message: 'User created successfully',
      });
    });

    updateUserRoleController.mockImplementation(async (req, res) => {
      const { userId } = req.params;
      const { role } = req.body;

      if (!Object.values(SystemRoles).includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      await User.findByIdAndUpdate(userId, { role });
      res.status(200).json({ success: true, message: 'User role updated successfully' });
    });

    banUserController.mockImplementation(async (req, res) => {
      const { userId } = req.params;
      const { isEnabled } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      await User.findByIdAndUpdate(userId, { isEnabled });
      res.status(200).json({ 
        success: true, 
        message: isEnabled ? 'User unbanned successfully' : 'User banned successfully' 
      });
    });

    deleteUserAdminController.mockImplementation(async (req, res) => {
      const { userId } = req.params;

      // Prevent admin from deleting themselves
      if (userId === req.user._id.toString()) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      await User.findByIdAndDelete(userId);
      res.status(200).json({ success: true, message: 'User deleted successfully' });
    });

    getAdminStatsController.mockImplementation(async (req, res) => {
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ isEnabled: true });

      res.status(200).json({
        totalUsers,
        activeUsers,
        totalConversations: 1000,
        totalMessages: 50000,
        newUsersThisMonth: 25,
        activeUsersToday: 15,
        systemLoad: {
          cpu: 45,
          memory: 60,
          storage: 30,
        },
        monthlyStats: [
          { month: 'Oct 2025', users: 50, conversations: 200, messages: 5000 },
          { month: 'Sep 2025', users: 45, conversations: 180, messages: 4500 },
        ],
      });
    });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Reset any modifications to test users between tests
    await User.findByIdAndUpdate(regularUser._id, {
      isEnabled: true,
      role: SystemRoles.USER,
    });
  });

  describe('GET /api/admin/users', () => {
    test('should return paginated user list for admin', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('totalUsers');
      expect(response.body).toHaveProperty('totalPages');
      expect(response.body).toHaveProperty('currentPage');
      expect(response.body.users).toBeInstanceOf(Array);
      expect(response.body.users.length).toBeGreaterThan(0);
      
      // Check user structure
      const user = response.body.users[0];
      expect(user).toHaveProperty('_id');
      expect(user).toHaveProperty('username');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('isEnabled');
      expect(user).not.toHaveProperty('password'); // Password should be excluded
    });

    test('should support pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/users?page=1&limit=1')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.users).toHaveLength(1);
      expect(response.body.currentPage).toBe(1);
      expect(response.body.pageSize).toBe(1);
    });

    test('should support search functionality', async () => {
      const response = await request(app)
        .get('/api/admin/users?search=admin')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.users.length).toBeGreaterThan(0);
      const hasAdminUser = response.body.users.some(
        user => user.username.includes('admin') || user.email.includes('admin')
      );
      expect(hasAdminUser).toBe(true);
    });

    test('should support sorting', async () => {
      const response = await request(app)
        .get('/api/admin/users?sortBy=email&sortOrder=asc')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.users.length).toBeGreaterThan(1);
      // Check if emails are sorted in ascending order
      for (let i = 1; i < response.body.users.length; i++) {
        expect(response.body.users[i-1].email <= response.body.users[i].email).toBe(true);
      }
    });

    test('should reject requests without authorization', async () => {
      await request(app)
        .get('/api/admin/users')
        .expect(401);
    });
  });

  describe('POST /api/admin/users', () => {
    test('should create new user successfully', async () => {
      const newUser = {
        username: 'newuser',
        email: 'newuser@test.com',
        password: 'password123',
        name: 'New Test User',
        role: SystemRoles.USER,
      };

      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', authToken)
        .send(newUser)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('message');
      expect(response.body.user.username).toBe(newUser.username);
      expect(response.body.user.email).toBe(newUser.email);
      expect(response.body.user).not.toHaveProperty('password'); // Password should not be returned

      // Verify user was created in database
      const createdUser = await User.findOne({ username: newUser.username });
      expect(createdUser).toBeTruthy();
      expect(createdUser.email).toBe(newUser.email);
    });

    test('should reject duplicate username', async () => {
      const duplicateUser = {
        username: 'admin-test', // Already exists
        email: 'different@test.com',
        password: 'password123',
        name: 'Duplicate User',
      };

      await request(app)
        .post('/api/admin/users')
        .set('Authorization', authToken)
        .send(duplicateUser)
        .expect(400);
    });

    test('should reject duplicate email', async () => {
      const duplicateUser = {
        username: 'different-user',
        email: 'admin@test.com', // Already exists
        password: 'password123',
        name: 'Duplicate Email User',
      };

      await request(app)
        .post('/api/admin/users')
        .set('Authorization', authToken)
        .send(duplicateUser)
        .expect(400);
    });

    test('should validate required fields', async () => {
      const invalidUser = {
        username: 'test',
        // Missing email and password
      };

      await request(app)
        .post('/api/admin/users')
        .set('Authorization', authToken)
        .send(invalidUser)
        .expect(400);
    });
  });

  describe('PUT /api/admin/users/:userId/role', () => {
    test('should update user role successfully', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${regularUser._id}/role`)
        .set('Authorization', authToken)
        .send({ role: SystemRoles.ADMIN })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');

      // Verify role was updated in database
      const updatedUser = await User.findById(regularUser._id);
      expect(updatedUser.role).toBe(SystemRoles.ADMIN);
    });

    test('should reject invalid role', async () => {
      await request(app)
        .put(`/api/admin/users/${regularUser._id}/role`)
        .set('Authorization', authToken)
        .send({ role: 'INVALID_ROLE' })
        .expect(400);
    });

    test('should reject non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .put(`/api/admin/users/${fakeId}/role`)
        .set('Authorization', authToken)
        .send({ role: SystemRoles.ADMIN })
        .expect(404);
    });
  });

  describe('PUT /api/admin/users/:userId/ban', () => {
    test('should ban user successfully', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${regularUser._id}/ban`)
        .set('Authorization', authToken)
        .send({ 
          isEnabled: false,
          reason: 'Test ban reason'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');

      // Verify user was banned in database
      const updatedUser = await User.findById(regularUser._id);
      expect(updatedUser.isEnabled).toBe(false);
    });

    test('should unban user successfully', async () => {
      // First ban the user
      await User.findByIdAndUpdate(regularUser._id, { isEnabled: false });

      const response = await request(app)
        .put(`/api/admin/users/${regularUser._id}/ban`)
        .set('Authorization', authToken)
        .send({ 
          isEnabled: true,
          reason: 'Test unban reason'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);

      // Verify user was unbanned in database
      const updatedUser = await User.findById(regularUser._id);
      expect(updatedUser.isEnabled).toBe(true);
    });

    test('should reject non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .put(`/api/admin/users/${fakeId}/ban`)
        .set('Authorization', authToken)
        .send({ isEnabled: false })
        .expect(404);
    });
  });

  describe('DELETE /api/admin/users/:userId', () => {
    test('should delete user successfully', async () => {
      // Create a user to delete
      const userToDelete = await User.create({
        username: 'delete-test',
        email: 'delete@test.com',
        name: 'Delete Test User',
        role: SystemRoles.USER,
        isEnabled: true,
        password: 'hashedpassword123',
      });

      const response = await request(app)
        .delete(`/api/admin/users/${userToDelete._id}`)
        .set('Authorization', authToken)
        .send({ reason: 'Test deletion' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');

      // Verify user was deleted from database
      const deletedUser = await User.findById(userToDelete._id);
      expect(deletedUser).toBeNull();
    });

    test('should reject deleting non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .delete(`/api/admin/users/${fakeId}`)
        .set('Authorization', authToken)
        .send({ reason: 'Test deletion' })
        .expect(404);
    });

    test('should prevent admin from deleting themselves', async () => {
      await request(app)
        .delete(`/api/admin/users/${adminUser._id}`)
        .set('Authorization', authToken)
        .send({ reason: 'Self deletion attempt' })
        .expect(400);
    });
  });

  describe('GET /api/admin/stats', () => {
    test('should return system statistics', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('totalUsers');
      expect(response.body).toHaveProperty('activeUsers');
      expect(response.body).toHaveProperty('totalConversations');
      expect(response.body).toHaveProperty('totalMessages');
      expect(response.body).toHaveProperty('newUsersThisMonth');
      expect(response.body).toHaveProperty('activeUsersToday');
      expect(response.body).toHaveProperty('systemLoad');
      expect(response.body).toHaveProperty('monthlyStats');

      // Verify numeric fields
      expect(typeof response.body.totalUsers).toBe('number');
      expect(typeof response.body.activeUsers).toBe('number');
      expect(response.body.totalUsers).toBeGreaterThanOrEqual(2); // At least admin and regular user

      // Verify systemLoad structure
      expect(response.body.systemLoad).toHaveProperty('cpu');
      expect(response.body.systemLoad).toHaveProperty('memory');
      expect(response.body.systemLoad).toHaveProperty('storage');

      // Verify monthlyStats is array
      expect(Array.isArray(response.body.monthlyStats)).toBe(true);
    });

    test('should reject requests without authorization', async () => {
      await request(app)
        .get('/api/admin/stats')
        .expect(401);
    });
  });
});