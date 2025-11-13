import providerSettingsSchema from '../schema/providerSettings';
import type { IProviderSettings } from '../types';

/**
 * Creates or returns the ProviderSettings model using the provided mongoose instance and schema
 */
export function createProviderSettingsModel(mongoose: typeof import('mongoose')) {
  return mongoose.models.ProviderSettings ||
         mongoose.model<IProviderSettings>('ProviderSettings', providerSettingsSchema);
}
