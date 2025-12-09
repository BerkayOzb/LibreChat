import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  X,
  Loader2,
  AlertTriangle,
  Search,
  User,
  Mail,
  Check
} from 'lucide-react';
import { useAssignOrgAdminMutation } from '~/data-provider/Admin/organizations';
import { useAdminUsersQuery, TAdminUser } from '~/data-provider/Admin/queries';
import { useDebounce, useLocalize } from '~/hooks';

interface AssignAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
}

export default function AssignAdminModal({
  isOpen,
  onClose,
  orgId
}: AssignAdminModalProps) {
  const localize = useLocalize();
  const assignMutation = useAssignOrgAdminMutation();
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<TAdminUser | null>(null);
  const [error, setError] = useState('');

  const debouncedSearch = useDebounce(search, 400);

  const { data: usersData, isLoading: isSearching } = useAdminUsersQuery(
    {
      search: debouncedSearch,
      limit: 10,
      page: 1
    },
    {
      enabled: isOpen && debouncedSearch.length >= 2
    }
  );

  // Filter out users who are already ORG_ADMIN or ADMIN
  const availableUsers = usersData?.users?.filter(
    (user) => user.role !== 'ORG_ADMIN' && user.role !== 'ADMIN'
  ) ?? [];

  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setSelectedUser(null);
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      setError(localize('com_admin_please_select_user'));
      return;
    }

    try {
      await assignMutation.mutateAsync({ organizationId: orgId, userId: selectedUser._id });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || localize('com_admin_failed_assign_admin'));
    }
  };

  const handleSelectUser = (user: TAdminUser) => {
    setSelectedUser(user);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        </div>

        <span className="hidden sm:inline-block sm:h-screen sm:align-middle">&#8203;</span>

        <div className="inline-block transform overflow-hidden rounded-xl bg-surface-primary text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle border border-border-medium">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-medium">
            <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-500" />
              {localize('com_admin_assign_org_admin')}
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
              {/* Search Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  {localize('com_admin_search_users_label')}
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-4 w-4 text-text-tertiary" />
                  </div>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="block w-full rounded-lg border border-border-medium bg-surface-secondary pl-10 pr-3 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:border-border-heavy focus:ring-1 focus:ring-border-heavy"
                    placeholder={localize('com_admin_search_name_email')}
                    autoFocus
                  />
                </div>
                <p className="text-xs text-text-tertiary mt-1.5">
                  {localize('com_admin_type_to_search')}
                </p>
              </div>

              {/* Search Results */}
              {debouncedSearch.length >= 2 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    {localize('com_admin_select_user')}
                  </label>
                  <div className="border border-border-medium rounded-lg max-h-60 overflow-y-auto">
                    {isSearching ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-text-secondary" />
                      </div>
                    ) : availableUsers.length > 0 ? (
                      <div className="divide-y divide-border-medium">
                        {availableUsers.map((user) => (
                          <button
                            key={user._id}
                            type="button"
                            onClick={() => handleSelectUser(user)}
                            className={`w-full flex items-center gap-3 p-3 text-left hover:bg-surface-hover transition-colors ${
                              selectedUser?._id === user._id
                                ? 'bg-blue-50 dark:bg-blue-900/20'
                                : ''
                            }`}
                          >
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                              {user.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-text-primary truncate flex items-center gap-2">
                                {user.name || user.username}
                                {selectedUser?._id === user._id && (
                                  <Check className="h-4 w-4 text-blue-500" />
                                )}
                              </div>
                              <div className="text-xs text-text-tertiary truncate flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {user.email}
                              </div>
                            </div>
                            <div className="text-xs text-text-tertiary bg-surface-secondary px-2 py-0.5 rounded">
                              {user.role}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-text-secondary">
                        <User className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">{localize('com_admin_no_available_users')}</p>
                        <p className="text-xs text-text-tertiary mt-1">
                          {localize('com_admin_admins_not_shown')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Selected User Preview */}
              {selectedUser && (
                <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                      {selectedUser.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-text-primary">
                        {selectedUser.name || selectedUser.username}
                      </div>
                      <div className="text-sm text-text-secondary">{selectedUser.email}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedUser(null)}
                      className="p-1 rounded text-text-tertiary hover:text-text-primary"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

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
                  disabled={!selectedUser || assignMutation.isLoading}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
                >
                  {assignMutation.isLoading ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4" />
                      {localize('com_admin_assigning')}
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      {localize('com_admin_assign_as_admin')}
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
