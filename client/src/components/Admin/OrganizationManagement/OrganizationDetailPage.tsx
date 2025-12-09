import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import OrganizationDetail from './OrganizationDetail';

export default function OrganizationDetailPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();

  if (!orgId) {
    return (
      <div className="p-6">
        <div className="rounded-lg bg-red-50 p-4 text-red-500 border border-red-200">
          Organization ID not found in URL.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <button
        onClick={() => navigate('/d/admin/organizations')}
        className="mb-6 flex items-center text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Organizations
      </button>
      <OrganizationDetail orgId={orgId} />
    </div>
  );
}
