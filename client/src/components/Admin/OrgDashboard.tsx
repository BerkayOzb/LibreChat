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
        <Loader2 className="h-8 w-8 animate-spin text-admin-light-text-secondary dark:text-admin-text-secondary" />
      </div>
    );
  }

  if (statsError || !stats) {
    return (
      <div className="rounded-xl bg-admin-light-danger/10 dark:bg-admin-danger/10 p-6 border border-admin-light-danger/30 dark:border-admin-danger/30">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-admin-light-danger dark:text-admin-danger" />
          <div>
            <h3 className="font-medium text-admin-light-danger dark:text-admin-danger">{localize('com_admin_error_loading_dashboard')}</h3>
            <p className="text-sm text-admin-light-text-secondary dark:text-admin-text-secondary mt-1">
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
    <div className="space-y-6">
      {/* Organization Header */}
      <div className="rounded-xl border border-admin-light-border-subtle dark:border-admin-border-subtle bg-admin-light-primary dark:bg-admin-primary p-6 shadow-md">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-white/20">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{stats.organization.name}</h1>
            <p className="text-blue-100 mt-1">
              {localize('com_admin_org_code_label')}: <code className="bg-white/20 px-2 py-0.5 rounded text-white">{stats.organization.code}</code>
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-admin-light-border-subtle dark:border-admin-border-subtle bg-admin-light-bg-surface dark:bg-admin-bg-surface p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-admin-light-text-muted dark:text-admin-text-muted uppercase tracking-wide">
                {localize('com_admin_total_users_label')}
              </p>
              <p className="mt-2 text-3xl font-bold text-admin-light-text-primary dark:text-admin-text-primary">{stats.totalUsers}</p>
            </div>
            <div className="p-3 rounded-xl bg-admin-light-info/10 dark:bg-admin-primary/10">
              <Users className="h-6 w-6 text-admin-light-info dark:text-admin-info" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-admin-light-border-subtle dark:border-admin-border-subtle bg-admin-light-bg-surface dark:bg-admin-bg-surface p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-admin-light-text-muted dark:text-admin-text-muted uppercase tracking-wide">
                {localize('com_admin_active_users_label')}
              </p>
              <p className="mt-2 text-3xl font-bold text-admin-light-success dark:text-admin-success">
                {stats.activeUsers}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-admin-light-success/10 dark:bg-admin-success/10">
              <UserCheck className="h-6 w-6 text-admin-light-success dark:text-admin-success" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-admin-light-border-subtle dark:border-admin-border-subtle bg-admin-light-bg-surface dark:bg-admin-bg-surface p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-admin-light-text-muted dark:text-admin-text-muted uppercase tracking-wide">
                {localize('com_admin_expired_users_label')}
              </p>
              <p className="mt-2 text-3xl font-bold text-admin-light-danger dark:text-admin-danger">
                {stats.expiredUsers}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-admin-light-danger/10 dark:bg-admin-danger/10">
              <UserX className="h-6 w-6 text-admin-light-danger dark:text-admin-danger" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-admin-light-border-subtle dark:border-admin-border-subtle bg-admin-light-bg-surface dark:bg-admin-bg-surface p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-admin-light-text-muted dark:text-admin-text-muted uppercase tracking-wide">
                {localize('com_admin_admins_label')}
              </p>
              <p className="mt-2 text-3xl font-bold text-admin-light-link dark:text-admin-link">
                {stats.adminCount}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-admin-light-link/10 dark:bg-admin-link/10">
              <Shield className="h-6 w-6 text-admin-light-link dark:text-admin-link" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="rounded-xl border border-admin-light-border-subtle dark:border-admin-border-subtle bg-admin-light-bg-surface dark:bg-admin-bg-surface shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-admin-light-border-subtle dark:border-admin-border-subtle">
            <h3 className="text-lg font-semibold text-admin-light-text-primary dark:text-admin-text-primary flex items-center gap-2">
              <Users className="h-5 w-5 text-admin-light-text-secondary dark:text-admin-text-secondary" />
              {localize('com_admin_recent_users')}
            </h3>
            <button
              onClick={() => navigate('/d/admin/users')}
              className="text-sm text-admin-light-link dark:text-admin-link hover:text-admin-light-link-hover dark:hover:text-admin-link-hover flex items-center gap-1"
            >
              {localize('com_admin_view_all')}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="divide-y divide-admin-light-border-subtle dark:divide-admin-border-subtle">
            {usersLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="h-5 w-5 animate-spin mx-auto text-admin-light-text-secondary dark:text-admin-text-secondary" />
              </div>
            ) : usersData?.users && usersData.users.length > 0 ? (
              usersData.users.slice(0, 5).map((user) => (
                <div key={user._id} className="flex items-center justify-between p-4 hover:bg-admin-light-row-hover dark:hover:bg-admin-row-hover transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-admin-light-border-muted to-admin-light-text-muted dark:from-admin-border-muted dark:to-admin-bg-elevated flex items-center justify-center text-white font-medium text-sm">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="font-medium text-admin-light-text-primary dark:text-admin-text-primary text-sm">{user.name}</div>
                      <div className="text-xs text-admin-light-text-muted dark:text-admin-text-muted">{user.email}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    {user.membershipExpiresAt ? (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          isExpired(user.membershipExpiresAt)
                            ? 'bg-admin-light-danger/10 text-admin-light-danger dark:bg-admin-danger/10 dark:text-admin-danger'
                            : isExpiringSoon(user.membershipExpiresAt)
                              ? 'bg-admin-light-warning/10 text-admin-light-warning dark:bg-admin-warning/10 dark:text-admin-warning'
                              : 'bg-admin-light-success/10 text-admin-light-success dark:bg-admin-success/10 dark:text-admin-success'
                        }`}
                      >
                        {isExpired(user.membershipExpiresAt)
                          ? localize('com_admin_expired')
                          : formatDate(user.membershipExpiresAt)}
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-admin-light-info/10 text-admin-light-info dark:bg-admin-info/10 dark:text-admin-info">
                        {localize('com_admin_unlimited')}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-admin-light-text-secondary dark:text-admin-text-secondary">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">{localize('com_admin_no_users_yet')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="rounded-xl border border-admin-light-border-subtle dark:border-admin-border-subtle bg-admin-light-bg-surface dark:bg-admin-bg-surface shadow-sm">
          <div className="p-5 border-b border-admin-light-border-subtle dark:border-admin-border-subtle">
            <h3 className="text-lg font-semibold text-admin-light-text-primary dark:text-admin-text-primary">{localize('com_admin_quick_actions_panel')}</h3>
          </div>
          <div className="p-5 space-y-3">
            <button
              onClick={() => navigate('/d/admin/users')}
              className="w-full flex items-center gap-4 p-4 rounded-lg border border-admin-light-border-subtle dark:border-admin-border-subtle hover:bg-admin-light-row-hover dark:hover:bg-admin-row-hover transition-colors text-left"
            >
              <div className="p-2 rounded-lg bg-admin-light-info/10 dark:bg-admin-primary/10">
                <UserPlus className="h-5 w-5 text-admin-light-info dark:text-admin-info" />
              </div>
              <div>
                <div className="font-medium text-admin-light-text-primary dark:text-admin-text-primary">{localize('com_admin_create_new_user')}</div>
                <div className="text-sm text-admin-light-text-secondary dark:text-admin-text-secondary">{localize('com_admin_create_new_user_description')}</div>
              </div>
            </button>

            <button
              onClick={() => navigate('/d/admin/users')}
              className="w-full flex items-center gap-4 p-4 rounded-lg border border-admin-light-border-subtle dark:border-admin-border-subtle hover:bg-admin-light-row-hover dark:hover:bg-admin-row-hover transition-colors text-left"
            >
              <div className="p-2 rounded-lg bg-admin-light-success/10 dark:bg-admin-success/10">
                <Clock className="h-5 w-5 text-admin-light-success dark:text-admin-success" />
              </div>
              <div>
                <div className="font-medium text-admin-light-text-primary dark:text-admin-text-primary">{localize('com_admin_manage_memberships')}</div>
                <div className="text-sm text-admin-light-text-secondary dark:text-admin-text-secondary">{localize('com_admin_manage_memberships_description')}</div>
              </div>
            </button>

            <button
              onClick={() => navigate('/d/admin/stats')}
              className="w-full flex items-center gap-4 p-4 rounded-lg border border-admin-light-border-subtle dark:border-admin-border-subtle hover:bg-admin-light-row-hover dark:hover:bg-admin-row-hover transition-colors text-left"
            >
              <div className="p-2 rounded-lg bg-admin-light-link/10 dark:bg-admin-link/10">
                <Calendar className="h-5 w-5 text-admin-light-link dark:text-admin-link" />
              </div>
              <div>
                <div className="font-medium text-admin-light-text-primary dark:text-admin-text-primary">{localize('com_admin_view_statistics_action')}</div>
                <div className="text-sm text-admin-light-text-secondary dark:text-admin-text-secondary">{localize('com_admin_view_statistics_action_description')}</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Organization Info Footer */}
      <div className="rounded-xl border border-admin-light-border-subtle dark:border-admin-border-subtle bg-admin-light-bg-elevated/50 dark:bg-admin-bg-elevated/50 p-4">
        <div className="flex items-center justify-between text-sm text-admin-light-text-secondary dark:text-admin-text-secondary">
          <span>{localize('com_admin_org_created_label')}: {formatDate(stats.organization.createdAt)}</span>
          <span>
            {localize('com_admin_users_active_label', { active: stats.activeUsers.toString(), total: stats.totalUsers.toString() })}
          </span>
        </div>
      </div>
    </div>
  );
}
