import React, { useState, useEffect } from 'react'
import adminStore from '../../stores/adminStore'

interface SystemStats {
  totalUsers: number
  activeUsers: number
  serverUptime: string
  memoryUsage: number
}

interface UserActivity {
  id: number
  username: string
  lastLogin: string
  loginCount: number
}

const AdminPanel: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [userActivities, setUserActivities] = useState<UserActivity[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

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
      try {
        setLoading(true)
        const systemStats = await adminStore.getSystemStats()
        const activities = await adminStore.getUserActivities()

        setStats({
          totalUsers: systemStats.totalUsers,
          activeUsers: systemStats.activeUsers,
          serverUptime: formatUptime(systemStats.uptimeSeconds),
          memoryUsage: systemStats.memoryUsage,
        })

        setUserActivities(activities)
      } catch {
        setError('Failed to load admin data')
      } finally {
        setLoading(false)
      }
    }

    fetchAdminData()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
        role="alert"
      >
        {error}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 md:px-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-gray-500 text-sm">Total Users</h2>
          <p className="text-2xl font-bold">{stats?.totalUsers}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-gray-500 text-sm">Active Users</h2>
          <p className="text-2xl font-bold">{stats?.activeUsers}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-gray-500 text-sm">Server Uptime</h2>
          <p className="text-2xl font-bold">{stats?.serverUptime}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-gray-500 text-sm">Memory Usage</h2>
          <p className="text-2xl font-bold">{stats?.memoryUsage}%</p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">Recent User Activity</h2>
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Username</th>
              <th className="p-3">Last Login</th>
              <th className="p-3">Login Count</th>
            </tr>
          </thead>
          <tbody>
            {userActivities.map((activity) => (
              <tr key={activity.id} className="border-b">
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
