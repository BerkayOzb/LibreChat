import { useState } from 'react';
import { X, UserX, Loader2, AlertTriangle, Shield } from 'lucide-react';
import { useLocalize } from '~/hooks';

interface RemoveAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  adminName: string;
  isLoading?: boolean;
}

export default function RemoveAdminModal({
  isOpen,
  onClose,
  onConfirm,
  adminName,
  isLoading = false,
}: RemoveAdminModalProps) {
  const localize = useLocalize();
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      setError(err?.message || localize('com_admin_remove_admin_failed'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        </div>

        <span className="hidden sm:inline-block sm:h-screen sm:align-middle">&#8203;</span>

        <div className="inline-block transform overflow-hidden rounded-xl bg-surface-primary text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:align-middle border border-border-medium">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-medium">
            <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <UserX className="h-5 w-5 text-red-500" />
              {localize('com_admin_remove_admin_title')}
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4">
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-2 border border-red-200 dark:border-red-800">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Warning Message */}
              <div className="mb-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      {localize('com_admin_remove_admin_warning')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Admin Info Card */}
              <div className="mb-4 p-4 rounded-lg bg-surface-secondary border border-border-medium">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                    {adminName?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-text-primary text-lg">{adminName}</div>
                    <div className="text-sm text-text-secondary flex items-center gap-1">
                      <Shield className="h-3.5 w-3.5" />
                      {localize('com_admin_org_admin_role')}
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-text-secondary mb-4">
                {localize('com_admin_remove_admin_description')}
              </p>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border-medium mt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-border-medium bg-surface-primary px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-hover transition-colors"
                >
                  {localize('com_ui_cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4" />
                      {localize('com_admin_removing')}
                    </>
                  ) : (
                    <>
                      <UserX className="h-4 w-4" />
                      {localize('com_admin_remove_admin_button')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
