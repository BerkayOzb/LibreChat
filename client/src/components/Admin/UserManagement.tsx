import { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Loader2,
  AlertTriangle,
  Edit,
  Ban,
  Trash2,
  Shield,
  User,
  Clock,
  X
} from 'lucide-react';
import {
  Button,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@librechat/client';
import {
  useAdminUsersQuery,
  useUpdateUserStatusMutation,
  useAdminDeleteUserMutation,
  useResetUserPasswordMutation,
  useUpdateUserRoleMutation,
  type TAdminUsersQueryParams
} from '~/data-provider';
import { useLocalize } from '~/hooks';
import UserCreationModal from './UserCreationModal';

export default function UserManagement() {
  const localize = useLocalize();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'banned'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'USER' | 'ADMIN'>('all');

  // Fetch users with current filters
  const {
    data: usersData,
    isLoading,
    error,
    refetch
  } = useAdminUsersQuery({
    page: currentPage,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    search: searchTerm || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    role: roleFilter === 'all' ? undefined : roleFilter,
  });

  // Mutations
  const updateUserStatusMutation = useUpdateUserStatusMutation();
  const deleteUserMutation = useAdminDeleteUserMutation();
  const resetPasswordMutation = useResetUserPasswordMutation();
  const updateUserRoleMutation = useUpdateUserRoleMutation();

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ userId: string; userEmail: string } | null>(null);
  const [passwordReset, setPasswordReset] = useState<{ userId: string; userEmail: string } | null>(null);
  const [roleChange, setRoleChange] = useState<{ userId: string; userEmail: string; currentRole: string; newRole: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<{ [key: string]: string }>({});

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle filter changes
  const handleStatusFilter = (value: string) => {
    setStatusFilter(value as 'all' | 'active' | 'banned');
    setCurrentPage(1);
  };

  const handleRoleFilter = (value: string) => {
    setRoleFilter(value as 'all' | 'USER' | 'ADMIN');
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setStatusFilter('all');
    setRoleFilter('all');
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Check if any filters are active
  const hasActiveFilters = statusFilter !== 'all' || roleFilter !== 'all' || searchTerm !== '';

  // Handle user status toggle
  const handleStatusToggle = async (userId: string, isCurrentlyEnabled: boolean) => {
    const shouldBan = isCurrentlyEnabled;
    try {
      await updateUserStatusMutation.mutateAsync({
        userId,
        banned: shouldBan,
      });
    } catch (error) {

    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUserMutation.mutateAsync({
        userId,
      });
      setDeleteConfirm(null);
    } catch (error) {

    }
  };

  // Password validation function
  const validatePassword = (password: string) => {
    const errors: { [key: string]: string } = {};

    if (!password) {
      errors.required = localize('com_admin_password_required');
    } else {
      if (password.length < 8) {
        errors.minLength = localize('com_admin_password_min_length');
      }
      if (password.length > 128) {
        errors.maxLength = localize('com_admin_password_max_length');
      }
    }

    return errors;
  };

  // Handle password change with validation
  const handlePasswordChange = (value: string) => {
    setNewPassword(value);
    const errors = validatePassword(value);
    setPasswordErrors(errors);
  };

  // Handle password reset
  const handlePasswordReset = async () => {
    if (!passwordReset || !newPassword.trim()) return;

    // Final validation before submit
    const errors = validatePassword(newPassword);
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync({
        userId: passwordReset.userId,
        password: newPassword,
      });
      setPasswordReset(null);
      setNewPassword('');
      setPasswordErrors({});
    } catch (error) {
      // Error handled by React Query's onError callback
    }
  };

  // Handle role change
  const handleRoleChange = async (userId: string, currentRole: string, newRole: string) => {
    try {
      await updateUserRoleMutation.mutateAsync({
        userId,
        role: newRole,
      });
      setRoleChange(null);
    } catch (error) {
      // Error handled by React Query's onError callback
    }
  };

  // Check if user can be deleted/edited (not admin)
  const canDeleteUser = (user: any) => {
    return user.role !== 'ADMIN';
  };

  const canEditUser = (user: any) => {
    return user.role !== 'ADMIN';
  };

  // Handle user creation success
  const handleUserCreated = (user: any) => {
    // User list will be automatically updated by React Query
    // Optional: Show success message
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {localize('com_admin_user_management')}
          </h1>
          <p className="mt-1 text-text-secondary">
            {localize('com_admin_user_management_description')}
          </p>
        </div>
        <Button
          variant="submit"
          size="default"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="h-4 w-4" />
          {localize('com_admin_create_user')}
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
            <Input
              type="text"
              placeholder={localize('com_admin_search_users')}
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 text-text-primary placeholder:text-text-tertiary"
            />
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-40">
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="text-text-primary">
                <SelectValue placeholder={localize('com_admin_status')} />
              </SelectTrigger>
              <SelectContent className="!bg-white dark:!bg-gray-800 !z-[100] !shadow-xl">
                <SelectItem value="all" className="!bg-white dark:!bg-gray-800 !text-gray-900 dark:!text-gray-100 hover:!bg-gray-100 dark:hover:!bg-gray-700">All Users</SelectItem>
                <SelectItem value="active" className="!bg-white dark:!bg-gray-800 !text-gray-900 dark:!text-gray-100 hover:!bg-gray-100 dark:hover:!bg-gray-700">{localize('com_admin_active')}</SelectItem>
                <SelectItem value="banned" className="!bg-white dark:!bg-gray-800 !text-gray-900 dark:!text-gray-100 hover:!bg-gray-100 dark:hover:!bg-gray-700">{localize('com_admin_banned')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Role Filter */}
          <div className="w-full sm:w-40">
            <Select value={roleFilter} onValueChange={handleRoleFilter}>
              <SelectTrigger className="text-text-primary">
                <SelectValue placeholder={localize('com_admin_role')} />
              </SelectTrigger>
              <SelectContent className="!bg-white dark:!bg-gray-800 !z-[100] !shadow-xl">
                <SelectItem value="all" className="!bg-white dark:!bg-gray-800 !text-gray-900 dark:!text-gray-100 hover:!bg-gray-100 dark:hover:!bg-gray-700">All Roles</SelectItem>
                <SelectItem value="USER" className="!bg-white dark:!bg-gray-800 !text-gray-900 dark:!text-gray-100 hover:!bg-gray-100 dark:hover:!bg-gray-700">User</SelectItem>
                <SelectItem value="ADMIN" className="!bg-white dark:!bg-gray-800 !text-gray-900 dark:!text-gray-100 hover:!bg-gray-100 dark:hover:!bg-gray-700">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="whitespace-nowrap"
            >
              <X className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Clear Filters</span>
            </Button>
          )}
        </div>

        {/* Active Filter Badges */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-text-secondary">Active Filters:</span>
            {searchTerm && (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-surface-secondary px-3 py-1 text-xs font-medium text-text-primary cursor-pointer transition-colors hover:bg-destructive/20"
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
              >
                Search: {searchTerm}
                <X className="h-3 w-3" />
              </span>
            )}
            {statusFilter !== 'all' && (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-surface-secondary px-3 py-1 text-xs font-medium text-text-primary cursor-pointer transition-colors hover:bg-destructive/20"
                onClick={() => {
                  setStatusFilter('all');
                  setCurrentPage(1);
                }}
              >
                {localize('com_admin_status')}: {statusFilter === 'active' ? localize('com_admin_active') : localize('com_admin_banned')}
                <X className="h-3 w-3" />
              </span>
            )}
            {roleFilter !== 'all' && (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-surface-secondary px-3 py-1 text-xs font-medium text-text-primary cursor-pointer transition-colors hover:bg-destructive/20"
                onClick={() => {
                  setRoleFilter('all');
                  setCurrentPage(1);
                }}
              >
                {localize('com_admin_role')}: {roleFilter === 'USER' ? 'User' : 'Admin'}
                <X className="h-3 w-3" />
              </span>
            )}
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-text-secondary" />
            <p className="mt-2 text-sm text-text-secondary">
              {localize('com_admin_loading_users')}
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {Boolean(error) && (
        <div className="rounded-lg bg-destructive/10 p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-destructive">
                {localize('com_admin_error_loading_users')}
              </h3>
              <p className="mt-1 text-sm text-text-secondary">
                {localize('com_admin_error_loading_users_description')}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                className="mt-2 h-auto p-0 text-destructive hover:text-destructive/80"
              >
                {localize('com_admin_try_again')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      {!isLoading && !Boolean(error) && usersData && (
        <div className="overflow-hidden rounded-lg bg-surface-primary shadow">
          {/* Table Header */}
          <div className="bg-surface-secondary px-6 py-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-text-primary">
                {localize('com_admin_users')} ({(usersData as any)?.totalUsers || 0} {localize('com_admin_total')})
              </h3>
              <div className="text-sm text-text-secondary">
                {localize('com_admin_page')} {currentPage} {localize('com_admin_of')} {(usersData as any)?.totalPages || 1}
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border-light">
              <thead className="bg-surface-secondary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                    {localize('com_admin_user')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                    {localize('com_admin_role')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                    {localize('com_admin_status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                    {localize('com_admin_joined')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                    {localize('com_admin_last_activity')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-secondary">
                    {localize('com_admin_actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light bg-surface-primary">
                {((usersData as any)?.users || []).map((user: any) => (
                  <tr key={user._id} className="hover:bg-surface-hover">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-secondary">
                          <User className="h-4 w-4 text-text-secondary" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-text-primary">
                            {user.name || user.username}
                          </div>
                          <div className="text-sm text-text-secondary">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role}
                        onChange={(e) => {
                          const newRole = e.target.value;
                          if (newRole !== user.role) {
                            setRoleChange({
                              userId: user._id,
                              userEmail: user.email,
                              currentRole: user.role,
                              newRole: newRole
                            });
                          }
                        }}
                        disabled={updateUserRoleMutation.isLoading}
                        className={`rounded-md border pl-2 pr-7 py-1 text-xs font-medium focus:outline-none focus:ring-1 cursor-pointer ${user.role === 'ADMIN'
                          ? 'border-border-medium bg-destructive/10 text-destructive focus:border-destructive focus:ring-destructive'
                          : 'border-border-medium bg-surface-secondary text-text-primary focus:border-border-heavy focus:ring-border-heavy'
                          } disabled:opacity-50`}
                      >
                        <option value="USER">{localize('com_admin_user_role')}</option>
                        <option value="ADMIN">{localize('com_admin_admin_role')}</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.isEnabled
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                        {user.isEnabled ? localize('com_admin_active') : localize('com_admin_banned')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-text-secondary">
                        <Clock className="mr-1 h-3 w-3" />
                        {user.lastActivity
                          ? new Date(user.lastActivity).toLocaleString()
                          : localize('com_admin_never')
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => canEditUser(user) && setPasswordReset({ userId: user._id, userEmail: user.email })}
                          disabled={!canEditUser(user)}
                          className={canEditUser(user) ? 'text-text-primary hover:text-text-primary' : 'text-text-tertiary cursor-not-allowed'}
                          title={canEditUser(user) ? localize('com_admin_reset_password') : localize('com_admin_cannot_edit_admin')}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleStatusToggle(user._id, user.isEnabled)}
                          disabled={updateUserStatusMutation.isLoading}
                          className={user.isEnabled ? 'text-destructive hover:text-destructive/80' : 'text-success hover:text-success/80'}
                          title={user.isEnabled ? localize('com_admin_ban_user') : localize('com_admin_activate_user')}
                        >
                          {updateUserStatusMutation.isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Ban className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => canDeleteUser(user) && setDeleteConfirm({ userId: user._id, userEmail: user.email })}
                          disabled={!canDeleteUser(user) || deleteUserMutation.isLoading}
                          className={canDeleteUser(user) ? 'text-destructive hover:text-destructive/80' : 'text-text-tertiary cursor-not-allowed'}
                          title={canDeleteUser(user) ? localize('com_admin_delete_user') : localize('com_admin_cannot_delete_admin')}
                        >
                          {deleteUserMutation.isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {(usersData?.totalPages || 0) > 1 && (
            <div className="border-t border-border-light bg-surface-primary px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-text-primary">
                  {localize('com_admin_showing')} {((currentPage - 1) * (usersData?.pageSize || 10)) + 1} {localize('com_admin_to')}{' '}
                  {Math.min(currentPage * (usersData?.pageSize || 10), usersData?.totalUsers || 0)} {localize('com_admin_of')}{' '}
                  {usersData?.totalUsers || 0} {localize('com_admin_results')}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    {localize('com_admin_previous')}
                  </Button>
                  <span className="text-sm text-text-primary">
                    {currentPage} / {usersData?.totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === (usersData?.totalPages || 1)}
                  >
                    {localize('com_admin_next')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !Boolean(error) && usersData && ((usersData as any)?.users || []).length === 0 && (
        <div className="rounded-lg bg-surface-primary p-8 text-center shadow">
          <Users className="mx-auto h-16 w-16 text-text-tertiary" />
          <h3 className="mt-4 text-lg font-medium text-text-primary">
            {localize('com_admin_no_users_found')}
          </h3>
          <p className="mt-2 text-text-secondary">
            {searchTerm ? localize('com_admin_no_users_match').replace('{{searchTerm}}', searchTerm) : localize('com_admin_no_users_created')}
          </p>
        </div>
      )}

      {/* Password Reset Modal */}
      {passwordReset && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-black/50"></div>
            </div>

            <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>

            <div className="inline-block transform overflow-hidden rounded-lg bg-surface-primary text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
              <div className="bg-surface-primary px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-surface-secondary sm:mx-0 sm:h-10 sm:w-10">
                    <Edit className="h-6 w-6 text-text-primary" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg font-medium leading-6 text-text-primary">
                      {localize('com_admin_reset_password_title')}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-text-secondary mb-4">
                        {localize('com_admin_reset_password_description')} <strong>{passwordReset.userEmail}</strong>
                      </p>
                      <Input
                        type="password"
                        placeholder={localize('com_admin_new_password_placeholder')}
                        value={newPassword}
                        onChange={(e) => handlePasswordChange(e.target.value)}
                        className={Object.keys(passwordErrors).length > 0 ? 'border-destructive focus:border-destructive focus:ring-destructive' : ''}
                        minLength={8}
                        maxLength={128}
                        disabled={resetPasswordMutation.isLoading}
                      />
                      {Object.keys(passwordErrors).length > 0 && (
                        <div className="mt-2 text-sm text-destructive">
                          {Object.values(passwordErrors).map((error, index) => (
                            <div key={index}>{error}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-surface-secondary px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <Button
                  variant="submit"
                  size="default"
                  disabled={resetPasswordMutation.isLoading || Object.keys(passwordErrors).length > 0 || !newPassword.trim()}
                  onClick={handlePasswordReset}
                  className="w-full sm:ml-3 sm:w-auto"
                >
                  {resetPasswordMutation.isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {localize('com_admin_resetting')}
                    </>
                  ) : (
                    localize('com_admin_reset_password_title')
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="default"
                  disabled={resetPasswordMutation.isLoading}
                  onClick={() => {
                    setPasswordReset(null);
                    setNewPassword('');
                    setPasswordErrors({});
                  }}
                  className="mt-3 w-full sm:mt-0 sm:w-auto"
                >
                  {localize('com_admin_cancel')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Creation Modal */}
      <UserCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleUserCreated}
      />

      {/* Role Change Confirmation Modal */}
      {roleChange && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-black/50"></div>
            </div>

            <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>

            <div className="inline-block transform overflow-hidden rounded-lg bg-surface-primary text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
              <div className="bg-surface-primary px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-destructive/10 sm:mx-0 sm:h-10 sm:w-10">
                    <Shield className="h-6 w-6 text-destructive" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg font-medium leading-6 text-text-primary">
                      {localize('com_admin_change_role_title')}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-text-secondary">
                        {localize('com_admin_change_role_confirmation')}
                        <br />
                        <strong>{roleChange.userEmail}</strong>
                        <br />
                        {localize('com_admin_role_from_to')
                          .replace('{{currentRole}}', roleChange.currentRole)
                          .replace('{{newRole}}', roleChange.newRole)}
                      </p>
                      {roleChange.newRole === 'ADMIN' && (
                        <div className="mt-3 rounded-lg bg-destructive/10 p-3">
                          <div className="flex">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            <div className="ml-3">
                              <p className="text-sm text-destructive">
                                {localize('com_admin_admin_role_warning')}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-surface-secondary px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <Button
                  variant={roleChange.newRole === 'ADMIN' ? 'destructive' : 'submit'}
                  size="default"
                  disabled={updateUserRoleMutation.isLoading}
                  onClick={() => handleRoleChange(roleChange.userId, roleChange.currentRole, roleChange.newRole)}
                  className="w-full sm:ml-3 sm:w-auto"
                >
                  {updateUserRoleMutation.isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {localize('com_admin_updating_role')}
                    </>
                  ) : (
                    localize('com_admin_change_role')
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="default"
                  disabled={updateUserRoleMutation.isLoading}
                  onClick={() => setRoleChange(null)}
                  className="mt-3 w-full sm:mt-0 sm:w-auto"
                >
                  {localize('com_admin_cancel')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-black/50"></div>
            </div>

            <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>

            <div className="inline-block transform overflow-hidden rounded-lg bg-surface-primary text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
              <div className="bg-surface-primary px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-destructive/10 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg font-medium leading-6 text-text-primary">
                      {localize('com_admin_delete_user_title')}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-text-secondary">
                        {localize('com_admin_delete_user_confirmation')} <strong>{deleteConfirm.userEmail}</strong>?
                        {localize('com_admin_delete_user_warning')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-surface-secondary px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <Button
                  variant="destructive"
                  size="default"
                  disabled={deleteUserMutation.isLoading}
                  onClick={() => handleDeleteUser(deleteConfirm.userId)}
                  className="w-full sm:ml-3 sm:w-auto"
                >
                  {deleteUserMutation.isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {localize('com_admin_deleting')}
                    </>
                  ) : (
                    localize('com_admin_delete_user_title')
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="default"
                  disabled={deleteUserMutation.isLoading}
                  onClick={() => setDeleteConfirm(null)}
                  className="mt-3 w-full sm:mt-0 sm:w-auto"
                >
                  {localize('com_admin_cancel')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}