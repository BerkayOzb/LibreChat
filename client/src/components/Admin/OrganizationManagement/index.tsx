import { useState } from 'react';
import { Plus, Search, Loader2, Building2 } from 'lucide-react';
import { Button, Input } from '@librechat/client';
import { useGetOrganizationsQuery, useDeleteOrganizationMutation } from '~/data-provider/Admin/organizations';
import OrganizationTable from './OrganizationTable';
import CreateOrgModal from './CreateOrgModal';
import { useDebounce, useLocalize } from '~/hooks';

export default function OrganizationManagement() {
  const localize = useLocalize();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, error, isError } = useGetOrganizationsQuery({
    page,
    limit: 10,
    search: debouncedSearch
  });

  if (isError) {
    console.error('Organization Fetch Error:', error);
  }

  const deleteMutation = useDeleteOrganizationMutation();

  const handleDelete = async (id: string) => {
    if (window.confirm(localize('com_admin_delete_org_confirm'))) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err) {
        alert(localize('com_admin_delete_org_failed'));
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header Card */}
      <div className="rounded-xl border border-border-light bg-surface-primary p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-tertiary">
              <Building2 className="h-6 w-6 text-text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-text-primary">
                {localize('com_admin_org_management')}
              </h1>
              <p className="text-sm text-text-secondary">
                {localize('com_admin_org_management_description')}
              </p>
            </div>
          </div>
          <Button
            variant="default"
            size="default"
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full bg-text-primary text-surface-primary hover:opacity-90 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            {localize('com_admin_new_organization')}
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
          <Input
            type="text"
            placeholder={localize('com_admin_search_organizations')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10 text-text-primary placeholder:text-text-tertiary"
          />
        </div>
        {data?.total !== undefined && (
          <div className="flex items-center text-sm text-text-secondary">
            <span className="bg-surface-secondary px-3 py-1.5 rounded-lg">
              {data.total} {data.total !== 1 ? localize('com_admin_organizations') : localize('com_admin_organization')}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      {isError ? (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-6 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
          <p className="font-medium">{localize('com_admin_error_loading_organizations')}</p>
          <p className="text-sm mt-1 opacity-80">{localize('com_admin_try_again')}</p>
        </div>
      ) : isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-text-secondary" />
        </div>
      ) : (
        <div className="rounded-xl border border-border-light bg-surface-primary shadow-sm overflow-hidden">
          <OrganizationTable
            data={data?.organizations || []}
            onDelete={handleDelete}
          />

          {/* Pagination */}
          {data?.pages && data.pages > 1 && (
            <div className="border-t border-border-light bg-surface-primary px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-text-secondary">
                  {localize('com_admin_showing_page', { page: page.toString(), pages: data.pages.toString() })}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    {localize('com_admin_previous')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === data.pages}
                    onClick={() => setPage(p => Math.min(data.pages, p + 1))}
                  >
                    {localize('com_admin_next')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <CreateOrgModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
