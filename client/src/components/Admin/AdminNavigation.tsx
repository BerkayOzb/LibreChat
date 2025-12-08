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
  ArrowLeft,
  Wrench,
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
  {
    name: 'Tool Management',
    href: '/d/admin/tools',
    icon: Wrench,
    description: 'Manage AI tools visibility and access control',
    localizeKey: 'com_admin_tool_management',
    descriptionKey: 'com_admin_tool_management_description',
  },
];

export default function AdminNavigation({ currentPath }: AdminNavigationProps) {
  // Fetch admin stats for Quick Stats section
  const { data: stats } = useAdminStatsQuery();
  const localize = useLocalize();
  const navigate = useNavigate();

  return (
    <nav className="flex h-full flex-col border-r border-border-light bg-surface-primary px-4 py-6 dark:bg-surface-primary-alt">
      {/* Logo */}
      <div className="mb-8 flex items-center px-3">
        <img
          src="/assets/logo-light.png"
          alt="Logo"
          className="h-8 w-auto dark:hidden"
        />
        <img
          src="/assets/logo-dark.png"
          alt="Logo"
          className="hidden h-8 w-auto dark:block"
        />
      </div>

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
                  "mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-surface-secondary"
                )}>
                  <Icon className="h-4 w-4 text-text-tertiary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-secondary truncate text-sm">
                      {item.localizeKey ? localize(item.localizeKey) : item.name}
                    </span>
                    <span className="inline-flex items-center rounded-md bg-surface-secondary px-1.5 py-0.5 text-xs font-medium text-text-tertiary">
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
                  ? 'bg-surface-tertiary shadow-sm'
                  : 'hover:bg-surface-hover'
              )}
            >
              <div className={cn(
                "mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-colors",
                isActive
                  ? 'bg-surface-secondary'
                  : 'bg-surface-secondary group-hover:bg-surface-tertiary'
              )}>
                <Icon
                  className={cn(
                    'h-4 w-4 transition-colors',
                    isActive
                      ? 'text-text-primary'
                      : 'text-text-secondary group-hover:text-text-primary'
                  )}
                />
              </div>
              <div className="flex-1 min-w-0">
                <span className={cn(
                  'block truncate text-sm font-semibold transition-colors',
                  isActive
                    ? 'text-text-primary'
                    : 'text-text-primary group-hover:text-text-primary'
                )}>
                  {item.localizeKey ? localize(item.localizeKey) : item.name}
                </span>
                <p className={cn(
                  'mt-0.5 text-xs line-clamp-2 leading-relaxed transition-colors',
                  isActive
                    ? 'text-text-secondary'
                    : 'text-text-tertiary group-hover:text-text-secondary'
                )}>
                  {item.descriptionKey ? localize(item.descriptionKey) : item.description}
                </p>
              </div>
            </Link>
          );
        })}
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