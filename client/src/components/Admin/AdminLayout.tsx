import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import AdminNavigation from './AdminNavigation';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();

  return (
    <div className="flex h-screen w-full bg-surface-primary dark:bg-surface-primary-alt">
      {/* Admin Sidebar Navigation */}
      <div className="hidden w-64 lg:block">
        <AdminNavigation currentPath={location.pathname} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}