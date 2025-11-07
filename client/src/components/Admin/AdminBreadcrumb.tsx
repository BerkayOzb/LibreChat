import React, { useMemo } from 'react';
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
    <div className="flex h-16 items-center justify-between gap-2 sm:gap-4">
      {/* Back Navigation & Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Back to Dashboard */}
        <BreadcrumbLink
          href="/d/prompts"
          onClick={dashboardLinkHandler}
          aria-label="Return to main dashboard"
          className="inline-flex items-center gap-2 rounded-md px-2 text-sm font-medium text-text-secondary no-underline transition-all duration-200 hover:gap-3 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-primary focus-visible:ring-offset-2"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Back to Dashboard</span>
          <span className="sm:hidden">Back</span>
        </BreadcrumbLink>

        {/* Visual Separator */}
        {breadcrumbItems.length > 0 && (
          <>
            <div className="h-4 w-px bg-border-medium" aria-hidden="true" />

            {/* Breadcrumb Trail */}
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbItems.map((item, index) => (
                  <React.Fragment key={item.href}>
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      <BreadcrumbLink
                        href={item.href}
                        className="flex items-center gap-2 rounded-md px-1 text-sm font-medium text-text-primary no-underline transition-colors hover:text-purple-600 dark:hover:text-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-primary focus-visible:ring-offset-2"
                      >
                        {item.icon && <item.icon className="h-4 w-4" aria-hidden="true" />}
                        <span>{item.label}</span>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </>
        )}
      </div>

      {/* Admin Badge */}
      <div
        className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-700 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-300 sm:px-3"
        role="status"
        aria-label="Admin access mode active"
      >
        <Shield className="hidden h-3.5 w-3.5 xs:block" aria-hidden="true" />
        <span>Admin</span>
      </div>
    </div>
  );
}