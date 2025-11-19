import modelSettingsSchema from '../schema/modelSettings';
import type { IModelSettings } from '../types/modelSettings';

/**
 * Creates the ModelSettings model
 * @param mongoose - Mongoose instance
 * @returns ModelSettings model
 */
export function createModelSettingsModel(mongoose: typeof import('mongoose')) {
  return mongoose.models.ModelSettings as ReturnType<typeof mongoose.model<IModelSettings>> ||
    mongoose.model<IModelSettings>('ModelSettings', modelSettingsSchema);
}
