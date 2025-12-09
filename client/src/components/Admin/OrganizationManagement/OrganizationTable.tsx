import { useNavigate } from 'react-router-dom';
import { Eye, Trash2, Calendar, Users, Building } from 'lucide-react';
import { TOrganization } from '~/data-provider/Admin/organizations';
import { useLocalize } from '~/hooks';

interface OrganizationTableProps {
  data: TOrganization[];
  onDelete: (id: string) => void;
}

export default function OrganizationTable({ data, onDelete }: OrganizationTableProps) {
  const navigate = useNavigate();
  const localize = useLocalize();

  const handleRowClick = (orgId: string) => {
    navigate(`/d/admin/organizations/${orgId}`);
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-border-medium bg-surface-primary shadow-sm">
      <table className="min-w-full divide-y divide-border-light">
        <thead className="bg-surface-secondary">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
              {localize('com_admin_organization')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
              {localize('com_admin_code')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
              {localize('com_admin_users')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
              {localize('com_admin_created_at')}
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-secondary">
              {localize('com_admin_actions')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-light bg-surface-primary">
          {data.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center py-12 text-text-secondary">
                <Building className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">{localize('com_admin_no_organizations')}</p>
              </td>
            </tr>
          ) : (
            data.map((org) => (
              <tr
                key={org._id}
                onClick={() => handleRowClick(org._id)}
                className="hover:bg-surface-hover/50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                      <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="font-medium text-text-primary text-sm">{org.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-text-secondary text-sm">
                  <code className="inline-flex items-center rounded-md bg-surface-secondary px-2 py-1 text-xs font-mono text-text-secondary ring-1 ring-inset ring-border-medium/50">
                    {org.code}
                  </code>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className="inline-flex items-center gap-1.5 text-text-secondary">
                    <Users className="h-4 w-4" />
                    {org.userCount || 0}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-text-secondary text-sm">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(org.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(org._id);
                      }}
                      className="p-2 rounded-lg hover:bg-surface-secondary text-text-secondary hover:text-text-primary transition-colors"
                      title={localize('com_admin_view_details')}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(org._id);
                      }}
                      className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                      title={localize('com_admin_delete_organization')}
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
