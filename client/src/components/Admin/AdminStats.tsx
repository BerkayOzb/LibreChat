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

export default function AdminStats() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  
  // Fetch real admin statistics
  const { 
    data: stats, 
    isLoading, 
    error,
    refetch 
  } = useAdminStatsQuery();

  const periods = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' },
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Loading statistics...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
        <div className="flex">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
              Error loading statistics
            </h3>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              Unable to fetch statistics data. Please refresh the page or check your connection.
            </p>
            <button
              onClick={() => refetch()}
              className="mt-2 text-sm font-medium text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Statistics & Analytics
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            System usage analytics and performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            {periods.map((period) => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
          <button className="flex items-center space-x-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { 
            title: 'Total Users', 
            value: stats?.totalUsers?.toLocaleString() || '0', 
            change: `+${stats?.newUsersThisMonth || 0} this month`, 
            trend: 'up' 
          },
          { 
            title: 'Active Users', 
            value: stats?.activeUsers?.toLocaleString() || '0', 
            change: `${stats?.activeUsersToday || 0} today`, 
            trend: 'up' 
          },
          { 
            title: 'Total Messages', 
            value: stats?.totalMessages?.toLocaleString() || '0', 
            change: 'All time', 
            trend: 'neutral' 
          },
        ].map((stat) => (
          <div
            key={stat.title}
            className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {stat.title}
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                    {stat.value}
                  </div>
                </div>
                <div
                  className={`flex items-center text-sm font-medium ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
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
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            User Activity
          </h3>
          <div className="mt-4 flex h-64 items-center justify-center">
            <div className="text-center">
              <BarChart3 className="mx-auto h-16 w-16 text-gray-400" />
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Activity chart will be displayed here
              </p>
            </div>
          </div>
        </div>

        {/* Registration Trends */}
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Registration Trends
          </h3>
          <div className="mt-4 flex h-64 items-center justify-center">
            <div className="text-center">
              <Calendar className="mx-auto h-16 w-16 text-gray-400" />
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Registration trends chart will be displayed here
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Statistics Table */}
      <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Detailed Analytics
          </h3>
          <div className="mt-4 flex h-32 items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Detailed statistics table with breakdowns by:
              </p>
              <div className="mt-2 space-y-1 text-sm text-gray-400">
                <p>• User registrations by day/week/month</p>
                <p>• Message counts and conversation analytics</p>
                <p>• System performance metrics</p>
                <p>• Usage patterns and trends</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}