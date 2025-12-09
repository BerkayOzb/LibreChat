import { useState } from 'react';
import { useGetOrganizationByIdQuery, useGetOrganizationUsersQuery } from '~/data-provider/Admin/organizations';
import { Loader2, Users, Building, Shield, UserPlus } from 'lucide-react';
import AssignAdminModal from './AssignAdminModal';

export default function OrganizationDetail({ orgId }: { orgId: string }) {
    const { data: org, isLoading } = useGetOrganizationByIdQuery(orgId);
    const userQuery = useGetOrganizationUsersQuery(orgId, { limit: 100 });
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-text-secondary" />
            </div>
        )
    }

    if (!org) return <div>Organization not found</div>;

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <div className="rounded-lg border border-border-medium bg-surface-primary p-6 shadow-sm">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                            <Building className="h-5 w-5" />
                            {org.name}
                        </h2>
                        <p className="text-sm text-text-secondary mt-1">Code: <span className="font-mono bg-surface-secondary px-1 rounded">{org.code}</span></p>
                        <p className="text-xs text-text-tertiary mt-2">Created: {new Date(org.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-center bg-surface-secondary p-3 rounded-lg min-w-[100px]">
                        <div className="text-2xl font-bold text-text-primary">{org.userCount}</div>
                        <div className="text-xs text-text-secondary uppercase tracking-wider font-semibold">Users</div>
                    </div>
                </div>
            </div>

            {/* Admins Section */}
            <div className="rounded-lg border border-border-medium bg-surface-primary p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-text-primary flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-500" />
                        Organization Admins
                    </h3>
                    <button
                        onClick={() => setIsAssignModalOpen(true)}
                        className="text-sm text-blue-500 hover:underline flex items-center gap-1"
                    >
                        <UserPlus className="h-4 w-4" /> Assign New
                    </button>
                </div>

                {org.admins && org.admins.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {org.admins.map(admin => (
                            <div key={admin._id} className="flex items-center gap-3 p-3 rounded border border-border-medium bg-surface-secondary/50">
                                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold">
                                    {admin.name.charAt(0)}
                                </div>
                                <div className="overflow-hidden">
                                    <div className="font-medium text-sm text-text-primary truncate">{admin.name}</div>
                                    <div className="text-xs text-text-secondary truncate">{admin.email}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-text-secondary italic">No admins assigned yet.</p>
                )}
            </div>

            {/* Users List */}
            <div className="rounded-lg border border-border-medium bg-surface-primary p-6 shadow-sm">
                <h3 className="text-lg font-medium text-text-primary mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5 text-text-secondary" />
                    All Users
                </h3>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-text-secondary uppercase bg-surface-secondary">
                            <tr>
                                <th className="px-4 py-2">Name</th>
                                <th className="px-4 py-2">Email</th>
                                <th className="px-4 py-2">Role</th>
                            </tr>
                        </thead>
                        <tbody>
                            {userQuery.data?.users?.map((user: any) => (
                                <tr key={user._id} className="border-b border-border-medium last:border-0 hover:bg-surface-hover/50">
                                    <td className="px-4 py-2 font-medium text-text-primary">{user.name}</td>
                                    <td className="px-4 py-2 text-text-secondary">{user.email}</td>
                                    <td className="px-4 py-2 text-text-secondary">{user.role}</td>
                                </tr>
                            )) || (
                                    <tr><td colSpan={3} className="px-4 py-4 text-center text-text-tertiary">No users found.</td></tr>
                                )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AssignAdminModal
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                orgId={orgId}
            />
        </div>
    );
}
