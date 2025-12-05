import { useState } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  TrendingUp,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { useAdminStatsQuery } from '~/data-provider';
import { useLocalize } from '~/hooks';

export default function AdminStats() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const localize = useLocalize();

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
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary">
            {localize('com_admin_statistics_analytics')}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {localize('com_admin_statistics_description')}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="h-10 w-full sm:w-auto rounded-lg border border-border-medium bg-surface-primary px-4 py-2 text-sm font-medium text-text-primary transition-all hover:border-border-heavy focus:border-border-heavy focus:outline-none focus:ring-1 focus:ring-border-heavy"
          >
            {periods.map((period) => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
          <button className="flex h-10 w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-border-medium bg-text-primary px-4 py-2 text-sm font-medium text-surface-primary transition-all hover:opacity-90">
            <Download className="h-4 w-4" />
            <span>{localize('com_admin_export')}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
            className="overflow-hidden rounded-lg bg-surface-primary-alt shadow-sm border border-border-light"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="text-sm font-medium text-text-secondary">
                    {stat.title}
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-text-primary">
                    {stat.value}
                  </div>
                </div>
                <div
                  className={`flex items-center text-sm font-medium ${
                    stat.trend === 'up' ? 'text-text-primary' : stat.trend === 'down' ? 'text-destructive' : 'text-text-secondary'
                  }`}
                >
                  <TrendingUp
                    className={`mr-1 h-4 w-4 ${
                      stat.trend === 'down' ? 'rotate-180 transform' : ''
                    }`}
                  />
                  {stat.change}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* User Activity Chart */}
        <div className="rounded-lg bg-surface-primary-alt p-6 shadow-sm border border-border-light">
          <h3 className="text-lg font-medium text-text-primary">
            {localize('com_admin_user_activity')}
          </h3>
          <div className="mt-4 flex h-64 items-center justify-center">
            <div className="text-center">
              <BarChart3 className="mx-auto h-16 w-16 text-text-tertiary" />
              <p className="mt-2 text-text-secondary">
                {localize('com_admin_activity_chart_placeholder')}
              </p>
            </div>
          </div>
        </div>

        {/* Registration Trends */}
        <div className="rounded-lg bg-surface-primary-alt p-6 shadow-sm border border-border-light">
          <h3 className="text-lg font-medium text-text-primary">
            {localize('com_admin_registration_trends')}
          </h3>
          <div className="mt-4 flex h-64 items-center justify-center">
            <div className="text-center">
              <Calendar className="mx-auto h-16 w-16 text-text-tertiary" />
              <p className="mt-2 text-text-secondary">
                {localize('com_admin_registration_chart_placeholder')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Statistics Table */}
      <div className="overflow-hidden rounded-lg bg-surface-primary-alt shadow-sm border border-border-light">
        <div className="p-6">
          <h3 className="text-lg font-medium text-text-primary">
            {localize('com_admin_detailed_analytics')}
          </h3>
          <div className="mt-4 flex h-32 items-center justify-center">
            <div className="text-center">
              <p className="text-text-secondary">
                {localize('com_admin_detailed_statistics_description')}
              </p>
              <div className="mt-2 space-y-1 text-sm text-text-tertiary">
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
