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
  Building2,
} from 'lucide-react';
import { cn, ThemeSelector } from '@librechat/client';
import { useAdminStatsQuery } from '~/data-provider';
import { useAuthContext } from '~/hooks/AuthContext';
import { useLocalize } from '~/hooks';
import { SystemRoles } from 'librechat-data-provider';
import { useMemo } from 'react';

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
    name: 'Organizations',
    href: '/d/admin/organizations',
    icon: Building2,
    description: 'Manage tenant organizations and admins',
    localizeKey: 'com_admin_organizations',
    descriptionKey: 'com_admin_organizations_description',
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
  const { user } = useAuthContext();
  const localize = useLocalize();
  const navigate = useNavigate();

  const filteredNavigationItems = useMemo(() => {
    if (user?.role === SystemRoles.ORG_ADMIN) {
      return navigationItems.filter(item =>
        ['Dashboard', 'User Management', 'Statistics'].includes(item.name)
      );
    }
    return navigationItems;
  }, [user?.role]);

  return (
    <nav className="admin-nav flex h-full flex-col">
      {/* Logo - Fixed at top */}
      <div className="flex-shrink-0 px-4 pt-6 pb-4">
        <div className="flex items-center px-3">
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
      </div>

      {/* Navigation Items - Scrollable */}
      <div className="admin-scrollbar flex-1 overflow-y-auto overflow-x-hidden px-4">
        <div className="space-y-1 pb-4">
        {filteredNavigationItems.map((item) => {
          const isActive = currentPath === item.href;
          const Icon = item.icon;

          if (item.disabled) {
            return (
              <div
                key={item.name}
                className="group relative flex cursor-not-allowed items-start gap-3 rounded-xl px-3 py-2.5 opacity-50"
              >
                <div className="admin-nav-item-icon mt-0.5 flex-shrink-0">
                  <Icon className="admin-text-muted h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="admin-text-secondary admin-nav-item-label truncate">
                      {item.localizeKey ? localize(item.localizeKey) : item.name}
                    </span>
                    <span className="admin-badge-neutral inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium">
                      Soon
                    </span>
                  </div>
                  <p className="admin-nav-item-description mt-0.5 line-clamp-2">
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
                'admin-nav-item group relative flex items-start gap-3',
                isActive && 'active'
              )}
            >
              <div className={cn(
                'admin-nav-item-icon mt-0.5 flex-shrink-0',
              )}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="admin-nav-item-label admin-text-primary block truncate">
                  {item.localizeKey ? localize(item.localizeKey) : item.name}
                </span>
                <p className="admin-nav-item-description mt-0.5 line-clamp-2">
                  {item.descriptionKey ? localize(item.descriptionKey) : item.description}
                </p>
              </div>
            </Link>
          );
        })}
        </div>
      </div>

      {/* Footer Actions - Fixed at bottom */}
      <div className="flex-shrink-0 px-4 pb-6 pt-3 border-t border-[var(--admin-border-subtle)]">
        <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/c/new')}
          className="admin-btn-ghost flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden xl:inline">{localize('com_nav_back_to_chat')}</span>
        </button>

        <div className="rounded-xl p-1 transition-all duration-200 hover:bg-[var(--admin-bg-elevated)]">
          <ThemeSelector returnThemeOnly={true} />
        </div>
        </div>
      </div>
    </nav>
  );
}