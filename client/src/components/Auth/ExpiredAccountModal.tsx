import { useCallback } from 'react';
import { Clock, AlertTriangle, LogOut } from 'lucide-react';
import { useLocalize, useAuthContext } from '~/hooks';

interface ExpiredAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  expiredAt?: string | null;
}

export default function ExpiredAccountModal({ isOpen, onClose, expiredAt }: ExpiredAccountModalProps) {
  const localize = useLocalize();
  const { logout, user } = useAuthContext();

  const handleLogout = useCallback(() => {
    onClose();
    logout();
  }, [logout, onClose]);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop - no click to close, user must logout */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative mx-4 w-full max-w-md animate-in fade-in zoom-in duration-200">
        <div className="rounded-2xl bg-gradient-to-b from-gray-800 to-gray-900 p-1 shadow-2xl">
          <div className="rounded-xl bg-gray-900 p-6">
            {/* Header */}
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20">
                <Clock className="h-8 w-8 text-amber-500" />
              </div>
              <h2 className="text-xl font-semibold text-white">
                {localize('com_auth_membership_expired_title')}
              </h2>
              {user?.email && (
                <p className="mt-1 text-sm text-gray-400">{user.email}</p>
              )}
            </div>

            {/* Content */}
            <div className="mb-6 space-y-4">
              <div className="rounded-lg bg-amber-500/10 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
                  <div>
                    <p className="text-sm text-gray-300">
                      {localize('com_auth_membership_expired_message')}
                    </p>
                    {expiredAt && (
                      <p className="mt-2 text-xs text-gray-400">
                        {localize('com_auth_membership_expired_at', { 0: formatDate(expiredAt) })}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* What to do section */}
              <div className="rounded-lg bg-gray-800/50 p-4">
                <h3 className="mb-2 text-sm font-medium text-white">
                  {localize('com_auth_membership_what_to_do')}
                </h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    {localize('com_auth_membership_contact_admin')}
                  </li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 rounded-lg bg-gray-700 px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-600"
              >
                <LogOut className="h-4 w-4" />
                {localize('com_auth_logout')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
