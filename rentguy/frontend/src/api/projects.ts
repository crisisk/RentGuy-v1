import apiClient from './client';
import { Project, ProjectStatus } from '../types';

// Mock data for initial integration
const mockProjects: Project[] = [
    { id: 'p1', name: 'Summer Festival 2026', status: 'active', startDate: '2026-07-15', endDate: '2026-07-20', required_crew_count: 5, required_skills: ['Audio', 'Lighting'], location: { address: 'Amsterdam Arena', latitude: 52.314, longitude: 4.944 } },
    { id: 'p2', name: 'Corporate Event Q4', status: 'planning', startDate: '2025-11-01', endDate: '2025-11-03', required_crew_count: 2, required_skills: ['Video'], location: { address: 'Rotterdam Ahoy', latitude: 51.884, longitude: 4.479 } },
    { id: 'p3', name: 'Winter Gala', status: 'completed', startDate: '2024-12-10', endDate: '2024-12-11', required_crew_count: 3, required_skills: ['Rigging'], location: { address: 'Utrecht Jaarbeurs', latitude: 52.086, longitude: 5.105 } },
];

export const projectsAPI = {
  getAll: async (filters?: {
    status?: ProjectStatus;
    startDate?: string;
    endDate?: string;
  }): Promise<Project[]> => {
    // const response = await apiClient.get('/projects', { params: filters });
    // return response.data;
    
    // Mock implementation
    let filteredProjects = mockProjects;
    if (filters?.status) {
        filteredProjects = filteredProjects.filter(p => p.status === filters.status);
    }
    // Basic date filtering logic can be added here if needed
    
    return filteredProjects;
  },

  getById: async (id: string): Promise<Project> => {
    // const response = await apiClient.get(`/projects/${id}`);
    // return response.data;
    
    // Mock implementation
    const project = mockProjects.find(p => p.id === id);
    if (!project) throw new Error('Project not found');
    return project;
  },

  create: async (project: Partial<Project>): Promise<Project> => {
    // const response = await apiClient.post('/projects', project);
    // return response.data;
    
    // Mock implementation
    const newProject: Project = {
        ...project as Project,
        id: `p${mockProjects.length + 1}`,
        status: project.status || 'planning',
        required_skills: project.required_skills || [],
        location: project.location || { address: 'New Location', latitude: 0, longitude: 0 },
    };
    mockProjects.push(newProject);
    return newProject;
  },

  update: async (id: string, updates: Partial<Project>): Promise<Project> => {
    // const response = await apiClient.patch(`/projects/${id}`, updates);
    // return response.data;
    
    // Mock implementation
    const index = mockProjects.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Project not found');
    mockProjects[index] = { ...mockProjects[index], ...updates };
    return mockProjects[index];
  },

  delete: async (id: string): Promise<void> => {
    // await apiClient.delete(`/projects/${id}`);
    
    // Mock implementation
    const index = mockProjects.findIndex(p => p.id === id);
    if (index !== -1) mockProjects.splice(index, 1);
  },

  // Planning-specific endpoints
  getAvailability: async (projectId: string, date: string) => {
    // const response = await apiClient.get(`/projects/${projectId}/availability`, { params: { date } });
    // return response.data;
    
    // Mock implementation
    return {
        crew: [{ id: 'c1', name: 'John Doe', available: true }],
        equipment: [{ id: 'e1', name: 'Speaker Set A', available: false }],
    };
  },

  assignCrew: async (projectId: string, crewId: string, role: string) => {
    // const response = await apiClient.post(`/projects/${projectId}/crew`, { crewId, role });
    // return response.data;
    
    // Mock implementation
    console.log(`Mock: Assigned crew ${crewId} to project ${projectId} as ${role}`);
    return { success: true };
  },
};

