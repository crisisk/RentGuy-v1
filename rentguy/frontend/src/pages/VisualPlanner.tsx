import React, { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { projectsAPI } from '../api/projects';
import { config } from '../config/env';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserHardHat, faToolbox, faWarning } from '@fortawesome/pro-solid-svg-icons';

interface Resource {
  id: string;
  type: 'crew' | 'equipment';
  name: string;
}

interface Task {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resources: Resource[];
  hasConflict: boolean;
}

interface Project {
  id: string;
  name: string;
  tasks: Task[];
}

interface DragItem {
  type: 'task' | 'resource';
  id: string;
  originProjectId: string;
  originTaskId?: string;
}

const VisualPlanner: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ws] = useState(() => new WebSocket(config.getWsUrl('/ws/planner')));

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await projectsAPI.getAll();
        setProjects(data);
        setSelectedProject(data[0]?.id || null);
      } catch (err) {
        setError('Fout bij laden van projecten');
      } finally {
        setLoading(false);
      }
    };

    loadData();

    ws.addEventListener('message', (event) => {
      const update = JSON.parse(event.data);
      setProjects(prev => prev.map(p => p.id === update.projectId ? { ...p, tasks: p.tasks.map(t => t.id === update.taskId ? { ...t, ...update.changes } : t) } : p));
    });

    return () => ws.close();
  }, []);

  const moveTask = (projectId: string, taskId: string, newStart: Date, newEnd: Date) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const updatedTasks = p.tasks.map(t => {
          if (t.id === taskId) {
            const conflicts = checkConflicts(p.tasks, taskId, newStart, newEnd);
            return { ...t, start: newStart, end: newEnd, hasConflict: conflicts.length > 0 };
          }
          return t;
        });
        return { ...p, tasks: updatedTasks };
      }
      return p;
    }));
  };

  const checkConflicts = (tasks: Task[], currentTaskId: string, start: Date, end: Date) => {
    return tasks.filter(t => 
      t.id !== currentTaskId && 
      ((start >= t.start && start < t.end) || (end > t.start && end <= t.end))
    );
  };

  const assignResource = (projectId: string, taskId: string, resource: Resource) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const updatedTasks = p.tasks.map(t => 
          t.id === taskId ? { ...t, resources: [...t.resources, resource] } : t
        );
        return { ...p, tasks: updatedTasks };
      }
      return p;
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="mr-dj-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <FontAwesomeIcon icon={faWarning} className="text-rentguy-destructive text-3xl mb-4" />
        <p className="text-foreground">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-rentguy mt-4">
          Probeer opnieuw
        </button>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="heading-rentguy text-3xl mb-8">Urenplan Planner</h1>

          <div className="flex gap-8">
            <div className="w-64 space-y-4">
              <div className="card-rentguy p-4">
                <h2 className="text-foreground font-bold mb-4">Projecten</h2>
                {projects.map(project => (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProject(project.id)}
                    className={`btn-rentguy w-full mb-2 ${selectedProject === project.id ? 'bg-rentguy-primary' : ''}`}
                  >
                    {project.name}
                  </button>
                ))}
                <button className="btn-rentguy mt-4 w-full">
                  Laad meer...
                </button>
              </div>

              <div className="card-rentguy p-4">
                <h2 className="text-foreground font-bold mb-4">Hulpbronnen</h2>
                <div className="space-y-2">
                  <ResourcePoolItem type="crew" name="Technisch team" />
                  <ResourcePoolItem type="equipment" name="Hijskraan X3" />
                </div>
              </div>
            </div>

            <div className="flex-1">
              {selectedProject && (
                <GanttChart 
                  project={projects.find(p => p.id === selectedProject)!}
                  onMoveTask={moveTask}
                  onAssignResource={assignResource}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

const GanttChart: React.FC<{
  project: Project;
  onMoveTask: (projectId: string, taskId: string, start: Date, end: Date) => void;
  onAssignResource: (projectId: string, taskId: string, resource: Resource) => void;
}> = ({ project, onMoveTask, onAssignResource }) => {
  const timelineDays = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date;
  });

  return (
    <div className="card-rentguy p-4">
      <div className="overflow-x-auto">
        <div className="grid" style={{ gridTemplateColumns: `200px repeat(${timelineDays.length}, 1fr)` }}>
          <div className="sticky left-0 bg-background z-10"></div>
          {timelineDays.map(day => (
            <div key={day.toISOString()} className="text-center text-foreground text-sm py-2">
              {day.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
            </div>
          ))}

          {project.tasks.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              projectId={project.id}
              timelineDays={timelineDays}
              onMove={onMoveTask}
              onAssignResource={onAssignResource}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const TaskRow: React.FC<{
  task: Task;
  projectId: string;
  timelineDays: Date[];
  onMove: (projectId: string, taskId: string, start: Date, end: Date) => void;
  onAssignResource: (projectId: string, taskId: string, resource: Resource) => void;
}> = ({ task, projectId, timelineDays, onMove, onAssignResource }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'task',
    item: { id: task.id, originProjectId: projectId },
    collect: monitor => ({ isDragging: monitor.isDragging() }),
  }));

  const [, drop] = useDrop(() => ({
    accept: ['task', 'resource'],
    drop: (item: DragItem) => {
      if (item.type === 'resource') {
        onAssignResource(projectId, task.id, { id: item.id, type: 'crew', name: 'Test Resource' });
      }
    },
  }));

  const taskStartIndex = timelineDays.findIndex(d => d > task.start);
  const taskDuration = Math.ceil((task.end.getTime() - task.start.getTime()) / (1000 * 3600 * 24));

  return (
    <div ref={drop} className="contents">
      <div
        ref={drag}
        className="sticky left-0 bg-background z-20 flex items-center px-4 py-2 border-b"
        style={{ opacity: isDragging ? 0.5 : 1 }}
      >
        <div className={`flex-1 ${task.hasConflict ? 'text-rentguy-destructive' : 'text-foreground'}`}>
          {task.title}
        </div>
        <div className="flex gap-2">
          {task.resources.map(resource => (
            <FontAwesomeIcon
              key={resource.id}
              icon={resource.type === 'crew' ? faUserHardHat : faToolbox}
              className={resource.type === 'crew' ? 'text-rentguy-secondary' : 'text-rentguy-warning'}
            />
          ))}
        </div>
      </div>

      {timelineDays.map((day, index) => (
        <div key={day.toISOString()} className="border-b relative">
          {index === taskStartIndex && (
            <div
              className={`absolute h-8 rounded-lg ${task.hasConflict ? 'bg-rentguy-destructive' : 'bg-rentguy-primary'}`}
              style={{ width: `${taskDuration * 100}%`, left: '2px' }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

const ResourcePoolItem: React.FC<{ type: 'crew' | 'equipment'; name: string }> = ({ type, name }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'resource',
    item: { type, id: Date.now().toString() },
    collect: monitor => ({ isDragging: monitor.isDragging() }),
  }));

  return (
    <div
      ref={drag}
      className="flex items-center gap-2 p-2 bg-rentguy-background rounded cursor-move"
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <FontAwesomeIcon
        icon={type === 'crew' ? faUserHardHat : faToolbox}
        className={type === 'crew' ? 'text-rentguy-secondary' : 'text-rentguy-warning'}
      />
      <span className="text-foreground">{name}</span>
    </div>
  );
};

export default VisualPlanner;