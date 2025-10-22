import { Schema } from 'mongoose';
import type { IAdminModelSettings } from '../types';

const adminModelSettingsSchema = new Schema<IAdminModelSettings>(
  {
    endpoint: {
      type: String,
      required: [true, 'Endpoint name is required'],
      trim: true,
      maxlength: [50, 'Endpoint name cannot exceed 50 characters'],
      index: true,
    },
    modelName: {
      type: String,
      required: [true, 'Model name is required'],
      trim: true,
      maxlength: [100, 'Model name cannot exceed 100 characters'],
      index: true,
    },
    isEnabled: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
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
  },
  { 
    timestamps: true,
    collection: 'admin_model_settings'
  }
);

// Create compound unique index to prevent duplicates
adminModelSettingsSchema.index({ endpoint: 1, modelName: 1 }, { unique: true });

// Create indexes for efficient queries
adminModelSettingsSchema.index({ endpoint: 1 });
adminModelSettingsSchema.index({ modelName: 1 });
adminModelSettingsSchema.index({ isEnabled: 1 });
adminModelSettingsSchema.index({ disabledBy: 1 });
adminModelSettingsSchema.index({ updatedAt: -1 });

// Compound indexes for common query patterns
adminModelSettingsSchema.index({ endpoint: 1, isEnabled: 1 });
adminModelSettingsSchema.index({ endpoint: 1, modelName: 1, isEnabled: 1 });

// Middleware to automatically set disabledBy and disabledAt when isEnabled changes to false
adminModelSettingsSchema.pre('findOneAndUpdate', function() {
  const update = this.getUpdate() as any;
  
  if (update.$set && update.$set.isEnabled === false) {
    // Only set disabledAt if not already provided
    if (!update.$set.disabledAt) {
      update.$set.disabledAt = new Date();
    }
  }
  
  if (update.$set && update.$set.isEnabled === true) {
    // Clear disabled metadata when re-enabling
    update.$unset = update.$unset || {};
    update.$unset.disabledBy = '';
    update.$unset.disabledAt = '';
    update.$unset.reason = '';
  }
});

export default adminModelSettingsSchema;