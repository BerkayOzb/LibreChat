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
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-text-secondary dark:text-admin-text-secondary" />
          <p className="mt-2 text-sm text-text-secondary dark:text-admin-text-secondary">
            {localize('com_admin_loading_statistics')}
          </p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-xl bg-rose-50 dark:bg-admin-danger/10 p-6 border border-rose-200 dark:border-admin-danger/30">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-rose-500 dark:text-admin-danger" />
          <div>
            <h3 className="font-medium text-rose-800 dark:text-admin-danger">
              {localize('com_admin_error_loading_statistics')}
            </h3>
            <p className="text-sm text-rose-600 dark:text-admin-text-secondary mt-1">
              {localize('com_admin_error_loading_statistics_description')}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-2 text-sm font-medium text-rose-700 dark:text-admin-link hover:underline"
            >
              {localize('com_admin_try_again')}
            </button>
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

  // Calculate membership percentages for the visual bar
  const totalForBar = stats.totalUsers || 1;
  const unlimitedPercent = (stats.membershipDistribution.unlimited / totalForBar) * 100;
  const activePercent = (stats.membershipDistribution.active / totalForBar) * 100;
  const expiringSoonPercent = (stats.membershipDistribution.expiringSoon / totalForBar) * 100;
  const expiredPercent = (stats.membershipDistribution.expired / totalForBar) * 100;

  return (
    <div className="space-y-6">
      {/* Page Header with Organization Info */}
      <div className="rounded-xl border border-border-medium dark:border-admin-border-subtle bg-admin-primary p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{stats.organization.name}</h1>
              <p className="text-blue-100 mt-1 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {localize('com_admin_org_statistics_title')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-blue-100">
            <Calendar className="h-4 w-4" />
            {localize('com_admin_org_since')}: {formatDate(stats.organization.createdAt)}
          </div>
        </div>
      </div>

      {/* Main Stats Cards - First Row */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="rounded-xl border border-border-medium dark:border-admin-border-subtle bg-surface-primary dark:bg-admin-bg-surface p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-text-tertiary dark:text-admin-text-muted uppercase tracking-wide">
                {localize('com_admin_total_users_label')}
              </p>
              <p className="mt-2 text-3xl font-bold text-text-primary dark:text-admin-text-primary">{stats.totalUsers}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-admin-primary/10">
              <Users className="h-6 w-6 text-blue-600 dark:text-admin-info" />
            </div>
          </div>
          <div className="mt-3 text-xs text-text-secondary dark:text-admin-text-secondary">
            {localize('com_admin_admins_label')}: <span className="font-medium">{stats.adminCount}</span>
          </div>
        </div>

        {/* Active Users */}
        <div className="rounded-xl border border-border-medium dark:border-admin-border-subtle bg-surface-primary dark:bg-admin-bg-surface p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-text-tertiary dark:text-admin-text-muted uppercase tracking-wide">
                {localize('com_admin_active_users_label')}
              </p>
              <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-admin-success">
                {stats.activeUsers}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-admin-success/10">
              <UserCheck className="h-6 w-6 text-emerald-600 dark:text-admin-success" />
            </div>
          </div>
          <div className="mt-3 text-xs text-text-secondary dark:text-admin-text-secondary">
            {Math.round((stats.activeUsers / (stats.totalUsers || 1)) * 100)}% {localize('com_admin_of_total')}
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="rounded-xl border border-border-medium dark:border-admin-border-subtle bg-surface-primary dark:bg-admin-bg-surface p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-text-tertiary dark:text-admin-text-muted uppercase tracking-wide">
                {localize('com_admin_expiring_soon_label')}
              </p>
              <p className="mt-2 text-3xl font-bold text-amber-600 dark:text-admin-warning">
                {stats.expiringSoonUsers}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-admin-warning/10">
              <Clock className="h-6 w-6 text-amber-600 dark:text-admin-warning" />
            </div>
          </div>
          <div className="mt-3 text-xs text-text-secondary dark:text-admin-text-secondary">
            {localize('com_admin_next_7_days')}
          </div>
        </div>

        {/* Expired Users */}
        <div className="rounded-xl border border-border-medium dark:border-admin-border-subtle bg-surface-primary dark:bg-admin-bg-surface p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-text-tertiary dark:text-admin-text-muted uppercase tracking-wide">
                {localize('com_admin_expired_users_label')}
              </p>
              <p className="mt-2 text-3xl font-bold text-rose-600 dark:text-admin-danger">
                {stats.expiredUsers}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-admin-danger/10">
              <UserX className="h-6 w-6 text-rose-600 dark:text-admin-danger" />
            </div>
          </div>
          <div className="mt-3 text-xs text-text-secondary dark:text-admin-text-secondary">
            {localize('com_admin_needs_attention')}
          </div>
        </div>
      </div>

      {/* Membership Distribution Bar */}
      <div className="rounded-xl border border-border-medium dark:border-admin-border-subtle bg-surface-primary dark:bg-admin-bg-surface p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-text-primary dark:text-admin-text-primary mb-4">
          {localize('com_admin_membership_distribution')}
        </h3>

        {/* Visual Bar */}
        <div className="h-4 rounded-full bg-surface-secondary dark:bg-admin-bg-elevated overflow-hidden flex">
          {unlimitedPercent > 0 && (
            <div
              className="bg-sky-500 dark:bg-admin-info transition-all duration-500"
              style={{ width: `${unlimitedPercent}%` }}
              title={`${localize('com_admin_unlimited')}: ${stats.membershipDistribution.unlimited}`}
            />
          )}
          {activePercent > 0 && (
            <div
              className="bg-emerald-500 dark:bg-admin-success transition-all duration-500"
              style={{ width: `${activePercent}%` }}
              title={`${localize('com_admin_active')}: ${stats.membershipDistribution.active}`}
            />
          )}
          {expiringSoonPercent > 0 && (
            <div
              className="bg-amber-500 dark:bg-admin-warning transition-all duration-500"
              style={{ width: `${expiringSoonPercent}%` }}
              title={`${localize('com_admin_expiring_soon')}: ${stats.membershipDistribution.expiringSoon}`}
            />
          )}
          {expiredPercent > 0 && (
            <div
              className="bg-rose-500 dark:bg-admin-danger transition-all duration-500"
              style={{ width: `${expiredPercent}%` }}
              title={`${localize('com_admin_expired')}: ${stats.membershipDistribution.expired}`}
            />
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-sky-500 dark:bg-admin-info" />
            <span className="text-sm text-text-secondary dark:text-admin-text-secondary">
              {localize('com_admin_unlimited')} ({stats.membershipDistribution.unlimited})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 dark:bg-admin-success" />
            <span className="text-sm text-text-secondary dark:text-admin-text-secondary">
              {localize('com_admin_active')} ({stats.membershipDistribution.active})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500 dark:bg-admin-warning" />
            <span className="text-sm text-text-secondary dark:text-admin-text-secondary">
              {localize('com_admin_expiring_soon')} ({stats.membershipDistribution.expiringSoon})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500 dark:bg-admin-danger" />
            <span className="text-sm text-text-secondary dark:text-admin-text-secondary">
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
          <div className="rounded-xl border border-border-medium dark:border-admin-border-subtle bg-surface-primary dark:bg-admin-bg-surface p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-text-primary dark:text-admin-text-primary flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-emerald-500 dark:text-admin-success" />
              {localize('com_admin_growth_stats')}
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary/50 dark:bg-admin-bg-elevated/50">
                <span className="text-sm text-text-secondary dark:text-admin-text-secondary">{localize('com_admin_new_today')}</span>
                <span className="text-lg font-bold text-text-primary dark:text-admin-text-primary">+{stats.growth.newUsersToday}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary/50 dark:bg-admin-bg-elevated/50">
                <span className="text-sm text-text-secondary dark:text-admin-text-secondary">{localize('com_admin_new_this_week')}</span>
                <span className="text-lg font-bold text-text-primary dark:text-admin-text-primary">+{stats.growth.newUsersThisWeek}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary/50 dark:bg-admin-bg-elevated/50">
                <span className="text-sm text-text-secondary dark:text-admin-text-secondary">{localize('com_admin_new_this_month')}</span>
                <span className="text-lg font-bold text-text-primary dark:text-admin-text-primary">+{stats.growth.newUsersThisMonth}</span>
              </div>
            </div>
          </div>

          {/* Activity Stats */}
          <div className="rounded-xl border border-border-medium dark:border-admin-border-subtle bg-surface-primary dark:bg-admin-bg-surface p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-text-primary dark:text-admin-text-primary flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-violet-500 dark:text-admin-link" />
              {localize('com_admin_activity_stats')}
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary/50 dark:bg-admin-bg-elevated/50">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-text-tertiary dark:text-admin-text-muted" />
                  <span className="text-sm text-text-secondary dark:text-admin-text-secondary">{localize('com_admin_total_conversations')}</span>
                </div>
                <span className="text-lg font-bold text-text-primary dark:text-admin-text-primary">{stats.activity.totalConversations}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary/50 dark:bg-admin-bg-elevated/50">
                <span className="text-sm text-text-secondary dark:text-admin-text-secondary">{localize('com_admin_conversations_today')}</span>
                <span className="text-lg font-bold text-violet-600 dark:text-admin-link">
                  {stats.activity.conversationsToday}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary/50 dark:bg-admin-bg-elevated/50">
                <span className="text-sm text-text-secondary dark:text-admin-text-secondary">{localize('com_admin_conversations_this_week')}</span>
                <span className="text-lg font-bold text-violet-600 dark:text-admin-link">
                  {stats.activity.conversationsThisWeek}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Users */}
        <div className="rounded-xl border border-border-medium dark:border-admin-border-subtle bg-surface-primary dark:bg-admin-bg-surface shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-border-medium dark:border-admin-border-subtle">
            <h3 className="text-lg font-semibold text-text-primary dark:text-admin-text-primary flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-text-secondary dark:text-admin-text-secondary" />
              {localize('com_admin_recent_users')}
            </h3>
            <button
              onClick={() => navigate('/d/admin/users')}
              className="text-sm text-blue-600 dark:text-admin-link hover:text-blue-700 dark:hover:text-admin-link-hover flex items-center gap-1"
            >
              {localize('com_admin_view_all')}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="divide-y divide-border-medium dark:divide-admin-border-subtle">
            {stats.recentUsers && stats.recentUsers.length > 0 ? (
              stats.recentUsers.map((user) => (
                <div key={user._id} className="flex items-center justify-between p-4 hover:bg-surface-hover/50 dark:hover:bg-admin-row-hover transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 dark:from-admin-border-muted dark:to-admin-bg-elevated flex items-center justify-center text-white font-medium text-sm shadow-sm">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="font-medium text-text-primary dark:text-admin-text-primary text-sm">{user.name}</div>
                      <div className="text-xs text-text-tertiary dark:text-admin-text-muted">{user.email}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    {user.membershipExpiresAt ? (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          isExpired(user.membershipExpiresAt)
                            ? 'bg-rose-50 text-rose-700 dark:bg-admin-danger/10 dark:text-admin-danger'
                            : isExpiringSoon(user.membershipExpiresAt)
                              ? 'bg-amber-50 text-amber-700 dark:bg-admin-warning/10 dark:text-admin-warning'
                              : 'bg-emerald-50 text-emerald-700 dark:bg-admin-success/10 dark:text-admin-success'
                        }`}
                      >
                        {isExpired(user.membershipExpiresAt)
                          ? localize('com_admin_expired')
                          : formatDate(user.membershipExpiresAt)}
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 dark:bg-admin-info/10 dark:text-admin-info inline-flex items-center gap-1">
                        <Infinity className="h-3 w-3" />
                        {localize('com_admin_unlimited')}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-text-secondary dark:text-admin-text-secondary">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">{localize('com_admin_no_users_yet')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Summary */}
      <div className="rounded-xl border border-border-medium dark:border-admin-border-subtle bg-surface-secondary/50 dark:bg-admin-bg-elevated/50 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-text-secondary dark:text-admin-text-secondary">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-violet-500 dark:text-admin-link" />
            <span>
              {localize('com_admin_org_code_label')}: <code className="bg-surface-primary dark:bg-admin-bg-surface px-2 py-0.5 rounded text-text-primary dark:text-admin-text-primary">{stats.organization.code}</code>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span>
              {localize('com_admin_unlimited_users')}: <strong className="text-sky-600 dark:text-admin-info">{stats.unlimitedUsers}</strong>
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
