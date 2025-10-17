import { Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  BarChart3, 
  Shield, 
  Settings,
  Home,
  UserCheck,
  Activity
} from 'lucide-react';
import { cn } from '@librechat/client';
import { useAdminStatsQuery } from '~/data-provider';

interface AdminNavigationProps {
  currentPath: string;
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/d/admin',
    icon: Home,
    description: 'Overview and system status',
  },
  {
    name: 'User Management',
    href: '/d/admin/users',
    icon: Users,
    description: 'Manage users, roles, and permissions',
  },
  {
    name: 'Statistics',
    href: '/d/admin/stats',
    icon: BarChart3,
    description: 'System analytics and usage stats',
  },
  {
    name: 'Security & Audit',
    href: '/d/admin/security',
    icon: Shield,
    description: 'Security logs and audit trails',
    disabled: true, // Coming soon
  },
  {
    name: 'System Settings',
    href: '/d/admin/settings',
    icon: Settings,
    description: 'Configure system settings',
    disabled: true, // Coming soon
  },
];

export default function AdminNavigation({ currentPath }: AdminNavigationProps) {
  // Fetch admin stats for Quick Stats section
  const { data: stats } = useAdminStatsQuery();

  return (
    <nav className="h-full px-4 py-6">
      {/* Admin Panel Title */}
      <div className="mb-8">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Admin Panel
          </h2>
        </div>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          System administration and management
        </p>
      </div>

      {/* Navigation Items */}
      <div className="space-y-2">
        {navigationItems.map((item) => {
          const isActive = currentPath === item.href;
          const Icon = item.icon;

          if (item.disabled) {
            return (
              <div
                key={item.name}
                className="group flex cursor-not-allowed items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-400 dark:text-gray-600"
              >
                <Icon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                <div>
                  <div className="flex items-center">
                    {item.name}
                    <span className="ml-2 rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                      Soon
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-600">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          }

          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
              )}
            >
              <Icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300'
                )}
                aria-hidden="true"
              />
              <div>
                <div>{item.name}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="mt-8 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
          Quick Stats
        </h3>
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Active Users</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {stats?.activeUsersToday?.toLocaleString() || '0'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">System Status</span>
            <span className="inline-flex items-center">
              <Activity className={`mr-1 h-3 w-3 ${stats ? 'text-green-500' : 'text-red-500'}`} />
              <span className={stats ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                {stats ? 'Online' : 'Offline'}
              </span>
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}