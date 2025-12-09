import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import OrganizationDetail from './OrganizationDetail';
import { useLocalize } from '~/hooks';

export default function OrganizationDetailPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const localize = useLocalize();

  if (!orgId) {
    return (
      <div className="p-6">
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-red-500 border border-red-200 dark:border-red-800">
          {localize('com_admin_org_id_not_found')}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/d/admin/organizations')}
        className="flex items-center text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {localize('com_admin_back_to_organizations')}
      </button>
      <OrganizationDetail orgId={orgId} />
    </div>
  );
}
