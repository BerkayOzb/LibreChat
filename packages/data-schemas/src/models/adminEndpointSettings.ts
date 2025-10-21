import adminEndpointSettingsSchema from '../schema/adminEndpointSettings';
import type { IAdminEndpointSettings } from '../types';

/**
 * Creates or returns the AdminEndpointSettings model using the provided mongoose instance and schema
 */
export function createAdminEndpointSettingsModel(mongoose: typeof import('mongoose')) {
  return mongoose.models.AdminEndpointSettings || 
         mongoose.model<IAdminEndpointSettings>('AdminEndpointSettings', adminEndpointSettingsSchema);
}