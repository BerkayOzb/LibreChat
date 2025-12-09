import { useState } from 'react';
import {
    ShieldCheck,
    X,
    Loader2,
    AlertTriangle,
    UserPlus
} from 'lucide-react';
import { useAssignOrgAdminMutation } from '~/data-provider/Admin/organizations';

interface AssignAdminModalProps {
    isOpen: boolean;
    onClose: () => void;
    orgId: string;
}

export default function AssignAdminModal({
    isOpen,
    onClose,
    orgId
}: AssignAdminModalProps) {
    const assignMutation = useAssignOrgAdminMutation();
    const [userId, setUserId] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) return;

        try {
            await assignMutation.mutateAsync({ organizationId: orgId, userId });
            onClose();
            setUserId('');
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to assign admin');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" onClick={onClose}>
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
                </div>

                <span className="hidden sm:inline-block sm:h-screen sm:align-middle">&#8203;</span>

                <div className="inline-block transform overflow-hidden rounded-lg bg-surface-primary text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:align-middle border border-border-medium">
                    <div className="bg-surface-primary px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <h3 className="text-lg font-medium leading-6 text-text-primary flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-text-primary" />
                            Assign Organization Admin
                        </h3>

                        {error && (
                            <div className="mt-4 rounded bg-surface-destructive/10 p-3 text-sm text-destructive flex gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="mt-4">
                            <label className="block text-sm font-medium text-text-secondary mb-1">
                                User ID
                            </label>
                            <input
                                type="text"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                className="block w-full rounded-md border border-border-medium bg-surface-secondary px-3 py-2 shadow-sm focus:border-border-heavy focus:ring-1 focus:ring-border-heavy sm:text-sm"
                                placeholder="Enter existing User ID (e.g. 64f8...)"
                                required
                            />
                            <p className="text-xs text-text-tertiary mt-2">
                                Tip: You can find the User ID in the User Management list.
                            </p>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-md border border-border-medium bg-surface-primary px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-hover"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={assignMutation.isLoading}
                                    className="rounded-md bg-text-primary px-4 py-2 text-sm font-medium text-surface-primary hover:opacity-90 disabled:opacity-50"
                                >
                                    {assignMutation.isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Assign'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
