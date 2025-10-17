import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import type { LucideProps } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@librechat/client';
import { useLocalize, useCustomLink } from '~/hooks';

interface BreadcrumbItem {
  label: string;
  href: string;
  icon?: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
}

export default function AdminBreadcrumb() {
  const location = useLocation();
  const localize = useLocalize();
  const dashboardLinkHandler = useCustomLink('/d/prompts');

  // Parse the current path to determine breadcrumb
  const breadcrumbItems = useMemo(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const items: BreadcrumbItem[] = [];

    if (pathSegments.includes('admin')) {
      items.push({
        label: 'Admin Panel',
        href: '/d/admin',
        icon: Shield,
      });

      if (pathSegments.includes('users')) {
        items.push({
          label: 'User Management',
          href: '/d/admin/users',
        });
      } else if (pathSegments.includes('stats')) {
        items.push({
          label: 'Statistics',
          href: '/d/admin/stats',
        });
      }
    }

    return items;
  }, [location.pathname]);

  return (
    <div className="flex h-16 items-center justify-between">
      <Breadcrumb className="px-2 dark:text-gray-200">
        <BreadcrumbList>
          {/* Back to Dashboard */}
          <BreadcrumbItem className="hover:dark:text-white">
            <BreadcrumbLink
              href="/d/prompts"
              className="flex flex-row items-center gap-2"
              onClick={dashboardLinkHandler}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Back to Dashboard</span>
            </BreadcrumbLink>
          </BreadcrumbItem>

          {/* Breadcrumb Items */}
          {breadcrumbItems.map((item, index) => (
            <div key={item.href} className="flex items-center">
              <BreadcrumbSeparator />
              <BreadcrumbItem className="hover:dark:text-white">
                <BreadcrumbLink
                  href={item.href}
                  className="flex flex-row items-center gap-2"
                >
                  {item.icon && <item.icon className="h-4 w-4" aria-hidden="true" />}
                  <span>{item.label}</span>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Admin Badge */}
      <div className="flex items-center space-x-2">
        <div className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
          <Shield className="mr-1 inline h-3 w-3" />
          Admin Access
        </div>
      </div>
    </div>
  );
}