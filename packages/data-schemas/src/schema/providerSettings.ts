import { Schema } from 'mongoose';
import type { IProviderSettings } from '../types';

const providerSettingsSchema = new Schema<IProviderSettings>(
  {
    endpoint: {
      type: String,
      required: [true, 'Endpoint name is required'],
      trim: true,
      unique: true,
      maxlength: [50, 'Endpoint name cannot exceed 50 characters'],
    },
    providerDisplayOrder: {
      type: [String],
      default: ['openai', 'anthropic', 'meta-llama', 'google', 'mistralai', 'qwen'],
      required: false,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  {
    timestamps: true,
    collection: 'provider_settings'
  }
);

// Create indexes for efficient queries
providerSettingsSchema.index({ endpoint: 1 });
providerSettingsSchema.index({ updatedAt: -1 });

export default providerSettingsSchema;
