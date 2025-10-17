const bcrypt = require('bcryptjs');
const { logger } = require('@librechat/data-schemas');
const { SystemRoles } = require('librechat-data-provider');
const { User } = require('~/db/models');
const {
  createUser,
  updateUser,
  deleteUserById,
  deleteMessages,
  deleteAllUserSessions,
  deleteUserPluginAuth,
  deleteAllSharedLinks,
  deleteFiles,
  deleteConvos,
  deletePresets,
  deleteUserKey,
} = require('~/models');
const { Transaction, Balance } = require('~/db/models');
const { normalizeHttpError } = require('@librechat/api');
const { deleteToolCalls } = require('~/models/ToolCall');

/**
 * Get all users with pagination, filtering, and search
 */
const getAllUsersController = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      role = '',
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Build query filters
    const query = {};
    
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
    }

    if (role && Object.values(SystemRoles).includes(role)) {
      query.role = role;
    }

    if (status === 'banned') {
      query.banned = true;
    } else if (status === 'active') {
      query.banned = { $ne: true };
    }

    // Build sort options
    const sortOptions = {};
    if (['createdAt', 'email', 'username', 'role'].includes(sortBy)) {
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }

    // Execute queries in parallel
    const [users, totalCount] = await Promise.all([
      User.find(query, '-password -totpSecret -backupCodes')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    // Transform users data for frontend compatibility
    const transformedUsers = users.map(user => ({
      ...user,
      isEnabled: !user.banned, // Frontend expects isEnabled (opposite of banned)
      lastActivity: user.lastLoginAt || null, // Map lastLoginAt to lastActivity
    }));

    res.status(200).json({
      users: transformedUsers,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    logger.error('[getAllUsersController]', error);
    const { status, message } = normalizeHttpError(error);
    res.status(status).json({ message });
  }
};

/**
 * Get specific user by ID
 */
const getUserByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id, '-password -totpSecret -backupCodes').lean();
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Transform user data for frontend compatibility
    const transformedUser = {
      ...user,
      isEnabled: !user.banned, // Frontend expects isEnabled (opposite of banned)
      lastActivity: user.lastLoginAt || null, // Map lastLoginAt to lastActivity
    };

    res.status(200).json({ user: transformedUser });
  } catch (error) {
    logger.error('[getUserByIdController]', error);
    const { status, message } = normalizeHttpError(error);
    res.status(status).json({ message });
  }
};

/**
 * Create new user
 */
const createUserController = async (req, res) => {
  try {
    const { email, password, username, name, role = SystemRoles.USER } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Validate role
    if (!Object.values(SystemRoles).includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const userData = {
      email,
      password: hashedPassword,
      username,
      name,
      role,
      emailVerified: true, // Admin created users are pre-verified
    };

    const newUser = await createUser(userData);

    // Remove sensitive data from response
    const userResponse = { ...newUser.toObject() };
    delete userResponse.password;
    delete userResponse.totpSecret;
    delete userResponse.backupCodes;

    logger.info(`Admin ${req.user.email} created user: ${newUser.email}`);
    
    res.status(201).json({ 
      message: 'User created successfully',
      user: userResponse 
    });
  } catch (error) {
    logger.error('[createUserController]', error);
    const { status, message } = normalizeHttpError(error);
    res.status(status).json({ message });
  }
};

/**
 * Update user role
 */
const updateUserRoleController = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate role
    if (!Object.values(SystemRoles).includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    // Prevent admin from changing their own role
    if (id === req.user.id) {
      return res.status(403).json({ message: 'Cannot change your own role' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    logger.info(`Admin ${req.user.email} changed role of ${user.email} from ${oldRole} to ${role}`);
    
    res.status(200).json({ 
      message: 'User role updated successfully',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error) {
    logger.error('[updateUserRoleController]', error);
    const { status, message } = normalizeHttpError(error);
    res.status(status).json({ message });
  }
};

/**
 * Ban or unban user
 */
const banUserController = async (req, res) => {
  try {
    const { id } = req.params;
    const { banned, reason } = req.body;

    // Prevent admin from banning themselves
    if (id === req.user.id) {
      return res.status(403).json({ message: 'Cannot ban yourself' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent banning other admins
    if (user.role === SystemRoles.ADMIN) {
      return res.status(403).json({ message: 'Cannot ban admin users' });
    }

    const updateData = { banned: !!banned };
    if (reason) {
      updateData.banReason = reason;
    }

    await updateUser(id, updateData);

    // If banning user, delete their active sessions
    if (banned) {
      await deleteAllUserSessions({ userId: id });
    }

    logger.info(`Admin ${req.user.email} ${banned ? 'banned' : 'unbanned'} user: ${user.email}${reason ? ` (Reason: ${reason})` : ''}`);
    
    res.status(200).json({ 
      message: `User ${banned ? 'banned' : 'unbanned'} successfully`,
      user: {
        id: user._id,
        email: user.email,
        banned,
      }
    });
  } catch (error) {
    logger.error('[banUserController]', error);
    const { status, message } = normalizeHttpError(error);
    res.status(status).json({ message });
  }
};

/**
 * Delete user (admin version with audit logging)
 */
const deleteUserAdminController = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (id === req.user.id) {
      return res.status(403).json({ message: 'Cannot delete yourself' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting other admins
    if (user.role === SystemRoles.ADMIN) {
      return res.status(403).json({ message: 'Cannot delete admin users' });
    }

    // Comprehensive user data deletion
    await Promise.all([
      deleteMessages({ user: id }),
      deleteAllUserSessions({ userId: id }),
      Transaction.deleteMany({ user: id }),
      deleteUserKey({ userId: id, all: true }),
      Balance.deleteMany({ user: id }),
      deletePresets(id),
      deleteConvos(id),
      deleteUserPluginAuth(id, null, true),
      deleteAllSharedLinks(id),
      deleteFiles(null, id),
      deleteToolCalls(id),
    ]);

    // Finally delete the user
    await deleteUserById(id);

    logger.info(`Admin ${req.user.email} deleted user: ${user.email} (ID: ${id})`);
    
    res.status(200).json({ 
      message: 'User deleted successfully'
    });
  } catch (error) {
    logger.error('[deleteUserAdminController]', error);
    const { status, message } = normalizeHttpError(error);
    res.status(status).json({ message });
  }
};

module.exports = {
  getAllUsersController,
  getUserByIdController,
  createUserController,
  updateUserRoleController,
  banUserController,
  deleteUserAdminController,
};