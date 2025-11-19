import { Schema } from 'mongoose';

/**
 * User model preferences schema
 * Stores user-specific model preferences like pinned models
 */
const userModelPreferencesSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true,
    },
    pinnedModels: [
      {
        endpoint: {
          type: String,
          required: true,
        },
        provider: {
          type: String,
          required: true,
        },
        modelName: {
          type: String,
          required: true,
        },
        pinnedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
    collection: 'user_model_preferences',
  },
);

// Compound index for efficient queries
userModelPreferencesSchema.index(
  { userId: 1, 'pinnedModels.endpoint': 1, 'pinnedModels.provider': 1 },
  { sparse: true },
);

// Unique index to ensure one preferences document per user
userModelPreferencesSchema.index({ userId: 1 }, { unique: true });

export default userModelPreferencesSchema;
