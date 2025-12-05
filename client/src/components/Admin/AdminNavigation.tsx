import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  Brain,
  ArrowUpDown,
  ArrowLeft
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
    name: 'Provider Ordering',
    href: '/d/admin/provider-ordering',
    icon: ArrowUpDown,
    description: 'Customize display order of AI model providers',
    localizeKey: 'com_admin_provider_ordering',
    descriptionKey: 'com_admin_provider_ordering_description',
  },
];

export default function AdminNavigation({ currentPath }: AdminNavigationProps) {
  // Fetch admin stats for Quick Stats section
  const { data: stats } = useAdminStatsQuery();
  const localize = useLocalize();
  const navigate = useNavigate();

  return (
    <nav className="flex h-full flex-col border-r border-border-light bg-surface-primary px-4 py-6 dark:bg-surface-primary-alt">
      {/* Navigation Items */}
      <div className="flex-1 space-y-1">
        {navigationItems.map((item) => {
          const isActive = currentPath === item.href;
          const Icon = item.icon;

          if (item.disabled) {
            return (
              <div
                key={item.name}
                className="group relative flex cursor-not-allowed items-start gap-3 rounded-xl px-3 py-2.5 opacity-50"
              >
                <div className={cn(
                  "mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800"
                )}>
                  <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-secondary truncate text-sm">
                      {item.localizeKey ? localize(item.localizeKey) : item.name}
                    </span>
                    <span className="inline-flex items-center rounded-md bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                      Soon
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-text-tertiary line-clamp-2 leading-relaxed">
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
                'group relative flex items-start gap-3 rounded-xl px-3 py-2.5 transition-all duration-200',
                isActive
                  ? 'bg-blue-50 shadow-sm dark:bg-blue-900/20'
                  : 'hover:bg-surface-hover'
              )}
            >
              <div className={cn(
                "mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-colors",
                isActive
                  ? 'bg-blue-100 dark:bg-blue-900/40'
                  : 'bg-gray-100 group-hover:bg-gray-200 dark:bg-gray-800 dark:group-hover:bg-gray-700'
              )}>
                <Icon
                  className={cn(
                    'h-4 w-4 transition-colors',
                    isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300'
                  )}
                />
              </div>
              <div className="flex-1 min-w-0">
                <span className={cn(
                  'block truncate text-sm font-semibold transition-colors',
                  isActive
                    ? 'text-blue-700 dark:text-blue-400'
                    : 'text-text-primary group-hover:text-text-primary'
                )}>
                  {item.localizeKey ? localize(item.localizeKey) : item.name}
                </span>
                <p className={cn(
                  'mt-0.5 text-xs line-clamp-2 leading-relaxed transition-colors',
                  isActive
                    ? 'text-blue-600/70 dark:text-blue-400/70'
                    : 'text-text-tertiary group-hover:text-text-secondary'
                )}>
                  {item.descriptionKey ? localize(item.descriptionKey) : item.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="mt-3 rounded-lg border border-border-light bg-surface-secondary p-3 dark:bg-surface-secondary">
        <h3 className="text-xs font-semibold text-text-primary">
          {localize('com_admin_quick_stats')}
        </h3>
        <div className="mt-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">
              {localize('com_admin_active_users')}
            </span>
            <span className="text-sm font-semibold tabular-nums text-text-primary">
              {stats?.activeUsersToday?.toLocaleString() || '0'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">
              {localize('com_admin_system_status')}
            </span>
            <div className="flex items-center gap-1.5">
              <div className={cn(
                'h-2 w-2 rounded-full',
                stats ? 'bg-green-500' : 'bg-red-500'
              )} />
              <span className="text-xs font-medium text-text-primary">
                {stats ? localize('com_admin_online') : localize('com_admin_offline')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => navigate('/c/new')}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-text-secondary transition-all duration-200 hover:bg-surface-secondary hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden xl:inline">{localize('com_nav_back_to_chat')}</span>
        </button>

        <div className="rounded-xl p-1 transition-all duration-200 hover:bg-surface-secondary">
          <ThemeSelector returnThemeOnly={true} />
        </div>
      </div>
    </nav>
  );
}