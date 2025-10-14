import { Project, Task } from '../types';

const mockProjects: Project[] = [
  { id: 'p1', name: 'Project Alpha', status: 'active', startDate: '2025-10-01', endDate: '2025-10-31', required_crew_count: 5, required_skills: ['Audio', 'Lighting'], location: { address: 'Amsterdam', latitude: 52.37, longitude: 4.89 } },
  { id: 'p2', name: 'Project Beta', status: 'planning', startDate: '2025-11-01', endDate: '2025-11-15', required_crew_count: 3, required_skills: ['Video'], location: { address: 'Utrecht', latitude: 52.09, longitude: 5.12 } },
];

const mockTasks: Task[] = [
  { id: 't1', projectId: 'p1', name: 'Setup lighting', status: 'done' },
  { id: 't2', projectId: 'p1', name: 'Configure audio', status: 'in_progress' },
  { id: 't3', projectId: 'p2', name: 'Finalize video script', status: 'todo' },
];

export const getProjects = async (): Promise<Project[]> => {
  // const response = await apiClient.get('/projects');
  // return response.data;
  return mockProjects;
};

export const getTasks = async (projectId: string): Promise<Task[]> => {
  // const response = await apiClient.get(`/projects/${projectId}/tasks`);
  // return response.data;
  return mockTasks.filter(t => t.projectId === projectId);
};

