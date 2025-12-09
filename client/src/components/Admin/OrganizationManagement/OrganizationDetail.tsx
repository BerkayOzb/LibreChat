import { useState } from 'react';
import {
  useGetOrganizationByIdQuery,
  useGetOrganizationUsersQuery,
  useRemoveOrgAdminMutation,
  TOrganizationUser
} from '~/data-provider/Admin/organizations';
import {
  Loader2,
  Users,
  Building,
  Shield,
  UserPlus,
  Search,
  Calendar,
  Mail,
  UserX,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@librechat/client';
import AssignAdminModal from './AssignAdminModal';
import RemoveAdminModal from './RemoveAdminModal';
import { useDebounce, useLocalize } from '~/hooks';

interface OrganizationDetailProps {
  orgId: string;
}

type SortField = 'createdAt' | 'name' | 'membershipExpiresAt' | 'role';
type SortOrder = 'asc' | 'desc';

export default function OrganizationDetail({ orgId }: OrganizationDetailProps) {
  const localize = useLocalize();
  const { data: org, isLoading, error } = useGetOrganizationByIdQuery(orgId);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [removeAdminTarget, setRemoveAdminTarget] = useState<{ userId: string; name: string } | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const debouncedUserSearch = useDebounce(userSearch, 500);

  const userQuery = useGetOrganizationUsersQuery(orgId, {
    page: userPage,
    limit: pageSize,
    search: debouncedUserSearch,
    sortBy: sortField,
    sortOrder: sortOrder
  });

  const removeAdminMutation = useRemoveOrgAdminMutation();

  const handleRemoveAdmin = async () => {
    if (!removeAdminTarget) return;
    await removeAdminMutation.mutateAsync({ organizationId: orgId, userId: removeAdminTarget.userId });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setUserPage(1);
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(parseInt(value));
    setUserPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-text-secondary" />
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-6 border border-red-200 dark:border-red-800">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-red-500" />
          <div>
            <h3 className="font-medium text-red-800 dark:text-red-200">{localize('com_admin_org_not_found')}</h3>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1">
              {localize('com_admin_org_not_found_description')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ORG_ADMIN':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ORG_ADMIN':
        return localize('com_admin_org_admin_role');
      case 'ADMIN':
        return localize('com_admin_admin_role');
      default:
        return localize('com_admin_user_role');
    }
  };

  const getMembershipStatus = (user: TOrganizationUser) => {
    if (!user.membershipExpiresAt) {
      return { label: localize('com_admin_unlimited'), color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30' };
    }
    if (isExpired(user.membershipExpiresAt)) {
      return { label: localize('com_admin_expired'), color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30' };
    }
    return { label: localize('com_admin_active'), color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30' };
  };

  // Sortable column header component
  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary cursor-pointer hover:bg-surface-hover transition-colors select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field ? (
          sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" />
        )}
      </div>
    </th>
  );

  const totalPages = userQuery.data?.pages || 1;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="rounded-xl border border-admin-light-border-subtle dark:border-admin-border-subtle bg-admin-light-primary dark:bg-admin-primary p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/20">
                <Building className="h-6 w-6 text-white" />
              </div>
              {org.name}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
              <span className="inline-flex items-center gap-1.5 text-blue-100">
                <span className="font-medium">{localize('com_admin_code')}:</span>
                <code className="font-mono bg-white/20 px-2 py-0.5 rounded text-white">
                  {org.code}
                </code>
              </span>
              <span className="inline-flex items-center gap-1.5 text-blue-100">
                <Calendar className="h-4 w-4" />
                {localize('com_admin_created_at')}: {formatDate(org.createdAt)}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-center bg-white/20 p-4 rounded-xl min-w-[100px]">
              <div className="text-3xl font-bold text-white">{org.userCount ?? 0}</div>
              <div className="text-xs text-blue-100 uppercase tracking-wider font-semibold mt-1">
                {localize('com_admin_total_users_label')}
              </div>
            </div>
            <div className="text-center bg-white/20 p-4 rounded-xl min-w-[100px]">
              <div className="text-3xl font-bold text-white">
                {org.admins?.length ?? 0}
              </div>
              <div className="text-xs text-blue-100 uppercase tracking-wider font-semibold mt-1">
                {localize('com_admin_admins_label')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admins Section */}
      <div className="rounded-xl border border-border-medium bg-surface-primary p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            {localize('com_admin_org_admins')}
          </h3>
          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            {localize('com_admin_assign_new_admin')}
          </button>
        </div>

        {org.admins && org.admins.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {org.admins.map((admin) => (
              <div
                key={admin._id}
                className="group relative flex items-center gap-3 p-4 rounded-lg border border-border-medium bg-surface-secondary/50 hover:bg-surface-hover transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                  {admin.name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-text-primary truncate">{admin.name}</div>
                  <div className="text-xs text-text-secondary truncate flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {admin.email}
                  </div>
                </div>
                <button
                  onClick={() => setRemoveAdminTarget({ userId: admin._id, name: admin.name })}
                  disabled={removeAdminMutation.isLoading}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"
                  title={localize('com_admin_remove_admin_role')}
                >
                  <UserX className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-text-secondary">
            <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{localize('com_admin_no_admins_yet')}</p>
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {localize('com_admin_assign_first_admin')}
            </button>
          </div>
        )}
      </div>

      {/* Users List */}
      <div className="rounded-xl border border-border-medium bg-surface-primary shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border-medium">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <Users className="h-5 w-5 text-text-secondary" />
              {localize('com_admin_all_users_section')}
              {userQuery.data?.total !== undefined && (
                <span className="text-sm font-normal text-text-tertiary">
                  ({userQuery.data.total})
                </span>
              )}
            </h3>
            <div className="relative max-w-xs w-full">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-text-tertiary" />
              </div>
              <input
                type="text"
                placeholder={localize('com_admin_search_users_placeholder')}
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  setUserPage(1);
                }}
                className="block w-full rounded-lg border border-border-medium bg-surface-secondary pl-10 pr-3 py-2 text-sm text-text-primary placeholder-text-tertiary focus:border-border-heavy focus:ring-1 focus:ring-border-heavy"
              />
            </div>
          </div>
        </div>

        {userQuery.isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-text-secondary" />
          </div>
        ) : userQuery.data?.users && userQuery.data.users.length > 0 ? (
          <>
            {/* Desktop Table - Hidden on mobile */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-text-secondary uppercase bg-surface-secondary">
                  <tr>
                    <SortableHeader field="name">{localize('com_admin_user')}</SortableHeader>
                    <SortableHeader field="role">{localize('com_admin_role')}</SortableHeader>
                    <SortableHeader field="createdAt">{localize('com_admin_joined')}</SortableHeader>
                    <SortableHeader field="membershipExpiresAt">{localize('com_admin_membership')}</SortableHeader>
                  </tr>
                </thead>
                <tbody>
                  {userQuery.data.users.map((user: TOrganizationUser) => (
                    <tr
                      key={user._id}
                      className="border-b border-border-medium last:border-0 hover:bg-surface-hover/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white font-medium text-sm">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="font-medium text-text-primary">{user.name}</div>
                            <div className="text-xs text-text-tertiary">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {user.membershipExpiresAt ? (
                          <span className={`inline-flex items-center gap-1 text-xs ${isExpired(user.membershipExpiresAt) ? 'text-red-500' : 'text-text-secondary'}`}>
                            <Clock className="h-3 w-3" />
                            {isExpired(user.membershipExpiresAt) ? localize('com_admin_expired') : localize('com_admin_expires')}: {formatDate(user.membershipExpiresAt)}
                          </span>
                        ) : (
                          <span className="text-xs text-green-600 dark:text-green-400">{localize('com_admin_unlimited')}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View - Shown only on mobile */}
            <div className="lg:hidden divide-y divide-border-medium">
              {userQuery.data.users.map((user: TOrganizationUser) => {
                const membershipStatus = getMembershipStatus(user);
                return (
                  <div key={user._id} className="p-4 hover:bg-surface-hover transition-colors">
                    {/* User Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                          {(user.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-text-primary truncate">
                            {user.name}
                          </div>
                          <div className="text-sm text-text-secondary truncate">
                            {user.email}
                          </div>
                        </div>
                      </div>
                      {/* Status Badge */}
                      <span className={`flex-shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${membershipStatus.bgColor} ${membershipStatus.color}`}>
                        {membershipStatus.label}
                      </span>
                    </div>

                    {/* User Details Grid */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {/* Role */}
                      <div className="bg-surface-secondary/50 rounded-lg p-2.5">
                        <div className="text-xs text-text-tertiary uppercase tracking-wider mb-1">
                          {localize('com_admin_role')}
                        </div>
                        <div className="font-medium text-text-primary">
                          {getRoleLabel(user.role)}
                        </div>
                      </div>

                      {/* Joined Date */}
                      <div className="bg-surface-secondary/50 rounded-lg p-2.5">
                        <div className="text-xs text-text-tertiary uppercase tracking-wider mb-1">
                          {localize('com_admin_joined')}
                        </div>
                        <div className="font-medium text-text-primary">
                          {formatDate(user.createdAt)}
                        </div>
                      </div>

                      {/* Expires / Membership */}
                      <div className="col-span-2 bg-surface-secondary/50 rounded-lg p-2.5">
                        <div className="text-xs text-text-tertiary uppercase tracking-wider mb-1">
                          {localize('com_admin_membership')}
                        </div>
                        <div className={`font-medium flex items-center gap-1 ${
                          user.membershipExpiresAt && isExpired(user.membershipExpiresAt)
                            ? 'text-red-500'
                            : user.membershipExpiresAt
                              ? 'text-text-primary'
                              : 'text-green-600 dark:text-green-400'
                        }`}>
                          <Clock className="h-3.5 w-3.5" />
                          {user.membershipExpiresAt
                            ? `${isExpired(user.membershipExpiresAt) ? localize('com_admin_expired') : localize('com_admin_expires')}: ${formatDate(user.membershipExpiresAt)}`
                            : localize('com_admin_unlimited')}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="border-t border-border-medium bg-surface-primary px-4 py-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Left side: Showing info & page size selector */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <div className="text-sm text-text-secondary">
                    {localize('com_admin_showing')} {((userPage - 1) * pageSize) + 1} {localize('com_admin_to')}{' '}
                    {Math.min(userPage * pageSize, userQuery.data?.total || 0)} {localize('com_admin_of')}{' '}
                    {userQuery.data?.total || 0} {localize('com_admin_results')}
                  </div>
                  {/* Page Size Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-tertiary">{localize('com_admin_rows_per_page')}:</span>
                    <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                      <SelectTrigger className="w-20 h-8 text-text-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="!bg-surface-primary !z-[100] !shadow-xl border border-border-medium">
                        <SelectItem value="10" className="!bg-surface-primary !text-text-primary hover:!bg-surface-hover">10</SelectItem>
                        <SelectItem value="20" className="!bg-surface-primary !text-text-primary hover:!bg-surface-hover">20</SelectItem>
                        <SelectItem value="50" className="!bg-surface-primary !text-text-primary hover:!bg-surface-hover">50</SelectItem>
                        <SelectItem value="100" className="!bg-surface-primary !text-text-primary hover:!bg-surface-hover">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Right side: Pagination controls */}
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => setUserPage(1)}
                    disabled={userPage === 1}
                    className="p-1.5 rounded-md hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title={localize('com_admin_first_page')}
                  >
                    <ChevronsLeft className="h-4 w-4 text-text-secondary" />
                  </button>
                  <button
                    onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                    disabled={userPage === 1}
                    className="p-1.5 rounded-md hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title={localize('com_admin_previous')}
                  >
                    <ChevronLeft className="h-4 w-4 text-text-secondary" />
                  </button>
                  <span className="px-3 text-sm text-text-primary min-w-[80px] text-center">
                    {userPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setUserPage((p) => Math.min(totalPages, p + 1))}
                    disabled={userPage === totalPages}
                    className="p-1.5 rounded-md hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title={localize('com_admin_next')}
                  >
                    <ChevronRight className="h-4 w-4 text-text-secondary" />
                  </button>
                  <button
                    onClick={() => setUserPage(totalPages)}
                    disabled={userPage === totalPages}
                    className="p-1.5 rounded-md hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title={localize('com_admin_last_page')}
                  >
                    <ChevronsRight className="h-4 w-4 text-text-secondary" />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-text-secondary">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {userSearch ? localize('com_admin_no_users_match_search') : localize('com_admin_no_users_in_org')}
            </p>
          </div>
        )}
      </div>

      <AssignAdminModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        orgId={orgId}
      />

      <RemoveAdminModal
        isOpen={!!removeAdminTarget}
        onClose={() => setRemoveAdminTarget(null)}
        onConfirm={handleRemoveAdmin}
        adminName={removeAdminTarget?.name ?? ''}
        isLoading={removeAdminMutation.isLoading}
      />
    </div>
  );
}
