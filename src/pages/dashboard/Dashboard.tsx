import React, { useState, useEffect } from 'react'
import { formatDateTime } from '../../core/storage'
import projectStore, { type Project } from '../../stores/projectStore'

interface DashboardActivity {
  id: string
  title: string
  date: string
  status: string
}

interface DashboardStats {
  totalProjects: number
  completedProjects: number
  activeProjects: number
  upcomingProjects: number
}

const Dashboard = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [projectCount, setProjectCount] = useState<number>(0)
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    completedProjects: 0,
    activeProjects: 0,
    upcomingProjects: 0,
  })
  const [activities, setActivities] = useState<DashboardActivity[]>([])
  const [revenueData, setRevenueData] = useState<number[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const projectData: Project[] = await projectStore.getProjects()
        const statsData = await projectStore.getStats()
        const activitiesData = await projectStore.getRecentActivities()

        setProjectCount(projectData.length)
        setStats(statsData)
        setActivities(activitiesData)
        setRevenueData(generateRevenueData())
        setError('')
      } catch {
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const generateRevenueData = () => {
    return Array.from({ length: 12 }, () => Math.floor(Math.random() * 10000) + 5000)
  }

  const formatActivityDate = (dateString: string) =>
    formatDateTime(dateString, {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })

  if (loading)
    return (
      <div className="p-4 text-gray-500" data-testid="dashboard-loading">
        Loading dashboard...
      </div>
    )
  if (error)
    return (
      <div className="p-4 text-red-500" data-testid="dashboard-error">
        {error}
      </div>
    )

  return (
    <div className="p-4 space-y-6" data-testid="dashboard-root">
      {/* Stats Grid */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        data-testid="dashboard-stats-grid"
      >
        <div
          className="bg-white p-4 rounded-lg shadow-sm"
          data-testid="dashboard-card-total-projects"
        >
          <h3 className="text-gray-500 text-sm">Total Projects</h3>
          <p className="text-2xl font-semibold">{projectCount}</p>
        </div>
        <div
          className="bg-white p-4 rounded-lg shadow-sm"
          data-testid="dashboard-card-active-projects"
        >
          <h3 className="text-gray-500 text-sm">Active Projects</h3>
          <p className="text-2xl font-semibold">{stats.activeProjects}</p>
        </div>
        <div
          className="bg-white p-4 rounded-lg shadow-sm"
          data-testid="dashboard-card-completed-projects"
        >
          <h3 className="text-gray-500 text-sm">Completed Projects</h3>
          <p className="text-2xl font-semibold">{stats.completedProjects}</p>
        </div>
        <div
          className="bg-white p-4 rounded-lg shadow-sm"
          data-testid="dashboard-card-completion-rate"
        >
          <h3 className="text-gray-500 text-sm">Upcoming Projects</h3>
          <p className="text-2xl font-semibold">{stats.upcomingProjects}</p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white p-4 rounded-lg shadow-sm" data-testid="dashboard-revenue-card">
        <h2 className="text-lg font-semibold mb-4">Revenue Overview</h2>
        <div className="h-64" data-testid="dashboard-revenue-chart">
          <svg width="100%" height="100%" data-testid="dashboard-revenue-chart-svg">
            {revenueData.map((value, index) => {
              const currentX = `${(index / (revenueData.length - 1)) * 100}%`
              const currentY = `${100 - (value / 15000) * 100}%`

              return (
                <React.Fragment key={index}>
                  <circle cx={currentX} cy={currentY} r="4" className="fill-blue-500" />
                  {index > 0 &&
                    index - 1 < revenueData.length &&
                    (() => {
                      const previousValue = revenueData[index - 1]
                      if (typeof previousValue !== 'number') {
                        return null
                      }
                      const previousY = `${100 - (previousValue / 15000) * 100}%`
                      const previousX = `${((index - 1) / (revenueData.length - 1)) * 100}%`
                      return (
                        <line
                          x1={previousX}
                          y1={previousY}
                          x2={currentX}
                          y2={currentY}
                          className="stroke-blue-500 stroke-2"
                        />
                      )
                    })()}
                </React.Fragment>
              )
            })}
          </svg>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white p-4 rounded-lg shadow-sm" data-testid="dashboard-activities-card">
        <h2 className="text-lg font-semibold mb-4">Recent Activities</h2>
        <div className="space-y-3" data-testid="dashboard-activities-list">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
              data-testid={`dashboard-activity-${activity.id}`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-2 h-2 rounded-full ${activity.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}`}
                />
                <span className="font-medium">{activity.title}</span>
              </div>
              <span className="text-sm text-gray-500">{formatActivityDate(activity.date)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
