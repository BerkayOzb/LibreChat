import { Schema } from 'mongoose';
import { IAdminEndpointSettings } from '~/types';

const adminEndpointSettingsSchema = new Schema<IAdminEndpointSettings>(
  {
    endpoint: {
      type: String,
      required: [true, 'Endpoint name is required'],
      unique: true,
      trim: true,
      maxlength: [50, 'Endpoint name cannot exceed 50 characters'],
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
        validator: function(roles: string[]) {
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
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  { 
    timestamps: true,
    collection: 'admin_endpoint_settings'
  }
);

// Create indexes for efficient queries
adminEndpointSettingsSchema.index({ endpoint: 1 }, { unique: true });
adminEndpointSettingsSchema.index({ enabled: 1 });
adminEndpointSettingsSchema.index({ order: 1 });
adminEndpointSettingsSchema.index({ allowedRoles: 1 });
adminEndpointSettingsSchema.index({ updatedAt: -1 });

// Compound index for efficient role-based queries
adminEndpointSettingsSchema.index({ enabled: 1, allowedRoles: 1, order: 1 });

export default adminEndpointSettingsSchema;