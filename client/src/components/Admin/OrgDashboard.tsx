import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  UserCheck,
  UserX,
  Shield,
  Calendar,
  ArrowRight,
  Loader2,
  AlertTriangle,
  UserPlus,
  Clock,
} from 'lucide-react';
import { useOrgStatsQuery, useOrgUsersQuery } from '~/data-provider/Admin/organization-management';
import { useLocalize } from '~/hooks';

export default function OrgDashboard() {
  const navigate = useNavigate();
  const localize = useLocalize();
  const { data: stats, isLoading: statsLoading, error: statsError } = useOrgStatsQuery();
  const { data: usersData, isLoading: usersLoading } = useOrgUsersQuery({ limit: 5 });

  if (statsLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-text-secondary" />
      </div>
    );
  }

  if (statsError || !stats) {
    return (
      <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-6 border border-red-200 dark:border-red-800">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-red-500" />
          <div>
            <h3 className="font-medium text-red-800 dark:text-red-200">{localize('com_admin_error_loading_dashboard')}</h3>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1">
              {localize('com_admin_error_loading_dashboard_description')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return localize('com_admin_never');
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isExpired = (expiresAt?: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const isExpiringSoon = (expiresAt?: string | null) => {
    if (!expiresAt) return false;
    const now = new Date();
    const expDate = new Date(expiresAt);
    const daysUntilExpiry = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Organization Header */}
      <div className="rounded-xl border border-border-medium bg-gradient-to-r from-blue-600 to-blue-700 p-6 shadow-lg text-white">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-white/20">
            <Building2 className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{stats.organization.name}</h1>
            <p className="text-blue-100 mt-1">
              {localize('com_admin_org_code_label')}: <code className="bg-white/20 px-2 py-0.5 rounded">{stats.organization.code}</code>
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border-medium bg-surface-primary p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                {localize('com_admin_total_users_label')}
              </p>
              <p className="mt-2 text-3xl font-bold text-text-primary">{stats.totalUsers}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/50">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border-medium bg-surface-primary p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                {localize('com_admin_active_users_label')}
              </p>
              <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
                {stats.activeUsers}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/50">
              <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border-medium bg-surface-primary p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                {localize('com_admin_expired_users_label')}
              </p>
              <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">
                {stats.expiredUsers}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/50">
              <UserX className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border-medium bg-surface-primary p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                {localize('com_admin_admins_label')}
              </p>
              <p className="mt-2 text-3xl font-bold text-purple-600 dark:text-purple-400">
                {stats.adminCount}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/50">
              <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="rounded-xl border border-border-medium bg-surface-primary shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-border-medium">
            <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <Users className="h-5 w-5 text-text-secondary" />
              {localize('com_admin_recent_users')}
            </h3>
            <button
              onClick={() => navigate('/d/admin/users')}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              {localize('com_admin_view_all')}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="divide-y divide-border-medium">
            {usersLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="h-5 w-5 animate-spin mx-auto text-text-secondary" />
              </div>
            ) : usersData?.users && usersData.users.length > 0 ? (
              usersData.users.slice(0, 5).map((user) => (
                <div key={user._id} className="flex items-center justify-between p-4 hover:bg-surface-hover/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white font-medium text-sm">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="font-medium text-text-primary text-sm">{user.name}</div>
                      <div className="text-xs text-text-tertiary">{user.email}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    {user.membershipExpiresAt ? (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          isExpired(user.membershipExpiresAt)
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                            : isExpiringSoon(user.membershipExpiresAt)
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300'
                              : 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                        }`}
                      >
                        {isExpired(user.membershipExpiresAt)
                          ? localize('com_admin_expired')
                          : formatDate(user.membershipExpiresAt)}
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                        {localize('com_admin_unlimited')}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-text-secondary">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">{localize('com_admin_no_users_yet')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="rounded-xl border border-border-medium bg-surface-primary shadow-sm">
          <div className="p-5 border-b border-border-medium">
            <h3 className="text-lg font-semibold text-text-primary">{localize('com_admin_quick_actions_panel')}</h3>
          </div>
          <div className="p-5 space-y-3">
            <button
              onClick={() => navigate('/d/admin/users')}
              className="w-full flex items-center gap-4 p-4 rounded-lg border border-border-medium hover:bg-surface-hover transition-colors text-left"
            >
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="font-medium text-text-primary">{localize('com_admin_create_new_user')}</div>
                <div className="text-sm text-text-secondary">{localize('com_admin_create_new_user_description')}</div>
              </div>
            </button>

            <button
              onClick={() => navigate('/d/admin/users')}
              className="w-full flex items-center gap-4 p-4 rounded-lg border border-border-medium hover:bg-surface-hover transition-colors text-left"
            >
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50">
                <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="font-medium text-text-primary">{localize('com_admin_manage_memberships')}</div>
                <div className="text-sm text-text-secondary">{localize('com_admin_manage_memberships_description')}</div>
              </div>
            </button>

            <button
              onClick={() => navigate('/d/admin/stats')}
              className="w-full flex items-center gap-4 p-4 rounded-lg border border-border-medium hover:bg-surface-hover transition-colors text-left"
            >
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="font-medium text-text-primary">{localize('com_admin_view_statistics_action')}</div>
                <div className="text-sm text-text-secondary">{localize('com_admin_view_statistics_action_description')}</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Organization Info Footer */}
      <div className="rounded-xl border border-border-medium bg-surface-secondary/50 p-4">
        <div className="flex items-center justify-between text-sm text-text-secondary">
          <span>{localize('com_admin_org_created_label')}: {formatDate(stats.organization.createdAt)}</span>
          <span>
            {localize('com_admin_users_active_label', { active: stats.activeUsers.toString(), total: stats.totalUsers.toString() })}
          </span>
        </div>
      </div>
    </div>
  );
}
