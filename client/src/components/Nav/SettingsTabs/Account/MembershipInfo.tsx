import React from 'react';
import { Clock, Calendar, AlertTriangle, CheckCircle, Infinity, Building2 } from 'lucide-react';
import { useLocalize } from '~/hooks';
import { useAuthContext } from '~/hooks/AuthContext';

function MembershipInfo() {
  const localize = useLocalize();
  const { user } = useAuthContext();

  // Only show for users in an organization
  if (!user?.organization) {
    return null;
  }

  const membershipExpiresAt = user.membershipExpiresAt;
  const organizationName = user.organizationName;
  const now = new Date();

  // Calculate status and remaining time
  const getStatus = () => {
    if (!membershipExpiresAt) {
      return {
        type: 'unlimited',
        label: localize('com_settings_membership_unlimited'),
        icon: Infinity,
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
        textColor: 'text-blue-700 dark:text-blue-300',
        iconColor: 'text-blue-500 dark:text-blue-400',
      };
    }

    const expirationDate = new Date(membershipExpiresAt);
    const isExpired = expirationDate < now;

    if (isExpired) {
      return {
        type: 'expired',
        label: localize('com_settings_membership_expired'),
        icon: AlertTriangle,
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
        textColor: 'text-red-700 dark:text-red-300',
        iconColor: 'text-red-500 dark:text-red-400',
      };
    }

    // Check if expiring soon (within 7 days)
    const daysRemaining = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isExpiringSoon = daysRemaining <= 7;

    if (isExpiringSoon) {
      return {
        type: 'expiring_soon',
        label: localize('com_settings_membership_expiring_soon'),
        icon: Clock,
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        textColor: 'text-yellow-700 dark:text-yellow-300',
        iconColor: 'text-yellow-500 dark:text-yellow-400',
      };
    }

    return {
      type: 'active',
      label: localize('com_settings_membership_active'),
      icon: CheckCircle,
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      textColor: 'text-green-700 dark:text-green-300',
      iconColor: 'text-green-500 dark:text-green-400',
    };
  };

  const getRemainingTime = () => {
    if (!membershipExpiresAt) {
      return null;
    }

    const expirationDate = new Date(membershipExpiresAt);
    const diffMs = expirationDate.getTime() - now.getTime();

    if (diffMs < 0) {
      // Expired - show how long ago
      const daysAgo = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
      if (daysAgo === 0) {
        return localize('com_settings_membership_expired_today');
      }
      return localize('com_settings_membership_expired_days_ago', { 0: daysAgo.toString() });
    }

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 30) {
      const months = Math.floor(days / 30);
      const remainingDays = days % 30;
      if (remainingDays > 0) {
        return localize('com_settings_membership_remaining_months_days', {
          0: months.toString(),
          1: remainingDays.toString(),
        });
      }
      return localize('com_settings_membership_remaining_months', { 0: months.toString() });
    }

    if (days > 0) {
      return localize('com_settings_membership_remaining_days', { 0: days.toString() });
    }

    return localize('com_settings_membership_remaining_hours', { 0: hours.toString() });
  };

  const status = getStatus();
  const StatusIcon = status.icon;
  const remainingTime = getRemainingTime();

  return (
    <div className="flex flex-col gap-4">
      {/* Organization Info */}
      {organizationName && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text-primary">
            {localize('com_settings_organization')}
          </span>
          <div className="flex items-center gap-3 rounded-lg border border-border-medium bg-surface-secondary p-3">
            <div className="rounded-full bg-surface-tertiary p-2">
              <Building2 className="h-5 w-5 text-text-secondary" />
            </div>
            <span className="font-medium text-text-primary">{organizationName}</span>
          </div>
        </div>
      )}

      {/* Membership Status */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-text-primary">
          {localize('com_settings_membership_status')}
        </span>

        <div
          className={`rounded-lg border p-4 ${status.bgColor} ${status.borderColor} transition-all duration-200`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`rounded-full p-2 ${status.bgColor}`}>
                <StatusIcon className={`h-5 w-5 ${status.iconColor}`} />
              </div>
              <div>
                <div className={`font-medium ${status.textColor}`}>{status.label}</div>
                {remainingTime && (
                  <div className="text-sm text-text-secondary mt-0.5">{remainingTime}</div>
                )}
              </div>
            </div>

            {membershipExpiresAt && (
              <div className="flex items-center gap-2 text-text-secondary">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">
                  {new Date(membershipExpiresAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>

          {status.type === 'expired' && (
            <div className="mt-3 text-sm text-red-600 dark:text-red-400">
              {localize('com_settings_membership_expired_message')}
            </div>
          )}

          {status.type === 'expiring_soon' && (
            <div className="mt-3 text-sm text-yellow-600 dark:text-yellow-400">
              {localize('com_settings_membership_expiring_soon_message')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default React.memo(MembershipInfo);
