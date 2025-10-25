import React, { useEffect, useState } from 'react'
import adminStore, { SystemStats, UserActivity } from '../../stores/adminStore'

const AdminPanel: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [userActivities, setUserActivities] = useState<UserActivity[]>([])
  const [localError, setLocalError] = useState<string | null>(null)
  const loading = adminStore((state) => state.loading)
  const storeError = adminStore((state) => state.error)
  const getSystemStats = adminStore((state) => state.getSystemStats)
  const getUserActivities = adminStore((state) => state.getUserActivities)
  const error = localError ?? storeError

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / (24 * 3600))
    const hours = Math.floor((seconds % (24 * 3600)) / 3600)
    return `${days}d ${hours}h`
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  useEffect(() => {
    const fetchAdminData = async () => {
      setLocalError(null)
      try {
        const systemStats = await getSystemStats()
        const activities = await getUserActivities()

        setStats(systemStats)
        setUserActivities(activities)
      } catch {
        setLocalError('Failed to load admin data')
      }
    }

    void fetchAdminData()
  }, [getSystemStats, getUserActivities])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen" data-testid="admin-panel-loading">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
        role="alert"
        data-testid="admin-panel-error"
      >
        {error}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 md:px-8" data-testid="admin-panel-root">
      <h1 className="text-3xl font-bold mb-6" data-testid="admin-panel-title">
        Admin Dashboard
      </h1>

      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        data-testid="admin-panel-stats-grid"
      >
        <div className="bg-white shadow rounded-lg p-4" data-testid="admin-panel-card-total-users">
          <h2 className="text-gray-500 text-sm">Total Users</h2>
          <p className="text-2xl font-bold">{stats ? stats.totalUsers : '--'}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4" data-testid="admin-panel-card-active-users">
          <h2 className="text-gray-500 text-sm">Active Users</h2>
          <p className="text-2xl font-bold">{stats ? stats.activeUsers : '--'}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4" data-testid="admin-panel-card-uptime">
          <h2 className="text-gray-500 text-sm">Server Uptime</h2>
          <p className="text-2xl font-bold">{stats ? formatUptime(stats.uptimeSeconds) : '--'}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4" data-testid="admin-panel-card-memory">
          <h2 className="text-gray-500 text-sm">Memory Usage</h2>
          <p className="text-2xl font-bold">{stats ? `${stats.memoryUsage}%` : '--'}</p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-4" data-testid="admin-panel-activity-card">
        <h2 className="text-xl font-semibold mb-4" data-testid="admin-panel-activity-title">
          Recent User Activity
        </h2>
        <table className="w-full text-sm text-left" data-testid="admin-panel-activity-table">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Username</th>
              <th className="p-3">Last Login</th>
              <th className="p-3">Login Count</th>
            </tr>
          </thead>
          <tbody>
            {userActivities.map((activity) => (
              <tr
                key={activity.id}
                className="border-b"
                data-testid={`admin-panel-activity-row-${activity.id}`}
              >
                <td className="p-3">{activity.username}</td>
                <td className="p-3">{formatDate(activity.lastLogin)}</td>
                <td className="p-3">{activity.loginCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminPanel
