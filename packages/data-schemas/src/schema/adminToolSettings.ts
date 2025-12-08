import { Schema } from 'mongoose';
import type { IAdminToolSettings } from '../types';

const adminToolSettingsSchema = new Schema<IAdminToolSettings>(
  {
    toolId: {
      type: String,
      required: [true, 'Tool ID is required'],
      unique: true,
      trim: true,
      maxlength: [50, 'Tool ID cannot exceed 50 characters'],
      index: true,
    },
    enabled: {
      type: Boolean,
      required: true,
      default: true,
    },
    allowedRoles: {
      type: [String],
      default: ['USER', 'ADMIN'],
      validate: {
        validator: function (roles: string[]) {
          return roles.length > 0;
        },
        message: 'At least one role must be specified',
      },
    },
    order: {
      type: Number,
      default: 0,
      min: [0, 'Order must be a non-negative number'],
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    disabledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    disabledAt: {
      type: Date,
      required: false,
    },
    reason: {
      type: String,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
      trim: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  {
    timestamps: true,
    collection: 'admin_tool_settings',
  }
);

// Create indexes for efficient queries
adminToolSettingsSchema.index({ toolId: 1 }, { unique: true });
adminToolSettingsSchema.index({ enabled: 1 });
adminToolSettingsSchema.index({ order: 1 });
adminToolSettingsSchema.index({ allowedRoles: 1 });
adminToolSettingsSchema.index({ updatedAt: -1 });

// Compound index for efficient role-based queries
adminToolSettingsSchema.index({ enabled: 1, allowedRoles: 1, order: 1 });

// Middleware to automatically set disabledAt when enabled changes to false
adminToolSettingsSchema.pre('findOneAndUpdate', function () {
  const update = this.getUpdate() as Record<string, unknown>;

  if (update.$set && (update.$set as Record<string, unknown>).enabled === false) {
    // Only set disabledAt if not already provided
    if (!(update.$set as Record<string, unknown>).disabledAt) {
      (update.$set as Record<string, unknown>).disabledAt = new Date();
    }
  }

  if (update.$set && (update.$set as Record<string, unknown>).enabled === true) {
    // Clear disabled metadata when re-enabling
    update.$unset = update.$unset || {};
    (update.$unset as Record<string, string>).disabledBy = '';
    (update.$unset as Record<string, string>).disabledAt = '';
    (update.$unset as Record<string, string>).reason = '';
  }
});

export default adminToolSettingsSchema;
