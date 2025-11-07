import { Link, useLocation } from 'react-router-dom';
import {
  Users,
  BarChart3,
  Shield,
  Settings,
  Home,
  UserCheck,
  Activity,
  Layers,
  Key,
  Brain
} from 'lucide-react';
import { cn, ThemeSelector } from '@librechat/client';
import { useAdminStatsQuery } from '~/data-provider';
import { useLocalize } from '~/hooks';

interface AdminNavigationProps {
  currentPath: string;
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/d/admin',
    icon: Home,
    description: 'Overview and system status',
    localizeKey: 'com_admin_dashboard',
    descriptionKey: 'com_admin_dashboard_description',
  },
  {
    name: 'User Management',
    href: '/d/admin/users',
    icon: Users,
    description: 'Manage users, roles, and permissions',
    localizeKey: 'com_admin_user_management',
    descriptionKey: 'com_admin_user_management_description',
  },
  {
    name: 'Statistics',
    href: '/d/admin/stats',
    icon: BarChart3,
    description: 'System analytics and usage stats',
    localizeKey: 'com_admin_statistics',
    descriptionKey: 'com_admin_statistics_description',
  },
  {
    name: 'Endpoint Management',
    href: '/d/admin/endpoints',
    icon: Layers,
    description: 'Control AI model endpoint access',
    localizeKey: 'com_admin_endpoint_management',
    descriptionKey: 'com_admin_endpoint_management_description',
  },
  {
    name: 'API Key Management',
    href: '/d/admin/api-keys',
    icon: Key,
    description: 'Manage API keys for AI model endpoints',
    localizeKey: 'com_admin_api_key_management',
    descriptionKey: 'com_admin_api_key_management_description',
  },
  {
    name: 'Model Control',
    href: '/d/admin/models',
    icon: Brain,
    description: 'Control which AI models are visible to users',
    localizeKey: 'com_admin_model_control',
    descriptionKey: 'com_admin_model_control_description',
  },
  {
    name: 'Security & Audit',
    href: '/d/admin/security',
    icon: Shield,
    description: 'Security logs and audit trails',
    localizeKey: 'com_admin_security_audit',
    descriptionKey: 'com_admin_security_audit_description',
    disabled: true, // Coming soon
  },
  {
    name: 'System Settings',
    href: '/d/admin/settings',
    icon: Settings,
    description: 'Configure system settings',
    localizeKey: 'com_admin_system_settings',
    descriptionKey: 'com_admin_system_settings_description',
    disabled: true, // Coming soon
  },
];

export default function AdminNavigation({ currentPath }: AdminNavigationProps) {
  // Fetch admin stats for Quick Stats section
  const { data: stats } = useAdminStatsQuery();
  const localize = useLocalize();

  return (
    <nav className="h-full px-4 py-6">
      {/* Admin Panel Title */}
      <div className="mb-8">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-destructive" />
          <h2 className="text-lg font-semibold text-text-primary">
            {localize('com_admin_panel')}
          </h2>
        </div>
        <p className="mt-1 text-sm text-text-secondary">
          {localize('com_admin_panel_description')}
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
                className="group flex cursor-not-allowed items-center rounded-lg px-3 py-2 text-sm font-medium text-text-tertiary opacity-60"
              >
                <Icon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span>{item.localizeKey ? localize(item.localizeKey) : item.name}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                      Soon
                    </span>
                  </div>
                  <p className="text-xs text-text-tertiary">
                    {item.descriptionKey ? localize(item.descriptionKey) : item.description}
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
                  ? 'bg-destructive/10 text-destructive'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              )}
            >
              <Icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0 transition-colors',
                  isActive
                    ? 'text-destructive'
                    : 'text-text-tertiary group-hover:text-text-secondary'
                )}
                aria-hidden="true"
              />
              <div className="flex-1">
                <div className="font-medium">
                  {item.localizeKey ? localize(item.localizeKey) : item.name}
                </div>
                <p className="text-xs text-text-tertiary">
                  {item.descriptionKey ? localize(item.descriptionKey) : item.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Theme Selector */}
      <div className="mt-8 flex items-center justify-center rounded-lg bg-surface-primary p-2 shadow dark:bg-surface-primary-alt">
        <ThemeSelector returnThemeOnly={true} />
      </div>

      {/* Quick Stats */}
      <div className="mt-4 rounded-lg bg-surface-primary p-4 shadow dark:bg-surface-primary-alt">
        <h3 className="text-sm font-medium text-text-primary">
          {localize('com_admin_quick_stats')}
        </h3>
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">{localize('com_admin_active_users')}</span>
            <span className="font-medium text-text-primary">
              {stats?.activeUsersToday?.toLocaleString() || '0'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">{localize('com_admin_system_status')}</span>
            <span className="inline-flex items-center gap-1">
              <Activity className={cn('h-3 w-3', stats ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')} />
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                stats
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {stats ? localize('com_admin_online') : localize('com_admin_offline')}
              </span>
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}