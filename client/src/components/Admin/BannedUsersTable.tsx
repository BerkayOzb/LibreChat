import React, { useState } from 'react';
import {
  ShieldBan,
  Search,
  Loader2,
  AlertTriangle,
  User,
  Globe,
  Trash2,
  Clock,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  CheckSquare,
  Square,
  MinusSquare,
} from 'lucide-react';
import {
  Button,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  useToastContext,
} from '@librechat/client';
import {
  useGetBans,
  type TBanRecord,
} from '~/data-provider/Admin/queries';
import {
  useRemoveBanByIdMutation,
  useRemoveBansByTargetMutation,
  useClearExpiredBansMutation,
} from '~/data-provider/Admin/mutations';
import { useLocalize } from '~/hooks';

export default function BannedUsersTable() {
  const localize = useLocalize();
  const { showToast } = useToastContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [typeFilter, setTypeFilter] = useState<'all' | 'user' | 'ip'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; target: string; type: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Fetch bans
  const {
    data: bansData,
    isLoading,
    error,
    refetch,
  } = useGetBans({
    page: currentPage,
    limit: pageSize,
    type: typeFilter === 'all' ? '' : typeFilter,
    search: searchTerm || undefined,
  });

  // Mutations
  const removeBanByIdMutation = useRemoveBanByIdMutation();
  const removeBansByTargetMutation = useRemoveBansByTargetMutation();
  const clearExpiredBansMutation = useClearExpiredBansMutation();

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Handle type filter
  const handleTypeFilter = (value: string) => {
    setTypeFilter(value as 'all' | 'user' | 'ip');
    setCurrentPage(1);
  };

  // Handle page size change
  const handlePageSizeChange = (value: string) => {
    setPageSize(parseInt(value));
    setCurrentPage(1);
  };

  // Handle remove ban
  const handleRemoveBan = async (id: string) => {
    try {
      await removeBanByIdMutation.mutateAsync({ id });
      showToast({
        message: localize('com_admin_ban_removed_success'),
        status: 'success',
      });
      setDeleteConfirm(null);
    } catch (error) {
      showToast({
        message: localize('com_admin_ban_removed_error'),
        status: 'error',
      });
    }
  };

  // Handle clear expired bans
  const handleClearExpired = async () => {
    try {
      const result = await clearExpiredBansMutation.mutateAsync();
      showToast({
        message: localize('com_admin_cleared_expired_bans').replace('{{count}}', String(result.clearedCount)),
        status: 'success',
      });
    } catch (error) {
      showToast({
        message: localize('com_admin_clear_expired_error'),
        status: 'error',
      });
    }
  };

  // Format expiration time
  const formatExpiry = (expiresAt: number | null) => {
    if (!expiresAt) {
      return localize('com_admin_permanent');
    }
    const now = Date.now();
    if (expiresAt <= now) {
      return localize('com_admin_expired');
    }
    const date = new Date(expiresAt);
    return date.toLocaleString();
  };

  // Check if ban is expired
  const isExpired = (expiresAt: number | null) => {
    if (!expiresAt) return false;
    return expiresAt <= Date.now();
  };

  // Check if any filters are active
  const hasActiveFilters = typeFilter !== 'all' || searchTerm !== '';

  // Handle clear filters
  const handleClearFilters = () => {
    setTypeFilter('all');
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedIds(new Set()); // Clear selection on page change
  };

  // Bulk selection handlers
  const currentBans = bansData?.bans || [];
  const allSelected = currentBans.length > 0 && currentBans.every(ban => selectedIds.has(ban._id));
  const someSelected = currentBans.some(ban => selectedIds.has(ban._id));

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      const newSelected = new Set(selectedIds);
      currentBans.forEach(ban => newSelected.add(ban._id));
      setSelectedIds(newSelected);
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Bulk delete handler
  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      const idsToDelete = Array.from(selectedIds);
      let successCount = 0;
      let errorCount = 0;

      for (const id of idsToDelete) {
        try {
          await removeBanByIdMutation.mutateAsync({ id });
          successCount++;
        } catch {
          errorCount++;
        }
      }

      if (successCount > 0) {
        showToast({
          message: localize('com_admin_bulk_unban_success').replace('{{count}}', String(successCount)),
          status: 'success',
        });
      }
      if (errorCount > 0) {
        showToast({
          message: localize('com_admin_bulk_unban_error').replace('{{count}}', String(errorCount)),
          status: 'error',
        });
      }

      setSelectedIds(new Set());
      setBulkDeleteConfirm(false);
    } catch (error) {
      showToast({
        message: localize('com_admin_bulk_unban_error').replace('{{count}}', String(selectedIds.size)),
        status: 'error',
      });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {bansData?.stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="admin-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-500/10 p-2">
                <ShieldBan className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm admin-text-secondary">{localize('com_admin_total_bans')}</p>
                <p className="text-xl font-semibold admin-text-primary">{bansData.stats.total}</p>
              </div>
            </div>
          </div>
          <div className="admin-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <User className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm admin-text-secondary">{localize('com_admin_user_bans')}</p>
                <p className="text-xl font-semibold admin-text-primary">{bansData.stats.users}</p>
              </div>
            </div>
          </div>
          <div className="admin-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-500/10 p-2">
                <Globe className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm admin-text-secondary">{localize('com_admin_ip_bans')}</p>
                <p className="text-xl font-semibold admin-text-primary">{bansData.stats.ips}</p>
              </div>
            </div>
          </div>
          <div className="admin-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-500/10 p-2">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm admin-text-secondary">{localize('com_admin_permanent_bans')}</p>
                <p className="text-xl font-semibold admin-text-primary">{bansData.stats.permanent}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
            <Input
              type="text"
              placeholder={localize('com_admin_search_bans')}
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 text-text-primary placeholder:text-text-tertiary"
            />
          </div>

          {/* Type Filter */}
          <div className="w-full sm:w-40">
            <Select value={typeFilter} onValueChange={handleTypeFilter}>
              <SelectTrigger className="text-text-primary">
                <SelectValue placeholder={localize('com_admin_type')} />
              </SelectTrigger>
              <SelectContent className="!bg-surface-primary !z-[100] !shadow-xl border border-border-medium">
                <SelectItem value="all" className="!bg-surface-primary !text-text-primary hover:!bg-surface-hover">
                  {localize('com_admin_all_types')}
                </SelectItem>
                <SelectItem value="user" className="!bg-surface-primary !text-text-primary hover:!bg-surface-hover">
                  {localize('com_admin_user_bans')}
                </SelectItem>
                <SelectItem value="ip" className="!bg-surface-primary !text-text-primary hover:!bg-surface-hover">
                  {localize('com_admin_ip_bans')}
                </SelectItem>
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
              <span className="hidden sm:inline">{localize('com_admin_clear_filters')}</span>
            </Button>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteConfirm(true)}
              disabled={isBulkDeleting}
            >
              {isBulkDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {localize('com_admin_unban_selected')} ({selectedIds.size})
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearExpired}
            disabled={clearExpiredBansMutation.isLoading}
          >
            {clearExpiredBansMutation.isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {localize('com_admin_clear_expired')}
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="admin-loading">
          <div className="admin-loading-spinner" />
          <p className="admin-loading-text">
            {localize('com_admin_loading_bans')}
          </p>
        </div>
      )}

      {/* Error State */}
      {Boolean(error) && (
        <div className="admin-alert admin-alert-danger">
          <AlertTriangle className="h-5 w-5" />
          <div>
            <h3 className="admin-alert-title">
              {localize('com_admin_error_loading_bans')}
            </h3>
            <p className="admin-alert-description">
              {localize('com_admin_error_loading_bans_description')}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="mt-2 h-auto p-0 admin-danger hover:opacity-80"
            >
              {localize('com_admin_try_again')}
            </Button>
          </div>
        </div>
      )}

      {/* Bans Table */}
      {!isLoading && !Boolean(error) && bansData && (
        <div className="admin-card overflow-hidden">
          {/* Table Header */}
          <div className="admin-card-header">
            <div className="flex items-center justify-between">
              <h3 className="admin-card-title">
                {localize('com_admin_banned_entries')} ({bansData.pagination?.totalCount || 0} {localize('com_admin_total')})
              </h3>
              <div className="text-sm admin-text-secondary">
                {localize('com_admin_page')} {currentPage} {localize('com_admin_of')} {bansData.pagination?.totalPages || 1}
              </div>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="px-4 py-3 w-12">
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center justify-center admin-text-secondary hover:admin-text-primary"
                      title={allSelected ? localize('com_admin_deselect_all') : localize('com_admin_select_all')}
                    >
                      {allSelected ? (
                        <CheckSquare className="h-5 w-5 text-blue-500" />
                      ) : someSelected ? (
                        <MinusSquare className="h-5 w-5 text-blue-500" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider admin-text-secondary">
                    {localize('com_admin_type')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider admin-text-secondary">
                    {localize('com_admin_target')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider admin-text-secondary">
                    {localize('com_admin_reason')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider admin-text-secondary">
                    {localize('com_admin_violations')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider admin-text-secondary">
                    {localize('com_admin_expires')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider admin-text-secondary">
                    {localize('com_admin_actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--admin-border-subtle)] bg-[var(--admin-bg-surface)]">
                {(bansData.bans || []).map((ban: TBanRecord) => (
                  <tr key={ban._id} className={`hover:bg-[var(--admin-row-hover)] ${isExpired(ban.expiresAt) ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-4 w-12">
                      <button
                        onClick={() => handleSelectOne(ban._id)}
                        className="flex items-center justify-center"
                      >
                        {selectedIds.has(ban._id) ? (
                          <CheckSquare className="h-5 w-5 text-blue-500" />
                        ) : (
                          <Square className="h-5 w-5 admin-text-secondary hover:admin-text-primary" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`admin-badge ${ban.type === 'user' ? 'admin-badge-info' : 'admin-badge-warning'}`}>
                        {ban.type === 'user' ? (
                          <><User className="h-3 w-3 mr-1" /> {localize('com_admin_user')}</>
                        ) : (
                          <><Globe className="h-3 w-3 mr-1" /> IP</>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium admin-text-primary">
                          {ban.target}
                        </span>
                        {ban.userInfo && (
                          <span className="text-xs admin-text-secondary">
                            {ban.userInfo.email}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm admin-text-secondary">
                        {ban.violationType || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm admin-text-primary">
                        {ban.violationCount || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm ${ban.permanent ? 'text-red-500 font-medium' : isExpired(ban.expiresAt) ? 'text-amber-500' : 'admin-text-secondary'}`}>
                        {formatExpiry(ban.expiresAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirm({ id: ban._id, target: ban.target, type: ban.type })}
                        disabled={removeBanByIdMutation.isLoading}
                        className="text-destructive hover:text-destructive/80"
                        title={localize('com_admin_unban')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden divide-y divide-border-light">
            {(bansData.bans || []).map((ban: TBanRecord) => (
              <div key={ban._id} className={`p-4 hover:bg-surface-hover transition-colors ${isExpired(ban.expiresAt) ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleSelectOne(ban._id)}
                      className="flex items-center justify-center"
                    >
                      {selectedIds.has(ban._id) ? (
                        <CheckSquare className="h-5 w-5 text-blue-500" />
                      ) : (
                        <Square className="h-5 w-5 admin-text-secondary" />
                      )}
                    </button>
                    <span className={`admin-badge ${ban.type === 'user' ? 'admin-badge-info' : 'admin-badge-warning'}`}>
                      {ban.type === 'user' ? (
                        <><User className="h-3 w-3 mr-1" /> {localize('com_admin_user')}</>
                      ) : (
                        <><Globe className="h-3 w-3 mr-1" /> IP</>
                      )}
                    </span>
                    {ban.permanent && (
                      <span className="admin-badge admin-badge-danger">
                        {localize('com_admin_permanent')}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteConfirm({ id: ban._id, target: ban.target, type: ban.type })}
                    className="text-destructive hover:text-destructive/80"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs admin-text-secondary">{localize('com_admin_target')}:</span>
                    <p className="text-sm font-medium admin-text-primary">{ban.target}</p>
                    {ban.userInfo && (
                      <p className="text-xs admin-text-secondary">{ban.userInfo.email}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-xs admin-text-secondary">{localize('com_admin_reason')}:</span>
                      <p className="admin-text-primary">{ban.violationType || '-'}</p>
                    </div>
                    <div>
                      <span className="text-xs admin-text-secondary">{localize('com_admin_expires')}:</span>
                      <p className={ban.permanent ? 'text-red-500 font-medium' : 'admin-text-primary'}>
                        {formatExpiry(ban.expiresAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="border-t border-[var(--admin-border-subtle)] bg-[var(--admin-bg-surface)] px-4 py-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Left side: Showing info & page size selector */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <div className="text-sm admin-text-secondary">
                  {localize('com_admin_showing')} {((currentPage - 1) * pageSize) + 1} {localize('com_admin_to')}{' '}
                  {Math.min(currentPage * pageSize, bansData.pagination?.totalCount || 0)} {localize('com_admin_of')}{' '}
                  {bansData.pagination?.totalCount || 0} {localize('com_admin_results')}
                </div>
                {/* Page Size Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm admin-text-muted">{localize('com_admin_rows_per_page')}:</span>
                  <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                    <SelectTrigger className="w-20 h-8 admin-text-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="!bg-[var(--admin-bg-surface)] !z-[100] !shadow-xl border border-[var(--admin-border-muted)]">
                      <SelectItem value="10" className="!bg-[var(--admin-bg-surface)] admin-text-primary hover:!bg-[var(--admin-row-hover)]">10</SelectItem>
                      <SelectItem value="20" className="!bg-[var(--admin-bg-surface)] admin-text-primary hover:!bg-[var(--admin-row-hover)]">20</SelectItem>
                      <SelectItem value="50" className="!bg-[var(--admin-bg-surface)] admin-text-primary hover:!bg-[var(--admin-row-hover)]">50</SelectItem>
                      <SelectItem value="100" className="!bg-[var(--admin-bg-surface)] admin-text-primary hover:!bg-[var(--admin-row-hover)]">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Right side: Pagination controls */}
              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8"
                  title={localize('com_admin_first_page')}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8"
                  title={localize('com_admin_previous')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 text-sm admin-text-primary min-w-[80px] text-center">
                  {currentPage} / {bansData.pagination?.totalPages || 1}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === (bansData.pagination?.totalPages || 1)}
                  className="h-8 w-8"
                  title={localize('com_admin_next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handlePageChange(bansData.pagination?.totalPages || 1)}
                  disabled={currentPage === (bansData.pagination?.totalPages || 1)}
                  className="h-8 w-8"
                  title={localize('com_admin_last_page')}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !Boolean(error) && bansData && (bansData.bans?.length || 0) === 0 && (
        <div className="admin-card">
          <div className="admin-empty-state">
            <div className="admin-empty-state-icon">
              <ShieldBan />
            </div>
            <h3 className="admin-empty-state-title">
              {localize('com_admin_no_bans_found')}
            </h3>
            <p className="admin-empty-state-description">
              {searchTerm
                ? localize('com_admin_no_bans_match').replace('{{searchTerm}}', searchTerm)
                : localize('com_admin_no_active_bans')}
            </p>
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

            <div className="inline-block transform overflow-hidden rounded-xl border border-border-light bg-surface-primary text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
              <div className="bg-surface-primary px-5 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-green-500/10 sm:mx-0">
                    <ShieldBan className="h-5 w-5 text-green-500" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg font-medium leading-6 text-text-primary">
                      {localize('com_admin_unban_title')}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-text-secondary">
                        {localize('com_admin_unban_confirmation')}{' '}
                        <strong>{deleteConfirm.type === 'user' ? localize('com_admin_user') : 'IP'}: {deleteConfirm.target}</strong>?
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-surface-secondary px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <Button
                  variant="default"
                  size="default"
                  disabled={removeBanByIdMutation.isLoading}
                  onClick={() => handleRemoveBan(deleteConfirm.id)}
                  className="w-full sm:ml-3 sm:w-auto bg-green-600 hover:bg-green-700"
                >
                  {removeBanByIdMutation.isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {localize('com_admin_removing')}
                    </>
                  ) : (
                    localize('com_admin_unban')
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="default"
                  disabled={removeBanByIdMutation.isLoading}
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

      {/* Bulk Delete Confirmation Modal */}
      {bulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-black/50"></div>
            </div>

            <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>

            <div className="inline-block transform overflow-hidden rounded-xl border border-border-light bg-surface-primary text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
              <div className="bg-surface-primary px-5 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-red-500/10 sm:mx-0">
                    <Trash2 className="h-5 w-5 text-red-500" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg font-medium leading-6 text-text-primary">
                      {localize('com_admin_bulk_unban_title')}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-text-secondary">
                        {localize('com_admin_bulk_unban_confirmation').replace('{{count}}', String(selectedIds.size))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-surface-secondary px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <Button
                  variant="destructive"
                  size="default"
                  disabled={isBulkDeleting}
                  onClick={handleBulkDelete}
                  className="w-full sm:ml-3 sm:w-auto"
                >
                  {isBulkDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {localize('com_admin_removing')}
                    </>
                  ) : (
                    localize('com_admin_unban_selected').replace('{{count}}', '')
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="default"
                  disabled={isBulkDeleting}
                  onClick={() => setBulkDeleteConfirm(false)}
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
