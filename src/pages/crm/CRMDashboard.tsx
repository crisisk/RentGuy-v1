import React, { useState, useEffect } from 'react'
import crmStore from '../../stores/crmStore'

interface CustomerStat {
  total: number
  newThisMonth: number
  activeCustomers: number
}

interface RecentActivity {
  id: string
  type: 'sale' | 'support' | 'signup'
  customerName: string
  timestamp: number
}

const CRMDashboard: React.FC = () => {
  const [customerStats, setCustomerStats] = useState<CustomerStat | null>(null)
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const stats = await crmStore.getCustomerStats()
        const activities = await crmStore.getRecentActivities()

        setCustomerStats(stats)
        setRecentActivities(activities)
      } catch {
        setError('Failed to load dashboard data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (isLoading) {
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
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">CRM Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Total Customers</h2>
          <p className="text-3xl font-bold text-blue-600">{customerStats?.total || 0}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">New This Month</h2>
          <p className="text-3xl font-bold text-green-600">{customerStats?.newThisMonth || 0}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Active Customers</h2>
          <p className="text-3xl font-bold text-purple-600">
            {customerStats?.activeCustomers || 0}
          </p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Recent Activities</h2>
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">Type</th>
              <th className="p-2">Customer</th>
              <th className="p-2">Time</th>
            </tr>
          </thead>
          <tbody>
            {recentActivities.map((activity) => (
              <tr key={activity.id} className="border-b">
                <td className="p-2 capitalize">{activity.type}</td>
                <td className="p-2">{activity.customerName}</td>
                <td className="p-2">{formatRelativeTime(activity.timestamp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default CRMDashboard
