import { logger } from '@librechat/data-schemas';
import { ErrorTypes } from 'librechat-data-provider';
import type { IUser, UserMethods } from '@librechat/data-schemas';

/**
 * Finds or migrates a user for OpenID authentication
 * @returns user object (with migration fields if needed), error message, and whether migration is needed
 */
export async function findOpenIDUser({
  openidId,
  findUser,
  email,
  idOnTheSource,
  strategyName = 'openid',
}: {
  openidId: string;
  findUser: UserMethods['findUser'];
  email?: string;
  idOnTheSource?: string;
  strategyName?: string;
}): Promise<{ user: IUser | null; error: string | null; migration: boolean }> {
  const primaryConditions = [];

  if (openidId && typeof openidId === 'string') {
    primaryConditions.push({ openidId });
  }

  if (idOnTheSource && typeof idOnTheSource === 'string') {
    primaryConditions.push({ idOnTheSource });
  }

  let user = null;
  if (primaryConditions.length > 0) {
    user = await findUser({ $or: primaryConditions }, '+banned');

    // Check if user is banned (applies to primary lookup)
    if (user && (user.banned === true || user.banned === undefined)) {
      logger.warn(
        `[${strategyName}] Banned user attempted OpenID login: ${user.email || openidId}`,
      );
      return { user: null, error: 'Account is pending admin approval or has been disabled.', migration: false };
    }
  }
  if (!user && email) {
    user = await findUser({ email }, '+banned');
    logger.warn(
      `[${strategyName}] user ${user ? 'found' : 'not found'} with email: ${email} for openidId: ${openidId}`,
    );

    // Check if user is banned before allowing authentication
    if (user && (user.banned === true || user.banned === undefined)) {
      logger.warn(
        `[${strategyName}] Banned user attempted OpenID login: ${user.email}`,
      );
      return { user: null, error: 'Account is pending admin approval or has been disabled.', migration: false };
    }

    // If user found by email, check if they're allowed to use OpenID provider
    if (user && user.provider && user.provider !== 'openid') {
      logger.warn(
        `[${strategyName}] Attempted OpenID login by user ${user.email}, was registered with "${user.provider}" provider`,
      );
      return { user: null, error: ErrorTypes.AUTH_FAILED, migration: false };
    }

    // If user found by email but doesn't have openidId, prepare for migration
    if (user && !user.openidId) {
      logger.info(
        `[${strategyName}] Preparing user ${user.email} for migration to OpenID with sub: ${openidId}`,
      );
      user.provider = 'openid';
      user.openidId = openidId;
      return { user, error: null, migration: true };
    }
  }

  return { user, error: null, migration: false };
}
