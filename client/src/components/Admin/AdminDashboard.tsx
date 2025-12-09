import { Link } from 'react-router-dom';
import {
  Users,
  BarChart3,
  Shield,
  Activity,
  UserCheck,
  AlertTriangle,
  TrendingUp,
  Loader2,
  ArrowRight,
  Clock,
  MessageSquare,
  ShieldAlert,
  UserPlus,
  Brain,
  ArrowUpDown,
  LayoutDashboard
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
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-text-secondary" />
          <p className="mt-2 text-sm text-text-secondary">
            {localize('com_admin_loading_stats')}
          </p>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: localize('com_admin_users'),
      description: localize('com_admin_manage_users'),
      icon: Users,
      href: '/admin/users',
      disabled: false,
    },
    {
      title: localize('com_admin_model_control'),
      description: localize('com_admin_model_control_description'),
      icon: Brain,
      href: '/admin/models',
      disabled: false,
    },
    {
      title: localize('com_admin_provider_ordering'),
      description: localize('com_admin_provider_ordering_description'),
      icon: ArrowUpDown,
      href: '/admin/provider-ordering',
      disabled: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header Card */}
      <div className="rounded-xl border border-border-light bg-surface-primary p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-tertiary">
              <LayoutDashboard className="h-6 w-6 text-text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-text-primary">
                {localize('com_admin_dashboard')}
              </h1>
              <p className="text-sm text-text-secondary">
                {localize('com_admin_dashboard_welcome')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Users Card */}
        <div className="group relative overflow-hidden rounded-xl border border-border-light bg-surface-primary p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                {localize('com_admin_total_users')}
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-text-primary">
                {stats?.totalUsers?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="rounded-lg bg-surface-tertiary p-2.5">
              <Users className="h-5 w-5 text-text-primary" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <div className="flex items-center text-text-primary">
              <TrendingUp className="h-3 w-3" />
              <span className="ml-1 text-xs font-medium">+{stats?.growth?.newUsersToday || 0}</span>
            </div>
            <span className="text-xs text-text-tertiary">{localize('com_admin_new_today')}</span>
          </div>
        </div>

        {/* Active Users Card */}
        <div className="group relative overflow-hidden rounded-xl border border-border-light bg-surface-primary p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                {localize('com_admin_active_weekly')}
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-text-primary">
                {stats?.activity?.activeUsersWeek?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="rounded-lg bg-surface-tertiary p-2.5">
              <Activity className="h-5 w-5 text-text-primary" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-text-tertiary" />
            <span className="text-xs text-text-tertiary">{localize('com_admin_last_7_days')}</span>
          </div>
        </div>

        {/* Conversations Card */}
        <div className="group relative overflow-hidden rounded-xl border border-border-light bg-surface-primary p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                {localize('com_admin_total_conversations')}
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-text-primary">
                {stats?.totalConversations?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="rounded-lg bg-surface-tertiary p-2.5">
              <MessageSquare className="h-5 w-5 text-text-primary" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="text-xs text-text-tertiary">{localize('com_admin_all_time_stats')}</span>
          </div>
        </div>

        {/* Security/Banned Card */}
        <div className="group relative overflow-hidden rounded-xl border border-border-light bg-surface-primary p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                {localize('com_admin_banned_users')}
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-text-primary">
                {stats?.overview?.bannedUsers?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="rounded-lg bg-surface-destructive/10 p-2.5">
              <ShieldAlert className="h-5 w-5 text-destructive" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <div className={cn(
              'h-2 w-2 rounded-full',
              stats ? 'bg-text-primary animate-pulse' : 'bg-destructive'
            )} />
            <span className="text-xs font-medium text-text-primary">
              {stats ? localize('com_admin_system_operational') : localize('com_admin_system_issues')}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Growth Analytics */}
        <div className="rounded-xl border border-border-light bg-surface-primary p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-lg bg-surface-tertiary p-2">
              <UserPlus className="h-5 w-5 text-text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                {localize('com_admin_growth_analytics')}
              </h2>
              <p className="text-sm text-text-secondary">
                {localize('com_admin_user_registration_stats')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border-light bg-surface-secondary p-4">
              <p className="text-xs font-medium text-text-tertiary">{localize('com_admin_today')}</p>
              <p className="mt-2 text-2xl font-semibold text-text-primary">
                +{stats?.growth?.newUsersToday || 0}
              </p>
            </div>
            <div className="rounded-lg border border-border-light bg-surface-secondary p-4">
              <p className="text-xs font-medium text-text-tertiary">{localize('com_admin_this_week')}</p>
              <p className="mt-2 text-2xl font-semibold text-text-primary">
                +{stats?.growth?.newUsersWeek || 0}
              </p>
            </div>
            <div className="rounded-lg border border-border-light bg-surface-secondary p-4">
              <p className="text-xs font-medium text-text-tertiary">{localize('com_admin_this_month')}</p>
              <p className="mt-2 text-2xl font-semibold text-text-primary">
                +{stats?.growth?.newUsersMonth || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">
            {localize('com_admin_quick_actions')}
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;

              if (action.disabled) {
                return (
                  <div
                    key={action.title}
                    className="relative cursor-not-allowed overflow-hidden rounded-xl border border-border-light bg-surface-primary p-4 opacity-60"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-surface-tertiary p-2">
                        <Icon className="h-4 w-4 text-text-tertiary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-text-primary truncate">
                          {action.title}
                        </h3>
                      </div>
                      <span className="inline-flex items-center rounded-md bg-surface-secondary px-2 py-0.5 text-[10px] font-medium text-text-tertiary">
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
                  className="group relative overflow-hidden rounded-xl border border-border-light bg-surface-primary p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-surface-tertiary p-2 transition-colors group-hover:bg-surface-secondary">
                      <Icon className="h-4 w-4 text-text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-text-primary truncate">
                        {action.title}
                      </h3>
                      <p className="text-xs text-text-secondary truncate">
                        {action.description}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-text-tertiary opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          {localize('com_admin_recent_activity')}
        </h2>
        <div className="overflow-hidden rounded-xl border border-border-light bg-surface-primary shadow-sm">
          <div className="p-8">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-surface-tertiary p-4">
                <Activity className="h-8 w-8 text-text-tertiary" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-text-primary">
                {localize('com_admin_activity_log')}
              </h3>
              <p className="mt-2 text-center text-sm text-text-secondary max-w-sm">
                {localize('com_admin_activity_log_description')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}