import { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { SystemRoles } from 'librechat-data-provider';
import { useAuthContext } from '~/hooks';
import AdminLayout from './AdminLayout';

export default function AdminRoute() {
  const { user, isAuthenticated } = useAuthContext();

  useEffect(() => {
    // Scroll to top when entering admin area
    window.scrollTo(0, 0);
  }, []);

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect if not admin
  if (user?.role !== SystemRoles.ADMIN && user?.role !== SystemRoles.ORG_ADMIN) {
    return <Navigate to="/" replace />;
  }

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}