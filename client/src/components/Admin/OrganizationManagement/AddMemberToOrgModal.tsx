import React, { useState, useMemo } from 'react';
import { useLocalize } from '~/hooks';
import { useToastContext, OGDialog, OGDialogTemplate, Button, Input } from '@librechat/client';
import {
    useOrgUsersQuery,
} from '~/data-provider/Admin/organization-management';
import { useAddUserToOrganizationMutation } from '~/data-provider/Admin/organizations';
import { Search, UserPlus, Loader2, User as UserIcon } from 'lucide-react';
import { cn } from '~/utils/';

interface AddMemberToOrgModalProps {
    isOpen: boolean;
    onClose: () => void;
    organizationId: string;
    organizationName: string;
}

const AddMemberToOrgModal: React.FC<AddMemberToOrgModalProps> = ({
    isOpen,
    onClose,
    organizationId,
    organizationName,
}) => {
    const localize = useLocalize();
    const { showToast } = useToastContext();
    const [search, setSearch] = useState('');

    // Debounce search logic or just rely on react-query caching and fast inputs?
    // Ideally debounce. For now, let's pass search directly but only query if length >= 2
    const shouldSearch = search.length >= 2;

    const { data: usersData, isLoading: isLoadingUsers } = useOrgUsersQuery(
        { page: 1, limit: 10, search },
        { enabled: isOpen && shouldSearch }
    );

    const addUserMutation = useAddUserToOrganizationMutation();

    const handleAddUser = (userId: string, userName: string) => {
        addUserMutation.mutate(
            { organizationId, userId },
            {
                onSuccess: () => {
                    showToast({
                        message: localize('com_admin_user_added_to_org_success', { name: userName }),
                        status: 'success',
                    });
                    // Optional: clear search or close modal?
                    // Keeping modal open allows adding multiple users
                },
                onError: (error: any) => {
                    const apiMessage = error?.response?.data?.message || error?.message || '';
                    showToast({
                        message: apiMessage || localize('com_admin_error_adding_user'),
                        status: 'error',
                    });
                },
            }
        );
    };

    const isLoading = isLoadingUsers;

    return (
        <OGDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <OGDialogTemplate
                title={`${localize('com_admin_add_member_to')} ${organizationName}`}
                showCloseButton={true}
                className="max-w-xl"
                main={
                    <div className="py-4">
                        <label htmlFor="user-search" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {localize('com_search_users')}
                        </label>
                        <div className="relative mt-2">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="user-search"
                                placeholder={localize('com_admin_search_users_placeholder') || "Search by name or email (min 2 chars)"}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-8"
                                autoComplete="off"
                            />
                        </div>

                        <div className="mt-4 max-h-[300px] overflow-y-auto border rounded-md">
                            {!shouldSearch && (
                                <div className="p-4 text-center text-muted-foreground text-sm">
                                    {localize('com_admin_type_to_search') || "Type at least 2 characters to search users..."}
                                </div>
                            )}

                            {shouldSearch && isLoading && (
                                <div className="p-4 flex justify-center items-center">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            )}

                            {shouldSearch && !isLoading && usersData?.users?.length === 0 && (
                                <div className="p-4 text-center text-muted-foreground text-sm">
                                    {localize('com_ui_no_users_found') || "No users found"}
                                </div>
                            )}

                            {shouldSearch && !isLoading && usersData?.users && usersData.users.length > 0 && (
                                <div className="divide-y">
                                    {usersData.users.map((user) => (
                                        <div key={user._id} className="flex items-center justify-between p-3 hover:bg-muted/50">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <UserIcon className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-sm">{user.name || user.username}</div>
                                                    <div className="text-xs text-muted-foreground">{user.email}</div>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleAddUser(user._id, user.name || user.username || user.email)}
                                                disabled={addUserMutation.isLoading}
                                                className="gap-2"
                                            >
                                                <UserPlus className="h-4 w-4" />
                                                {localize('com_ui_add')}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                }
                buttons={
                    <Button variant="outline" onClick={onClose}>
                        {localize('com_ui_close')}
                    </Button>
                }
            />
        </OGDialog>
    );
};

export default AddMemberToOrgModal;
