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
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        <p className="admin-loading-text">{localize('com_admin_loading')}</p>
      </div>
    );
  }

  if (statsError || !stats) {
    return (
      <div className="admin-alert admin-alert-danger">
        <AlertTriangle className="h-6 w-6" />
        <div>
          <h3 className="admin-alert-title">{localize('com_admin_error_loading_dashboard')}</h3>
          <p className="admin-alert-description mt-1">
            {localize('com_admin_error_loading_dashboard_description')}
          </p>
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
      <div className="admin-header-card">
        <div className="flex items-center gap-4">
          <div className="admin-header-icon">
            <Building2 className="h-8 w-8" />
          </div>
          <div>
            <h1 className="admin-header-title">{stats.organization.name}</h1>
            <p className="admin-header-description mt-1">
              {localize('com_admin_org_code_label')}: <code className="bg-[var(--admin-header-icon-bg)] px-2 py-0.5 rounded">{stats.organization.code}</code>
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="admin-stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">
                {localize('com_admin_total_users_label')}
              </p>
              <p className="stat-value mt-2">{stats.totalUsers}</p>
            </div>
            <div className="admin-info-bg p-3 rounded-xl">
              <Users className="h-6 w-6 admin-info" />
            </div>
          </div>
        </div>

        <div className="admin-stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">
                {localize('com_admin_active_users_label')}
              </p>
              <p className="stat-value mt-2 admin-success">
                {stats.activeUsers}
              </p>
            </div>
            <div className="admin-success-bg p-3 rounded-xl">
              <UserCheck className="h-6 w-6 admin-success" />
            </div>
          </div>
        </div>

        <div className="admin-stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">
                {localize('com_admin_expired_users_label')}
              </p>
              <p className="stat-value mt-2 admin-danger">
                {stats.expiredUsers}
              </p>
            </div>
            <div className="admin-danger-bg p-3 rounded-xl">
              <UserX className="h-6 w-6 admin-danger" />
            </div>
          </div>
        </div>

        <div className="admin-stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">
                {localize('com_admin_admins_label')}
              </p>
              <p className="stat-value mt-2 admin-link">
                {stats.adminCount}
              </p>
            </div>
            <div className="stat-icon p-3">
              <Shield className="h-6 w-6 admin-link" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="admin-card">
          <div className="admin-card-header flex items-center justify-between">
            <h3 className="admin-card-title flex items-center gap-2">
              <Users className="h-5 w-5 admin-text-secondary" />
              {localize('com_admin_recent_users')}
            </h3>
            <button
              onClick={() => navigate('/d/admin/users')}
              className="text-sm admin-link hover:opacity-80 flex items-center gap-1"
            >
              {localize('com_admin_view_all')}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="divide-y divide-[var(--admin-border-subtle)]">
            {usersLoading ? (
              <div className="p-8 text-center">
                <div className="admin-loading-spinner mx-auto" />
              </div>
            ) : usersData?.users && usersData.users.length > 0 ? (
              usersData.users.slice(0, 5).map((user) => (
                <div key={user._id} className="flex items-center justify-between p-4 hover:bg-[var(--admin-row-hover)] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium text-sm">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="font-medium admin-text-primary text-sm">{user.name}</div>
                      <div className="text-xs admin-text-muted">{user.email}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    {user.membershipExpiresAt ? (
                      <span
                        className={`admin-badge ${
                          isExpired(user.membershipExpiresAt)
                            ? 'admin-badge-danger'
                            : isExpiringSoon(user.membershipExpiresAt)
                              ? 'admin-badge-warning'
                              : 'admin-badge-success'
                        }`}
                      >
                        {isExpired(user.membershipExpiresAt)
                          ? localize('com_admin_expired')
                          : formatDate(user.membershipExpiresAt)}
                      </span>
                    ) : (
                      <span className="admin-badge admin-badge-info">
                        {localize('com_admin_unlimited')}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="admin-empty-state py-8">
                <div className="admin-empty-state-icon">
                  <Users />
                </div>
                <p className="admin-empty-state-description">{localize('com_admin_no_users_yet')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">{localize('com_admin_quick_actions_panel')}</h3>
          </div>
          <div className="admin-card-body space-y-3">
            <button
              onClick={() => navigate('/d/admin/users')}
              className="w-full flex items-center gap-4 p-4 rounded-lg border border-[var(--admin-border-subtle)] hover:bg-[var(--admin-row-hover)] transition-colors text-left"
            >
              <div className="p-2 rounded-lg admin-info-bg">
                <UserPlus className="h-5 w-5 admin-info" />
              </div>
              <div>
                <div className="font-medium admin-text-primary">{localize('com_admin_create_new_user')}</div>
                <div className="text-sm admin-text-secondary">{localize('com_admin_create_new_user_description')}</div>
              </div>
            </button>

            <button
              onClick={() => navigate('/d/admin/users')}
              className="w-full flex items-center gap-4 p-4 rounded-lg border border-[var(--admin-border-subtle)] hover:bg-[var(--admin-row-hover)] transition-colors text-left"
            >
              <div className="p-2 rounded-lg admin-success-bg">
                <Clock className="h-5 w-5 admin-success" />
              </div>
              <div>
                <div className="font-medium admin-text-primary">{localize('com_admin_manage_memberships')}</div>
                <div className="text-sm admin-text-secondary">{localize('com_admin_manage_memberships_description')}</div>
              </div>
            </button>

            <button
              onClick={() => navigate('/d/admin/stats')}
              className="w-full flex items-center gap-4 p-4 rounded-lg border border-[var(--admin-border-subtle)] hover:bg-[var(--admin-row-hover)] transition-colors text-left"
            >
              <div className="stat-icon p-2">
                <Calendar className="h-5 w-5 admin-link" />
              </div>
              <div>
                <div className="font-medium admin-text-primary">{localize('com_admin_view_statistics_action')}</div>
                <div className="text-sm admin-text-secondary">{localize('com_admin_view_statistics_action_description')}</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Organization Info Footer */}
      <div className="admin-card p-4">
        <div className="flex items-center justify-between text-sm admin-text-secondary">
          <span>{localize('com_admin_org_created_label')}: {formatDate(stats.organization.createdAt)}</span>
          <span>
            {localize('com_admin_users_active_label', { active: stats.activeUsers.toString(), total: stats.totalUsers.toString() })}
          </span>
        </div>
      </div>
    </div>
  );
}
