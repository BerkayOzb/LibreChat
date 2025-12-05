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
  ArrowRight
} from 'lucide-react';
import { useLocalize } from '~/hooks';
import { useAdminStatsQuery } from '~/data-provider';

export default function AdminDashboard() {
  const localize = useLocalize();

  // Fetch real admin statistics
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError
  } = useAdminStatsQuery();


  // Loading state fallback
  if (statsLoading) {
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

  // Error state fallback  
  if (statsError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
        <div className="flex">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-semibold text-red-800 dark:text-red-400">
              {localize('com_admin_error_loading')}
            </h3>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              {localize('com_admin_error_loading_description')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      title: localize('com_admin_total_users'),
      value: stats?.totalUsers?.toLocaleString() || '0',
      icon: Users,
      color: 'blue',
      change: `+${stats?.newUsersThisMonth || 0} ${localize('com_admin_this_month')}`,
      changeType: 'increase',
    },
    {
      title: localize('com_admin_active_users'),
      value: stats?.activeUsers?.toLocaleString() || '0',
      icon: UserCheck,
      color: 'green',
      change: `${stats?.activeUsersToday || 0} ${localize('com_admin_today')}`,
      changeType: 'increase',
    },
    {
      title: localize('com_admin_total_conversations'),
      value: stats?.totalConversations?.toLocaleString() || '0',
      icon: BarChart3,
      color: 'purple',
      change: localize('com_admin_all_time'),
      changeType: 'neutral',
    },
  ];

  const quickActions = [
    {
      title: localize('com_admin_manage_users'),
      description: localize('com_admin_manage_users_description'),
      href: '/d/admin/users',
      icon: Users,
      color: 'blue',
    },
    {
      title: localize('com_admin_view_statistics'),
      description: localize('com_admin_view_statistics_description'),
      href: '/d/admin/stats',
      icon: BarChart3,
      color: 'green',
    },
    {
      title: localize('com_admin_security_logs'),
      description: localize('com_admin_security_logs_description'),
      href: '/d/admin/security',
      icon: Shield,
      color: 'red',
      disabled: true,
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="group relative overflow-hidden rounded-xl border border-border-light bg-surface-primary p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] dark:bg-surface-primary-alt"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                    {stat.title}
                  </p>
                  <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-text-primary">
                    {stat.value}
                  </p>
                  <div className="mt-2 flex items-center gap-1">
                    {stat.changeType === 'increase' && (
                      <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                    )}
                    <span className={`text-xs font-medium ${stat.changeType === 'increase'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-text-tertiary'
                      }`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className={`rounded-lg p-2.5 ${stat.color === 'blue'
                  ? 'bg-blue-50 dark:bg-blue-900/20'
                  : stat.color === 'green'
                    ? 'bg-green-50 dark:bg-green-900/20'
                    : stat.color === 'purple'
                      ? 'bg-purple-50 dark:bg-purple-900/20'
                      : 'bg-gray-50 dark:bg-gray-900/20'
                  }`}>
                  <Icon
                    className={`h-5 w-5 ${stat.color === 'blue'
                      ? 'text-blue-600 dark:text-blue-400'
                      : stat.color === 'green'
                        ? 'text-green-600 dark:text-green-400'
                        : stat.color === 'purple'
                          ? 'text-purple-600 dark:text-purple-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary">
          {localize('com_admin_quick_actions')}
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;

            if (action.disabled) {
              return (
                <div
                  key={action.title}
                  className="relative cursor-not-allowed overflow-hidden rounded-xl border border-border-light bg-surface-primary p-5 opacity-60 dark:bg-surface-primary-alt"
                >
                  <div className="flex items-start gap-4">
                    <div className={`rounded-lg p-2.5 ${action.color === 'blue'
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : action.color === 'green'
                        ? 'bg-green-50 dark:bg-green-900/20'
                        : action.color === 'red'
                          ? 'bg-red-50 dark:bg-red-900/20'
                          : 'bg-gray-50 dark:bg-gray-900/20'
                      }`}>
                      <Icon
                        className={`h-5 w-5 ${action.color === 'blue'
                          ? 'text-blue-600 dark:text-blue-400'
                          : action.color === 'green'
                            ? 'text-green-600 dark:text-green-400'
                            : action.color === 'red'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-text-primary">
                        {action.title}
                      </h3>
                      <p className="mt-1 text-xs text-text-secondary">
                        {action.description}
                      </p>
                    </div>
                  </div>
                  <div className="absolute right-3 top-3">
                    <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      {localize('com_admin_coming_soon')}
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={action.title}
                to={action.href}
                className="group relative overflow-hidden rounded-xl border border-border-light bg-surface-primary p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] dark:bg-surface-primary-alt"
              >
                <div className="flex items-start gap-4">
                  <div className={`rounded-lg p-2.5 transition-colors ${action.color === 'blue'
                      ? 'bg-blue-50 group-hover:bg-blue-100 dark:bg-blue-900/20 dark:group-hover:bg-blue-900/30'
                      : action.color === 'green'
                        ? 'bg-green-50 group-hover:bg-green-100 dark:bg-green-900/20 dark:group-hover:bg-green-900/30'
                        : action.color === 'red'
                          ? 'bg-red-50 group-hover:bg-red-100 dark:bg-red-900/20 dark:group-hover:bg-red-900/30'
                          : 'bg-gray-50 group-hover:bg-gray-100 dark:bg-gray-900/20 dark:group-hover:bg-gray-900/30'
                    }`}>
                    <Icon
                      className={`h-5 w-5 ${action.color === 'blue'
                          ? 'text-blue-600 dark:text-blue-400'
                          : action.color === 'green'
                            ? 'text-green-600 dark:text-green-400'
                            : action.color === 'red'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-600 dark:text-gray-400'
                        }`}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-text-primary">
                      {action.title}
                    </h3>
                    <p className="mt-1 text-xs text-text-secondary">
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