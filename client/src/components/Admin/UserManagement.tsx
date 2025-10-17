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
  Clock
} from 'lucide-react';
import { 
  useAdminUsersQuery, 
  useUpdateUserStatusMutation,
  useAdminDeleteUserMutation,
  type TAdminUsersQueryParams 
} from '~/data-provider';

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters] = useState<TAdminUsersQueryParams>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Fetch users with current filters
  const { 
    data: usersData, 
    isLoading, 
    error,
    refetch 
  } = useAdminUsersQuery({
    ...filters,
    search: searchTerm || undefined,
    page: currentPage,
  });

  // Mutations
  const updateUserStatusMutation = useUpdateUserStatusMutation();
  const deleteUserMutation = useAdminDeleteUserMutation();

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{userId: string; userEmail: string} | null>(null);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

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

  // Check if user can be deleted (not admin)
  const canDeleteUser = (user: any) => {
    return user.role !== 'ADMIN';
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            User Management
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <button className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" />
          <span>Create User</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div className="flex items-center space-x-2">
          <button className="flex items-center space-x-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Loading users...
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {Boolean(error) && (
        <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
                Error loading users
              </h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                Unable to fetch user data. Please refresh the page or check your connection.
              </p>
              <button
                onClick={() => refetch()}
                className="mt-2 text-sm font-medium text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      {!isLoading && !Boolean(error) && usersData && (
        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
          {/* Table Header */}
          <div className="bg-gray-50 px-6 py-3 dark:bg-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Users ({(usersData as any)?.totalUsers || 0} total)
              </h3>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Page {currentPage} of {(usersData as any)?.totalPages || 1}
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Last Activity
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-600 dark:bg-gray-800">
                {((usersData as any)?.users || []).map((user: any) => (
                  <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600">
                          <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.name || user.username}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        user.role === 'ADMIN' 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {user.role === 'ADMIN' && <Shield className="mr-1 h-3 w-3" />}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        user.isEnabled 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {user.isEnabled ? 'Active' : 'Banned'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="mr-1 h-3 w-3" />
                        {user.lastActivity 
                          ? new Date(user.lastActivity).toLocaleDateString()
                          : 'Never'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleStatusToggle(user._id, user.isEnabled)}
                          disabled={updateUserStatusMutation.isLoading}
                          className={`${
                            user.isEnabled 
                              ? 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300'
                              : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'
                          } disabled:opacity-50`}
                          title={user.isEnabled ? 'Ban User' : 'Activate User'}
                        >
                          {updateUserStatusMutation.isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Ban className="h-4 w-4" />
                          )}
                        </button>
                        <button 
                          onClick={() => canDeleteUser(user) && setDeleteConfirm({userId: user._id, userEmail: user.email})}
                          disabled={!canDeleteUser(user) || deleteUserMutation.isLoading}
                          className={`${
                            canDeleteUser(user) 
                              ? 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300'
                              : 'text-gray-400 cursor-not-allowed dark:text-gray-600'
                          } disabled:opacity-50`}
                          title={canDeleteUser(user) ? 'Delete User' : 'Cannot delete admin users'}
                        >
                          {deleteUserMutation.isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {((usersData as any)?.totalPages || 0) > 1 && (
            <div className="border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-600 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {((currentPage - 1) * ((usersData as any)?.pageSize || 10)) + 1} to{' '}
                  {Math.min(currentPage * ((usersData as any)?.pageSize || 10), (usersData as any)?.totalUsers || 0)} of{' '}
                  {(usersData as any)?.totalUsers || 0} results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {currentPage} / {(usersData as any)?.totalPages || 1}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === ((usersData as any)?.totalPages || 1)}
                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !Boolean(error) && usersData && ((usersData as any)?.users || []).length === 0 && (
        <div className="rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800">
          <Users className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No users found
          </h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {searchTerm ? `No users match "${searchTerm}"` : 'No users have been created yet.'}
          </p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75 dark:bg-gray-900"></div>
            </div>

            <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>

            <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all dark:bg-gray-800 sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
              <div className="bg-white px-4 pt-5 pb-4 dark:bg-gray-800 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                      Delete User
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Are you sure you want to delete the user <strong>{deleteConfirm.userEmail}</strong>? 
                        This action cannot be undone and will permanently remove all user data including 
                        conversations, files, and settings.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 dark:bg-gray-700 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  disabled={deleteUserMutation.isLoading}
                  onClick={() => handleDeleteUser(deleteConfirm.userId)}
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 dark:focus:ring-offset-gray-800 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {deleteUserMutation.isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete User'
                  )}
                </button>
                <button
                  type="button"
                  disabled={deleteUserMutation.isLoading}
                  onClick={() => setDeleteConfirm(null)}
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:focus:ring-offset-gray-800 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}