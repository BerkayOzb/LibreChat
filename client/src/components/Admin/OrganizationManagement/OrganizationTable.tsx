import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Eye, Trash2, Calendar, Users, Building, UserPlus } from 'lucide-react';
import { TOrganization } from '~/data-provider/Admin/organizations';
import AddMemberToOrgModal from './AddMemberToOrgModal';
import { useLocalize } from '~/hooks';

interface OrganizationTableProps {
  data: TOrganization[];
  onDelete: (id: string) => void;
}

export default function OrganizationTable({ data, onDelete }: OrganizationTableProps) {
  const navigate = useNavigate();
  const localize = useLocalize();
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [selectedOrgForAdd, setSelectedOrgForAdd] = useState<{ id: string, name: string } | null>(null);

  const handleRowClick = (orgId: string) => {
    navigate(`/d/admin/organizations/${orgId}`);
  };

  const handleAddMember = (e: React.MouseEvent, org: TOrganization) => {
    e.stopPropagation();
    setSelectedOrgForAdd({ id: org._id, name: org.name });
    setAddMemberModalOpen(true);
  };

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-[var(--admin-border-subtle)] bg-[var(--admin-bg-surface)] shadow-sm">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                {localize('com_admin_organization')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                {localize('com_admin_code')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                {localize('com_admin_users')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                {localize('com_admin_created_at')}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                {localize('com_admin_actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 admin-text-secondary">
                  <Building className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">{localize('com_admin_no_organizations')}</p>
                </td>
              </tr>
            ) : (
              data.map((org) => (
                <tr
                  key={org._id}
                  onClick={() => handleRowClick(org._id)}
                  className="hover:bg-[var(--admin-row-hover)] cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg admin-info-bg flex items-center justify-center">
                        <Building className="h-5 w-5 admin-info" />
                      </div>
                      <span className="font-medium admin-text-primary text-sm">{org.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap admin-text-secondary text-sm">
                    <code className="inline-flex items-center rounded-md bg-[var(--admin-bg-elevated)] px-2 py-1 text-xs font-mono admin-text-secondary ring-1 ring-inset ring-[var(--admin-border-muted)]">
                      {org.code}
                    </code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="inline-flex items-center gap-1.5 admin-text-secondary">
                      <Users className="h-4 w-4" />
                      {org.userCount || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap admin-text-secondary text-sm">
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
                        className="p-2 rounded-lg hover:bg-[var(--admin-bg-elevated)] admin-text-secondary hover:admin-text-primary transition-colors"
                        title={localize('com_admin_view_details')}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => handleAddMember(e, org)}
                        className="p-2 rounded-lg hover:bg-[var(--admin-bg-elevated)] admin-text-secondary hover:admin-text-primary transition-colors"
                        title={localize('com_admin_add_member') || localize('com_ui_add_member')}
                      >
                        <UserPlus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(org._id);
                        }}
                        className="p-2 rounded-lg admin-danger-bg hover:opacity-80 admin-danger transition-colors"
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
      {selectedOrgForAdd && (
        <AddMemberToOrgModal
          isOpen={addMemberModalOpen}
          onClose={() => {
            setAddMemberModalOpen(false);
            setSelectedOrgForAdd(null);
          }}
          organizationId={selectedOrgForAdd.id}
          organizationName={selectedOrgForAdd.name}
        />
      )}
    </>
  );
}
