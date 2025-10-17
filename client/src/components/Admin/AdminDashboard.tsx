import { Link } from 'react-router-dom';
import { 
  Users, 
  BarChart3, 
  Shield, 
  Activity,
  UserCheck,
  AlertTriangle,
  TrendingUp,
  Loader2
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
            Loading dashboard statistics...
          </p>
        </div>
      </div>
    );
  }

  // Error state fallback  
  if (statsError) {
    return (
      <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
        <div className="flex">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
              Error loading dashboard
            </h3>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              Unable to fetch admin statistics. Please refresh the page or check your connection.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers?.toLocaleString() || '0',
      icon: Users,
      color: 'blue',
      change: `+${stats?.newUsersThisMonth || 0} this month`,
      changeType: 'increase',
    },
    {
      title: 'Active Users',
      value: stats?.activeUsers?.toLocaleString() || '0',
      icon: UserCheck,
      color: 'green',
      change: `${stats?.activeUsersToday || 0} today`,
      changeType: 'increase',
    },
    {
      title: 'Total Conversations',
      value: stats?.totalConversations?.toLocaleString() || '0',
      icon: BarChart3,
      color: 'purple',
      change: 'All time',
      changeType: 'neutral',
    },
  ];

  const quickActions = [
    {
      title: 'Manage Users',
      description: 'View, create, edit, and manage user accounts',
      href: '/d/admin/users',
      icon: Users,
      color: 'blue',
    },
    {
      title: 'View Statistics',
      description: 'System analytics and usage statistics',
      href: '/d/admin/stats',
      icon: BarChart3,
      color: 'green',
    },
    {
      title: 'Security Logs',
      description: 'Review security events and audit logs',
      href: '/d/admin/security',
      icon: Shield,
      color: 'red',
      disabled: true,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Welcome to the LibreChat administration panel. Monitor your system and manage users.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800"
            >
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon
                      className={`h-8 w-8 ${
                        stat.color === 'blue'
                          ? 'text-blue-600'
                          : stat.color === 'green'
                          ? 'text-green-600'
                          : stat.color === 'red'
                          ? 'text-red-600'
                          : stat.color === 'purple'
                          ? 'text-purple-600'
                          : 'text-gray-600'
                      }`}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                        {stat.title}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                          {stat.value}
                        </div>
                        <div
                          className={`ml-2 flex items-baseline text-sm font-semibold ${
                            stat.changeType === 'increase'
                              ? 'text-green-600'
                              : stat.changeType === 'decrease'
                              ? 'text-red-600'
                              : 'text-gray-500'
                          }`}
                        >
                          {stat.changeType === 'increase' && (
                            <TrendingUp className="h-3 w-3 flex-shrink-0 self-center" />
                          )}
                          <span className="sr-only">
                            {stat.changeType === 'increase' ? 'Increased' : 'Changed'} by
                          </span>
                          {stat.change}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Quick Actions
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            
            if (action.disabled) {
              return (
                <div
                  key={action.title}
                  className="relative cursor-not-allowed overflow-hidden rounded-lg bg-white opacity-50 shadow dark:bg-gray-800"
                >
                  <div className="p-6">
                    <div className="flex items-center">
                      <Icon
                        className={`h-8 w-8 ${
                          action.color === 'blue'
                            ? 'text-blue-600'
                            : action.color === 'green'
                            ? 'text-green-600'
                            : action.color === 'red'
                            ? 'text-red-600'
                            : 'text-gray-600'
                        }`}
                        aria-hidden="true"
                      />
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {action.title}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-10">
                    <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      Coming Soon
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={action.title}
                to={action.href}
                className="group overflow-hidden rounded-lg bg-white shadow transition-shadow hover:shadow-md dark:bg-gray-800"
              >
                <div className="p-6">
                  <div className="flex items-center">
                    <Icon
                      className={`h-8 w-8 transition-colors group-hover:${
                        action.color === 'blue'
                          ? 'text-blue-700'
                          : action.color === 'green'
                          ? 'text-green-700'
                          : action.color === 'red'
                          ? 'text-red-700'
                          : 'text-gray-700'
                      } ${
                        action.color === 'blue'
                          ? 'text-blue-600'
                          : action.color === 'green'
                          ? 'text-green-600'
                          : action.color === 'red'
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }`}
                      aria-hidden="true"
                    />
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900 transition-colors group-hover:text-gray-700 dark:text-white dark:group-hover:text-gray-200">
                        {action.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Recent Activity
        </h2>
        <div className="mt-4 overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
          <div className="p-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Activity className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  Activity Log
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Real-time system activity will appear here.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}