import adminApiKeySchema from '../schema/adminApiKeys';
import type { IAdminApiKey } from '../types';

/**
 * Creates or returns the AdminApiKey model using the provided mongoose instance and schema
 */
export function createAdminApiKeyModel(mongoose: typeof import('mongoose')) {
  return mongoose.models.AdminApiKey || 
         mongoose.model<IAdminApiKey>('AdminApiKey', adminApiKeySchema);
}