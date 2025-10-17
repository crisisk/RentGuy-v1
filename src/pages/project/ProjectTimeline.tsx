import React, { useEffect, useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { Spinner } from '@/components/common/Spinner';
import { Alert } from '@/components/common/Alert';

enum EventType {
  CEREMONY = 'CEREMONY',
  COCKTAIL = 'COCKTAIL',
  DINNER = 'DINNER',
  PARTY = 'PARTY',
}

type TimelineEvent = {
  id: string;
  type: EventType;
  title: string;
  date: string;
  description: string;
};

export const ProjectTimeline = () => {
  const { project, loadTimeline } = useProjectStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        await loadTimeline();
        setError(null);
      } catch (err) {
        setError('Failed to load project timeline');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimeline();
  }, [loadTimeline]);

  const getEventColor = (type: EventType): string => {
    switch (type) {
      case EventType.CEREMONY:
        return 'border-blue-500';
      case EventType.COCKTAIL:
        return 'border-green-500';
      case EventType.DINNER:
        return 'border-purple-500';
      case EventType.PARTY:
        return 'border-orange-500';
      default:
        return 'border-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8">
        <Alert variant="error" message={error} />
      </div>
    );
  }

  if (!project?.timeline?.length) {
    return (
      <div className="text-center text-gray-500 p-8">
        No timeline events available for this project
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-8 text-gray-800">Project Timeline</h2>
      
      <div className="relative">
        {/* Timeline line */}
        <div
          className="absolute left-1/2 w-1 bg-gray-200 top-0 bottom-0"
          aria-hidden="true"
        ></div>

        <div className="space-y-8">
          {project.timeline.map((event: TimelineEvent) => (
            <div
              key={event.id}
              className={`relative flex items-center justify-between ${getEventColor(
                event.type
              )} transition-all duration-300 hover:scale-[1.01]`}
            >
              {/* Event card */}
              <div className="w-full bg-white rounded-lg shadow-sm p-6 ml-4 border-l-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <p className="text-sm text-gray-500">{event.date}</p>
                    <span className="inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {event.type.toLowerCase()}
                    </span>
                  </div>
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {event.title}
                    </h3>
                    <p className="text-gray-600">{event.description}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
