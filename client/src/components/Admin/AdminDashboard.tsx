import { Link } from 'react-router-dom';
import {
  Users,
  BarChart3,
  Activity,
  TrendingUp,
  ArrowRight,
  Clock,
  MessageSquare,
  ShieldAlert,
  UserPlus,
  Brain,
  ArrowUpDown,
  LayoutDashboard,
  Building2,
  Calendar,
} from 'lucide-react';
import { cn } from '@librechat/client';
import { SystemRoles } from 'librechat-data-provider';
import { useLocalize, useAuthContext } from '~/hooks';
import { useAdminStatsQuery } from '~/data-provider';
import OrgDashboard from './OrgDashboard';

export default function AdminDashboard() {
  const localize = useLocalize();
  const { user } = useAuthContext();

  // If user is ORG_ADMIN, show organization-specific dashboard
  if (user?.role === SystemRoles.ORG_ADMIN) {
    return <OrgDashboard />;
  }

  // Fetch real admin statistics
  const {
    data: stats,
    isLoading,
    error: statsError
  } = useAdminStatsQuery();


  // Loading state fallback
  if (isLoading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        <p className="admin-loading-text">
          {localize('com_admin_loading_stats')}
        </p>
      </div>
    );
  }

  const quickActions = [
    {
      title: localize('com_admin_users'),
      description: localize('com_admin_manage_users'),
      icon: Users,
      href: '/d/admin/users',
      disabled: false,
    },
    {
      title: localize('com_admin_organizations'),
      description: localize('com_admin_manage_organizations'),
      icon: Building2,
      href: '/d/admin/organizations',
      disabled: false,
    },
    {
      title: localize('com_admin_statistics'),
      description: localize('com_admin_view_detailed_stats'),
      icon: BarChart3,
      href: '/d/admin/stats',
      disabled: false,
    },
    {
      title: localize('com_admin_model_control'),
      description: localize('com_admin_model_control_description'),
      icon: Brain,
      href: '/d/admin/models',
      disabled: false,
    },
    {
      title: localize('com_admin_provider_ordering'),
      description: localize('com_admin_provider_ordering_description'),
      icon: ArrowUpDown,
      href: '/d/admin/provider-ordering',
      disabled: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header Card */}
      <div className="admin-header-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="admin-header-icon">
              <LayoutDashboard className="h-8 w-8" />
            </div>
            <div>
              <h1 className="admin-header-title">
                {localize('com_admin_dashboard')}
              </h1>
              <p className="admin-header-description mt-1">
                {localize('com_admin_dashboard_welcome')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Users Card */}
        <div className="admin-stats-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label">
                {localize('com_admin_total_users')}
              </p>
              <p className="stat-value mt-2">
                {stats?.totalUsers?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="stat-icon">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <div className="flex items-center admin-success">
              <TrendingUp className="h-3 w-3" />
              <span className="ml-1 text-xs font-medium">+{stats?.growth?.newUsersToday || 0}</span>
            </div>
            <span className="text-xs admin-text-muted">{localize('com_admin_new_today')}</span>
          </div>
        </div>

        {/* Active Users Card */}
        <div className="admin-stats-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label">
                {localize('com_admin_active_weekly')}
              </p>
              <p className="stat-value mt-2">
                {stats?.activity?.activeUsersWeek?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="stat-icon">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <Clock className="h-3 w-3 admin-text-muted" />
            <span className="text-xs admin-text-muted">{localize('com_admin_last_7_days')}</span>
          </div>
        </div>

        {/* Conversations Today Card */}
        <div className="admin-stats-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label">
                {localize('com_admin_conversations_today')}
              </p>
              <p className="stat-value mt-2">
                {stats?.conversations?.today?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="stat-icon">
              <MessageSquare className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <Calendar className="h-3 w-3 admin-text-muted" />
            <span className="text-xs admin-text-muted">
              {localize('com_admin_total')}: {stats?.totalConversations?.toLocaleString() || '0'}
            </span>
          </div>
        </div>

        {/* Security/Banned Card */}
        <div className="admin-stats-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label">
                {localize('com_admin_banned_users')}
              </p>
              <p className="stat-value mt-2">
                {stats?.overview?.bannedUsers?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="admin-danger-bg rounded-lg p-2.5">
              <ShieldAlert className="h-5 w-5 admin-danger" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <div className={cn(
              'h-2 w-2 rounded-full',
              stats ? 'admin-success-bg animate-pulse' : 'admin-danger-bg'
            )} style={{ backgroundColor: stats ? 'var(--admin-success)' : 'var(--admin-danger)' }} />
            <span className="text-xs font-medium admin-text-primary">
              {stats ? localize('com_admin_system_operational') : localize('com_admin_system_issues')}
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Metrics Summary & Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Metrics Summary Card */}
        <div className="admin-card">
          <div className="admin-card-body">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="admin-info-bg p-2.5 rounded-lg">
                  <BarChart3 className="h-5 w-5 admin-info" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold admin-text-primary">
                    {localize('com_admin_metrics_summary')}
                  </h2>
                  <p className="text-sm admin-text-secondary">
                    {localize('com_admin_quick_overview')}
                  </p>
                </div>
              </div>
              <Link
                to="/d/admin/stats"
                className="flex items-center gap-1 text-sm hover:underline"
                style={{ color: 'var(--admin-link)' }}
              >
                {localize('com_admin_view_all')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* User Growth */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <UserPlus className="h-4 w-4 admin-success" />
                <span className="text-sm font-medium admin-text-primary">
                  {localize('com_admin_user_growth')}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="admin-inner-stat flex-col !items-start">
                  <p className="admin-inner-stat-label">{localize('com_admin_today')}</p>
                  <p className="admin-inner-stat-value mt-1 admin-success">
                    +{stats?.growth?.newUsersToday || 0}
                  </p>
                </div>
                <div className="admin-inner-stat flex-col !items-start">
                  <p className="admin-inner-stat-label">{localize('com_admin_this_week')}</p>
                  <p className="admin-inner-stat-value mt-1 admin-success">
                    +{stats?.growth?.newUsersWeek || 0}
                  </p>
                </div>
                <div className="admin-inner-stat flex-col !items-start">
                  <p className="admin-inner-stat-label">{localize('com_admin_this_month')}</p>
                  <p className="admin-inner-stat-value mt-1 admin-success">
                    +{stats?.growth?.newUsersMonth || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Conversation Activity */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4 admin-info" />
                <span className="text-sm font-medium admin-text-primary">
                  {localize('com_admin_conversation_activity')}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="admin-inner-stat flex-col !items-start">
                  <p className="admin-inner-stat-label">{localize('com_admin_today')}</p>
                  <p className="admin-inner-stat-value mt-1" style={{ color: 'var(--admin-info)' }}>
                    {stats?.conversations?.today?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="admin-inner-stat flex-col !items-start">
                  <p className="admin-inner-stat-label">{localize('com_admin_this_week')}</p>
                  <p className="admin-inner-stat-value mt-1" style={{ color: 'var(--admin-info)' }}>
                    {stats?.conversations?.thisWeek?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="admin-inner-stat flex-col !items-start">
                  <p className="admin-inner-stat-label">{localize('com_admin_this_month')}</p>
                  <p className="admin-inner-stat-value mt-1" style={{ color: 'var(--admin-info)' }}>
                    {stats?.conversations?.thisMonth?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>
            </div>

            {/* View Details Link */}
            <div className="mt-6 pt-4 border-t admin-border">
              <p className="text-xs admin-text-muted text-center">
                {localize('com_admin_detailed_stats_hint')}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="admin-card">
          <div className="admin-card-body">
            <div className="flex items-center gap-3 mb-6">
              <div className="admin-warning-bg p-2.5 rounded-lg">
                <ArrowRight className="h-5 w-5 admin-warning" />
              </div>
              <div>
                <h2 className="text-lg font-semibold admin-text-primary">
                  {localize('com_admin_quick_actions')}
                </h2>
                <p className="text-sm admin-text-secondary">
                  {localize('com_admin_quick_actions_description')}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;

                if (action.disabled) {
                  return (
                    <div
                      key={action.title}
                      className="admin-inner-stat relative cursor-not-allowed p-3 opacity-60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="stat-icon">
                          <Icon className="h-4 w-4 admin-text-muted" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold admin-text-primary truncate">
                            {action.title}
                          </h3>
                        </div>
                        <span className="admin-badge-neutral text-[10px]">
                          Soon
                        </span>
                      </div>
                    </div>
                  );
                }

                return (
                  <Link
                    key={action.title}
                    to={action.href}
                    className="admin-inner-stat group p-3 hover:bg-[var(--admin-hover)] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg p-2" style={{ backgroundColor: 'var(--admin-bg-elevated)' }}>
                        <Icon className="h-4 w-4" style={{ color: 'var(--admin-text-secondary)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold admin-text-primary truncate">
                          {action.title}
                        </h3>
                        <p className="text-xs admin-text-secondary truncate">
                          {action.description}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" style={{ color: 'var(--admin-text-muted)' }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}