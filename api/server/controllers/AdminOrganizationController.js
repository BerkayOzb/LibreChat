const models = require('~/db/models');
const { Organization, User } = models;
console.log('AdminOrgController Models keys:', Object.keys(models));
console.log('Organization Model:', Organization);
const { SystemRoles } = require('librechat-data-provider');
const { logger } = require('~/config');

/**
 * Get all organizations with pagination and search
 */
const getOrganizations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    const organizations = await Organization.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await Organization.countDocuments(query);

    // Populate user counts for each org
    const orgsWithCounts = await Promise.all(
      organizations.map(async (org) => {
        const userCount = await User.countDocuments({ organization: org._id });
        return { ...org, userCount };
      }),
    );

    res.status(200).json({
      organizations: orgsWithCounts,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    logger.error('[getOrganizations]', error);
    res.status(500).json({ message: 'Error fetching organizations' });
  }
};

/**
 * Create a new organization
 */
const createOrganization = async (req, res) => {
  try {
    const { name, code } = req.body;

    if (!name || !code) {
      return res.status(400).json({ message: 'Name and code are required' });
    }

    const existingOrg = await Organization.findOne({ code });
    if (existingOrg) {
      return res.status(400).json({ message: 'Organization code already exists' });
    }

    const newOrg = await Organization.create({ name, code });
    res.status(201).json(newOrg);
  } catch (error) {
    logger.error('[createOrganization]', error);
    res.status(500).json({ message: 'Error creating organization' });
  }
};

/**
 * Get organization details by ID
 */
const getOrganizationById = async (req, res) => {
  try {
    const { id } = req.params;
    const organization = await Organization.findById(id).lean();

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const userCount = await User.countDocuments({ organization: id });
    const admins = await User.find({ organization: id, role: SystemRoles.ORG_ADMIN })
      .select('name email _id')
      .lean();

    res.status(200).json({
      ...organization,
      userCount,
      admins,
    });
  } catch (error) {
    logger.error('[getOrganizationById]', error);
    res.status(500).json({ message: 'Error fetching organization details' });
  }
};

/**
 * Update organization details
 */
const updateOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body; // Code usually shouldn't change easily to avoid breaking links, but can be added if requested.

    const updatedOrg = await Organization.findByIdAndUpdate(
      id,
      { name },
      { new: true, runValidators: true },
    );

    if (!updatedOrg) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    res.status(200).json(updatedOrg);
  } catch (error) {
    logger.error('[updateOrganization]', error);
    res.status(500).json({ message: 'Error updating organization' });
  }
};

/**
 * Delete organization
 */
const deleteOrganization = async (req, res) => {
  try {
    const { id } = req.params;

    // Optional: Check if users exist and block or cascade?
    // For now, let's block if users exist for safety.
    const userCount = await User.countDocuments({ organization: id });
    if (userCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete organization with existing users. Please remove users first.',
      });
    }

    const deletedOrg = await Organization.findByIdAndDelete(id);
    if (!deletedOrg) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    res.status(200).json({ message: 'Organization deleted' });
  } catch (error) {
    logger.error('[deleteOrganization]', error);
    res.status(500).json({ message: 'Error deleting organization' });
  }
};

/**
 * Assign an existing user as ORG_ADMIN to an organization
 */
const assignOrgAdmin = async (req, res) => {
  try {
    const { id: organizationId } = req.params;
    const { userId } = req.body;

    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If user is already ADMIN (Global), we might not want to demote them or change them strictly.
    // But the requirement says "assign org admin".
    // Let's assume we proceed if they are not already a global admin, or if we want to change their role.
    if (user.role === SystemRoles.ADMIN) {
      return res.status(400).json({
        message: 'Cannot assign Global Admin to an Organization. Demote them first if necessary.',
      });
    }

    user.role = SystemRoles.ORG_ADMIN;
    user.organization = organizationId;
    user.membershipVisible = true; // Default visibility

    await user.save();

    res.status(200).json({ message: 'User assigned as Organization Admin', user });
  } catch (error) {
    logger.error('[assignOrgAdmin]', error);
    res.status(500).json({ message: 'Error assigning admin' });
  }
};

/**
 * Get users of an organization
 */
const getOrganizationUsers = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'desc';

    const query = { organization: id };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
      ];
    }

    // Build sort options
    const sortOptions = {};
    const validSortFields = ['createdAt', 'name', 'email', 'role', 'membershipExpiresAt'];
    if (validSortFields.includes(sortBy)) {
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortOptions.createdAt = -1;
    }

    const users = await User.find(query)
      .select('-password -__v -totpSecret -backupCodes')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await User.countDocuments(query);

    res.status(200).json({
      users,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    logger.error('[getOrganizationUsers]', error);
    res.status(500).json({ message: 'Error fetching organization users' });
  }
};

/**
 * Remove ORG_ADMIN role from a user (demote to USER)
 */
const removeOrgAdmin = async (req, res) => {
  try {
    const { id: organizationId, userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.organization?.toString() !== organizationId) {
      return res.status(400).json({ message: 'User does not belong to this organization' });
    }

    if (user.role !== SystemRoles.ORG_ADMIN) {
      return res.status(400).json({ message: 'User is not an organization admin' });
    }

    user.role = SystemRoles.USER;
    await user.save();

    res.status(200).json({ message: 'Admin role removed', user });
  } catch (error) {
    logger.error('[removeOrgAdmin]', error);
    res.status(500).json({ message: 'Error removing admin role' });
  }
};

/**
 * Assign a user to an organization
 */
const addUserToOrganization = async (req, res) => {
  try {
    const { organizationId, userId } = req.body;

    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.organization && user.organization.toString() === organizationId) {
      return res.status(400).json({ message: 'User is already in this organization' });
    }

    user.organization = organizationId;
    await user.save();

    res.status(200).json({ message: 'User added to organization', user });
  } catch (error) {
    logger.error('[addUserToOrganization]', error);
    res.status(500).json({ message: 'Error adding user to organization' });
  }
};

/**
 * Remove a user from an organization
 */
const removeUserFromOrganization = async (req, res) => {
  try {
    const { organizationId, userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.organization || user.organization.toString() !== organizationId) {
      return res.status(400).json({ message: 'User is not in this organization' });
    }

    // Prevent removing the last admin or similar checks if necessary?
    // For now, allow removing any "member".
    // If they are an ORG_ADMIN, maybe we should strip the role too?
    if (user.role === SystemRoles.ORG_ADMIN) {
      user.role = SystemRoles.USER;
    }

    user.organization = undefined;
    await user.save();

    res.status(200).json({ message: 'User removed from organization', user });
  } catch (error) {
    logger.error('[removeUserFromOrganization]', error);
    res.status(500).json({ message: 'Error removing user from organization' });
  }
};

module.exports = {
  getOrganizations,
  createOrganization,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
  assignOrgAdmin,
  getOrganizationUsers,
  removeOrgAdmin,
  addUserToOrganization,
  removeUserFromOrganization,
};
