import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import crmStore from '../../stores/crmStore';

interface ActivityLogEntry {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'note';
  timestamp: string;
  description: string;
  user: string;
}

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hrs ago`;
  return date.toLocaleDateString();
};

const ActivityLog: React.FC = () => {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setIsLoading(true);
        const fetchedActivities = await crmStore.getActivityLog();
        setActivities(fetchedActivities);
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load activities');
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const renderActivityIcon = (type: ActivityLogEntry['type']) => {
    const icons = {
      call: '📞',
      email: '✉️',
      meeting: '📅',
      note: '📝'
    };
    return icons[type] || '📌';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-4 md:p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Activity Timeline</h2>
      {activities.length === 0 ? (
        <p className="text-gray-500 text-center">No activities found</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {activities.map((activity) => (
            <li 
              key={activity.id} 
              className="py-4 hover:bg-gray-50 transition-colors flex items-start"
            >
              <div className="mr-4 text-2xl">
                {renderActivityIcon(activity.type)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-gray-900">
                    {activity.user}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {formatRelativeTime(activity.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {activity.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ActivityLog;
