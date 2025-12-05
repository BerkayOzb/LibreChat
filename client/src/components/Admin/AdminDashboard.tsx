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
  ArrowUpDown
} from 'lucide-react';
import { cn } from '@librechat/client';
import { useLocalize } from '~/hooks';
import { useAdminStatsQuery } from '~/data-provider';

export default function AdminDashboard() {
  const localize = useLocalize();

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
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
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
      color: 'blue',
      disabled: false,
    },
    {
      title: localize('com_admin_model_control'),
      description: localize('com_admin_model_control_description'),
      icon: Brain,
      href: '/admin/models',
      color: 'purple',
      disabled: false,
    },
    {
      title: localize('com_admin_provider_ordering'),
      description: localize('com_admin_provider_ordering_description'),
      icon: ArrowUpDown,
      href: '/admin/provider-ordering',
      color: 'green',
      disabled: false,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="border-b border-border-light pb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-text-primary">
          {localize('com_admin_dashboard')}
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          {localize('com_admin_dashboard_welcome')}
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Users Card */}
        <div className="group relative overflow-hidden rounded-xl border border-border-light bg-surface-primary p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] dark:bg-surface-primary-alt">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                {localize('com_admin_total_users')}
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-text-primary">
                {stats?.totalUsers?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="rounded-lg bg-blue-50 p-2.5 dark:bg-blue-900/20">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <div className="flex items-center text-green-600 dark:text-green-400">
              <TrendingUp className="h-3 w-3" />
              <span className="ml-1 text-xs font-medium">+{stats?.growth?.newUsersToday || 0}</span>
            </div>
            <span className="text-xs text-text-tertiary">{localize('com_admin_new_today')}</span>
          </div>
        </div>

        {/* Active Users Card */}
        <div className="group relative overflow-hidden rounded-xl border border-border-light bg-surface-primary p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] dark:bg-surface-primary-alt">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                {localize('com_admin_active_weekly')}
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-text-primary">
                {stats?.activity?.activeUsersWeek?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="rounded-lg bg-green-50 p-2.5 dark:bg-green-900/20">
              <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-text-tertiary" />
            <span className="text-xs text-text-tertiary">{localize('com_admin_last_7_days')}</span>
          </div>
        </div>

        {/* Conversations Card */}
        <div className="group relative overflow-hidden rounded-xl border border-border-light bg-surface-primary p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] dark:bg-surface-primary-alt">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                {localize('com_admin_total_conversations')}
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-text-primary">
                {stats?.totalConversations?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="rounded-lg bg-purple-50 p-2.5 dark:bg-purple-900/20">
              <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="text-xs text-text-tertiary">{localize('com_admin_all_time_stats')}</span>
          </div>
        </div>

        {/* Security/Banned Card */}
        <div className="group relative overflow-hidden rounded-xl border border-border-light bg-surface-primary p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] dark:bg-surface-primary-alt">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                {localize('com_admin_banned_users')}
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-text-primary">
                {stats?.overview?.bannedUsers?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="rounded-lg bg-red-50 p-2.5 dark:bg-red-900/20">
              <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <div className={cn(
              'h-2 w-2 rounded-full',
              stats ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            )} />
            <span className="text-xs font-medium text-text-primary">
              {stats ? localize('com_admin_system_operational') : localize('com_admin_system_issues')}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Growth Analytics */}
        <div className="rounded-xl border border-border-light bg-surface-primary p-6 shadow-sm dark:bg-surface-primary-alt lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
              <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
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

        {/* Quick Actions (Moved here) */}
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
                    className="relative cursor-not-allowed overflow-hidden rounded-xl border border-border-light bg-surface-primary p-4 opacity-60 dark:bg-surface-primary-alt"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`rounded-lg p-2 ${action.color === 'blue'
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : action.color === 'green'
                          ? 'bg-green-50 dark:bg-green-900/20'
                          : action.color === 'red'
                            ? 'bg-red-50 dark:bg-red-900/20'
                            : 'bg-gray-50 dark:bg-gray-900/20'
                        }`}>
                        <Icon
                          className={`h-4 w-4 ${action.color === 'blue'
                            ? 'text-blue-600 dark:text-blue-400'
                            : action.color === 'green'
                              ? 'text-green-600 dark:text-green-400'
                              : action.color === 'red'
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-text-primary truncate">
                          {action.title}
                        </h3>
                      </div>
                      <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
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
                  className="group relative overflow-hidden rounded-xl border border-border-light bg-surface-primary p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] dark:bg-surface-primary-alt"
                >
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-2 transition-colors ${action.color === 'blue'
                      ? 'bg-blue-50 group-hover:bg-blue-100 dark:bg-blue-900/20 dark:group-hover:bg-blue-900/30'
                      : action.color === 'green'
                        ? 'bg-green-50 group-hover:bg-green-100 dark:bg-green-900/20 dark:group-hover:bg-green-900/30'
                        : action.color === 'red'
                          ? 'bg-red-50 group-hover:bg-red-100 dark:bg-red-900/20 dark:group-hover:bg-red-900/30'
                          : 'bg-gray-50 group-hover:bg-gray-100 dark:bg-gray-900/20 dark:group-hover:bg-gray-900/30'
                      }`}>
                      <Icon
                        className={`h-4 w-4 ${action.color === 'blue'
                          ? 'text-blue-600 dark:text-blue-400'
                          : action.color === 'green'
                            ? 'text-green-600 dark:text-green-400'
                            : action.color === 'red'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}
                      />
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
        <h2 className="text-xl font-semibold text-text-primary">
          {localize('com_admin_recent_activity')}
        </h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-border-light bg-surface-primary shadow-sm dark:bg-surface-primary-alt">
          <div className="p-8">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-gray-100 p-4 dark:bg-gray-800">
                <Activity className="h-8 w-8 text-gray-400" />
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