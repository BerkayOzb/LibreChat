import { Navigate } from 'react-router-dom';
import {
  PromptsView,
  PromptForm,
  CreatePromptForm,
  EmptyPromptPreview,
} from '~/components/Prompts';
import AdminRoute from '~/components/Admin/AdminRoute';
import AdminDashboard from '~/components/Admin/AdminDashboard';
import UserManagement from '~/components/Admin/UserManagement';
import AdminStats from '~/components/Admin/AdminStats';
import EndpointManagement from '~/components/Admin/EndpointManagement';
import ApiKeyManagement from '~/components/Admin/ApiKeyManagement';
import ModelControlPanel from '~/components/Admin/ModelControlPanel';
import ProviderOrderingPanel from '~/components/Admin/ProviderOrderingPanel';
import ToolManagement from '~/components/Admin/ToolManagement';
import OrganizationManagement from '~/components/Admin/OrganizationManagement';
import OrganizationDetailPage from '~/components/Admin/OrganizationManagement/OrganizationDetailPage';
import DashboardRoute from './Layouts/Dashboard';

const dashboardRoutes = {
  path: 'd/*',
  element: <DashboardRoute />,
  children: [
    /*
    {
      element: <FileDashboardView />,
      children: [
        {
          index: true,
          element: <EmptyVectorStorePreview />,
        },
        {
          path: ':vectorStoreId',
          element: <DataTableFilePreview />,
        },
      ],
    },
    {
      path: 'files/*',
      element: <FilesListView />,
      children: [
        {
          index: true,
          element: <EmptyFilePreview />,
        },
        {
          path: ':fileId',
          element: <FilePreview />,
        },
      ],
    },
    {
      path: 'vector-stores/*',
      element: <VectorStoreView />,
      children: [
        {
          index: true,
          element: <EmptyVectorStorePreview />,
        },
        {
          path: ':vectorStoreId',
          element: <VectorStorePreview />,
        },
      ],
    },
    */
    {
      path: 'prompts/*',
      element: <PromptsView />,
      children: [
        {
          index: true,
          element: <EmptyPromptPreview />,
        },
        {
          path: 'new',
          element: <CreatePromptForm />,
        },
        {
          path: ':promptId',
          element: <PromptForm />,
        },
      ],
    },
    {
      path: 'admin/*',
      element: <AdminRoute />,
      children: [
        {
          index: true,
          element: <AdminDashboard />,
        },
        {
          path: 'users',
          element: <UserManagement />,
        },
        {
          path: 'stats',
          element: <AdminStats />,
        },
        {
          path: 'endpoints',
          element: <EndpointManagement />,
        },
        {
          path: 'api-keys',
          element: <ApiKeyManagement />,
        },
        {
          path: 'models',
          element: <ModelControlPanel />,
        },
        {
          path: 'provider-ordering',
          element: <ProviderOrderingPanel />,
        },
        {
          path: 'tools',
          element: <ToolManagement />,
        },
        {
          path: 'organizations',
          element: <OrganizationManagement />,
        },
        {
          path: 'organizations/:orgId',
          element: <OrganizationDetailPage />,
        },
      ],
    },
    {
      path: '*',
      element: <Navigate to="/d/files" replace={true} />,
    },
  ],
};

export default dashboardRoutes;
