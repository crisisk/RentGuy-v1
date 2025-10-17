Here's a comprehensive `ActivityLog.tsx` implementation:

```typescript
import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useCrmStore } from '@/stores/crmStore';
import { Activity, ActivityType } from '@/types/activity';
import Spinner from '@/components/common/Spinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import { formatDate } from '@/utils/dateHelpers';
import { IconCall, IconEmail, IconMeeting } from '@/icons';

const ActivityLog: React.FC = observer(() => {
  const crmStore = useCrmStore();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        await crmStore.fetchActivities();
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load activities');
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, [crmStore]);

  const renderActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'call':
        return <IconCall className="text-blue-500" />;
      case 'email':
        return <IconEmail className="text-green-500" />;
      case 'meeting':
        return <IconMeeting className="text-purple-500" />;
      default:
        return null;
    }
  };

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Customer Activities</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 uppercase">
            <tr>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Customer</th>
            </tr>
          </thead>
          <tbody>
            {crmStore.activities.map((activity: Activity) => (
              <tr 
                key={activity.id} 
                className="border-b hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3">
                  {renderActivityIcon(activity.type)}
                </td>
                <td className="px-4 py-3">
                  {formatDate(activity.timestamp)}
                </td>
                <td className="px-4 py-3">{activity.description}</td>
                <td className="px-4 py-3">{activity.customerName}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {crmStore.activities.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            No activities found
          </div>
        )}
      </div>
    </div>
  );
});

export default ActivityLog;
```

Key Features:
- MobX observer pattern
- TypeScript typing
- Error and loading states
- Responsive Tailwind design
- Activity type icons
- Date formatting
- Empty state handling

Note: This assumes you have corresponding types, stores, icons, and utility functions in your project structure.
