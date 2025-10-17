import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import AdminBreadcrumb from './AdminBreadcrumb';
import AdminNavigation from './AdminNavigation';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();

  return (
    <div className="h-screen w-full bg-white dark:bg-gray-900">
      {/* Admin Header */}
      <div className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="px-4 sm:px-6 lg:px-8">
          <AdminBreadcrumb />
        </div>
      </div>

      <div className="flex h-full">
        {/* Admin Sidebar Navigation */}
        <div className="hidden w-64 overflow-y-auto bg-gray-50 dark:bg-gray-800 lg:block">
          <AdminNavigation currentPath={location.pathname} />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}