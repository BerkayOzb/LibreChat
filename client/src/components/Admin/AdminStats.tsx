import { Link } from 'react-router-dom';
import {
  BarChart3,
  Users,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  Building2,
  Brain,
  Key,
  Settings,
  Wrench,
  ArrowRight,
  Activity,
  UserCheck,
  UserX,
  ShieldAlert,
  UserPlus,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@librechat/client';
import { SystemRoles } from 'librechat-data-provider';
import { useAuthContext, useLocalize } from '~/hooks';
import {
  useAdminStatsQuery,
  useGetAdminModelStats,
  useGetAdminApiKeys,
  useGetEndpointSettings,
  useGetToolSettings,
  useAIModelsUsageQuery,
} from '~/data-provider';
import { useGetOrganizationsQuery } from '~/data-provider/Admin/organizations';
import OrgAdminStats from './OrgAdminStats';

export default function AdminStats() {
  const localize = useLocalize();
  const { user } = useAuthContext();

  // If user is ORG_ADMIN, show organization-specific stats
  if (user?.role === SystemRoles.ORG_ADMIN) {
    return <OrgAdminStats />;
  }

  // Fetch all admin statistics
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useAdminStatsQuery();

  const { data: orgsData, isLoading: orgsLoading } = useGetOrganizationsQuery({
    page: 1,
    limit: 5,
  });

  const { data: modelStats, isLoading: modelsLoading } = useGetAdminModelStats();
  const { data: apiKeysData, isLoading: apiKeysLoading } = useGetAdminApiKeys();
  const { data: endpointData, isLoading: endpointsLoading } = useGetEndpointSettings();
  const { data: toolsData, isLoading: toolsLoading } = useGetToolSettings();
  const { data: aiModelsUsage, isLoading: aiModelsLoading } = useAIModelsUsageQuery({ period: '30d' });

  // Combined loading state
  const isLoading = statsLoading || orgsLoading || modelsLoading || apiKeysLoading || endpointsLoading || toolsLoading || aiModelsLoading;

  // Loading state
  if (isLoading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        <p className="admin-loading-text">
          {localize('com_admin_loading_statistics')}
        </p>
      </div>
    );
  }

  // Error state
  if (statsError) {
    return (
      <div className="admin-alert admin-alert-danger">
        <AlertTriangle className="h-5 w-5" />
        <div>
          <h3 className="admin-alert-title">
            {localize('com_admin_error_loading_statistics')}
          </h3>
          <p className="admin-alert-description">
            {localize('com_admin_error_loading_statistics_description')}
          </p>
          <button
            onClick={() => refetchStats()}
            className="mt-2 text-sm font-medium admin-danger hover:opacity-80"
          >
            {localize('com_admin_try_again')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header Card */}
      <div className="admin-header-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="admin-header-icon">
              <BarChart3 className="h-8 w-8" />
            </div>
            <div>
              <h1 className="admin-header-title">
                {localize('com_admin_statistics_analytics')}
              </h1>
              <p className="admin-header-description mt-1">
                {localize('com_admin_statistics_description')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}
        <div className="admin-stats-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label">
                {localize('com_admin_total_users')}
              </p>
              <p className="stat-value mt-2">
                {stats?.totalUsers?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="stat-icon">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <div className="flex items-center admin-success">
              <TrendingUp className="h-3 w-3" />
              <span className="ml-1 text-xs font-medium">+{stats?.growth?.newUsersToday || 0}</span>
            </div>
            <span className="text-xs admin-text-muted">{localize('com_admin_new_today')}</span>
          </div>
        </div>

        {/* Active Users */}
        <div className="admin-stats-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label">
                {localize('com_admin_active_weekly')}
              </p>
              <p className="stat-value mt-2">
                {stats?.activity?.activeUsersWeek?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="admin-success-bg rounded-lg p-2.5">
              <UserCheck className="h-5 w-5 admin-success" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <Clock className="h-3 w-3 admin-text-muted" />
            <span className="text-xs admin-text-muted">{localize('com_admin_last_7_days')}</span>
          </div>
        </div>

        {/* Conversations Today */}
        <div className="admin-stats-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label">
                {localize('com_admin_conversations_today')}
              </p>
              <p className="stat-value mt-2">
                {stats?.conversations?.today?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="admin-info-bg rounded-lg p-2.5">
              <MessageSquare className="h-5 w-5 admin-info" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="text-xs admin-text-muted">
              {localize('com_admin_total')}: {stats?.totalConversations?.toLocaleString() || '0'}
            </span>
          </div>
        </div>

        {/* Banned Users */}
        <div className="admin-stats-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label">
                {localize('com_admin_banned_users')}
              </p>
              <p className="stat-value mt-2">
                {stats?.overview?.bannedUsers?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="admin-danger-bg rounded-lg p-2.5">
              <ShieldAlert className="h-5 w-5 admin-danger" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <div className={cn(
              'h-2 w-2 rounded-full animate-pulse',
            )} style={{ backgroundColor: stats ? 'var(--admin-success)' : 'var(--admin-danger)' }} />
            <span className="text-xs font-medium admin-text-primary">
              {stats ? localize('com_admin_system_operational') : localize('com_admin_system_issues')}
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Stats Row - System Resources */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
        {/* Organizations */}
        <Link to="/d/admin/organizations" className="admin-stats-card group transition-all hover:scale-[1.02]">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="admin-link-bg rounded-lg p-1.5 sm:p-2 flex-shrink-0">
              <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 admin-link" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-xs admin-text-muted truncate">{localize('com_admin_organizations')}</p>
              <p className="text-base sm:text-lg font-bold admin-text-primary">{orgsData?.total || 0}</p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 admin-text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 hidden sm:block" />
          </div>
        </Link>

        {/* Models */}
        <Link to="/d/admin/models" className="admin-stats-card group transition-all hover:scale-[1.02]">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="admin-link-bg rounded-lg p-1.5 sm:p-2 flex-shrink-0">
              <Brain className="h-3.5 w-3.5 sm:h-4 sm:w-4 admin-link" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-xs admin-text-muted truncate">{localize('com_admin_models')}</p>
              <p className="text-base sm:text-lg font-bold admin-text-primary">
                {modelStats?.stats?.totalEnabled || 0}
                <span className="text-xs sm:text-sm font-normal admin-text-muted">/{modelStats?.stats?.totalModels || 0}</span>
              </p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 admin-text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 hidden sm:block" />
          </div>
        </Link>

        {/* API Keys */}
        <Link to="/d/admin/api-keys" className="admin-stats-card group transition-all hover:scale-[1.02]">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="admin-warning-bg rounded-lg p-1.5 sm:p-2 flex-shrink-0">
              <Key className="h-3.5 w-3.5 sm:h-4 sm:w-4 admin-warning" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-xs admin-text-muted truncate">{localize('com_admin_api_keys')}</p>
              <p className="text-base sm:text-lg font-bold admin-text-primary">
                {apiKeysData?.stats?.active || 0}
                <span className="text-xs sm:text-sm font-normal admin-text-muted">/{apiKeysData?.stats?.total || 0}</span>
              </p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 admin-text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 hidden sm:block" />
          </div>
        </Link>

        {/* Endpoints */}
        <Link to="/d/admin/endpoints" className="admin-stats-card group transition-all hover:scale-[1.02]">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="admin-success-bg rounded-lg p-1.5 sm:p-2 flex-shrink-0">
              <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 admin-success" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-xs admin-text-muted truncate">{localize('com_admin_endpoints')}</p>
              <p className="text-base sm:text-lg font-bold admin-text-primary">
                {endpointData?.stats?.enabled || 0}
                <span className="text-xs sm:text-sm font-normal admin-text-muted">/{endpointData?.stats?.total || 0}</span>
              </p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 admin-text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 hidden sm:block" />
          </div>
        </Link>

        {/* Tools */}
        <Link to="/d/admin/tools" className="admin-stats-card group transition-all hover:scale-[1.02] col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="admin-info-bg rounded-lg p-1.5 sm:p-2 flex-shrink-0">
              <Wrench className="h-3.5 w-3.5 sm:h-4 sm:w-4 admin-info" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-xs admin-text-muted truncate">{localize('com_admin_tools')}</p>
              <p className="text-base sm:text-lg font-bold admin-text-primary">
                {toolsData?.stats?.enabled || 0}
                <span className="text-xs sm:text-sm font-normal admin-text-muted">/{toolsData?.stats?.total || 0}</span>
              </p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 admin-text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 hidden sm:block" />
          </div>
        </Link>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Growth Analytics */}
        <div className="admin-card">
          <div className="admin-card-body">
            <div className="flex items-center gap-3 mb-6">
              <div className="admin-success-bg p-2.5 rounded-lg">
                <UserPlus className="h-5 w-5 admin-success" />
              </div>
              <div>
                <h2 className="text-lg font-semibold admin-text-primary">
                  {localize('com_admin_growth_analytics')}
                </h2>
                <p className="text-sm admin-text-secondary">
                  {localize('com_admin_user_registration_stats')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="admin-inner-stat flex-col !items-start">
                <p className="admin-inner-stat-label">{localize('com_admin_today')}</p>
                <p className="admin-inner-stat-value mt-2 admin-success">
                  +{stats?.growth?.newUsersToday || 0}
                </p>
              </div>
              <div className="admin-inner-stat flex-col !items-start">
                <p className="admin-inner-stat-label">{localize('com_admin_this_week')}</p>
                <p className="admin-inner-stat-value mt-2 admin-success">
                  +{stats?.growth?.newUsersWeek || 0}
                </p>
              </div>
              <div className="admin-inner-stat flex-col !items-start">
                <p className="admin-inner-stat-label">{localize('com_admin_this_month')}</p>
                <p className="admin-inner-stat-value mt-2 admin-success">
                  +{stats?.growth?.newUsersMonth || 0}
                </p>
              </div>
            </div>

            {/* Activity Stats */}
            <div className="mt-6 pt-6 border-t border-[var(--admin-border-subtle)]">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-4 w-4 admin-link" />
                <span className="text-sm font-medium admin-text-primary">{localize('com_admin_activity_stats')}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="admin-inner-stat">
                  <span className="admin-inner-stat-label">{localize('com_admin_today_active')}</span>
                  <span className="admin-inner-stat-value admin-link">{stats?.activity?.activeUsersToday || 0}</span>
                </div>
                <div className="admin-inner-stat">
                  <span className="admin-inner-stat-label">{localize('com_admin_last_7_days')}</span>
                  <span className="admin-inner-stat-value admin-link">{stats?.activity?.activeUsersWeek || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Organizations Overview */}
        <div className="admin-card">
          <div className="admin-card-header flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="admin-card-title flex items-center gap-2">
              <Building2 className="h-5 w-5 admin-text-secondary flex-shrink-0" />
              <span className="truncate">{localize('com_admin_organizations')}</span>
            </h3>
            <Link
              to="/d/admin/organizations"
              className="text-sm admin-link hover:opacity-80 flex items-center gap-1 flex-shrink-0"
            >
              {localize('com_admin_view_all')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-[var(--admin-border-subtle)]">
            {orgsData?.organizations && orgsData.organizations.length > 0 ? (
              orgsData.organizations.slice(0, 5).map((org) => (
                <Link
                  key={org._id}
                  to={`/d/admin/organizations/${org._id}`}
                  className="flex items-center justify-between gap-3 p-3 sm:p-4 hover:bg-[var(--admin-row-hover)] transition-colors"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium text-xs sm:text-sm shadow-sm flex-shrink-0">
                      {org.name?.charAt(0).toUpperCase() || 'O'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium admin-text-primary text-sm truncate">{org.name}</div>
                      <div className="text-xs admin-text-muted truncate">
                        {localize('com_admin_code')}: {org.code}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="admin-badge admin-badge-neutral text-xs whitespace-nowrap">
                      {org.userCount || 0} <span className="hidden sm:inline">{localize('com_admin_users')}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 admin-text-muted hidden sm:block" />
                  </div>
                </Link>
              ))
            ) : (
              <div className="admin-empty-state py-6 sm:py-8">
                <div className="admin-empty-state-icon">
                  <Building2 />
                </div>
                <p className="admin-empty-state-description text-sm">{localize('com_admin_no_organizations')}</p>
                <Link to="/d/admin/organizations" className="mt-3 admin-btn-primary text-sm inline-flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {localize('com_admin_create_organization')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conversation Metrics & Organization Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Conversation Metrics */}
        <div className="admin-card">
          <div className="admin-card-body">
            <div className="flex items-center gap-3 mb-6">
              <div className="admin-info-bg p-2.5 rounded-lg">
                <MessageSquare className="h-5 w-5 admin-info" />
              </div>
              <div>
                <h2 className="text-lg font-semibold admin-text-primary">
                  {localize('com_admin_conversation_metrics')}
                </h2>
                <p className="text-sm admin-text-secondary">
                  {localize('com_admin_conversation_activity')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="admin-inner-stat flex-col !items-start">
                <p className="admin-inner-stat-label">{localize('com_admin_today')}</p>
                <p className="admin-inner-stat-value mt-2 admin-info">
                  {stats?.conversations?.today?.toLocaleString() || 0}
                </p>
              </div>
              <div className="admin-inner-stat flex-col !items-start">
                <p className="admin-inner-stat-label">{localize('com_admin_this_week')}</p>
                <p className="admin-inner-stat-value mt-2 admin-info">
                  {stats?.conversations?.thisWeek?.toLocaleString() || 0}
                </p>
              </div>
              <div className="admin-inner-stat flex-col !items-start">
                <p className="admin-inner-stat-label">{localize('com_admin_this_month')}</p>
                <p className="admin-inner-stat-value mt-2 admin-info">
                  {stats?.conversations?.thisMonth?.toLocaleString() || 0}
                </p>
              </div>
            </div>

            {/* Total Conversations Summary */}
            <div className="mt-6 pt-6 border-t border-[var(--admin-border-subtle)]">
              <div className="admin-inner-stat">
                <span className="admin-inner-stat-label">{localize('com_admin_total_conversations')}</span>
                <span className="admin-inner-stat-value">{stats?.conversations?.total?.toLocaleString() || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Organization Conversation Breakdown */}
        <div className="admin-card">
          <div className="admin-card-header flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="admin-card-title flex items-center gap-2">
              <Building2 className="h-5 w-5 admin-text-secondary flex-shrink-0" />
              <span className="truncate">{localize('com_admin_org_conversation_breakdown')}</span>
            </h3>
          </div>
          <div className="divide-y divide-[var(--admin-border-subtle)]">
            {stats?.organizationConversationStats && stats.organizationConversationStats.length > 0 ? (
              stats.organizationConversationStats.slice(0, 5).map((org) => {
                const maxConversations = stats.organizationConversationStats[0]?.totalConversations || 1;
                const percentage = maxConversations > 0 ? (org.totalConversations / maxConversations) * 100 : 0;
                return (
                  <div
                    key={org.organizationId}
                    className="p-3 sm:p-4 hover:bg-[var(--admin-row-hover)] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium text-xs sm:text-sm shadow-sm flex-shrink-0">
                          {org.organizationName?.charAt(0).toUpperCase() || 'O'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium admin-text-primary text-sm truncate">{org.organizationName}</div>
                          <div className="text-xs admin-text-muted">
                            {org.userCount} {localize('com_admin_users')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 text-right">
                        <div>
                          <div className="font-semibold admin-text-primary text-sm">
                            {org.totalConversations.toLocaleString()}
                          </div>
                          <div className="text-xs admin-text-muted">{localize('com_admin_total')}</div>
                        </div>
                        <div className="hidden sm:block">
                          <div className="font-medium admin-info text-sm">
                            {org.conversationsToday}
                          </div>
                          <div className="text-xs admin-text-muted">{localize('com_admin_today')}</div>
                        </div>
                        <div className="hidden md:block">
                          <div className="font-medium admin-text-secondary text-sm">
                            {org.conversationsThisWeek}
                          </div>
                          <div className="text-xs admin-text-muted">{localize('com_admin_this_week')}</div>
                        </div>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-1.5 rounded-full bg-[var(--admin-bg-elevated)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: 'var(--admin-info)',
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="admin-empty-state py-6 sm:py-8">
                <div className="admin-empty-state-icon">
                  <Building2 />
                </div>
                <p className="admin-empty-state-description text-sm">{localize('com_admin_no_org_conversation_data')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Model Stats by Endpoint */}
      {modelStats?.stats?.endpointStats && modelStats.stats.endpointStats.length > 0 && (
        <div className="admin-card">
          <div className="admin-card-header flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="admin-card-title flex items-center gap-2">
              <Brain className="h-5 w-5 admin-text-secondary flex-shrink-0" />
              <span className="truncate">{localize('com_admin_model_stats_by_endpoint')}</span>
            </h3>
            <Link
              to="/d/admin/models"
              className="text-sm admin-link hover:opacity-80 flex items-center gap-1 flex-shrink-0"
            >
              {localize('com_admin_manage_models')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="admin-card-body">
            <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {modelStats.stats.endpointStats.map((endpoint) => (
                <div key={endpoint.endpoint} className="admin-inner-stat flex-col !items-start gap-2 sm:gap-3">
                  <div className="flex items-center justify-between w-full gap-2">
                    <span className="font-medium admin-text-primary text-xs sm:text-sm truncate">{endpoint.endpoint}</span>
                    <span className="text-xs admin-text-muted flex-shrink-0">
                      {endpoint.enabledModels}/{endpoint.totalModels}
                    </span>
                  </div>
                  <div className="w-full h-1.5 sm:h-2 rounded-full bg-[var(--admin-bg-elevated)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${endpoint.totalModels > 0 ? (endpoint.enabledModels / endpoint.totalModels) * 100 : 0}%`,
                        backgroundColor: 'var(--admin-success)',
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs flex-wrap">
                    <span className="flex items-center gap-1 admin-success">
                      <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      {endpoint.enabledModels} <span className="hidden sm:inline">{localize('com_admin_enabled')}</span>
                    </span>
                    <span className="flex items-center gap-1 admin-danger">
                      <XCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      {endpoint.disabledModels} <span className="hidden sm:inline">{localize('com_admin_disabled')}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Models Usage Statistics */}
      {aiModelsUsage?.modelStats && aiModelsUsage.modelStats.length > 0 && (
        <div className="admin-card">
          <div className="admin-card-header flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="admin-card-title flex items-center gap-2">
              <Brain className="h-5 w-5 admin-text-secondary flex-shrink-0" />
              <span className="truncate">{localize('com_admin_ai_models_usage')}</span>
            </h3>
            <div className="flex items-center gap-2 text-xs admin-text-muted">
              <span>{localize('com_admin_last_30_days')}</span>
            </div>
          </div>
          <div className="admin-card-body">
            {/* Totals Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="admin-inner-stat flex-col !items-start">
                <p className="admin-inner-stat-label">{localize('com_admin_total_conversations')}</p>
                <p className="admin-inner-stat-value mt-1" style={{ color: 'var(--admin-info)' }}>
                  {aiModelsUsage.totals.totalConversations.toLocaleString()}
                </p>
              </div>
              <div className="admin-inner-stat flex-col !items-start">
                <p className="admin-inner-stat-label">{localize('com_admin_conversations_today')}</p>
                <p className="admin-inner-stat-value mt-1" style={{ color: 'var(--admin-success)' }}>
                  {aiModelsUsage.totals.conversationsToday.toLocaleString()}
                </p>
              </div>
              <div className="admin-inner-stat flex-col !items-start">
                <p className="admin-inner-stat-label">{localize('com_admin_total_tokens')}</p>
                <p className="admin-inner-stat-value mt-1 admin-text-primary">
                  {aiModelsUsage.totals.totalTokens.toLocaleString()}
                </p>
              </div>
              <div className="admin-inner-stat flex-col !items-start">
                <p className="admin-inner-stat-label">{localize('com_admin_models_used')}</p>
                <p className="admin-inner-stat-value mt-1 admin-text-primary">
                  {aiModelsUsage.modelStats.length}
                </p>
              </div>
            </div>

            {/* Model Breakdown */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium admin-text-primary">
                {localize('com_admin_model_breakdown')}
              </h4>
              <div className="divide-y divide-[var(--admin-border-subtle)]">
                {aiModelsUsage.modelStats.slice(0, 10).map((model, index) => {
                  const maxConversations = aiModelsUsage.modelStats[0]?.totalConversations || 1;
                  const percentage = maxConversations > 0 ? (model.totalConversations / maxConversations) * 100 : 0;
                  // Extract display name from model ID (e.g., "anthropic/claude-3-opus" -> "claude-3-opus")
                  const displayName = model.model.includes('/')
                    ? model.model.split('/').pop()
                    : model.model;
                  return (
                    <div
                      key={model.model}
                      className="py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="flex-shrink-0 w-5 h-5 rounded bg-[var(--admin-bg-elevated)] flex items-center justify-center text-xs font-medium admin-text-muted">
                            {index + 1}
                          </span>
                          <span className="font-medium admin-text-primary text-sm truncate" title={model.model}>
                            {displayName}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 text-right">
                          <div>
                            <div className="font-semibold admin-text-primary text-sm">
                              {model.totalConversations.toLocaleString()}
                            </div>
                            <div className="text-xs admin-text-muted">{localize('com_admin_conversations')}</div>
                          </div>
                          <div className="hidden sm:block">
                            <div className="font-medium text-sm" style={{ color: 'var(--admin-info)' }}>
                              {model.conversationsToday}
                            </div>
                            <div className="text-xs admin-text-muted">{localize('com_admin_today')}</div>
                          </div>
                          <div className="hidden md:block">
                            <div className="font-medium admin-text-secondary text-sm">
                              {model.uniqueUserCount}
                            </div>
                            <div className="text-xs admin-text-muted">{localize('com_admin_users')}</div>
                          </div>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full h-1.5 rounded-full bg-[var(--admin-bg-elevated)] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: 'var(--admin-info)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Health Grid */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* API Keys Status */}
        <div className="admin-card flex flex-col">
          <div className="admin-card-body flex-1 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="admin-warning-bg p-2 rounded-lg flex-shrink-0">
                <Key className="h-4 w-4 admin-warning" />
              </div>
              <h3 className="font-semibold admin-text-primary">{localize('com_admin_api_keys')}</h3>
            </div>
            <div className="space-y-3 flex-1">
              <div className="admin-inner-stat">
                <span className="admin-inner-stat-label">{localize('com_admin_active')}</span>
                <span className="admin-inner-stat-value admin-success">{apiKeysData?.stats?.active || 0}</span>
              </div>
              <div className="admin-inner-stat">
                <span className="admin-inner-stat-label">{localize('com_admin_inactive')}</span>
                <span className="admin-inner-stat-value admin-danger">{apiKeysData?.stats?.inactive || 0}</span>
              </div>
              <div className="admin-inner-stat">
                <span className="admin-inner-stat-label">{localize('com_admin_total')}</span>
                <span className="admin-inner-stat-value">{apiKeysData?.stats?.total || 0}</span>
              </div>
            </div>
            <Link
              to="/d/admin/api-keys"
              className="mt-4 admin-btn-secondary w-full text-sm inline-flex items-center justify-center gap-2"
            >
              <Key className="h-3.5 w-3.5" />
              {localize('com_admin_manage_api_keys')}
            </Link>
          </div>
        </div>

        {/* Endpoints Status */}
        <div className="admin-card flex flex-col">
          <div className="admin-card-body flex-1 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="admin-success-bg p-2 rounded-lg flex-shrink-0">
                <Settings className="h-4 w-4 admin-success" />
              </div>
              <h3 className="font-semibold admin-text-primary">{localize('com_admin_endpoints')}</h3>
            </div>
            <div className="space-y-3 flex-1">
              <div className="admin-inner-stat">
                <span className="admin-inner-stat-label">{localize('com_admin_enabled')}</span>
                <span className="admin-inner-stat-value admin-success">{endpointData?.stats?.enabled || 0}</span>
              </div>
              <div className="admin-inner-stat">
                <span className="admin-inner-stat-label">{localize('com_admin_disabled')}</span>
                <span className="admin-inner-stat-value admin-danger">{endpointData?.stats?.disabled || 0}</span>
              </div>
              <div className="admin-inner-stat">
                <span className="admin-inner-stat-label">{localize('com_admin_total')}</span>
                <span className="admin-inner-stat-value">{endpointData?.stats?.total || 0}</span>
              </div>
            </div>
            <Link
              to="/d/admin/endpoints"
              className="mt-4 admin-btn-secondary w-full text-sm inline-flex items-center justify-center gap-2"
            >
              <Settings className="h-3.5 w-3.5" />
              {localize('com_admin_manage_endpoints')}
            </Link>
          </div>
        </div>

        {/* Tools Status */}
        <div className="admin-card flex flex-col md:col-span-2 lg:col-span-1">
          <div className="admin-card-body flex-1 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="admin-info-bg p-2 rounded-lg flex-shrink-0">
                <Wrench className="h-4 w-4 admin-info" />
              </div>
              <h3 className="font-semibold admin-text-primary">{localize('com_admin_tools')}</h3>
            </div>
            <div className="space-y-3 flex-1">
              <div className="admin-inner-stat">
                <span className="admin-inner-stat-label">{localize('com_admin_enabled')}</span>
                <span className="admin-inner-stat-value admin-success">{toolsData?.stats?.enabled || 0}</span>
              </div>
              <div className="admin-inner-stat">
                <span className="admin-inner-stat-label">{localize('com_admin_disabled')}</span>
                <span className="admin-inner-stat-value admin-danger">{toolsData?.stats?.disabled || 0}</span>
              </div>
              <div className="admin-inner-stat">
                <span className="admin-inner-stat-label">{localize('com_admin_total')}</span>
                <span className="admin-inner-stat-value">{toolsData?.stats?.total || 0}</span>
              </div>
            </div>
            <Link
              to="/d/admin/tools"
              className="mt-4 admin-btn-secondary w-full text-sm inline-flex items-center justify-center gap-2"
            >
              <Wrench className="h-3.5 w-3.5" />
              {localize('com_admin_manage_tools')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
