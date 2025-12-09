import { useState } from 'react';
import { Plus, Search, Loader2, ArrowLeft } from 'lucide-react';
import { useGetOrganizationsQuery, useDeleteOrganizationMutation } from '~/data-provider/Admin/organizations';
import OrganizationTable from './OrganizationTable';
import CreateOrgModal from './CreateOrgModal';
import OrganizationDetail from './OrganizationDetail'; // We'll create this next
import { useDebounce } from '~/hooks';

export default function OrganizationManagement() {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

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
            } catch (error) {
                alert('Failed to delete organization. Ensure it has no users.');
            }
        }
    };

    if (selectedOrgId) {
        return (
            <div className="p-6">
                <button
                    onClick={() => setSelectedOrgId(null)}
                    className="mb-4 flex items-center text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Organizations
                </button>
                <OrganizationDetail orgId={selectedOrgId} />
            </div>
        )
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Organization Management</h1>
                    <p className="text-sm text-text-secondary mt-1">
                        Manage tenant organizations, assign admins, and view consolidated statistics.
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center justify-center rounded-lg bg-text-primary px-4 py-2 text-sm font-medium text-surface-primary shadow-sm hover:opacity-90 transition-opacity"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    New Organization
                </button>
            </div>

            {/* Filters */}
            <div className="mb-6 flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="h-4 w-4 text-text-tertiary" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search organizations..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="block w-full rounded-lg border border-border-medium bg-surface-primary pl-10 pr-3 py-2 text-sm text-text-primary placeholder-text-tertiary focus:border-border-heavy focus:ring-1 focus:ring-border-heavy"
                    />
                </div>
            </div>

            {/* Content */}
            {isError ? (
                <div className="rounded-lg bg-red-50 p-4 text-red-500 border border-red-200">
                    Error loading organizations. Check console for details.
                </div>
            ) : isLoading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-text-secondary" />
                </div>
            ) : (
                <>
                    <OrganizationTable
                        data={data?.organizations || []}
                        onView={(id) => setSelectedOrgId(id)}
                        onDelete={handleDelete}
                    />

                    {/* Pagination could go here */}
                    {data?.pages && data.pages > 1 && (
                        <div className="mt-4 flex justify-center gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="px-3 py-1 rounded border border-border-medium disabled:opacity-50"
                            >
                                Prev
                            </button>
                            <span className="px-3 py-1 text-sm text-text-secondary">
                                Page {page} of {data.pages}
                            </span>
                            <button
                                disabled={page === data.pages}
                                onClick={() => setPage(p => Math.min(data.pages, p + 1))}
                                className="px-3 py-1 rounded border border-border-medium disabled:opacity-50"
                            >
                                Next
                            </button>
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
