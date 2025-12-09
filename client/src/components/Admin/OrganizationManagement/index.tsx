import { useState } from 'react';
import { Plus, Search, Loader2, Building2 } from 'lucide-react';
import { useGetOrganizationsQuery, useDeleteOrganizationMutation } from '~/data-provider/Admin/organizations';
import OrganizationTable from './OrganizationTable';
import CreateOrgModal from './CreateOrgModal';
import { useDebounce } from '~/hooks';

export default function OrganizationManagement() {
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
    if (window.confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err) {
        alert('Failed to delete organization. Ensure it has no users.');
      }
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Building2 className="h-7 w-7" />
            Organization Management
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage tenant organizations, assign admins, and view consolidated statistics.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Organization
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-text-tertiary" />
          </div>
          <input
            type="text"
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="block w-full rounded-lg border border-border-medium bg-surface-primary pl-10 pr-3 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:border-border-heavy focus:ring-1 focus:ring-border-heavy"
          />
        </div>
        {data?.total !== undefined && (
          <div className="flex items-center text-sm text-text-secondary">
            <span className="bg-surface-secondary px-3 py-1.5 rounded-lg">
              {data.total} organization{data.total !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      {isError ? (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-6 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
          <p className="font-medium">Error loading organizations</p>
          <p className="text-sm mt-1 opacity-80">Please check the console for more details.</p>
        </div>
      ) : isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-text-secondary" />
        </div>
      ) : (
        <>
          <OrganizationTable
            data={data?.organizations || []}
            onDelete={handleDelete}
          />

          {/* Pagination */}
          {data?.pages && data.pages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-border-medium pt-4">
              <div className="text-sm text-text-secondary">
                Showing page {page} of {data.pages}
              </div>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-4 py-2 text-sm rounded-lg border border-border-medium hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  disabled={page === data.pages}
                  onClick={() => setPage(p => Math.min(data.pages, p + 1))}
                  className="px-4 py-2 text-sm rounded-lg border border-border-medium hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <CreateOrgModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
