import { Schema } from 'mongoose';
import { IAdminApiKey } from '~/types';

const adminApiKeySchema = new Schema<IAdminApiKey>(
  {
    endpoint: {
      type: String,
      required: [true, 'Endpoint name is required'],
      unique: true,
      trim: true,
      maxlength: [50, 'Endpoint name cannot exceed 50 characters'],
      index: true,
    },
    apiKey: {
      type: String,
      required: [true, 'API key is required'],
      trim: true,
      // This will store the encrypted API key
    },
    baseURL: {
      type: String,
      trim: true,
      maxlength: [500, 'Base URL cannot exceed 500 characters'],
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
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
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by user is required'],
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    lastUsed: {
      type: Date,
      required: false,
    },
  },
  { 
    timestamps: true,
    collection: 'admin_api_keys'
  }
);

// Create indexes for efficient queries
adminApiKeySchema.index({ endpoint: 1 }, { unique: true });
adminApiKeySchema.index({ isActive: 1 });
adminApiKeySchema.index({ createdBy: 1 });
adminApiKeySchema.index({ updatedAt: -1 });
adminApiKeySchema.index({ lastUsed: -1 });

// Compound index for efficient active endpoint queries
adminApiKeySchema.index({ endpoint: 1, isActive: 1 });

export default adminApiKeySchema;