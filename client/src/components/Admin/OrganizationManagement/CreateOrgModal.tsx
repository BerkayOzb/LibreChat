import { useState } from 'react';
import {
    Building2,
    X,
    Loader2,
    AlertTriangle,
    Code2
} from 'lucide-react';
import { useCreateOrganizationMutation, type TCreateOrgRequest } from '~/data-provider/Admin/organizations';
import { useLocalize } from '~/hooks';

interface CreateOrgModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function CreateOrgModal({
    isOpen,
    onClose,
    onSuccess
}: CreateOrgModalProps) {
    const localize = useLocalize();
    const createOrgMutation = useCreateOrganizationMutation();

    const [formData, setFormData] = useState<TCreateOrgRequest>({
        name: '',
        code: ''
    });

    const [error, setError] = useState<string>('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.name || !formData.code) {
            setError('Name and Code are required');
            return;
        }

        try {
            await createOrgMutation.mutateAsync(formData);
            if (onSuccess) onSuccess();
            handleClose();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to create organization');
        }
    };

    const handleClose = () => {
        setFormData({ name: '', code: '' });
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" onClick={handleClose}>
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
                </div>

                <span className="hidden sm:inline-block sm:h-screen sm:align-middle">&#8203;</span>

                <div className="inline-block transform overflow-hidden rounded-lg bg-surface-primary text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle border border-border-medium">
                    <div className="bg-surface-primary px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-surface-secondary sm:mx-0 sm:h-10 sm:w-10">
                                    <Building2 className="h-6 w-6 text-text-primary" />
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-medium leading-6 text-text-primary">
                                        Create Organization
                                    </h3>
                                    <p className="mt-1 text-sm text-text-secondary">
                                        Add a new tenant organization to the system.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="rounded-md text-text-tertiary hover:text-text-primary focus:outline-none"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 rounded-lg bg-surface-destructive/10 p-4 flex">
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                                <div className="ml-3 text-sm text-destructive">{error}</div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary">
                                    Organization Name *
                                </label>
                                <div className="mt-1 relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Building2 className="h-5 w-5 text-text-tertiary" />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="block w-full pl-10 pr-3 py-2 border border-border-medium rounded-md shadow-sm bg-surface-secondary text-text-primary focus:ring-border-heavy focus:border-border-heavy sm:text-sm"
                                        placeholder="Acme Corp"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary">
                                    Organization Code *
                                </label>
                                <div className="mt-1 relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Code2 className="h-5 w-5 text-text-tertiary" />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                        className="block w-full pl-10 pr-3 py-2 border border-border-medium rounded-md shadow-sm bg-surface-secondary text-text-primary focus:ring-border-heavy focus:border-border-heavy sm:text-sm"
                                        placeholder="acme-corp"
                                        required
                                    />
                                </div>
                                <p className="mt-1 text-xs text-text-tertiary">Unique identifier (lowercase, no spaces)</p>
                            </div>
                        </form>
                    </div>

                    <div className="bg-surface-secondary px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-border-light">
                        <button
                            onClick={handleSubmit}
                            disabled={createOrgMutation.isLoading}
                            className="inline-flex w-full justify-center rounded-md border border-transparent bg-text-primary px-4 py-2 text-base font-medium text-surface-primary shadow-sm hover:opacity-90 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            {createOrgMutation.isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Create'}
                        </button>
                        <button
                            onClick={handleClose}
                            className="mt-3 inline-flex w-full justify-center rounded-md border border-border-medium bg-surface-primary px-4 py-2 text-base font-medium text-text-primary shadow-sm hover:bg-surface-hover sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
