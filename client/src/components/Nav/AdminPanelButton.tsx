import React, { useCallback } from 'react';
import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TooltipAnchor, Button } from '@librechat/client';
import { useAuthContext, useLocalize } from '~/hooks';
import { SystemRoles } from 'librechat-data-provider';

interface AdminPanelButtonProps {
  isSmallScreen?: boolean;
  toggleNav: () => void;
}

export default function AdminPanelButton({ isSmallScreen, toggleNav }: AdminPanelButtonProps) {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const localize = useLocalize();

  // Only show button for admin users
  if (user?.role !== SystemRoles.ADMIN) {
    return null;
  }

  const handleAdminPanel = useCallback(() => {
    navigate('/d/admin');
    if (isSmallScreen) {
      toggleNav();
    }
  }, [navigate, isSmallScreen, toggleNav]);

  return (
    <TooltipAnchor
      description={localize('com_ui_admin_panel')}
      render={
        <Button
          variant="outline"
          data-testid="nav-admin-panel-button"
          aria-label={localize('com_ui_admin_panel')}
          className="rounded-full border-none bg-transparent p-2 hover:bg-surface-hover md:rounded-xl"
          onClick={handleAdminPanel}
        >
          <Settings className="icon-lg text-text-primary" />
        </Button>
      }
    />
  );
}