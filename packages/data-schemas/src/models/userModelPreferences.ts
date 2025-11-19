import userModelPreferencesSchema from '../schema/userModelPreferences';
import type { IUserModelPreferences } from '../types/userModelPreferences';

/**
 * Creates the UserModelPreferences model
 * @param mongoose - Mongoose instance
 * @returns UserModelPreferences model
 */
export function createUserModelPreferencesModel(mongoose: typeof import('mongoose')) {
  return mongoose.models.UserModelPreferences as ReturnType<typeof mongoose.model<IUserModelPreferences>> ||
    mongoose.model<IUserModelPreferences>('UserModelPreferences', userModelPreferencesSchema);
}
