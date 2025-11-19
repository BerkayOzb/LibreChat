import { Schema } from 'mongoose';

/**
 * Model display order settings schema
 * Stores custom ordering of models within provider groups
 */
const modelSettingsSchema = new Schema(
  {
    endpoint: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    provider: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    modelDisplayOrder: {
      type: [String],
      default: [],
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    collection: 'model_settings',
  },
);

// Compound unique index for endpoint + provider combination
modelSettingsSchema.index({ endpoint: 1, provider: 1 }, { unique: true });

export default modelSettingsSchema;
