import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  UserCheck,
  UserX,
  Shield,
  Clock,
  TrendingUp,
  MessageSquare,
  UserPlus,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Calendar,
  BarChart3,
  Activity,
  Infinity,
} from 'lucide-react';
import { useOrgStatsQuery } from '~/data-provider/Admin/organization-management';
import { useLocalize } from '~/hooks';

export default function OrgAdminStats() {
  const navigate = useNavigate();
  const localize = useLocalize();
  const { data: stats, isLoading, error, refetch } = useOrgStatsQuery();

  if (isLoading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        <p className="admin-loading-text">
          {localize('com_admin_loading_statistics')}
        </p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="admin-alert admin-alert-danger">
        <AlertTriangle className="h-6 w-6" />
        <div>
          <h3 className="admin-alert-title">
            {localize('com_admin_error_loading_statistics')}
          </h3>
          <p className="admin-alert-description mt-1">
            {localize('com_admin_error_loading_statistics_description')}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-2 text-sm font-medium admin-link hover:underline"
          >
            {localize('com_admin_try_again')}
          </button>
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

  // Calculate membership percentages for the visual bar
  const totalForBar = stats.totalUsers || 1;
  const unlimitedPercent = (stats.membershipDistribution.unlimited / totalForBar) * 100;
  const activePercent = (stats.membershipDistribution.active / totalForBar) * 100;
  const expiringSoonPercent = (stats.membershipDistribution.expiringSoon / totalForBar) * 100;
  const expiredPercent = (stats.membershipDistribution.expired / totalForBar) * 100;

  return (
    <div className="space-y-6">
      {/* Page Header with Organization Info */}
      <div className="admin-header-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="admin-header-icon">
              <BarChart3 className="h-8 w-8" />
            </div>
            <div>
              <h1 className="admin-header-title">{stats.organization.name}</h1>
              <p className="admin-header-description mt-1 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {localize('com_admin_org_statistics_title')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--admin-header-text-muted)' }}>
            <Calendar className="h-4 w-4" />
            {localize('com_admin_org_since')}: {formatDate(stats.organization.createdAt)}
          </div>
        </div>
      </div>

      {/* Main Stats Cards - First Row */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
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
          <div className="mt-3 text-xs admin-text-secondary">
            {localize('com_admin_admins_label')}: <span className="font-medium">{stats.adminCount}</span>
          </div>
        </div>

        {/* Active Users */}
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
          <div className="mt-3 text-xs admin-text-secondary">
            {Math.round((stats.activeUsers / (stats.totalUsers || 1)) * 100)}% {localize('com_admin_of_total')}
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="admin-stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">
                {localize('com_admin_expiring_soon_label')}
              </p>
              <p className="stat-value mt-2 admin-warning">
                {stats.expiringSoonUsers}
              </p>
            </div>
            <div className="admin-warning-bg p-3 rounded-xl">
              <Clock className="h-6 w-6 admin-warning" />
            </div>
          </div>
          <div className="mt-3 text-xs admin-text-secondary">
            {localize('com_admin_next_7_days')}
          </div>
        </div>

        {/* Expired Users */}
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
          <div className="mt-3 text-xs admin-text-secondary">
            {localize('com_admin_needs_attention')}
          </div>
        </div>
      </div>

      {/* Membership Distribution Bar */}
      <div className="admin-card p-6">
        <h3 className="text-lg font-semibold admin-text-primary mb-4">
          {localize('com_admin_membership_distribution')}
        </h3>

        {/* Visual Bar */}
        <div className="h-4 rounded-full bg-[var(--admin-bg-elevated)] overflow-hidden flex">
          {unlimitedPercent > 0 && (
            <div
              className="transition-all duration-500"
              style={{ width: `${unlimitedPercent}%`, backgroundColor: 'var(--admin-info)' }}
              title={`${localize('com_admin_unlimited')}: ${stats.membershipDistribution.unlimited}`}
            />
          )}
          {activePercent > 0 && (
            <div
              className="transition-all duration-500"
              style={{ width: `${activePercent}%`, backgroundColor: 'var(--admin-success)' }}
              title={`${localize('com_admin_active')}: ${stats.membershipDistribution.active}`}
            />
          )}
          {expiringSoonPercent > 0 && (
            <div
              className="transition-all duration-500"
              style={{ width: `${expiringSoonPercent}%`, backgroundColor: 'var(--admin-warning)' }}
              title={`${localize('com_admin_expiring_soon')}: ${stats.membershipDistribution.expiringSoon}`}
            />
          )}
          {expiredPercent > 0 && (
            <div
              className="transition-all duration-500"
              style={{ width: `${expiredPercent}%`, backgroundColor: 'var(--admin-danger)' }}
              title={`${localize('com_admin_expired')}: ${stats.membershipDistribution.expired}`}
            />
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--admin-info)' }} />
            <span className="text-sm admin-text-secondary">
              {localize('com_admin_unlimited')} ({stats.membershipDistribution.unlimited})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--admin-success)' }} />
            <span className="text-sm admin-text-secondary">
              {localize('com_admin_active')} ({stats.membershipDistribution.active})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--admin-warning)' }} />
            <span className="text-sm admin-text-secondary">
              {localize('com_admin_expiring_soon')} ({stats.membershipDistribution.expiringSoon})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--admin-danger)' }} />
            <span className="text-sm admin-text-secondary">
              {localize('com_admin_expired')} ({stats.membershipDistribution.expired})
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth & Activity Stats */}
        <div className="space-y-6">
          {/* Growth Stats */}
          <div className="admin-card p-6">
            <h3 className="text-lg font-semibold admin-text-primary flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 admin-success" />
              {localize('com_admin_growth_stats')}
            </h3>
            <div className="space-y-3">
              <div className="admin-inner-stat">
                <span className="admin-inner-stat-label">{localize('com_admin_new_today')}</span>
                <span className="admin-inner-stat-value admin-success">+{stats.growth.newUsersToday}</span>
              </div>
              <div className="admin-inner-stat">
                <span className="admin-inner-stat-label">{localize('com_admin_new_this_week')}</span>
                <span className="admin-inner-stat-value admin-success">+{stats.growth.newUsersThisWeek}</span>
              </div>
              <div className="admin-inner-stat">
                <span className="admin-inner-stat-label">{localize('com_admin_new_this_month')}</span>
                <span className="admin-inner-stat-value admin-success">+{stats.growth.newUsersThisMonth}</span>
              </div>
            </div>
          </div>

          {/* Activity Stats */}
          <div className="admin-card p-6">
            <h3 className="text-lg font-semibold admin-text-primary flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 admin-link" />
              {localize('com_admin_activity_stats')}
            </h3>
            <div className="space-y-3">
              <div className="admin-inner-stat">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 admin-text-muted" />
                  <span className="admin-inner-stat-label">{localize('com_admin_total_conversations')}</span>
                </div>
                <span className="admin-inner-stat-value">{stats.activity.totalConversations}</span>
              </div>
              <div className="admin-inner-stat">
                <span className="admin-inner-stat-label">{localize('com_admin_conversations_today')}</span>
                <span className="admin-inner-stat-value admin-link">
                  {stats.activity.conversationsToday}
                </span>
              </div>
              <div className="admin-inner-stat">
                <span className="admin-inner-stat-label">{localize('com_admin_conversations_this_week')}</span>
                <span className="admin-inner-stat-value admin-link">
                  {stats.activity.conversationsThisWeek}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Users */}
        <div className="admin-card">
          <div className="admin-card-header flex items-center justify-between">
            <h3 className="admin-card-title flex items-center gap-2">
              <UserPlus className="h-5 w-5 admin-text-secondary" />
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
            {stats.recentUsers && stats.recentUsers.length > 0 ? (
              stats.recentUsers.map((user) => (
                <div key={user._id} className="flex items-center justify-between p-4 hover:bg-[var(--admin-row-hover)] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium text-sm shadow-sm">
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
                      <span className="admin-badge admin-badge-info inline-flex items-center gap-1">
                        <Infinity className="h-3 w-3" />
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
      </div>

      {/* Quick Stats Summary */}
      <div className="admin-card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm admin-text-secondary">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 admin-link" />
            <span>
              {localize('com_admin_org_code_label')}: <code className="bg-[var(--admin-bg-elevated)] px-2 py-0.5 rounded admin-text-primary">{stats.organization.code}</code>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span>
              {localize('com_admin_unlimited_users')}: <strong className="admin-info">{stats.unlimitedUsers}</strong>
            </span>
            <span className="hidden sm:inline">•</span>
            <span>
              {localize('com_admin_users_active_label', {
                active: stats.activeUsers.toString(),
                total: stats.totalUsers.toString()
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
