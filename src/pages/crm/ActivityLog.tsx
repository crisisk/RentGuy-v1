import React, { useState, useEffect } from 'react'
import { formatDateTime } from '../../core/storage'
import crmStore, { type Activity } from '../../stores/crmStore'

type ActivityLogEntry = Pick<Activity, 'id' | 'type' | 'description'> & {
  timestamp: string
  user: string
}

const normalizeActivityType = (type: string): ActivityLogEntry['type'] => {
  switch (type) {
    case 'call':
    case 'email':
    case 'meeting':
    case 'note':
      return type
    default:
      return 'note'
  }
}

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))

  if (diffMinutes < 1) return 'Zojuist'
  if (diffMinutes < 60) return `${diffMinutes} min geleden`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} uur geleden`

  return formatDateTime(date, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const ActivityLog: React.FC = () => {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setIsLoading(true)
        const fetchedActivities = await crmStore.getActivityLog()
        const mappedActivities: ActivityLogEntry[] = fetchedActivities.map((activity) => ({
          id: activity.id,
          type: normalizeActivityType(activity.type),
          timestamp: activity.timestamp ?? activity.date,
          description: activity.description,
          user: activity.user ?? 'Onbekende gebruiker',
        }))
        setActivities(mappedActivities)
      } catch {
        setError('Failed to load activities')
      } finally {
        setIsLoading(false)
      }
    }

    fetchActivities()
  }, [])

  const renderActivityIcon = (type: ActivityLogEntry['type']) => {
    const icons = {
      call: '📞',
      email: '✉️',
      meeting: '📅',
      note: '📝',
    }
    return icons[type] || '📌'
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64" data-testid="crm-activity-log-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
        data-testid="crm-activity-log-error"
      >
        {error}
      </div>
    )
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-4 md:p-6" data-testid="crm-activity-log-root">
      <h2 className="text-xl font-semibold mb-4 text-gray-800" data-testid="crm-activity-log-title">
        Activity Timeline
      </h2>
      {activities.length === 0 ? (
        <p className="text-gray-500 text-center" data-testid="crm-activity-log-empty">
          No activities found
        </p>
      ) : (
        <ul className="divide-y divide-gray-200" data-testid="crm-activity-log-list">
          {activities.map((activity) => (
            <li
              key={activity.id}
              className="py-4 hover:bg-gray-50 transition-colors flex items-start"
              data-testid={`crm-activity-log-item-${activity.id}`}
            >
              <div className="mr-4 text-2xl" data-testid={`crm-activity-log-icon-${activity.id}`}>
                {renderActivityIcon(activity.type)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h3
                    className="text-sm font-medium text-gray-900"
                    data-testid={`crm-activity-log-user-${activity.id}`}
                  >
                    {activity.user}
                  </h3>
                  <span
                    className="text-xs text-gray-500"
                    data-testid={`crm-activity-log-time-${activity.id}`}
                  >
                    {formatRelativeTime(activity.timestamp)}
                  </span>
                </div>
                <p
                  className="text-sm text-gray-600 mt-1"
                  data-testid={`crm-activity-log-description-${activity.id}`}
                >
                  {activity.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default ActivityLog
