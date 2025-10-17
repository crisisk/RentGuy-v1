import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import projectStore from '../../stores/projectStore';

interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  date: string;
}

const ProjectTimeline: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const project = await projectStore.getProject(projectId!);
        setEvents(project.events || []);
        setError('');
      } catch (err) {
        setError('Failed to load project timeline');
      } finally {
        setIsLoading(false);
      }
    };

    loadProject();
  }, [projectId]);

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-500">
        Loading timeline...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-xl font-semibold mb-6 text-gray-800">
        Project Timeline
      </h2>

      {events.length === 0 ? (
        <div className="text-gray-500 text-center">No events found</div>
      ) : (
        <div className="space-y-4">
          {events.map((event, index) => (
            <div
              key={event.id}
              className="flex items-start space-x-4 group"
            >
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                {index !== events.length - 1 && (
                  <div className="w-px bg-gray-200 flex-1 my-2" />
                )}
              </div>
              <div className="flex-1 bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900">{event.title}</h3>
                  <span className="text-sm text-gray-500">
                    {formatDate(event.date)}
                  </span>
                </div>
                <p className="text-gray-600 text-sm">
                  {event.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectTimeline;
