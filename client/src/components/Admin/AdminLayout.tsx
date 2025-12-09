import { ReactNode, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import AdminNavigation from './AdminNavigation';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [sidebarOpen]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  return (
    <div className="admin-bg-base flex h-screen w-full overflow-hidden">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="admin-bg-surface admin-border-subtle fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl shadow-md ring-1 ring-[var(--admin-border-subtle)] transition-all duration-200 hover:bg-[var(--admin-bg-elevated)] active:scale-95 lg:hidden"
        aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
      >
        {sidebarOpen ? (
          <X className="admin-text-primary h-5 w-5" />
        ) : (
          <Menu className="admin-text-primary h-5 w-5" />
        )}
      </button>

      {/* Mobile overlay */}
      <div
        className={`admin-modal-overlay fixed inset-0 z-40 transition-opacity duration-300 lg:hidden ${
          sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Admin Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 flex-shrink-0 transform shadow-2xl transition-transform duration-300 ease-out lg:relative lg:w-64 lg:translate-x-0 lg:shadow-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <AdminNavigation currentPath={location.pathname} />
      </aside>

      {/* Main Content Area */}
      <main className="admin-bg-base admin-scrollbar flex-1 overflow-y-auto overflow-x-hidden">
        <div className="min-h-full p-4 pt-16 sm:p-6 sm:pt-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
