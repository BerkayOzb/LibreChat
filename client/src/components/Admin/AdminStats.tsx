import { useState } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  TrendingUp,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { SystemRoles } from 'librechat-data-provider';
import { useAdminStatsQuery } from '~/data-provider';
import { useAuthContext } from '~/hooks/AuthContext';
import { useLocalize } from '~/hooks';
import OrgAdminStats from './OrgAdminStats';

export default function AdminStats() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const localize = useLocalize();
  const { user } = useAuthContext();

  // If user is ORG_ADMIN, show organization-specific stats
  if (user?.role === SystemRoles.ORG_ADMIN) {
    return <OrgAdminStats />;
  }

  // Fetch real admin statistics
  const {
    data: stats,
    isLoading,
    error,
    refetch
  } = useAdminStatsQuery();

  const periods = [
    { value: '7d', label: localize('com_admin_period_7_days') },
    { value: '30d', label: localize('com_admin_period_30_days') },
    { value: '90d', label: localize('com_admin_period_90_days') },
    { value: '1y', label: localize('com_admin_period_1_year') },
  ];

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
  if (error) {
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
            onClick={() => refetch()}
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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="h-10 w-full rounded-lg border border-[var(--admin-header-icon-bg)] bg-[var(--admin-header-icon-bg)] px-4 py-2 text-sm font-medium text-[var(--admin-header-text)] transition-all hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[var(--admin-header-icon-bg)] sm:w-auto"
            >
              {periods.map((period) => (
                <option key={period.value} value={period.value} className="text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800">
                  {period.label}
                </option>
              ))}
            </select>
            <button className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[var(--admin-header-icon-bg)] border border-[var(--admin-header-icon-bg)] px-4 py-2 text-sm font-medium text-[var(--admin-header-text)] transition-all hover:opacity-80 sm:w-auto">
              <Download className="h-4 w-4" />
              <span>{localize('com_admin_export')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            title: localize('com_admin_total_users'),
            value: stats?.totalUsers?.toLocaleString() || '0',
            change: `+${stats?.newUsersThisMonth || 0} ${localize('com_admin_this_month_new')}`,
            trend: 'up'
          },
          {
            title: localize('com_admin_active_users'),
            value: stats?.activeUsers?.toLocaleString() || '0',
            change: `${stats?.activeUsersToday || 0} ${localize('com_admin_today_active')}`,
            trend: 'up'
          },
          {
            title: localize('com_admin_total_messages'),
            value: stats?.totalMessages?.toLocaleString() || '0',
            change: localize('com_admin_all_time'),
            trend: 'neutral'
          },
        ].map((stat) => (
          <div
            key={stat.title}
            className="admin-stats-card"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="stat-label">
                  {stat.title}
                </p>
                <p className="stat-value mt-2">
                  {stat.value}
                </p>
              </div>
              <div className="stat-icon">
                <TrendingUp className={`h-5 w-5 ${stat.trend === 'down' ? 'rotate-180 transform' : ''}`} />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <span className={`text-xs font-medium ${stat.trend === 'up' ? 'admin-success' : stat.trend === 'down' ? 'admin-danger' : 'admin-text-secondary'}`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* User Activity Chart */}
        <div className="admin-card">
          <div className="admin-card-body">
            <h3 className="text-lg font-semibold admin-text-primary">
              {localize('com_admin_user_activity')}
            </h3>
            <div className="mt-4 flex h-64 items-center justify-center">
              <div className="text-center">
                <div className="admin-empty-state-icon mx-auto">
                  <BarChart3 />
                </div>
                <p className="mt-4 text-sm admin-text-secondary">
                  {localize('com_admin_activity_chart_placeholder')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Registration Trends */}
        <div className="admin-card">
          <div className="admin-card-body">
            <h3 className="text-lg font-semibold admin-text-primary">
              {localize('com_admin_registration_trends')}
            </h3>
            <div className="mt-4 flex h-64 items-center justify-center">
              <div className="text-center">
                <div className="admin-empty-state-icon mx-auto">
                  <Calendar />
                </div>
                <p className="mt-4 text-sm admin-text-secondary">
                  {localize('com_admin_registration_chart_placeholder')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Statistics Table */}
      <div className="admin-card">
        <div className="admin-card-body">
          <h3 className="text-lg font-semibold admin-text-primary">
            {localize('com_admin_detailed_analytics')}
          </h3>
          <div className="mt-4 flex h-32 items-center justify-center">
            <div className="text-center">
              <p className="text-sm admin-text-secondary">
                {localize('com_admin_detailed_statistics_description')}
              </p>
              <div className="mt-3 space-y-1 text-xs admin-text-muted">
                <p>{localize('com_admin_user_registrations_breakdown')}</p>
                <p>{localize('com_admin_message_counts_breakdown')}</p>
                <p>{localize('com_admin_system_performance_breakdown')}</p>
                <p>{localize('com_admin_usage_patterns_breakdown')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
