import { Eye, Trash2, Calendar } from 'lucide-react';
import { TOrganization } from '~/data-provider/Admin/organizations';
import { useLocalize } from '~/hooks';

interface OrganizationTableProps {
    data: TOrganization[];
    onView: (id: string) => void;
    onDelete: (id: string) => void;
}

export default function OrganizationTable({ data, onView, onDelete }: OrganizationTableProps) {
    const localize = useLocalize();

    return (
        <div className="overflow-x-auto rounded-lg border border-border-medium bg-surface-primary shadow-sm">
            <table className="min-w-full divide-y divide-border-light">
                <thead className="bg-surface-secondary">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">Users</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">Created At</th>
                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-secondary">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border-light bg-surface-primary">
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="text-center py-8 text-text-secondary">
                                No organizations found.
                            </td>
                        </tr>
                    ) : (
                        data.map((org) => (
                            <tr key={org._id} className="hover:bg-surface-hover/50">
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-text-primary text-sm">{org.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-text-secondary text-sm">
                                    <span className="inline-flex items-center rounded-md bg-surface-secondary px-2 py-1 text-xs font-medium text-text-secondary ring-1 ring-inset ring-border-medium/50">
                                        {org.code}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-text-secondary text-sm">{org.userCount || 0}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-text-secondary text-sm">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(org.createdAt).toLocaleDateString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => onView(org._id)}
                                            className="p-1 rounded hover:bg-surface-secondary text-text-secondary hover:text-text-primary transition-colors"
                                            title="View Details"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => onDelete(org._id)}
                                            className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                                            title="Delete Organization"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
