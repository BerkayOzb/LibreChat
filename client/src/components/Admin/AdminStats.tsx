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
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-text-secondary" />
          <p className="mt-2 text-sm text-text-secondary">
            {localize('com_admin_loading_statistics')}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg bg-surface-destructive/10 p-4">
        <div className="flex">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-destructive">
              {localize('com_admin_error_loading_statistics')}
            </h3>
            <p className="mt-1 text-sm text-destructive/80">
              {localize('com_admin_error_loading_statistics_description')}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-2 text-sm font-medium text-destructive hover:text-destructive/80"
            >
              {localize('com_admin_try_again')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header Card */}
      <div className="rounded-xl border border-admin-light-border-subtle dark:border-admin-border-subtle bg-admin-light-primary dark:bg-admin-primary p-6 shadow-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {localize('com_admin_statistics_analytics')}
              </h1>
              <p className="text-blue-100 mt-1">
                {localize('com_admin_statistics_description')}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="h-10 w-full rounded-lg border border-white/30 bg-white/20 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 sm:w-auto"
            >
              {periods.map((period) => (
                <option key={period.value} value={period.value} className="text-gray-800">
                  {period.label}
                </option>
              ))}
            </select>
            <button className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-white/20 border border-white/30 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/30 sm:w-auto">
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
            className="group relative overflow-hidden rounded-xl border border-border-light bg-surface-primary p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                  {stat.title}
                </p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-text-primary">
                  {stat.value}
                </p>
              </div>
              <div className="rounded-lg bg-surface-tertiary p-2.5">
                <TrendingUp className={`h-5 w-5 text-text-primary ${stat.trend === 'down' ? 'rotate-180 transform' : ''}`} />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <span className={`text-xs font-medium ${stat.trend === 'up' ? 'text-text-primary' : stat.trend === 'down' ? 'text-destructive' : 'text-text-secondary'}`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* User Activity Chart */}
        <div className="rounded-xl border border-border-light bg-surface-primary p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-text-primary">
            {localize('com_admin_user_activity')}
          </h3>
          <div className="mt-4 flex h-64 items-center justify-center">
            <div className="text-center">
              <div className="rounded-full bg-surface-tertiary p-4 mx-auto w-fit">
                <BarChart3 className="h-8 w-8 text-text-tertiary" />
              </div>
              <p className="mt-4 text-sm text-text-secondary">
                {localize('com_admin_activity_chart_placeholder')}
              </p>
            </div>
          </div>
        </div>

        {/* Registration Trends */}
        <div className="rounded-xl border border-border-light bg-surface-primary p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-text-primary">
            {localize('com_admin_registration_trends')}
          </h3>
          <div className="mt-4 flex h-64 items-center justify-center">
            <div className="text-center">
              <div className="rounded-full bg-surface-tertiary p-4 mx-auto w-fit">
                <Calendar className="h-8 w-8 text-text-tertiary" />
              </div>
              <p className="mt-4 text-sm text-text-secondary">
                {localize('com_admin_registration_chart_placeholder')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Statistics Table */}
      <div className="overflow-hidden rounded-xl border border-border-light bg-surface-primary shadow-sm">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-text-primary">
            {localize('com_admin_detailed_analytics')}
          </h3>
          <div className="mt-4 flex h-32 items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-text-secondary">
                {localize('com_admin_detailed_statistics_description')}
              </p>
              <div className="mt-3 space-y-1 text-xs text-text-tertiary">
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
