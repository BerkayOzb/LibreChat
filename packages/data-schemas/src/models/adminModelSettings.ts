import adminModelSettingsSchema from '../schema/adminModelSettings';
import type { IAdminModelSettings } from '../types';

/**
 * Creates or returns the AdminModelSettings model using the provided mongoose instance and schema
 */
export function createAdminModelSettingsModel(mongoose: typeof import('mongoose')) {
  return mongoose.models.AdminModelSettings || 
         mongoose.model<IAdminModelSettings>('AdminModelSettings', adminModelSettingsSchema);
}