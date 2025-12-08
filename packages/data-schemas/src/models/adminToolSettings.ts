import adminToolSettingsSchema from '../schema/adminToolSettings';
import type { IAdminToolSettings } from '../types';

/**
 * Creates or returns the AdminToolSettings model using the provided mongoose instance and schema
 */
export function createAdminToolSettingsModel(mongoose: typeof import('mongoose')) {
  return mongoose.models.AdminToolSettings ||
    mongoose.model<IAdminToolSettings>('AdminToolSettings', adminToolSettingsSchema);
}
